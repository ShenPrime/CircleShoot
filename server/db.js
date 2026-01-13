// PostgreSQL database connection and queries

const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

/**
 * Initialize database tables
 */
async function initDB() {
  const client = await pool.connect();
  try {
    // Create players table
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        visitor_id TEXT UNIQUE NOT NULL,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create scores table
    await client.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        visitor_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        rank_achieved INTEGER DEFAULT 1,
        duration_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes (IF NOT EXISTS for idempotency)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_scores_visitor ON scores(visitor_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_players_name ON players(name)
    `);

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

/**
 * Check if a name is already taken
 * @param {string} name - Name to check
 * @returns {Promise<boolean>} True if name is taken
 */
async function isNameTaken(name) {
  const result = await pool.query(
    'SELECT 1 FROM players WHERE LOWER(name) = LOWER($1) LIMIT 1',
    [name]
  );
  return result.rows.length > 0;
}

/**
 * Create a new player
 * @param {string} visitorId - Unique visitor identifier
 * @param {string} name - Player name
 * @returns {Promise<object>} Created player
 */
async function createPlayer(visitorId, name) {
  const result = await pool.query(
    `INSERT INTO players (visitor_id, name) 
     VALUES ($1, $2) 
     RETURNING id, visitor_id, name, created_at`,
    [visitorId, name]
  );
  return result.rows[0];
}

/**
 * Get player by visitor ID
 * @param {string} visitorId - Visitor identifier
 * @returns {Promise<object|null>} Player or null
 */
async function getPlayerByVisitorId(visitorId) {
  const result = await pool.query(
    'SELECT * FROM players WHERE visitor_id = $1',
    [visitorId]
  );
  return result.rows[0] || null;
}

/**
 * Update player name
 * @param {string} visitorId - Visitor identifier
 * @param {string} newName - New name
 * @returns {Promise<object|null>} Updated player or null
 */
async function updatePlayerName(visitorId, newName) {
  const result = await pool.query(
    `UPDATE players 
     SET name = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE visitor_id = $2 
     RETURNING id, visitor_id, name, updated_at`,
    [newName, visitorId]
  );
  return result.rows[0] || null;
}

/**
 * Insert a new score
 * @param {string} visitorId - Visitor identifier
 * @param {number} score - Score achieved
 * @param {number} rankAchieved - Rank achieved in game
 * @param {number} durationMs - Game duration in milliseconds
 * @returns {Promise<object>} Created score record
 */
async function insertScore(visitorId, score, rankAchieved, durationMs) {
  const result = await pool.query(
    `INSERT INTO scores (visitor_id, score, rank_achieved, duration_ms)
     VALUES ($1, $2, $3, $4)
     RETURNING id, score, rank_achieved, duration_ms, created_at`,
    [visitorId, score, rankAchieved, durationMs]
  );
  return result.rows[0];
}

/**
 * Get top scores with player names
 * Uses each player's best score only
 * @param {number} limit - Number of scores to return
 * @returns {Promise<array>} Top scores with player names
 */
async function getTopScores(limit = 100) {
  const result = await pool.query(`
    SELECT 
      p.name,
      s.best_score as score,
      s.best_rank as rank_achieved,
      s.games_played,
      s.last_played
    FROM players p
    INNER JOIN (
      SELECT 
        visitor_id,
        MAX(score) as best_score,
        MAX(rank_achieved) as best_rank,
        COUNT(*) as games_played,
        MAX(created_at) as last_played
      FROM scores
      GROUP BY visitor_id
    ) s ON p.visitor_id = s.visitor_id
    ORDER BY s.best_score DESC
    LIMIT $1
  `, [limit]);

  // Add rank numbers
  return result.rows.map((row, index) => ({
    rank: index + 1,
    name: row.name,
    score: row.score,
    rankAchieved: row.rank_achieved,
    gamesPlayed: row.games_played,
    lastPlayed: row.last_played
  }));
}

/**
 * Get a player's best score and rank
 * @param {string} visitorId - Visitor identifier
 * @returns {Promise<object|null>} Player stats or null
 */
async function getPlayerStats(visitorId) {
  // Get player's best score
  const bestScoreResult = await pool.query(`
    SELECT 
      MAX(score) as best_score,
      MAX(rank_achieved) as best_rank,
      COUNT(*) as games_played
    FROM scores
    WHERE visitor_id = $1
  `, [visitorId]);

  const stats = bestScoreResult.rows[0];
  
  if (!stats || stats.games_played === '0') {
    return null;
  }

  // Calculate player's global rank (how many players have a higher best score)
  const rankResult = await pool.query(`
    SELECT COUNT(DISTINCT visitor_id) + 1 as global_rank
    FROM scores
    WHERE visitor_id IN (
      SELECT visitor_id
      FROM scores
      GROUP BY visitor_id
      HAVING MAX(score) > $1
    )
  `, [stats.best_score]);

  return {
    bestScore: parseInt(stats.best_score),
    bestRank: parseInt(stats.best_rank),
    gamesPlayed: parseInt(stats.games_played),
    globalRank: parseInt(rankResult.rows[0].global_rank)
  };
}

/**
 * Get total number of unique players
 * @returns {Promise<number>} Total player count
 */
async function getTotalPlayers() {
  const result = await pool.query('SELECT COUNT(*) as count FROM players');
  return parseInt(result.rows[0].count);
}

/**
 * Close database pool (for graceful shutdown)
 */
async function closeDB() {
  await pool.end();
}

module.exports = {
  pool,
  initDB,
  isNameTaken,
  createPlayer,
  getPlayerByVisitorId,
  updatePlayerName,
  insertScore,
  getTopScores,
  getPlayerStats,
  getTotalPlayers,
  closeDB
};
