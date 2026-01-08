// Power-up definitions and handlers - data-driven approach

const POWER_UP_TYPES = ['speed', 'tiny', 'health', 'cannon', 'invincible', 'rapidFire'];

const POWER_UP_CONFIG = {
  health: {
    duration: 300,
    color: 'green',
    apply: (state) => ({
      ...state,
      player: {
        ...state.player,
        lives: state.player.lives + 1,
        color: 'green',
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
      flags: { ...state.flags, powerUpDropped: false }
    })
  },

  speed: {
    duration: 10000,
    color: 'yellow',
    apply: (state) => ({
      ...state,
      player: {
        ...state.player,
        velocity: 6,
        hasPowerUp: true
      }
    }),
    remove: (state) => ({
      ...state,
      player: {
        ...state.player,
        velocity: 3,
        hasPowerUp: false
      },
      flags: { ...state.flags, powerUpDropped: false }
    })
  },

  cannon: {
    duration: 10000,
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
      flags: { ...state.flags, powerUpDropped: false }
    })
  },

  tiny: {
    duration: 10000,
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
      flags: { ...state.flags, powerUpDropped: false }
    })
  },

  invincible: {
    duration: 5000,
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
      flags: { ...state.flags, powerUpDropped: false }
    })
  },

  rapidFire: {
    duration: 10000,
    color: 'red',
    apply: (state) => ({
      ...state,
      player: { ...state.player, hasPowerUp: true },
      flags: { ...state.flags, rapidFireActive: true }
    }),
    remove: (state) => ({
      ...state,
      player: { ...state.player, hasPowerUp: false },
      flags: { ...state.flags, rapidFireActive: false, powerUpDropped: false }
    })
  }
};

const getRandomPowerUpType = () =>
  POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];

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
