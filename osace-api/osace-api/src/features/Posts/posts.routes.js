const express = require('express');
const router = express.Router();
const multer = require('multer');

const path = require('path');
const API_DOMAIN = 'https://api.osace.ro'; // URL-ul API-ului
const { checkBadgesOnLike, checkBadgesOnComment, checkBadgesOnPostCreate } = require('../../features/Badge/badge.service'); // S-ar putea să trebuiască să ajustezi calea '../'

// --- Configurare Multer (Upload Imagini) ---
const { uploadPostImages } = require('../../config/multer');
const UPLOAD_DIRECTORY = '/var/www/osace-uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIRECTORY);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'osace-post-' + uniqueSuffix + extension);
  }
});

// Middleware pentru upload de ARRAY de fișiere (max 10)
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// --- Exportăm Rutele ---
module.exports = (pool, verifyToken, verifyManager) => {
  const fs = require('fs/promises'); // Modul necesar pentru ștergerea fișierelor

  // ======================================================
  // ## POST / (Creează o postare nouă cu multiple imagini) - CORECTAT
  // ======================================================
  router.post('/', [verifyToken, verifyManager, uploadPostImages.array('images', 10)], async (req, res) => {
    
    const { description, created_at } = req.body;
    const creatorId = req.user.userId;
    const postDate = created_at ? new Date(created_at) : new Date();

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Postarea trebuie să conțină cel puțin o imagine.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Inserăm postarea principală
        const newPostResult = await client.query(
            `INSERT INTO posts (creator_id, description, created_at) 
             VALUES ($1, $2, $3) 
             RETURNING id`,
            [creatorId, description, postDate]
        );
        const postId = newPostResult.rows[0].id;

        // 2. Inserăm URL-urile imaginilor
        const imageInsertPromises = req.files.map((file, index) => {
            const imageUrl = `${API_DOMAIN}/uploads/${file.filename}`;
            return client.query(
                `INSERT INTO post_images (post_id, image_url, sort_order) 
                 VALUES ($1, $2, $3)`,
                [postId, imageUrl, index]
            );
        });

        await Promise.all(imageInsertPromises);

        await client.query('COMMIT');
        checkBadgesOnPostCreate(creatorId, pool);
        res.status(201).json({ 
            id: postId,
            description,
            created_at: postDate,
            message: `Postare creată cu ${req.files.length} imagini.`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Eroare la crearea postării cu multiple imagini:', error);
        res.status(500).json({ error: 'Eroare server la crearea postării.' });
    } finally {
        client.release();
    }
  });


  router.get('/:id/comments', verifyToken, async (req, res) => {
    const { id } = req.params; // ID-ul postării

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
        ORDER BY
          c.created_at ASC; -- Arată comentariile de la cel mai vechi la cel mai nou
      `;
      const result = await pool.query(commentsQuery, [id]);
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
  // ## GET / (Listează toate postările) - MODIFICAT
  // ======================================================
  router.get('/', verifyToken, async (req, res) => {
    const currentUserId = req.user.userId;

    try {
      const results = await pool.query(
        `SELECT 
           p.id, p.description, p.created_at,
           u.display_name AS creator_name,
           (
              SELECT json_agg(pi.image_url ORDER BY pi.sort_order) 
              FROM post_images pi 
              WHERE pi.post_id = p.id
           ) AS image_urls,
           (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS likes_count,
           (SELECT EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1)) AS is_liked_by_me,
           
           -- ▼▼▼ LINIE NOUĂ ADĂUGATĂ ▼▼▼
           (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comment_count
           -- ▲▲▲ SFÂRȘIT LINIE NOUĂ ▲▲▲

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
  // ## PUT /:id (Editează o postare existentă) - CORECTAT
  // ======================================================
  router.put('/:id', [verifyToken, verifyManager], async (req, res) => {
    const postId = req.params.id;
    const { description, created_at } = req.body;
    const { userId, role } = req.user;

    if (!description) {
      return res.status(400).json({ error: 'Descrierea postării este obligatorie.' });
    }

    try {
      let query;
      let params;
      
      // NOTĂ: Nu permitem schimbarea imaginii aici.
      const baseQuery = `UPDATE posts SET description = $1, created_at = $2 WHERE id = $3`;
      // CORECTAT: Am scos 'image_url' din RETURN, deoarece nu mai există în tabela 'posts'
      const returning = ` RETURNING id, description, created_at, creator_id`;
      
      if (role === 'admin') {
          query = baseQuery + returning;
          params = [description, created_at, postId];
      } else { // Coordonator
          query = baseQuery + ` AND creator_id = $4` + returning;
          params = [description, created_at, postId, userId];
      }

      const updateResult = await pool.query(query, params);

      if (updateResult.rows.length === 0) {
          return res.status(403).json({ error: 'Postarea nu a fost găsită sau nu ai permisiunea de a o edita.' });
      }

      res.status(200).json(updateResult.rows[0]);

    } catch (error) {
      console.error('Eroare la editarea postării:', error);
      res.status(500).json({ error: 'Eroare server la editare.' });
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
    const UPLOADS_DIR = '/var/www/osace-uploads/'; // Directorul de upload
    
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
        
        res.status(200).json({ message: 'Postarea și imaginile asociate au fost șterse.' });
    } catch (error) {
        console.error('Eroare la ștergerea postării:', error);
        res.status(500).json({ error: 'Eroare server la ștergere.' });
    }
  });

  return router;
};