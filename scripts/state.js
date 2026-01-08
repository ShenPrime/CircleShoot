// Centralized game state management

const createInitialState = (canvas) => ({
  player: createPlayer(canvas.width / 2, canvas.height / 2),
  enemies: [],
  projectiles: [],
  particles: [],
  powerUps: [],
  settings: {
    difficulty: 2,
    projectileRadius: 5,
    projectileDamage: 1
  },
  flags: {
    isRunning: true,
    powerUpDropped: false,
    rapidFireActive: false,
    gameStarted: false
  },
  input: {
    left: false,
    right: false,
    up: false,
    down: false
  },
  pendingPowerUpDrop: null,
  collectedPowerUp: null
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
  powerUps: [...state.powerUps, powerUp],
  flags: { ...state.flags, powerUpDropped: true }
});

// Update all entities in one pass
const updateAllEntities = (state, canvas) => {
  const { player, enemies, projectiles, particles, input, settings } = state;

  return {
    ...state,
    player: updatePlayerPosition(player, input, canvas),
    enemies: enemies.map(e => updateEnemy(e, player, settings.difficulty)),
    projectiles: removeOutOfBounds(
      projectiles.map(updateProjectile),
      canvas
    ),
    particles: particles
      .map(updateParticle)
      .filter(p => p.alpha > 0)
  };
};

// Difficulty scaling based on score
const getDifficultyForScore = (score, currentDifficulty) => {
  if (score > 3000 && currentDifficulty < 7) return 7;
  if (score > 2500 && currentDifficulty < 5) return 5;
  if (score > 1500 && currentDifficulty < 4) return 4;
  if (score > 1000 && currentDifficulty < 3) return 3;
  if (score > 500 && currentDifficulty < 2.5) return 2.5;
  return currentDifficulty;
};

const updateDifficulty = (state) => {
  const newDifficulty = getDifficultyForScore(
    state.player.score,
    state.settings.difficulty
  );
  if (newDifficulty !== state.settings.difficulty) {
    return updateSettingsInState(state, { difficulty: newDifficulty });
  }
  return state;
};

// Reset state for new game
const resetState = (canvas) => createInitialState(canvas);
