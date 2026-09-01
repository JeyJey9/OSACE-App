// scripts/run-migration.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  const sqlFile = path.join(__dirname, '../migrations/001_archive_tables.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log(`[Migration] Rulare ${sqlFile} pe ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}...`);
  try {
    await pool.query(sql);
    console.log('✅ Migratia 001_archive_tables.sql a fost executata cu succes in baza de date!');
  } catch (err) {
    console.error('❌ Eroare la executarea migratiei:', err.message);
  } finally {
    await pool.end();
  }
}

run();
