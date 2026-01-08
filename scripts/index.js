// Main game entry point and orchestration

(function() {
  'use strict';

  // DOM Elements
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const startBtn = document.querySelector('.strtBtn');
  const startScreen = document.querySelector('.startGame');
  const gameOverScreen = document.querySelector('.gameOver');
  const restartBtn = document.querySelector('.restartBtn');
  const endScore = document.querySelector('.score');
  const pauseScreen = document.querySelector('.pause');
  const pauseScore = document.querySelector('.pauseScore');

  // Canvas setup
  canvas.height = innerHeight - 3;
  canvas.width = innerWidth;

  // Audio
  const shootAudio = new Audio('./audio/Sub - Mini Impact-[AudioTrimmer.com] (1).wav');
  const backgroundAudio = new Audio('./audio/Sweet baby kicks PSG.mp3');

  // Game state
  let gameState = null;
  let animationId = null;
  let frameCount = 0;
  let lastFrameTime = 0;

  // Interval tracking for cleanup
  let enemySpawnInterval = null;
  const powerUpTimeouts = new Map(); // Track multiple power-up timeouts by name
  let colorCycleInterval = null;
  let damageTimeout = null;
  let rapidFireInterval = null;

  // Event listener tracking for cleanup
  const activeListeners = [];

  const addTrackedListener = (element, event, handler) => {
    element.addEventListener(event, handler);
    activeListeners.push({ element, event, handler });
  };

  const removeAllTrackedListeners = () => {
    activeListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    activeListeners.length = 0;
  };

  // Rapid fire tracking
  let rapidFireMousePos = { clientX: 0, clientY: 0 };
  let rapidFireMouseMoveHandler = null;
  let rapidFireMouseDownHandler = null;
  let rapidFireMouseUpHandler = null;

  // Clear all game intervals
  const clearAllIntervals = () => {
    if (enemySpawnInterval) {
      clearInterval(enemySpawnInterval);
      enemySpawnInterval = null;
    }
    // Clear all power-up timeouts
    powerUpTimeouts.forEach((timeout) => clearTimeout(timeout));
    powerUpTimeouts.clear();
    if (colorCycleInterval) {
      clearInterval(colorCycleInterval);
      colorCycleInterval = null;
    }
    if (damageTimeout) {
      clearTimeout(damageTimeout);
      damageTimeout = null;
    }
    if (rapidFireInterval) {
      clearInterval(rapidFireInterval);
      rapidFireInterval = null;
    }
  };

  // Remove rapid fire listeners
  const removeRapidFireListeners = () => {
    if (rapidFireMouseMoveHandler) {
      window.removeEventListener('mousemove', rapidFireMouseMoveHandler);
      rapidFireMouseMoveHandler = null;
    }
    if (rapidFireMouseDownHandler) {
      window.removeEventListener('mousedown', rapidFireMouseDownHandler);
      rapidFireMouseDownHandler = null;
    }
    if (rapidFireMouseUpHandler) {
      window.removeEventListener('mouseup', rapidFireMouseUpHandler);
      rapidFireMouseUpHandler = null;
    }
  };

  // Audio helpers
  const playShootSound = () => {
    shootAudio.currentTime = 0;
    shootAudio.volume = 0.1;
    shootAudio.play().catch(() => {});
  };

  const startBackgroundMusic = () => {
    backgroundAudio.volume = 0.1;
    backgroundAudio.loop = true;
    backgroundAudio.play().catch(() => {});
  };

  const stopBackgroundMusic = () => {
    backgroundAudio.pause();
    backgroundAudio.currentTime = 0;
  };

  // Spawn enemies at intervals
  const startEnemySpawner = () => {
    enemySpawnInterval = setInterval(() => {
      if (!gameState || !gameState.flags.isRunning) return;

      let radius = getRandomNumber(40);
      if (radius < 10) radius += 10;

      const health = radius > 30 ? 2 : 1;
      const spawnPos = getEnemySpawnPosition(canvas, radius);
      const color = getRandomColor();
      const angle = getAngle(gameState.player, spawnPos.x, spawnPos.y);
      const velocity = getVelocity(angle, gameState.settings.difficulty);

      const enemy = createEnemy(
        spawnPos.x,
        spawnPos.y,
        radius,
        color,
        velocity,
        health
      );

      gameState = addEnemyToState(gameState, enemy);
    }, 600);
  };

  // Shoot projectile toward mouse position
  const shootProjectile = (event) => {
    if (!gameState || !gameState.flags.isRunning) return;

    const angle = Math.atan2(
      event.clientY - gameState.player.y,
      event.clientX - gameState.player.x
    );
    const speed = gameState.player.projectileSpeed; // Uses player's projectile speed (increases with level)
    const velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };

    const projectile = createProjectile(
      gameState.player.x,
      gameState.player.y,
      gameState.settings.projectileRadius,
      'red',
      velocity
    );

    gameState = addProjectileToState(gameState, projectile);
    playShootSound();
  };

  // Track current power-up info for HUD
  let currentPowerUpInfo = null;

  // Schedule power-up removal (supports multiple concurrent power-ups)
  const schedulePowerUpRemoval = (name, duration, removeFunc) => {
    // Store power-up info for the game loop to pick up
    currentPowerUpInfo = { name, duration };

    // If same power-up is already active, clear its old timeout (refresh duration)
    if (powerUpTimeouts.has(name)) {
      clearTimeout(powerUpTimeouts.get(name));
    }

    // Handle invincible color cycling
    if (name === 'invincible') {
      colorCycleInterval = setInterval(() => {
        if (gameState && gameState.player.isInvincible) {
          const hue = Math.random() * 360;
          gameState = updatePlayerInState(gameState, {
            color: `hsl(${hue}, 50%, 50%)`
          });
        }
      }, 50);
    }

    // Handle rapid fire listeners
    if (name === 'rapidFire') {
      // Remove existing listeners first to prevent stacking
      removeRapidFireListeners();
      if (rapidFireInterval) {
        clearInterval(rapidFireInterval);
        rapidFireInterval = null;
      }

      rapidFireMouseMoveHandler = (event) => {
        rapidFireMousePos = { clientX: event.clientX, clientY: event.clientY };
      };
      rapidFireMouseDownHandler = () => {
        if (!rapidFireInterval) {
          rapidFireInterval = setInterval(() => {
            shootProjectile(rapidFireMousePos);
          }, 100);
        }
      };
      rapidFireMouseUpHandler = () => {
        if (rapidFireInterval) {
          clearInterval(rapidFireInterval);
          rapidFireInterval = null;
        }
      };

      window.addEventListener('mousemove', rapidFireMouseMoveHandler);
      window.addEventListener('mousedown', rapidFireMouseDownHandler);
      window.addEventListener('mouseup', rapidFireMouseUpHandler);
    }

    // Schedule this power-up's removal
    const timeout = setTimeout(() => {
      if (gameState) {
        gameState = removeFunc(gameState);
        gameState = removeActivePowerUp(gameState, name);
        powerUpTimeouts.delete(name);

        // Clear color cycling for invincible
        if (name === 'invincible' && colorCycleInterval) {
          clearInterval(colorCycleInterval);
          colorCycleInterval = null;
        }

        // Remove rapid fire listeners
        if (name === 'rapidFire') {
          removeRapidFireListeners();
          if (rapidFireInterval) {
            clearInterval(rapidFireInterval);
            rapidFireInterval = null;
          }
        }
      }
    }, duration);

    powerUpTimeouts.set(name, timeout);
  };

  // Handle game over
  const handleGameOver = () => {
    cancelAnimationFrame(animationId);
    clearAllIntervals();
    removeRapidFireListeners();
    stopBackgroundMusic();

    hideElements([canvas]);
    showElements([gameOverScreen]);
    setElementText(endScore, gameState.player.score);

    gameState = null;
  };

  // Main game loop
  const gameLoop = (currentTime = 0) => {
    if (!gameState) return;

    // Calculate delta time for smooth animations
    const deltaTime = lastFrameTime ? currentTime - lastFrameTime : 16.67;
    lastFrameTime = currentTime;
    frameCount++;

    // Start background music (handles autoplay restrictions)
    if (frameCount === 1) {
      startBackgroundMusic();
    }

    // Update power-up timers for HUD
    if (gameState.activePowerUps && gameState.activePowerUps.length > 0) {
      gameState = updateActivePowerUpTimers(gameState, deltaTime);
    }

    // Update no-hit streak timer
    gameState = updateStreak(gameState, deltaTime);

    // Update difficulty based on score
    gameState = updateDifficulty(gameState);

    // Update all entities
    gameState = updateAllEntities(gameState, canvas);

    // Update shockwave (if active)
    gameState = updateShockwave(gameState, canvas);

    // Process collisions
    gameState = processCollisions(
      gameState,
      canvas,
      handleGameOver
    );

    // If game over occurred, stop processing
    if (!gameState) return;

    // Handle collected power-up
    if (gameState.collectedPowerUp) {
      const collectedType = gameState.collectedPowerUp;
      gameState = activatePowerUp(gameState, collectedType, schedulePowerUpRemoval);
      gameState = { ...gameState, collectedPowerUp: null };

      // Add healing particles for health power-up
      if (collectedType === 'health') {
        const healParticles = [];
        for (let i = 0; i < 25; i++) {
          healParticles.push(createParticle(
            gameState.player.x,
            gameState.player.y,
            Math.random() * 4 + 2,
            '#00ff88',
            {
              x: (Math.random() - 0.5) * 8,
              y: (Math.random() - 0.5) * 8
            }
          ));
        }
        gameState = {
          ...gameState,
          particles: [...gameState.particles, ...healParticles]
        };
      }

      // Add the power-up to HUD display (after activatePowerUp returns)
      if (currentPowerUpInfo) {
        gameState = addActivePowerUp(gameState, currentPowerUpInfo.name, currentPowerUpInfo.duration);
      }
    }

    // Handle pending power-up drops
    if (gameState.pendingPowerUpDrop) {
      const { x, y } = gameState.pendingPowerUpDrop;
      // Get types already active to avoid duplicates
      const activeTypes = gameState.activePowerUps.map(p => p.name);
      const powerUp = createPowerUp(x, y, 15, getRandomPowerUpType(activeTypes));
      gameState = addPowerUpToState(gameState, powerUp);
      gameState = { ...gameState, pendingPowerUpDrop: null };
    }

    // Handle color flash reset (damage red or heal green)
    const playerColor = gameState.player.color;
    const isFlashColor = playerColor === 'red' || playerColor === '#00ff88';
    if (isFlashColor && !damageTimeout) {
      damageTimeout = setTimeout(() => {
        if (gameState && !gameState.player.isInvincible) {
          gameState = updatePlayerInState(gameState, { color: 'white' });
        }
        damageTimeout = null;
      }, 300);
    }

    // Render
    renderGame(ctx, canvas, gameState, frameCount);

    // Continue loop if running
    if (gameState && gameState.flags.isRunning) {
      animationId = requestAnimationFrame(gameLoop);
    }
  };

  // Start the game
  const startGame = () => {
    hideElements([startBtn, startScreen, gameOverScreen, pauseScreen]);
    showElements([canvas]);

    frameCount = 0;
    lastFrameTime = 0;
    gameState = createInitialState(canvas);
    gameState = updateFlagsInState(gameState, { gameStarted: true });

    startEnemySpawner();
    requestAnimationFrame(gameLoop);
  };

  // Pause the game
  const pauseGame = () => {
    if (!gameState) return;

    gameState = updateFlagsInState(gameState, { isRunning: false });
    cancelAnimationFrame(animationId);
    clearInterval(enemySpawnInterval);
    enemySpawnInterval = null;
    backgroundAudio.pause();

    hideElements([canvas]);
    showElements([pauseScreen]);
    setElementText(pauseScore, gameState.player.score);
  };

  // Resume the game
  const resumeGame = () => {
    if (!gameState) return;

    gameState = updateFlagsInState(gameState, { isRunning: true });
    showElements([canvas]);
    hideElements([pauseScreen]);

    lastFrameTime = 0;
    startEnemySpawner();
    startBackgroundMusic();
    requestAnimationFrame(gameLoop);
  };

  // Input handlers
  const handleKeyDown = (event) => {
    if (!gameState) return;

    const keyMap = {
      'a': 'left', 'ArrowLeft': 'left',
      'd': 'right', 'ArrowRight': 'right',
      'w': 'up', 'ArrowUp': 'up',
      's': 'down', 'ArrowDown': 'down'
    };

    const direction = keyMap[event.key];
    if (direction) {
      gameState = updateInputInState(gameState, { [direction]: true });
    }
  };

  const handleKeyUp = (event) => {
    if (!gameState) return;

    const keyMap = {
      'a': 'left', 'ArrowLeft': 'left',
      'd': 'right', 'ArrowRight': 'right',
      'w': 'up', 'ArrowUp': 'up',
      's': 'down', 'ArrowDown': 'down'
    };

    const direction = keyMap[event.key];
    if (direction) {
      gameState = updateInputInState(gameState, { [direction]: false });
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'x' && gameState && gameState.flags.isRunning) {
      pauseGame();
    } else if (event.key === 'z' && gameState && !gameState.flags.isRunning) {
      resumeGame();
    }
  };

  const handleClick = (event) => {
    // Don't shoot on UI button clicks
    if (event.target.tagName === 'BUTTON') return;
    if (!gameState || !gameState.flags.isRunning) return;

    shootProjectile(event);
  };

  // Initialize on window load
  window.addEventListener('load', () => {
    hideElements([canvas, gameOverScreen, pauseScreen]);

    // Button listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    // Game input listeners
    addTrackedListener(window, 'click', handleClick);
    addTrackedListener(window, 'keydown', handleKeyDown);
    addTrackedListener(window, 'keyup', handleKeyUp);
    addTrackedListener(window, 'keypress', handleKeyPress);

    // Handle window resize
    window.addEventListener('resize', () => {
      canvas.width = innerWidth;
      canvas.height = innerHeight - 3;
    });
  });
})();
