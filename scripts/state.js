// Centralized game state management

const createInitialState = (canvas) => ({
  player: createPlayer(canvas.width / 2, canvas.height / 2),
  enemies: [],
  projectiles: [],
  particles: [],
  powerUps: [],
  stars: createStarField(canvas, 150),
  settings: {
    difficulty: 2,
    projectileRadius: 5,
    projectileDamage: 1
  },
  flags: {
    isRunning: true,
    powerUpDropped: false,
    rapidFireActive: false,
    multishotActive: false,
    gameStarted: false
  },
  input: {
    left: false,
    right: false,
    up: false,
    down: false
  },
  activePowerUps: [], // Array of {name, timeRemaining, duration}
  pendingPowerUpDrop: null,
  collectedPowerUp: null,
  shockwave: null, // {x, y, radius, active, speed, hitEnemies}
  streakNotification: null // {title, color, framesRemaining}
});

// Pure state updater functions

const updatePlayerInState = (state, updates) => ({
  ...state,
  player: { ...state.player, ...updates }
});

const updateSettingsInState = (state, updates) => ({
  ...state,
  settings: { ...state.settings, ...updates }
});

const updateFlagsInState = (state, updates) => ({
  ...state,
  flags: { ...state.flags, ...updates }
});

const updateInputInState = (state, updates) => ({
  ...state,
  input: { ...state.input, ...updates }
});

const addEnemyToState = (state, enemy) => ({
  ...state,
  enemies: [...state.enemies, enemy]
});

const addProjectileToState = (state, projectile) => ({
  ...state,
  projectiles: [...state.projectiles, projectile]
});

const addPowerUpToState = (state, powerUp) => ({
  ...state,
  powerUps: [...state.powerUps, powerUp]
});

// Add a new active power-up to the array (extends timer if already exists)
const addActivePowerUp = (state, name, duration) => {
  const existing = state.activePowerUps.find(p => p.name === name);
  if (existing) {
    // Extend duration of existing power-up (add time, don't reset)
    return {
      ...state,
      activePowerUps: state.activePowerUps.map(p =>
        p.name === name ? {
          name,
          timeRemaining: p.timeRemaining + duration,
          duration: p.duration + duration
        } : p
      )
    };
  }
  // Add new power-up
  return {
    ...state,
    activePowerUps: [
      ...state.activePowerUps,
      { name, timeRemaining: duration, duration }
    ]
  };
};

// Update all active power-up timers
const updateActivePowerUpTimers = (state, deltaTime) => {
  if (state.activePowerUps.length === 0) return state;

  const updatedPowerUps = state.activePowerUps
    .map(powerUp => ({
      ...powerUp,
      timeRemaining: powerUp.timeRemaining - deltaTime
    }))
    .filter(powerUp => powerUp.timeRemaining > 0);

  return {
    ...state,
    activePowerUps: updatedPowerUps
  };
};

// Remove a specific power-up by name
const removeActivePowerUp = (state, name) => ({
  ...state,
  activePowerUps: state.activePowerUps.filter(p => p.name !== name)
});

// Update shockwave - expand and destroy enemies
const updateShockwave = (state, canvas) => {
  if (!state.shockwave || !state.shockwave.active) return state;

  const { shockwave, enemies, particles, player } = state;
  const newRadius = shockwave.radius + shockwave.speed;

  // Check if shockwave has reached max size (covers entire screen)
  const maxRadius = Math.sqrt(
    Math.pow(canvas.width, 2) + Math.pow(canvas.height, 2)
  );

  if (newRadius >= maxRadius) {
    return { ...state, shockwave: null };
  }

  // Check for enemy collisions with the ring
  let scoreGained = 0;
  let newParticles = [...particles];
  const hitEnemies = [...shockwave.hitEnemies];

  const survivingEnemies = enemies.filter(enemy => {
    // Skip if already hit
    if (hitEnemies.includes(enemy)) return true;

    // Calculate distance from shockwave center to enemy
    const dist = Math.hypot(enemy.x - shockwave.x, enemy.y - shockwave.y);

    // Check if enemy is within the ring (between inner and outer edge)
    const ringWidth = 30;
    const innerRadius = Math.max(0, newRadius - ringWidth);
    const outerRadius = newRadius;

    if (dist >= innerRadius && dist <= outerRadius + enemy.radius) {
      // Enemy hit by shockwave!
      hitEnemies.push(enemy);
      scoreGained += 25; // Bonus score for shockwave kills

      // Create explosion particles
      for (let i = 0; i < 15; i++) {
        newParticles.push(createParticle(
          enemy.x,
          enemy.y,
          Math.random() * 4 + 1,
          enemy.color,
          {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8
          }
        ));
      }
      return false; // Remove enemy
    }
    return true; // Keep enemy
  });

  return {
    ...state,
    shockwave: {
      ...shockwave,
      radius: newRadius,
      hitEnemies
    },
    enemies: survivingEnemies,
    particles: newParticles,
    player: {
      ...player,
      score: player.score + scoreGained
    }
  };
};

// Update all entities in one pass
const updateAllEntities = (state, canvas) => {
  const { player, enemies, projectiles, particles, input, settings, levelUpNotification } = state;

  // Decrement flash effects
  const updatedPlayer = {
    ...updatePlayerPosition(player, input, canvas),
    damageFlash: player.damageFlash ? player.damageFlash - 1 : 0,
    healFlash: player.healFlash ? player.healFlash - 1 : 0
  };

  // Decrement level up notification
  const updatedNotification = levelUpNotification && levelUpNotification.framesRemaining > 0
    ? { ...levelUpNotification, framesRemaining: levelUpNotification.framesRemaining - 1 }
    : null;

  return {
    ...state,
    player: updatedPlayer,
    enemies: enemies.map(e => updateEnemy(e, player, settings.difficulty)),
    projectiles: removeOutOfBounds(
      projectiles.map(updateProjectile),
      canvas
    ),
    particles: particles
      .map(updateParticle)
      .filter(p => p.alpha > 0),
    levelUpNotification: updatedNotification
  };
};

// No-hit streak thresholds (in milliseconds) and titles
const STREAK_THRESHOLDS = [
  { time: 10000,  title: 'FOCUSED',    color: '#88ff88' },  // 10 seconds
  { time: 20000,  title: 'UNTOUCHED',  color: '#00ff88' },  // 20 seconds
  { time: 35000,  title: 'FLAWLESS',   color: '#00ffff' },  // 35 seconds
  { time: 55000,  title: 'GODLIKE',    color: '#ff00ff' },  // 55 seconds
  { time: 80000,  title: 'IMMORTAL',   color: '#ffaa00' },  // 1:20
  { time: 110000, title: 'INVINCIBLE', color: '#ff0000' },  // 1:50
  { time: 150000, title: 'LEGENDARY',  color: '#ffffff' },  // 2:30
];

// Get streak tier (0 = no streak, 1-7 = streak tiers)
const getStreakTier = (streakTime) => {
  for (let i = STREAK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (streakTime >= STREAK_THRESHOLDS[i].time) {
      return i + 1;
    }
  }
  return 0;
};

// Get streak info for current tier
const getStreakInfo = (tier) => {
  if (tier <= 0 || tier > STREAK_THRESHOLDS.length) return null;
  return STREAK_THRESHOLDS[tier - 1];
};

// Update no-hit streak timer
const updateStreak = (state, deltaTime) => {
  const { player, streakNotification } = state;

  // Update streak timer
  const newStreak = player.noHitStreak + deltaTime;
  const oldTier = player.streakTier;
  const newTier = getStreakTier(newStreak);

  // Track highest streak achieved this match
  const highestStreakTier = Math.max(player.highestStreakTier || 0, newTier);
  const highestStreakTime = Math.max(player.highestStreakTime || 0, newStreak);

  // Check if reached new tier
  const tierReached = newTier > oldTier;

  let updatedNotification = streakNotification;

  // Decrement existing notification
  if (streakNotification && streakNotification.framesRemaining > 0) {
    updatedNotification = {
      ...streakNotification,
      framesRemaining: streakNotification.framesRemaining - 1
    };
    if (updatedNotification.framesRemaining <= 0) {
      updatedNotification = null;
    }
  }

  // Show new streak notification
  if (tierReached) {
    const streakInfo = getStreakInfo(newTier);
    if (streakInfo) {
      updatedNotification = {
        title: streakInfo.title,
        color: streakInfo.color,
        framesRemaining: 90 // ~1.5 seconds
      };
    }
  }

  return {
    ...state,
    player: {
      ...player,
      noHitStreak: newStreak,
      streakTier: newTier,
      highestStreakTier,
      highestStreakTime
    },
    streakNotification: updatedNotification
  };
};

// Reset streak when player takes damage
const resetStreak = (player) => ({
  ...player,
  noHitStreak: 0,
  streakTier: 0
});

// Difficulty scaling based on score - logarithmic for infinite scaling
// Starts at 2, ramps gently, slows at higher scores
const getDifficultyForScore = (score) => {
  const baseDifficulty = 2;
  const scaleFactor = 1.5;  // Lower = gentler ramp
  const scoreDivisor = 500; // Higher = slower progression
  return baseDifficulty + Math.log10(score / scoreDivisor + 1) * scaleFactor;
};

// Score thresholds for ranks
const RANK_THRESHOLDS = [
  0,      // Rank 1: RECRUIT
  250,    // Rank 2: CADET
  600,    // Rank 3: PILOT
  1100,   // Rank 4: WARRIOR
  1800,   // Rank 5: VETERAN
  2800,   // Rank 6: ELITE
  4000,   // Rank 7: COMMANDER
  5500,   // Rank 8: CAPTAIN
  7500,   // Rank 9: ADMIRAL
  10000,  // Rank 10: LEGEND
  14000,  // Rank 11: COSMIC HERO
  20000,  // Rank 12: STAR SLAYER
  30000,  // Rank 13: VOID WALKER
  45000,  // Rank 14: GALAXY GUARDIAN
  70000,  // Rank 15: CELESTIAL
];

// Get rank (1-15+) based on score
const getRankForScore = (score) => {
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (score >= RANK_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
};

const updateDifficulty = (state) => {
  const newDifficulty = getDifficultyForScore(state.player.score);
  const currentRank = state.player.rank || 1;
  const newRank = getRankForScore(state.player.score);

  // Check if we reached a new rank
  const rankedUp = newRank > currentRank;

  let updatedState = updateSettingsInState(state, { difficulty: newDifficulty });

  if (rankedUp) {
    // Apply rank-up bonuses
    const player = updatedState.player;
    const newBaseVelocity = player.baseVelocity + 0.12;  // Permanent speed increase
    const newProjectileSpeed = player.projectileSpeed + 0.3; // Permanent fire rate increase

    updatedState = {
      ...updatedState,
      player: {
        ...player,
        rank: newRank,
        lives: Math.min(player.lives + 1, 5), // Free life (cap at 5)
        baseVelocity: newBaseVelocity,
        velocity: player.hasPowerUp ? player.velocity : newBaseVelocity,
        projectileSpeed: newProjectileSpeed,
        healFlash: 20 // Show heal effect for the free life
      },
      levelUpNotification: {
        level: newRank,
        framesRemaining: 120 // Show for ~2 seconds at 60fps
      }
    };
  }

  return updatedState;
};

// Reset state for new game
const resetState = (canvas) => createInitialState(canvas);
