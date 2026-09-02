#!/usr/bin/env node
/**
 * full-ig-sync.js — Script complet de sincronizare Instagram → Google Drive → DB
 * 
 * Rulează direct pe VPS:  node scripts/full-ig-sync.js
 * 
 * Ce face:
 * 1. Paginează prin TOATE postările de pe Instagram
 * 2. Preia și descarcă video-uri (.mp4) și imagini (.jpg/.png/.webp)
 * 3. Pentru CAROUSEL_ALBUM, preia TOATE elementele (inclusiv video/imagini mix)
 * 4. Descarcă fiecare fișier și îl urcă pe Google Drive cu retry (3 încercări)
 * 5. Actualizează baza de date cu URL-urile corecte (.mp4 pentru video, permițând video player-ului din app să le redea)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');
const { Pool } = require('pg');
const googleDriveService = require('../src/services/googleDriveService');

const API_DOMAIN = 'https://api.osace.ro';
const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

if (!TOKEN) {
  console.error('❌ INSTAGRAM_ACCESS_TOKEN lipsește din .env!');
  process.exit(1);
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// --- Utilități ---

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryUpload(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err.message || '';
      const isRetryable = msg.includes('502') || msg.includes('503') || 
                          msg.includes('ECONNRESET') || msg.includes('timeout') ||
                          msg.includes('ETIMEDOUT');
      if (attempt === maxRetries || !isRetryable) throw err;
      const delay = attempt * 3000; // 3s, 6s, 9s
      console.log(`   ⏳ Retry ${attempt}/${maxRetries} după ${delay / 1000}s... (${msg.substring(0, 60)})`);
      await sleep(delay);
    }
  }
}

// --- 1. Preia TOATE postările de pe Instagram (cu paginare) ---

async function fetchAllInstagramPosts() {
  const allPosts = [];
  let url = 'https://graph.instagram.com/me/media';
  let params = {
    fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,children{id,media_type,media_url,thumbnail_url}',
    access_token: TOKEN,
    limit: 50
  };
  let page = 1;

  while (url) {
    try {
      console.log(`📄 Preluare pagina ${page}...`);
      const res = await axios.get(url, { params, timeout: 20000 });
      const items = res.data?.data || [];
      
      for (const item of items) {
        const post = {
          igId: item.id,
          caption: item.caption || '',
          permalink: item.permalink,
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
          mediaType: item.media_type,
          mediaList: [] // { url, isVideo }
        };

        if (item.media_type === 'CAROUSEL_ALBUM' && item.children?.data) {
          // Carousel: preluăm TOATE elementele (imagini & video-uri)
          for (const child of item.children.data) {
            const isVid = child.media_type === 'VIDEO';
            const mediaUrl = child.media_url || child.thumbnail_url;
            if (mediaUrl) {
              post.mediaList.push({ url: mediaUrl, isVideo: isVid });
            }
          }
          if (post.mediaList.length === 0 && (item.media_url || item.thumbnail_url)) {
            post.mediaList.push({ url: item.media_url || item.thumbnail_url, isVideo: item.media_type === 'VIDEO' });
          }
        } else if (item.media_type === 'VIDEO') {
          // Video: media_url este fișierul MP4 video!
          const videoUrl = item.media_url || item.thumbnail_url;
          if (videoUrl) {
            post.mediaList.push({ url: videoUrl, isVideo: true });
          }
        } else {
          // IMAGE
          if (item.media_url) {
            post.mediaList.push({ url: item.media_url, isVideo: false });
          }
        }

        if (post.mediaList.length > 0) {
          allPosts.push(post);
        }
      }

      // Paginare
      const nextUrl = res.data?.paging?.next;
      if (nextUrl) {
        url = nextUrl;
        params = {}; // next URL conține deja parametrii
        page++;
        await sleep(500);
      } else {
        url = null;
      }
    } catch (err) {
      console.error(`❌ Eroare la preluare pagina ${page}:`, err.message);
      break;
    }
  }

  console.log(`\n📊 Total postări preluate de pe Instagram: ${allPosts.length}\n`);
  return allPosts;
}

// --- 2. Descarcă media (Video/Imagine) și urcă pe Google Drive ---

async function downloadAndUpload(mediaObj, igFolder, permalink, index) {
  const { url, isVideo } = mediaObj;

  return retryUpload(async () => {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: isVideo ? 120000 : 30000,
      maxContentLength: 250 * 1024 * 1024,
      maxBodyLength: 250 * 1024 * 1024,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });

    const buffer = Buffer.from(res.data);
    const contentType = res.headers['content-type'] || (isVideo ? 'video/mp4' : 'image/jpeg');
    
    if (contentType.includes('text/html') || buffer.length < 1000) {
      throw new Error('Răspuns invalid (HTML sau fișier prea mic)');
    }

    let ext = 'jpg';
    let mimeType = 'image/jpeg';

    if (isVideo || contentType.includes('video') || contentType.includes('mp4')) {
      ext = 'mp4';
      mimeType = 'video/mp4';
    } else if (contentType.includes('png')) {
      ext = 'png';
      mimeType = 'image/png';
    } else if (contentType.includes('webp')) {
      ext = 'webp';
      mimeType = 'image/webp';
    }

    const filename = `ig_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}.${ext}`;

    const driveFile = await googleDriveService.uploadFile({
      name: filename,
      mimeType,
      body: buffer,
      parentFolderId: igFolder ? igFolder.id : undefined,
      description: `Instagram @o.s.a.c.e - ${permalink}`,
    });

    if (driveFile && driveFile.id) {
      return ext === 'mp4'
        ? `${API_DOMAIN}/api/posts/media/${driveFile.id}.mp4`
        : `${API_DOMAIN}/api/posts/media/${driveFile.id}.jpg`;
    }
    throw new Error('Upload reușit pe Drive dar fără ID returnat');
  });
}

// --- 3. Procesează și sincronizează în DB ---

async function syncPost(post, igFolder, stats, creatorId = 33, isFresh = false) {
  const description = post.caption + `\n\n📸 Vezi pe Instagram: ${post.permalink}`;

  let existingPostId = null;

  if (!isFresh) {
    // Verifică dacă postarea există deja în DB
    const check = await pool.query(
      `SELECT p.id 
       FROM posts p 
       WHERE p.description LIKE $1`,
      [`%${post.permalink}%`]
    );
    existingPostId = check.rows.length > 0 ? check.rows[0].id : null;
  }

  // Descarcă și urcă fiecare element media
  const driveUrls = [];
  for (let i = 0; i < post.mediaList.length; i++) {
    const item = post.mediaList[i];
    try {
      const typeLabel = item.isVideo ? '🎥 Video MP4' : '🖼️ Imagine';
      process.stdout.write(`   [${i + 1}/${post.mediaList.length}] Se descarcă și urcă ${typeLabel}... `);
      const driveUrl = await downloadAndUpload(item, igFolder, post.permalink, i);
      driveUrls.push(driveUrl);
      console.log(`✅ OK (${driveUrl})`);
    } catch (err) {
      console.log(`⚠️ Eșuat: ${err.message?.substring(0, 60)}`);
      driveUrls.push(item.url); // fallback
    }
    await sleep(600);
  }

  if (existingPostId) {
    // Postare existentă: actualizăm imaginile/video-urile
    await pool.query(`DELETE FROM post_images WHERE post_id = $1`, [existingPostId]);
    for (let i = 0; i < driveUrls.length; i++) {
      await pool.query(
        `INSERT INTO post_images (post_id, image_url, sort_order) VALUES ($1, $2, $3)`,
        [existingPostId, driveUrls[i], i]
      );
    }
    await pool.query(
      `UPDATE posts SET description = $1 WHERE id = $2`,
      [description, existingPostId]
    );
    stats.repaired++;
  } else {
    // Postare nouă: inserăm
    const newPost = await pool.query(
      `INSERT INTO posts (creator_id, description, created_at) VALUES ($1, $2, $3) RETURNING id`,
      [creatorId, description, post.timestamp]
    );
    const postId = newPost.rows[0].id;

    for (let i = 0; i < driveUrls.length; i++) {
      await pool.query(
        `INSERT INTO post_images (post_id, image_url, sort_order) VALUES ($1, $2, $3)`,
        [postId, driveUrls[i], i]
      );
    }
    stats.synced++;
  }
}

// --- MAIN ---

async function main() {
  console.log('🚀 Full Instagram Sync cu suport Video MP4 & Carousel — Start\n');

  const isFresh = process.argv.includes('--fresh') || process.argv.includes('--clean');

  // Determină ID-ul de autor (admin sau primul user)
  let creatorId = 33;
  try {
    const userCheck = await pool.query(`SELECT id FROM users ORDER BY id ASC LIMIT 1`);
    if (userCheck.rows.length > 0) {
      creatorId = userCheck.rows[0].id;
    }
  } catch (_) {}

  if (isFresh) {
    console.log('🧹 Mod --fresh activat: Se curăță tabelele posts, post_images, post_likes, post_comments...');
    await pool.query(`TRUNCATE TABLE post_comments, post_likes, post_images, posts RESTART IDENTITY CASCADE`);
    console.log('✅ Baza de date curățată complet!\n');
  }

  // 1. Preluăm toate postările
  const posts = await fetchAllInstagramPosts();
  if (posts.length === 0) {
    console.log('❌ Nicio postare preluată.');
    process.exit(1);
  }

  // 2. Asigurăm folderul pe Google Drive
  let igFolder = null;
  try {
    igFolder = await googleDriveService.ensureFolderPath('04_Instagram_Media');
    console.log(`📁 Folder Google Drive: ${igFolder?.id || 'ROOT'}\n`);
  } catch (err) {
    console.warn('⚠️ Nu s-a putut asigura folderul pe Drive:', err.message);
  }

  // 3. Procesăm secvențial
  const stats = { synced: 0, repaired: 0, failed: 0 };

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const preview = p.caption.replace(/\n/g, ' ').substring(0, 45);
    console.log(`[${i + 1}/${posts.length}] ${p.mediaType} (${p.mediaList.length} media) — "${preview}..."`);

    try {
      await syncPost(p, igFolder, stats, creatorId, isFresh);
    } catch (err) {
      console.error(`   ❌ Eroare: ${err.message}`);
      stats.failed++;
    }
    console.log('');
    await sleep(400);
  }

  console.log('\n' + '='.repeat(55));
  console.log(`🎉 Sincronizare completă!`);
  console.log(`   📥 Postări noi create: ${stats.synced}`);
  console.log(`   🔧 Postări reparate / actualizate: ${stats.repaired}`);
  console.log(`   ❌ Eșuate: ${stats.failed}`);
  console.log('='.repeat(55));

  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('💀 Eroare fatală:', err);
  process.exit(1);
});
