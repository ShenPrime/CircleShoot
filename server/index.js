// Express server for Circle Shoot leaderboard API

const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const db = require('./db');
const { generateUniqueName, validateName } = require('./nameGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files from project root
app.use(express.static(path.join(__dirname, '..')));

// Rate limiting for score submissions (in-memory, resets on restart)
const submissionTimestamps = new Map();
const RATE_LIMIT_MS = 10000; // 10 seconds between submissions

/**
 * Rate limiting middleware for score submissions
 */
function rateLimitScores(req, res, next) {
  const visitorId = req.body.visitorId;
  if (!visitorId) {
    return res.status(400).json({ error: 'visitorId is required' });
  }

  const lastSubmission = submissionTimestamps.get(visitorId);
  const now = Date.now();

  if (lastSubmission && (now - lastSubmission) < RATE_LIMIT_MS) {
    const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastSubmission)) / 1000);
    return res.status(429).json({ 
      error: `Please wait ${waitTime} seconds before submitting another score` 
    });
  }

  submissionTimestamps.set(visitorId, now);
  next();
}

/**
 * Validate score submission
 */
function validateScoreSubmission(req, res, next) {
  const { score, durationMs } = req.body;

  // Check score bounds
  if (typeof score !== 'number' || score < 0 || score > 1000000) {
    return res.status(400).json({ error: 'Invalid score value' });
  }

  // Check duration is reasonable
  if (typeof durationMs !== 'number' || durationMs < 0) {
    return res.status(400).json({ error: 'Invalid duration value' });
  }

  // Check score vs duration plausibility (max ~100 points per second)
  // Allow some buffer for edge cases
  if (durationMs > 1000) {
    const pointsPerSecond = score / (durationMs / 1000);
    if (pointsPerSecond > 150) {
      return res.status(400).json({ error: 'Score appears invalid' });
    }
  }

  next();
}

// ============ API Routes ============

/**
 * POST /api/scores - Submit a score
 * Body: { visitorId, score, rankAchieved, durationMs }
 */
app.post('/api/scores', rateLimitScores, validateScoreSubmission, async (req, res) => {
  try {
    const { visitorId, score, rankAchieved = 1, durationMs } = req.body;

    // Check if player exists
    let player = await db.getPlayerByVisitorId(visitorId);
    
    if (!player) {
      // Auto-create player with generated name
      const name = await generateUniqueName(db.isNameTaken);
      player = await db.createPlayer(visitorId, name);
    }

    // Insert score
    const scoreRecord = await db.insertScore(visitorId, score, rankAchieved, durationMs);

    res.json({
      success: true,
      scoreId: scoreRecord.id,
      playerName: player.name
    });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

/**
 * GET /api/leaderboard - Get top scores
 * Query: ?limit=100 (default 100, max 100)
 */
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 100);
    const scores = await db.getTopScores(limit);
    res.json(scores);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * GET /api/player/:visitorId - Get player info and stats
 */
app.get('/api/player/:visitorId', async (req, res) => {
  try {
    const { visitorId } = req.params;
    
    const player = await db.getPlayerByVisitorId(visitorId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const stats = await db.getPlayerStats(visitorId);

    res.json({
      name: player.name,
      visitorId: player.visitor_id,
      createdAt: player.created_at,
      stats: stats || {
        bestScore: 0,
        bestRank: 0,
        gamesPlayed: 0,
        globalRank: null
      }
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

/**
 * PUT /api/player/:visitorId - Update player name
 * Body: { name }
 */
app.put('/api/player/:visitorId', async (req, res) => {
  try {
    const { visitorId } = req.params;
    const { name } = req.body;

    // Validate name
    const validation = validateName(name);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const trimmedName = name.trim();

    // Check if player exists
    const player = await db.getPlayerByVisitorId(visitorId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if name is same as current
    if (player.name.toLowerCase() === trimmedName.toLowerCase()) {
      return res.json({ success: true, name: player.name });
    }

    // Check if name is taken by another player
    const taken = await db.isNameTaken(trimmedName);
    if (taken) {
      return res.status(409).json({ error: 'Name is already taken' });
    }

    // Update name
    const updated = await db.updatePlayerName(visitorId, trimmedName);
    
    res.json({
      success: true,
      name: updated.name
    });
  } catch (error) {
    console.error('Error updating player name:', error);
    res.status(500).json({ error: 'Failed to update name' });
  }
});

/**
 * GET /api/name/check - Check if name is available
 * Query: ?name=xxx
 */
app.get('/api/name/check', async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Validate name format first
    const validation = validateName(name);
    if (!validation.valid) {
      return res.json({ available: false, error: validation.error });
    }

    const taken = await db.isNameTaken(name.trim());
    
    res.json({ available: !taken });
  } catch (error) {
    console.error('Error checking name:', error);
    res.status(500).json({ error: 'Failed to check name' });
  }
});

/**
 * GET /api/name/generate - Generate a new unique name
 */
app.get('/api/name/generate', async (req, res) => {
  try {
    const name = await generateUniqueName(db.isNameTaken);
    res.json({ name });
  } catch (error) {
    console.error('Error generating name:', error);
    res.status(500).json({ error: 'Failed to generate name' });
  }
});

/**
 * POST /api/player/register - Register a new player
 * Body: { visitorId }
 */
app.post('/api/player/register', async (req, res) => {
  try {
    const { visitorId } = req.body;

    if (!visitorId) {
      return res.status(400).json({ error: 'visitorId is required' });
    }

    // Check if player already exists
    let player = await db.getPlayerByVisitorId(visitorId);
    
    if (player) {
      // Player exists, return their info
      return res.json({
        success: true,
        isNew: false,
        name: player.name,
        visitorId: player.visitor_id
      });
    }

    // Create new player with generated name
    const name = await generateUniqueName(db.isNameTaken);
    player = await db.createPlayer(visitorId, name);

    res.json({
      success: true,
      isNew: true,
      name: player.name,
      visitorId: player.visitor_id
    });
  } catch (error) {
    console.error('Error registering player:', error);
    res.status(500).json({ error: 'Failed to register player' });
  }
});

// ============ Server Startup ============

// Initialize database and start server
async function start() {
  try {
    await db.initDB();
    
    app.listen(PORT, () => {
      console.log(`Circle Shoot server running on port ${PORT}`);
      console.log(`Game available at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await db.closeDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await db.closeDB();
  process.exit(0);
});

start();
