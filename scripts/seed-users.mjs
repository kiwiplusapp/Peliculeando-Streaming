/**
 * Seed script: creates 15 realistic users with reviews, watchlist entries,
 * and review votes so the El Olimpo leaderboard has real data.
 *
 * Run: node scripts/seed-users.mjs
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';

const DATABASE_URL = 'postgresql://neondb_owner:npg_RwVZQ6F2nXrq@ep-icy-fire-acocm69r-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const USERS = [
  { username: 'LuciaSilva',    email: 'lucia@peliculeando.test',   color: '#FFE600', bio: 'Crítica freelance. Slow cinema, body horror, melodrama latinoamericano.' },
  { username: 'MarcosRivera',  email: 'marcos@peliculeando.test',  color: '#FF6B35', bio: 'Fan incondicional de Scorsese y los thrillers franceses.' },
  { username: 'SofiaVega',     email: 'sofia@peliculeando.test',   color: '#A855F7', bio: 'Cinéfila de culto. Horror asiático y nouvelle vague.' },
  { username: 'AndresCastro',  email: 'andres@peliculeando.test',  color: '#3B82F6', bio: 'Amante del sci-fi y el cine de autor.' },
  { username: 'ValeriaMoon',   email: 'valeria@peliculeando.test', color: '#EC4899', bio: 'Animación japonesa y cine independiente americano.' },
  { username: 'DiegoNieto',    email: 'diego@peliculeando.test',   color: '#10B981', bio: 'Documentales y cine político latinoamericano.' },
  { username: 'CamilaOrtiz',   email: 'camila@peliculeando.test',  color: '#F59E0B', bio: 'Drama europeo y cinema verité.' },
  { username: 'RodrigoFlores', email: 'rodrigo@peliculeando.test', color: '#EF4444', bio: 'Acción, thrillers, y el MCU sin disculpas.' },
  { username: 'IsabelMendez',  email: 'isabel@peliculeando.test',  color: '#6366F1', bio: 'Especialista en cine mudo y películas de los 30-50s.' },
  { username: 'FernandoPaz',   email: 'fernando@peliculeando.test',color: '#14B8A6', bio: 'Cine de terror clásico y slashers de los 80s.' },
  { username: 'NataliaReyes',  email: 'natalia@peliculeando.test', color: '#FB923C', bio: 'Rom-coms, comedias negras y Wes Anderson.' },
  { username: 'JuanDelgado',   email: 'juan@peliculeando.test',    color: '#84CC16', bio: 'Western, noir y cine de Kurosawa.' },
  { username: 'MarisolTorres', email: 'marisol@peliculeando.test', color: '#F43F5E', bio: 'Musical, fantasía y Studio Ghibli.' },
  { username: 'HectorLuna',    email: 'hector@peliculeando.test',  color: '#8B5CF6', bio: 'Cine de arte y ensayo. Sin subtítulos preferiblemente.' },
  { username: 'AnaGuerra',     email: 'ana@peliculeando.test',     color: '#06B6D4', bio: 'Todo tipo de cine. Reseño desde 2018.' },
];

// Popular movies (TMDB IDs + data)
const MOVIES = [
  { tmdb_id: 533535, title: 'Deadpool & Wolverine',     poster: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg', type: 'movie' },
  { tmdb_id: 278,    title: 'The Shawshank Redemption', poster: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', type: 'movie' },
  { tmdb_id: 238,    title: 'The Godfather',             poster: '/3bhkrj58Vtu7enYsLegHnDcdh9b.jpg', type: 'movie' },
  { tmdb_id: 424,    title: "Schindler's List",           poster: '/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', type: 'movie' },
  { tmdb_id: 27205,  title: 'Inception',                 poster: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', type: 'movie' },
  { tmdb_id: 155,    title: 'The Dark Knight',           poster: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', type: 'movie' },
  { tmdb_id: 680,    title: 'Pulp Fiction',              poster: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', type: 'movie' },
  { tmdb_id: 13,     title: 'Forrest Gump',              poster: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', type: 'movie' },
  { tmdb_id: 122,    title: 'The Lord of the Rings: The Return of the King', poster: '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', type: 'movie' },
  { tmdb_id: 550,    title: 'Fight Club',                poster: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', type: 'movie' },
  { tmdb_id: 11,     title: 'Star Wars',                 poster: '/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg', type: 'movie' },
  { tmdb_id: 389,    title: '12 Angry Men',              poster: '/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg', type: 'movie' },
  { tmdb_id: 637,    title: 'Life is Beautiful',         poster: '/74hLDKjD5aGYOotO6esUVaeISa2.jpg', type: 'movie' },
  { tmdb_id: 598,    title: 'City of God',               poster: '/k7eYdWvhYQyRQoU2TB2A2Xu2grZ.jpg', type: 'movie' },
  { tmdb_id: 240,    title: 'The Godfather Part II',     poster: '/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg', type: 'movie' },
  { tmdb_id: 129,    title: 'Spirited Away',             poster: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', type: 'movie' },
  { tmdb_id: 769,    title: 'GoodFellas',                poster: '/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg', type: 'movie' },
  { tmdb_id: 372058, title: 'Your Name.',                poster: '/q719jXXEzOoYaps6babgKnONONX.jpg', type: 'movie' },
  { tmdb_id: 496243, title: 'Parasite',                  poster: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', type: 'movie' },
  { tmdb_id: 324857, title: 'Spider-Man: Into the Spider-Verse', poster: '/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', type: 'movie' },
];

const REVIEW_TEMPLATES = [
  'Una obra maestra absoluta. Cada fotograma es perfecto.',
  'Impresionante actuación principal. Te deja sin palabras.',
  'El guión es brillante, pero el ritmo podría ser mejor.',
  'Una experiencia cinematográfica única que no olvidarás fácilmente.',
  'Visualmente impactante pero narrativamente convencional.',
  'La dirección de fotografía es extraordinaria. Un regalo para los ojos.',
  'Emotiva y poderosa. Me sacó lágrimas en varios momentos.',
  'Demasiado larga para lo que tiene que contar, pero aun así vale la pena.',
  'Uno de los mejores finales de la década. Absolutamente devastador.',
  'No entendí el hype hasta que la vi por segunda vez. Obra maestra tardía.',
  'El soundtrack eleva todo. Perfecta integración música-imagen.',
  'Actuaciones sólidas pero la historia se siente derivativa.',
  'Cada detalle importa. Requiere múltiples visionados para apreciarla completamente.',
  'Un clásico instantáneo que definirá su época.',
  'Brutal, honesta, incómoda. Exactamente lo que el cine debería ser.',
  'Entretenida sin ser profunda. Cine palomero de calidad.',
  'El villano roba la película completamente. Performance inolvidable.',
  'Tensa de principio a fin. No pude soltar el control en ningún momento.',
  'Una rareza. Desafía las convenciones del género de maneras fascinantes.',
  'Cine de autor en su máxima expresión. No apta para todos los paladares.',
];

function randomRating(min = 5, max = 10) {
  return Math.round((Math.random() * (max - min) + min) * 2) / 2;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🎬 Starting Peliculeando DB seed...\n');
    const passwordHash = await bcrypt.hash('Test1234!', 10);

    // Insert users
    const userIds = [];
    for (const u of USERS) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (existing.rows.length > 0) {
        console.log(`  ↷ Skipping ${u.username} (already exists)`);
        userIds.push(existing.rows[0].id);
        continue;
      }
      const res = await client.query(
        `INSERT INTO users (username, email, password_hash, avatar_color, bio, xp_total)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [u.username, u.email, passwordHash, u.color, u.bio, randomInt(500, 12000)]
      );
      userIds.push(res.rows[0].id);
      console.log(`  ✓ Created user: ${u.username} (id=${res.rows[0].id})`);
    }

    console.log('\n📝 Adding reviews...');
    const reviewIds = [];

    for (let ui = 0; ui < userIds.length; ui++) {
      const uid = userIds[ui];
      // Each user reviews between 8 and 18 movies
      const reviewCount = randomInt(8, 18);
      const shuffledMovies = [...MOVIES].sort(() => Math.random() - 0.5).slice(0, reviewCount);

      for (const movie of shuffledMovies) {
        const rating = randomRating(4, 10);
        const isFresh = rating >= 6;
        const content = Math.random() > 0.25 ? REVIEW_TEMPLATES[randomInt(0, REVIEW_TEMPLATES.length - 1)] : null;

        try {
          const res = await client.query(
            `INSERT INTO reviews (user_id, tmdb_id, media_type, rating, is_fresh, content, movie_title, movie_poster, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - INTERVAL '${randomInt(1, 365)} days')
             ON CONFLICT (user_id, tmdb_id, media_type) DO NOTHING
             RETURNING id`,
            [uid, movie.tmdb_id, movie.type, rating, isFresh, content, movie.title, movie.poster]
          );
          if (res.rows.length > 0) {
            reviewIds.push(res.rows[0].id);
          }
        } catch (e) {
          // ignore conflicts
        }
      }
      process.stdout.write(`  ✓ ${USERS[ui].username}: ${reviewCount} reseñas\n`);
    }

    console.log('\n👍 Adding review votes for karma...');
    for (const rid of reviewIds) {
      // Each review gets 0-8 random helpful votes from other users
      const voteCount = randomInt(0, 8);
      const voters = [...userIds].sort(() => Math.random() - 0.5).slice(0, voteCount);
      for (const voterId of voters) {
        try {
          await client.query(
            `INSERT INTO review_votes (review_id, user_id, is_helpful)
             VALUES ($1, $2, true)
             ON CONFLICT (review_id, user_id) DO NOTHING`,
            [rid, voterId]
          );
        } catch {}
      }
    }

    console.log('\n🎯 Adding watchlist entries...');
    for (let ui = 0; ui < userIds.length; ui++) {
      const uid = userIds[ui];
      const wCount = randomInt(10, 30);
      const shuffled = [...MOVIES].sort(() => Math.random() - 0.5).slice(0, wCount);
      for (const movie of shuffled) {
        try {
          await client.query(
            `INSERT INTO watchlist (user_id, tmdb_id, media_type, title, poster_path)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, tmdb_id, media_type) DO NOTHING`,
            [uid, movie.tmdb_id, movie.type, movie.title, movie.poster]
          );
        } catch {}
      }
    }

    // Final stats
    const { rows: [stats] } = await client.query(`
      SELECT COUNT(*) AS users,
             (SELECT COUNT(*) FROM reviews) AS reviews,
             (SELECT COUNT(*) FROM watchlist) AS watchlist,
             (SELECT COUNT(*) FROM review_votes) AS votes
      FROM users
    `);
    console.log('\n✅ Seed complete!');
    console.log(`   Users:    ${stats.users}`);
    console.log(`   Reviews:  ${stats.reviews}`);
    console.log(`   Watchlist:${stats.watchlist}`);
    console.log(`   Votes:    ${stats.votes}`);
    console.log('\nVisit /comunidad to see El Olimpo leaderboard 🏆');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(e => { console.error(e); process.exit(1); });
