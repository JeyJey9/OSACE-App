const express = require('express');
const router = express.Router();
const { logAction } = require('../../utils/auditLog');

const path = require('path');
const API_DOMAIN = 'https://api.osace.ro'; // URL-ul API-ului
const { checkBadgesOnLike, checkBadgesOnComment } = require('../../features/Badge/badge.service'); // S-ar putea să trebuiască să ajustezi calea '../'

const googleDriveService = require('../../services/googleDriveService');

// --- Exportăm Rutele ---
module.exports = (pool, verifyToken, verifyManager) => {
  const fs = require('fs/promises'); // Modul necesar pentru ștergerea fișierelor

  // In-memory cache pentru metadata fisierelor Google Drive (evita apeluri repetate)
  const mediaMetaCache = new Map();

  // ======================================================
  // ## GET /media/:driveFileId (Streaming permanent imagini & video MP4 din Google Drive)
  // ======================================================
  router.get('/media/:driveFileId', async (req, res) => {
    const rawId = req.params.driveFileId;

    if (!rawId || rawId.length < 5) {
      return res.status(400).send('ID media invalid.');
    }

    const isVideo = /\.mp4$/i.test(rawId);
    const driveFileId = rawId.replace(/\.(mp4|mov|jpg|jpeg|png|webp|m4v)$/i, '');

    try {
      const { getDriveClient } = require('../../config/googleDrive');
      const drive = getDriveClient();

      if (!drive) {
        return res.status(503).send('Google Drive neconfigurat.');
      }

      // 1. Obtinem metadata (size, mimeType) din cache sau Google Drive
      let meta = mediaMetaCache.get(driveFileId);
      if (!meta || (Date.now() - meta.cachedAt > 3600000)) {
        const driveMeta = await drive.files.get({
          fileId: driveFileId,
          fields: 'id, size, mimeType',
          supportsAllDrives: true,
        });
        meta = {
          size: parseInt(driveMeta.data.size, 10) || 0,
          mimeType: isVideo ? 'video/mp4' : (driveMeta.data.mimeType || 'image/jpeg'),
          cachedAt: Date.now(),
        };
        mediaMetaCache.set(driveFileId, meta);
      }

      const totalSize = meta.size;
      const mimeType = meta.mimeType;
      const range = req.headers.range;

      // Antete comune pentru streaming media
      const commonHeaders = {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Accept-Ranges': 'bytes',
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
      };

      // 2. Gestionare HTTP 206 Range Requests (Crucial pentru ExoPlayer / Safari / Chrome video streaming)
      if (range && totalSize > 0) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

        if (start >= totalSize || end >= totalSize) {
          res.setHeader('Content-Range', `bytes */${totalSize}`);
          return res.status(416).send('Requested range not satisfiable');
        }

        const chunkSize = (end - start) + 1;

        const driveResponse = await drive.files.get(
          {
            fileId: driveFileId,
            alt: 'media',
            supportsAllDrives: true,
          },
          {
            responseType: 'stream',
            headers: { Range: `bytes=${start}-${end}` },
          }
        );

        res.writeHead(206, {
          ...commonHeaders,
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Content-Length': chunkSize,
        });

        driveResponse.data.on('error', (err) => {
          console.error('[PostsMedia] Stream range error:', err.message);
          if (!res.headersSent) res.status(500).end();
        });

        return driveResponse.data.pipe(res);
      }

      // 3. Raspuns standard 200 OK (pentru imagini sau cereri video complete)
      const driveResponse = await drive.files.get(
        {
          fileId: driveFileId,
          alt: 'media',
          supportsAllDrives: true,
        },
        {
          responseType: 'stream',
        }
      );

      const headers200 = { ...commonHeaders };
      if (totalSize > 0) {
        headers200['Content-Length'] = totalSize;
      }

      res.writeHead(200, headers200);

      driveResponse.data.on('error', (err) => {
        console.error('[PostsMedia] Stream error:', err.message);
        if (!res.headersSent) res.status(500).end();
      });

      driveResponse.data.pipe(res);
    } catch (err) {
      console.error(`[PostsMedia] Error loading media ${rawId} (driveFileId: ${driveFileId}):`, err.message);
      if (!res.headersSent) {
        res.status(404).send('Media negasita.');
      }
    }
  });

  // ======================================================
  // ## POST /sync-instagram (Sincronizare postări de pe Instagram @o.s.a.c.e cu stocare pe Google Drive)
  // ======================================================

  // Retry helper pentru upload-uri Google Drive (evită 502/503 transiente)
  async function retryDriveUpload(fn, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const msg = err.message || '';
        const isRetryable = msg.includes('502') || msg.includes('503') || 
                            msg.includes('ECONNRESET') || msg.includes('timeout');
        if (attempt === maxRetries || !isRetryable) throw err;
        const delay = attempt * 3000;
        console.log(`   [IG Sync] Retry ${attempt}/${maxRetries} după ${delay/1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  router.post('/sync-instagram', [verifyToken, verifyManager], async (req, res) => {
    const creatorId = req.user.userId;
    const token = ((req.body && req.body.accessToken) || process.env.INSTAGRAM_ACCESS_TOKEN || '').trim();
    const axios = require('axios');

    if (!token) {
      return res.status(400).json({ error: 'Token Instagram lipsește. Adaugă INSTAGRAM_ACCESS_TOKEN în .env.' });
    }

    // --- 1. Preluăm ultimele 25 postări de pe Instagram (cu children pentru carousel) ---
    let mediaItems = [];
    try {
      const igRes = await axios.get('https://graph.instagram.com/me/media', {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,children{id,media_type,media_url,thumbnail_url}',
          access_token: token,
          limit: 25
        },
        timeout: 20000
      });

      const items = igRes.data?.data || [];
      for (const item of items) {
        const post = {
          caption: item.caption || '',
          permalink: item.permalink,
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
          mediaType: item.media_type,
          mediaList: [] // Array de { url, isVideo } (suportă carousel și video)
        };

        if (item.media_type === 'CAROUSEL_ALBUM' && item.children?.data) {
          for (const child of item.children.data) {
            const childIsVideo = child.media_type === 'VIDEO';
            const childUrl = child.media_url || child.thumbnail_url;
            if (childUrl) {
              post.mediaList.push({ url: childUrl, isVideo: childIsVideo });
            }
          }
          if (post.mediaList.length === 0 && (item.media_url || item.thumbnail_url)) {
            post.mediaList.push({ url: item.media_url || item.thumbnail_url, isVideo: item.media_type === 'VIDEO' });
          }
        } else if (item.media_type === 'VIDEO') {
          const videoUrl = item.media_url || item.thumbnail_url;
          if (videoUrl) {
            post.mediaList.push({ url: videoUrl, isVideo: true });
          }
        } else {
          if (item.media_url) {
            post.mediaList.push({ url: item.media_url, isVideo: false });
          }
        }

        if (post.mediaList.length > 0) mediaItems.push(post);
      }
      console.log(`[IG Sync] Graph API → ${mediaItems.length} postări (cu video & carousel).`);
    } catch (err) {
      console.error('[IG Sync] Graph API error:', err.message);
      return res.status(400).json({ error: 'Nu s-a putut conecta la API-ul Instagram. Verifică token-ul.' });
    }

    if (mediaItems.length === 0) {
      return res.status(400).json({ error: 'Nu s-au putut prelua postările de pe Instagram.' });
    }

    // --- 2. Filtrăm: procesăm doar postări NOI sau cu URL-uri expirate (SKIP dacă sunt deja pe Drive) ---
    const toProcess = [];
    for (const item of mediaItems) {
      // Extragem shortcode-ul unic de Instagram (ex: DZJ_99ColwA)
      const shortcodeMatch = item.permalink.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_\-]+)/i);
      const shortcode = shortcodeMatch ? shortcodeMatch[1] : null;

      const checkQuery = shortcode
        ? `SELECT p.id, 
             (SELECT pi.image_url FROM post_images pi WHERE pi.post_id = p.id ORDER BY pi.sort_order ASC LIMIT 1) AS first_image,
             (SELECT COUNT(*) FROM post_images pi WHERE pi.post_id = p.id) AS image_count
           FROM posts p 
           WHERE p.description LIKE $1`
        : `SELECT p.id, 
             (SELECT pi.image_url FROM post_images pi WHERE pi.post_id = p.id ORDER BY pi.sort_order ASC LIMIT 1) AS first_image,
             (SELECT COUNT(*) FROM post_images pi WHERE pi.post_id = p.id) AS image_count
           FROM posts p 
           WHERE p.description LIKE $1`;

      const checkParam = shortcode ? [`%/${shortcode}/%`] : [`%${item.permalink}%`];
      const check = await pool.query(checkQuery, checkParam);

      if (check.rows.length === 0) {
        // Postare cu adevărat nouă (publicată recent pe Instagram)
        toProcess.push({ ...item, existingPostId: null, reason: 'NOU' });
      } else {
        const existingPost = check.rows[0];
        const firstImage = existingPost.first_image || '';
        const imageCount = parseInt(existingPost.image_count, 10) || 0;

        // Dacă postarea are deja fișiere stocate pe Google Drive (/api/posts/media/), îi dăm SKIP complet!
        if (imageCount > 0 && firstImage.includes('/api/posts/media/')) {
          // SKIP complet — 0 download, 0 upload, 0 delay
          continue;
        }

        // Postarea există dar are imagini lipsă sau URL-uri expirate de CDN Instagram
        toProcess.push({ ...item, existingPostId: existingPost.id, reason: 'REPARAT' });
      }
    }

    console.log(`[IG Sync] De procesat: ${toProcess.length}/${mediaItems.length} (${mediaItems.length - toProcess.length} au primit SKIP fiind deja pe Drive)`);

    if (toProcess.length === 0) {
      return res.json({
        message: 'Toate postările sunt deja sincronizate și salvate pe Google Drive!',
        synced_count: 0,
        repaired_count: 0
      });
    }

    let syncedCount = 0;
    let repairedCount = 0;

    try {
      // 3. Asigurăm folderul pe Drive
      let igFolder = null;
      try {
        igFolder = await googleDriveService.ensureFolderPath('04_Instagram_Media');
      } catch (driveInitErr) {
        console.warn('[IG Sync] Nu s-a putut crea folderul:', driveInitErr.message);
      }

      // 4. Procesăm SECVENȚIAL (evităm rate limiting de la Google Drive)
      for (const item of toProcess) {
        console.log(`[IG Sync] ${item.reason}: ${item.permalink} (${item.mediaList.length} elemente media)`);

        const driveUrls = [];
        for (let mIdx = 0; mIdx < item.mediaList.length; mIdx++) {
          const mediaObj = item.mediaList[mIdx];
          try {
            const driveUrl = await retryDriveUpload(async () => {
              const res = await axios.get(mediaObj.url, {
                responseType: 'arraybuffer',
                timeout: mediaObj.isVideo ? 90000 : 25000,
                maxContentLength: 250 * 1024 * 1024,
                maxBodyLength: 250 * 1024 * 1024,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              });
              const buffer = Buffer.from(res.data);
              const contentType = res.headers['content-type'] || (mediaObj.isVideo ? 'video/mp4' : 'image/jpeg');

              if (contentType.includes('text/html') || buffer.length < 1000) {
                throw new Error('Răspuns invalid (HTML/fișier mic)');
              }

              let ext = 'jpg';
              let mimeType = 'image/jpeg';

              if (mediaObj.isVideo || contentType.includes('video') || contentType.includes('mp4')) {
                ext = 'mp4';
                mimeType = 'video/mp4';
              } else if (contentType.includes('png')) {
                ext = 'png';
                mimeType = 'image/png';
              } else if (contentType.includes('webp')) {
                ext = 'webp';
                mimeType = 'image/webp';
              }

              const filename = `ig_${Date.now()}_${mIdx}_${Math.random().toString(36).substring(2, 6)}.${ext}`;

              const driveFile = await googleDriveService.uploadFile({
                name: filename,
                mimeType,
                body: buffer,
                parentFolderId: igFolder ? igFolder.id : undefined,
                description: `Instagram @o.s.a.c.e - ${item.permalink}`,
              });
              if (!driveFile?.id) throw new Error('Upload OK dar fără ID');

              return ext === 'mp4'
                ? `${API_DOMAIN}/api/posts/media/${driveFile.id}.mp4`
                : `${API_DOMAIN}/api/posts/media/${driveFile.id}.jpg`;
            });
            driveUrls.push(driveUrl);
          } catch (uploadErr) {
            console.warn(`[IG Sync] Media ${mIdx} eșuată: ${uploadErr.message?.substring(0, 60)}`);
            driveUrls.push(mediaObj.url); // fallback la URL original
          }
          // Pauză între elemente
          await new Promise(r => setTimeout(r, 800));
        }

        const description = (item.caption || '') + `\n\n📸 Vezi pe Instagram: ${item.permalink}`;
        const postDate = item.timestamp || new Date();

        if (item.existingPostId) {
          // UPDATE: ștergem imaginile vechi, inserăm cele noi cu sort_order
          await pool.query(`DELETE FROM post_images WHERE post_id = $1`, [item.existingPostId]);
          for (let i = 0; i < driveUrls.length; i++) {
            await pool.query(
              `INSERT INTO post_images (post_id, image_url, sort_order) VALUES ($1, $2, $3)`,
              [item.existingPostId, driveUrls[i], i]
            );
          }
          repairedCount++;
        } else {
          // INSERT: postare nouă
          const newPost = await pool.query(
            `INSERT INTO posts (creator_id, description, created_at) VALUES ($1, $2, $3) RETURNING id`,
            [creatorId, description, postDate]
          );
          const postId = newPost.rows[0].id;
          for (let i = 0; i < driveUrls.length; i++) {
            await pool.query(
              `INSERT INTO post_images (post_id, image_url, sort_order) VALUES ($1, $2, $3)`,
              [postId, driveUrls[i], i]
            );
          }
          syncedCount++;
        }
      }


      if (syncedCount > 0 || repairedCount > 0) {
        await logAction(pool, creatorId, 'POST_SYNC_INSTAGRAM', 'post', null, { 
          synced_count: syncedCount, 
          repaired_count: repairedCount 
        });
      }

      res.json({ 
        message: `Sincronizare reușită! ${syncedCount} postări noi importate, ${repairedCount} postări reparate și salvate pe Google Drive.`, 
        synced_count: syncedCount,
        repaired_count: repairedCount 
      });
    } catch (dbErr) {
      console.error('Eroare DB la import Instagram:', dbErr);
      res.status(500).json({ error: 'Eroare la salvarea postărilor în baza de date.' });
    }
  });

  router.get('/:id/comments', verifyToken, async (req, res) => {
    const { id } = req.params; // ID-ul postării
    const currentUserId = req.user.userId;

    try {
      const commentsQuery = `
        SELECT
          c.id,
          c.content,
          c.created_at,
          u.id AS user_id,
          u.display_name,
          u.avatar_url
        FROM
          post_comments c
        JOIN
          users u ON c.user_id = u.id
        WHERE
          c.post_id = $1
          AND c.user_id NOT IN (
            SELECT blocked_id FROM user_blocks WHERE blocker_id = $2
          )
        ORDER BY
          c.created_at ASC; -- Arată comentariile de la cel mai vechi la cel mai nou
      `;
      const result = await pool.query(commentsQuery, [id, currentUserId]);
      res.json(result.rows);

    } catch (error) {
      console.error(`Eroare la preluarea comentariilor pentru postul ${id}:`, error);
      res.status(500).json({ error: 'Eroare server la preluarea comentariilor.' });
    }
  });


  router.post('/:id/comments', verifyToken, async (req, res) => {
    const { id } = req.params; // ID-ul postării
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Conținutul comentariului nu poate fi gol.' });
    }

    try {
      const newCommentQuery = `
        INSERT INTO post_comments (post_id, user_id, content)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const newCommentResult = await pool.query(newCommentQuery, [id, userId, content.trim()]);

      // Pentru a returna un comentariu complet (cu datele utilizatorului),
      // facem o interogare suplimentară.

      const commentId = newCommentResult.rows[0].id;

      const fullCommentQuery = `
        SELECT
          c.id,
          c.content,
          c.created_at,
          u.id AS user_id,
          u.display_name,
          u.avatar_url
        FROM
          post_comments c
        JOIN
          users u ON c.user_id = u.id
        WHERE
          c.id = $1;
      `;
      const fullComment = await pool.query(fullCommentQuery, [commentId]);
      checkBadgesOnComment(userId, pool);
      // Returnăm comentariul complet, gata de adăugat în listă
      res.status(201).json(fullComment.rows[0]);

    } catch (error) {
      console.error(`Eroare la adăugarea comentariului pentru postul ${id}:`, error);
      res.status(500).json({ error: 'Eroare server la adăugarea comentariului.' });
    }
  });

  // ======================================================
  // ## DELETE /comments/:commentId (Șterge un comentariu - Admin/Coordonator)
  // ======================================================
  router.delete('/comments/:commentId', [verifyToken, verifyManager], async (req, res) => {
    const { commentId } = req.params;
    const actorId = req.user.userId;

    try {
      const deleteResult = await pool.query(
        `DELETE FROM post_comments WHERE id = $1 RETURNING id, post_id, content`,
        [commentId]
      );

      if (deleteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Comentariul nu a fost găsit.' });
      }

      await logAction(pool, actorId, 'COMMENT_DELETE', 'comment', parseInt(commentId), {
        post_id: deleteResult.rows[0].post_id,
        content_preview: deleteResult.rows[0].content?.substring(0, 100)
      });

      res.status(200).json({ message: 'Comentariul a fost șters.' });
    } catch (error) {
      console.error('Eroare la ștergerea comentariului:', error);
      res.status(500).json({ error: 'Eroare server la ștergerea comentariului.' });
    }
  });

  // ======================================================
  // ## POST /comments/:commentId/report (Raportează un comentariu)
  // ======================================================
  router.post('/comments/:commentId/report', verifyToken, async (req, res) => {
    const { commentId } = req.params;
    const reporterId = req.user.userId;

    try {
      // Verificăm că comentariul există
      const commentCheck = await pool.query(
        'SELECT id, user_id FROM post_comments WHERE id = $1', [commentId]
      );
      if (commentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Comentariul nu a fost găsit.' });
      }

      // Nu poți raporta propriul comentariu
      if (commentCheck.rows[0].user_id === reporterId) {
        return res.status(400).json({ error: 'Nu poți raporta propriul comentariu.' });
      }

      await pool.query(
        `INSERT INTO comment_reports (comment_id, reporter_id)
         VALUES ($1, $2)
         ON CONFLICT (comment_id, reporter_id) DO NOTHING`,
        [commentId, reporterId]
      );

      res.status(201).json({ message: 'Raportul a fost trimis.' });
    } catch (error) {
      console.error('Eroare la raportarea comentariului:', error);
      res.status(500).json({ error: 'Eroare server la raportare.' });
    }
  });

  // ======================================================
  // ## GET /reports (Listează rapoartele - Admin/Coordonator)
  // ======================================================
  router.get('/reports', [verifyToken, verifyManager], async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          cr.id AS report_id,
          cr.status,
          cr.created_at AS reported_at,
          cr.comment_id,
          c.content AS comment_content,
          c.created_at AS comment_date,
          c.post_id,
          reporter.id AS reporter_id,
          reporter.display_name AS reporter_name,
          author.id AS author_id,
          author.display_name AS author_name
        FROM comment_reports cr
        JOIN post_comments c ON cr.comment_id = c.id
        JOIN users reporter ON cr.reporter_id = reporter.id
        JOIN users author ON c.user_id = author.id
        ORDER BY
          CASE cr.status WHEN 'pending' THEN 0 ELSE 1 END ASC,
          cr.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare la preluarea rapoartelor:', error);
      res.status(500).json({ error: 'Eroare server la preluarea rapoartelor.' });
    }
  });

  // ======================================================
  // ## PATCH /reports/:reportId (Actualizează statusul raportului)
  // ======================================================
  router.patch('/reports/:reportId', [verifyToken, verifyManager], async (req, res) => {
    const { reportId } = req.params;
    const { status } = req.body; // 'reviewed' sau 'dismissed'

    if (!['reviewed', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Status invalid. Folosește: reviewed, dismissed.' });
    }

    try {
      const result = await pool.query(
        `UPDATE comment_reports SET status = $1 WHERE id = $2 RETURNING *`,
        [status, reportId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Raportul nu a fost găsit.' });
      }

      await logAction(pool, req.user.userId, 'REPORT_UPDATE', 'comment_report', parseInt(reportId), { new_status: status });
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Eroare la actualizarea raportului:', error);
      res.status(500).json({ error: 'Eroare server la actualizarea raportului.' });
    }
  });

  // ======================================================
  // ## POST /users/:userId/block (Blochează un utilizator)
  // ======================================================
  router.post('/users/:userId/block', verifyToken, async (req, res) => {
    const blockerId = req.user.userId;
    const blockedId = parseInt(req.params.userId);

    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'Nu te poți bloca pe tine.' });
    }

    try {
      await pool.query(
        `INSERT INTO user_blocks (blocker_id, blocked_id)
         VALUES ($1, $2)
         ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
        [blockerId, blockedId]
      );
      res.status(201).json({ message: 'Utilizatorul a fost blocat.' });
    } catch (error) {
      console.error('Eroare la blocarea utilizatorului:', error);
      res.status(500).json({ error: 'Eroare server la blocare.' });
    }
  });

  // ======================================================
  // ## DELETE /users/:userId/block (Deblochează un utilizator)
  // ======================================================
  router.delete('/users/:userId/block', verifyToken, async (req, res) => {
    const blockerId = req.user.userId;
    const blockedId = parseInt(req.params.userId);

    try {
      await pool.query(
        `DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2`,
        [blockerId, blockedId]
      );
      res.status(200).json({ message: 'Utilizatorul a fost deblocat.' });
    } catch (error) {
      console.error('Eroare la deblocarea utilizatorului:', error);
      res.status(500).json({ error: 'Eroare server la deblocare.' });
    }
  });

  // ======================================================
  // ## GET /blocked-users (Lista utilizatorilor blocați)
  // ======================================================
  router.get('/blocked-users', verifyToken, async (req, res) => {
    const currentUserId = req.user.userId;

    try {
      const result = await pool.query(`
        SELECT
          ub.id AS block_id,
          ub.created_at AS blocked_at,
          u.id AS user_id,
          u.display_name,
          u.avatar_url
        FROM user_blocks ub
        JOIN users u ON ub.blocked_id = u.id
        WHERE ub.blocker_id = $1
        ORDER BY ub.created_at DESC
      `, [currentUserId]);
      res.json(result.rows);
    } catch (error) {
      console.error('Eroare la preluarea utilizatorilor blocați:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // ======================================================
  // ## GET / (Listează toate postările) - MODIFICAT
  // ======================================================
  router.get('/', verifyToken, async (req, res) => {
    const currentUserId = req.user.userId;

    try {
      const results = await pool.query(
        `SELECT 
           p.id, p.description, p.created_at,
           CASE 
             WHEN p.description LIKE '%instagram.com%' THEN 'O.S.A.C.E.'
             ELSE COALESCE(u.display_name, 'O.S.A.C.E.')
           END AS creator_name,
           (
              SELECT json_agg(pi.image_url ORDER BY pi.sort_order) 
              FROM post_images pi 
              WHERE pi.post_id = p.id
           ) AS image_urls,
           (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likes_count,
           (SELECT EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1)) AS is_liked_by_me,
           (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comment_count
         FROM posts p
         JOIN users u ON p.creator_id = u.id
         ORDER BY p.created_at DESC`,
        [currentUserId]
      );
      res.json(results.rows);
    } catch (error) {
      console.error('Eroare la preluarea postărilor:', error);
      res.status(500).json({ error: 'Eroare server la preluarea postărilor.' });
    }
  });

  // ======================================================
  // ## POST /:id/like (Dă like la o postare)
  // ======================================================
  router.post('/:id/like', verifyToken, async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.userId;

    try {
      await pool.query(
        `INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT (user_id, post_id) DO NOTHING`,
        [userId, postId]
      );
      checkBadgesOnLike(userId, pool);
      res.status(201).json({ message: 'Like adăugat.' });
    } catch (error) {
      console.error('Eroare la adăugarea like-ului:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });


  // ======================================================
  // ## DELETE /:id/like (Retrage like-ul)
  // ======================================================
  router.delete('/:id/like', verifyToken, async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.userId;

    try {
      await pool.query(
        `DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2`,
        [userId, postId]
      );
      res.status(200).json({ message: 'Like retras.' });
    } catch (error) {
      console.error('Eroare la retragerea like-ului:', error);
      res.status(500).json({ error: 'Eroare server.' });
    }
  });

  // =RECTIFICAT: Acum ștergem și imaginile fizice și din DB
  // ======================================================
  // ## DELETE /:id (Șterge o postare)
  // ======================================================
  router.delete('/:id', [verifyToken, verifyManager], async (req, res) => {
    const postId = req.params.id;
    const UPLOADS_DIR = '/var/www/osace-uploads/posts/'; // Directorul de upload (subfolder dedicat)

    try {
      // 1. Preluăm URL-urile imaginilor (pentru a le șterge fizic)
      const imagesResult = await pool.query('SELECT image_url FROM post_images WHERE post_id = $1', [postId]);

      // 2. Ștergem postarea (și imaginile din post_images via CASCADE)
      const deleteResult = await pool.query(`DELETE FROM posts WHERE id = $1 RETURNING id`, [postId]);

      if (deleteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Postarea nu a fost găsită.' });
      }

      // 3. Ștergem fișierele fizice (ne sincronizăm cu Nginx)
      const deleteFilePromises = imagesResult.rows.map(row => {
        // Extragem numele fișierului din URL
        const filename = row.image_url.split('/').pop();
        const filePath = path.join(UPLOADS_DIR, filename);

        // Folosim fs.unlink pentru ștergere
        return fs.unlink(filePath).catch(err => {
          // Dacă fișierul nu există, continuăm (logăm doar eroarea)
          if (err.code !== 'ENOENT') {
            console.error(`Eroare la ștergerea fișierului ${filename}:`, err);
          }
        });
      });

      await Promise.all(deleteFilePromises);

      await logAction(pool, req.user.userId, 'POST_DELETE', 'post', parseInt(postId), {});
      res.status(200).json({ message: 'Postarea și imaginile asociate au fost șterse.' });
    } catch (error) {
      console.error('Eroare la ștergerea postării:', error);
      res.status(500).json({ error: 'Eroare server la ștergere.' });
    }
  });

  return router;
};