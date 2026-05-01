import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

export default pool;

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const { rows } = await pool.query(text, params);
  return rows as T[];
}

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      avatar_color VARCHAR(20) DEFAULT '#f59e0b',
      bio TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tmdb_id INT NOT NULL,
      media_type VARCHAR(10) NOT NULL DEFAULT 'movie',
      rating NUMERIC(3,1) NOT NULL CHECK (rating BETWEEN 1 AND 10),
      is_fresh BOOLEAN NOT NULL DEFAULT true,
      content TEXT,
      has_spoilers BOOLEAN DEFAULT false,
      movie_title VARCHAR(300),
      movie_poster VARCHAR(200),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, tmdb_id, media_type)
    );

    CREATE TABLE IF NOT EXISTS watchlist (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tmdb_id INT NOT NULL,
      media_type VARCHAR(10) NOT NULL DEFAULT 'movie',
      title VARCHAR(300),
      poster_path VARCHAR(200),
      added_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, tmdb_id, media_type)
    );

    CREATE TABLE IF NOT EXISTS watch_progress (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tmdb_id INT NOT NULL,
      media_type VARCHAR(10) NOT NULL DEFAULT 'movie',
      season_number INT DEFAULT 1,
      episode_number INT DEFAULT 1,
      progress_seconds INT DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, tmdb_id, media_type)
    );

    CREATE TABLE IF NOT EXISTS media_tags (
      id SERIAL PRIMARY KEY,
      tmdb_id INT NOT NULL,
      media_type VARCHAR(10) NOT NULL,
      tag VARCHAR(60) NOT NULL,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, tmdb_id, media_type, tag)
    );

    CREATE TABLE IF NOT EXISTS collections (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      is_public BOOLEAN DEFAULT true,
      cover_poster VARCHAR(200),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS collection_items (
      id SERIAL PRIMARY KEY,
      collection_id INT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      tmdb_id INT NOT NULL,
      media_type VARCHAR(10) NOT NULL,
      title VARCHAR(300),
      poster_path VARCHAR(200),
      note TEXT,
      added_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(collection_id, tmdb_id, media_type)
    );

    CREATE TABLE IF NOT EXISTS collection_follows (
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      collection_id INT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      followed_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, collection_id)
    );

    CREATE TABLE IF NOT EXISTS user_genre_stats (
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      genre_id INT NOT NULL,
      genre_name VARCHAR(100),
      watch_count INT DEFAULT 0,
      total_rating NUMERIC DEFAULT 0,
      watch_seconds INT DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, genre_id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    );
  `);

  // Add columns that may be missing in existing tables
  await pool.query(`
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS movie_title VARCHAR(300);
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS movie_poster VARCHAR(200);
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS has_spoilers BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(20) DEFAULT '#f59e0b';
    ALTER TABLE collections ADD COLUMN IF NOT EXISTS cover_poster VARCHAR(200);
    ALTER TABLE collection_items ADD COLUMN IF NOT EXISTS note TEXT;
  `);
}
