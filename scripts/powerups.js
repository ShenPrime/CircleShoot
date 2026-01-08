// Power-up definitions and handlers - data-driven approach

const POWER_UP_TYPES = ['speed', 'tiny', 'health', 'cannon', 'invincible', 'rapidFire', 'shockwave'];

const POWER_UP_CONFIG = {
  health: {
    duration: 500,  // Instant effect, short duration
    color: 'green',
    apply: (state) => ({
      ...state,
      player: {
        ...state.player,
        lives: Math.min(state.player.lives + 1, 5), // Cap at 5 lives
        color: '#00ff88',
        healFlash: 20, // Frames of screen flash
        hasPowerUp: true
      }
    }),
    remove: (state) => ({
      ...state,
      player: {
        ...state.player,
        color: 'white',
        hasPowerUp: false
      },
      flags: { ...state.flags }
    })
  },

  speed: {
    duration: 18000,  // 18 seconds
    color: 'yellow',
    apply: (state) => ({
      ...state,
      player: {
        ...state.player,
        velocity: state.player.baseVelocity * 2, // Double the base speed
        hasPowerUp: true
      }
    }),
    remove: (state) => ({
      ...state,
      player: {
        ...state.player,
        velocity: state.player.baseVelocity, // Restore to base speed
        hasPowerUp: false
      },
      flags: { ...state.flags }
    })
  },

  cannon: {
    duration: 15000,  // 15 seconds
    color: 'orange',
    apply: (state) => ({
      ...state,
      player: { ...state.player, hasPowerUp: true },
      settings: {
        ...state.settings,
        projectileRadius: 30,
        projectileDamage: 2
      }
    }),
    remove: (state) => ({
      ...state,
      player: { ...state.player, hasPowerUp: false },
      settings: {
        ...state.settings,
        projectileRadius: 5,
        projectileDamage: 1
      },
      flags: { ...state.flags }
    })
  },

  tiny: {
    duration: 20000,  // 20 seconds
    color: 'purple',
    apply: (state) => ({
      ...state,
      player: {
        ...state.player,
        radius: 5,
        hasPowerUp: true
      }
    }),
    remove: (state) => ({
      ...state,
      player: {
        ...state.player,
        radius: 15,
        hasPowerUp: false
      },
      flags: { ...state.flags }
    })
  },

  invincible: {
    duration: 8000,  // 8 seconds
    color: 'rainbow',
    apply: (state) => ({
      ...state,
      player: {
        ...state.player,
        isInvincible: true,
        hasPowerUp: true
      }
    }),
    remove: (state) => ({
      ...state,
      player: {
        ...state.player,
        isInvincible: false,
        color: 'white',
        hasPowerUp: false
      },
      flags: { ...state.flags }
    })
  },

  rapidFire: {
    duration: 15000,  // 15 seconds
    color: 'red',
    apply: (state) => ({
      ...state,
      player: { ...state.player, hasPowerUp: true },
      flags: { ...state.flags, rapidFireActive: true }
    }),
    remove: (state) => ({
      ...state,
      player: { ...state.player, hasPowerUp: false },
      flags: { ...state.flags, rapidFireActive: false }
    })
  },

  shockwave: {
    duration: 100,  // Instant effect, minimal duration for HUD
    color: 'cyan',
    apply: (state) => ({
      ...state,
      player: { ...state.player, hasPowerUp: true },
      shockwave: {
        x: state.player.x,
        y: state.player.y,
        radius: 0,
        active: true,
        speed: 18,
        hitEnemies: [] // Track which enemies have been hit
      }
    }),
    remove: (state) => ({
      ...state,
      player: { ...state.player, hasPowerUp: false }
    })
  }
};

const getRandomPowerUpType = (excludeTypes = []) => {
  // Filter out already active power-up types
  const availableTypes = POWER_UP_TYPES.filter(type => !excludeTypes.includes(type));

  // If all types are active, pick any random one (will extend timer)
  if (availableTypes.length === 0) {
    return POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
  }

  return availableTypes[Math.floor(Math.random() * availableTypes.length)];
};

const getPowerUpConfig = (name) => POWER_UP_CONFIG[name];

// Activate a power-up and schedule its removal
const activatePowerUp = (state, powerUpName, scheduleRemoval) => {
  const config = POWER_UP_CONFIG[powerUpName];
  if (!config) return state;

  const newState = config.apply(state);

  // Schedule the power-up removal
  scheduleRemoval(powerUpName, config.duration, config.remove);

  return newState;
};
