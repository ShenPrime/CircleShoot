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
  const highestRankEl = document.querySelector('.highestRank');
  const bestStreakEl = document.querySelector('.bestStreak');

  // Mobile touch control elements
  const mobileControls = document.getElementById('mobileControls');
  const joystickBase = document.getElementById('joystickBase');
  const joystickThumb = document.getElementById('joystickThumb');
  const aimBase = document.getElementById('aimBase');
  const aimThumb = document.getElementById('aimThumb');

  // Touch state tracking
  let joystickTouchId = null;
  let aimTouchId = null;
  let isTouchDevice = false;
  const fireRate = 250; // ms between shots
  let aimDirection = { x: 1, y: 0 }; // Default aim direction (right)

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

  // Rapid fire tracking (for power-up)
  let rapidFireMousePos = { clientX: 0, clientY: 0 };
  let rapidFireMouseMoveHandler = null;
  let rapidFireMouseDownHandler = null;
  let rapidFireMouseUpHandler = null;

  // Mouse hold-to-fire tracking
  let mouseHoldInterval = null;
  let mousePos = { clientX: 0, clientY: 0 };
  let isMouseDown = false;

  // Touch rapid fire tracking (defined early for use in handleGameOver)
  let touchRapidFireInterval = null;

  const stopTouchRapidFire = () => {
    if (touchRapidFireInterval) {
      clearInterval(touchRapidFireInterval);
      touchRapidFireInterval = null;
    }
  };

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
    if (mouseHoldInterval) {
      clearInterval(mouseHoldInterval);
      mouseHoldInterval = null;
    }
    isMouseDown = false;
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

    const baseAngle = Math.atan2(
      event.clientY - gameState.player.y,
      event.clientX - gameState.player.x
    );
    const speed = gameState.player.projectileSpeed; // Uses player's projectile speed (increases with level)

    // Check if multishot is active
    if (gameState.flags.multishotActive) {
      // Fire 5 bullets in a spread pattern
      const spreadAngle = Math.PI * 0.2; // 36 degrees total spread
      const bulletCount = 5;
      for (let i = 0; i < bulletCount; i++) {
        const angleOffset = -spreadAngle / 2 + (spreadAngle / (bulletCount - 1)) * i;
        const angle = baseAngle + angleOffset;
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
      }
    } else {
      // Single shot
      const velocity = {
        x: Math.cos(baseAngle) * speed,
        y: Math.sin(baseAngle) * speed
      };
      const projectile = createProjectile(
        gameState.player.x,
        gameState.player.y,
        gameState.settings.projectileRadius,
        'red',
        velocity
      );
      gameState = addProjectileToState(gameState, projectile);
    }

    playShootSound();
  };

  // Track current power-up info for HUD
  let currentPowerUpInfo = null;

  // Schedule power-up removal (supports multiple concurrent power-ups)
  const schedulePowerUpRemoval = (name, duration, removeFunc) => {
    // Calculate actual timeout duration (extend if already active)
    let actualDuration = duration;
    if (gameState && gameState.activePowerUps) {
      const existing = gameState.activePowerUps.find(p => p.name === name);
      if (existing) {
        // Add new duration to remaining time
        actualDuration = existing.timeRemaining + duration;
      }
    }

    // Store power-up info for the game loop to pick up
    currentPowerUpInfo = { name, duration };

    // If same power-up is already active, clear its old timeout
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

      // If mouse is already held down, start rapid fire immediately
      if (isMouseDown) {
        rapidFireMousePos = mousePos;
        rapidFireMouseDownHandler();
      }
    }

    // Schedule this power-up's removal (use actualDuration for extended powerups)
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
    }, actualDuration);

    powerUpTimeouts.set(name, timeout);
  };

  // Handle game over
  const handleGameOver = () => {
    cancelAnimationFrame(animationId);
    clearAllIntervals();
    removeRapidFireListeners();
    stopTouchRapidFire();
    stopBackgroundMusic();

    hideElements([canvas]);
    hideMobileControls();
    showElements([gameOverScreen]);
    setElementText(endScore, gameState.player.score);

    // Display highest rank reached
    const rankTitle = getRankTitle(gameState.player.rank || 1);
    setElementText(highestRankEl, rankTitle);

    // Display best streak
    const highestTier = gameState.player.highestStreakTier || 0;
    const highestTime = gameState.player.highestStreakTime || 0;
    if (highestTier > 0) {
      const streakTitle = getStreakTitle(highestTier);
      const seconds = Math.floor(highestTime / 1000);
      setElementText(bestStreakEl, `${streakTitle} (${seconds}s)`);
    } else {
      setElementText(bestStreakEl, '-');
    }

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
      gameState = { ...gameState, collectedPowerUp: null };

      // Health powerup activates immediately (exception)
      if (collectedType === 'health') {
        gameState = activatePowerUp(gameState, collectedType, schedulePowerUpRemoval);

        // Add healing particles
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

        // Add to HUD display
        if (currentPowerUpInfo) {
          gameState = addActivePowerUp(gameState, currentPowerUpInfo.name, currentPowerUpInfo.duration);
        }
      } else {
        // Non-health powerups go to hotbar
        if (canAddToHotbar(gameState, collectedType)) {
          // Add to hotbar (stacks if same type exists)
          gameState = addToHotbar(gameState, collectedType);
        } else {
          // Hotbar full and can't stack - auto-activate the collected powerup
          gameState = activatePowerUp(gameState, collectedType, schedulePowerUpRemoval);
          if (currentPowerUpInfo) {
            gameState = addActivePowerUp(gameState, currentPowerUpInfo.name, currentPowerUpInfo.duration);
          }
        }
      }
    }

    // Handle pending power-up drops
    if (gameState.pendingPowerUpDrop) {
      const { x, y } = gameState.pendingPowerUpDrop;
      // Clamp position to keep powerups away from screen edges
      const margin = 50;
      const clampedX = Math.max(margin, Math.min(canvas.width - margin, x));
      const clampedY = Math.max(margin, Math.min(canvas.height - margin, y));
      // Get types already active to avoid duplicates
      const activeTypes = gameState.activePowerUps.map(p => p.name);
      const powerUp = createPowerUp(clampedX, clampedY, 15, getRandomPowerUpType(activeTypes));
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

    // Show mobile controls on touch devices
    if (isTouchDevice) {
      showMobileControls();
    }

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
    stopTouchRapidFire();
    backgroundAudio.pause();

    hideElements([canvas]);
    hideMobileControls();
    showElements([pauseScreen]);
    setElementText(pauseScore, gameState.player.score);
  };

  // Resume the game
  const resumeGame = () => {
    if (!gameState) return;

    gameState = updateFlagsInState(gameState, { isRunning: true });
    showElements([canvas]);
    hideElements([pauseScreen]);

    // Show mobile controls on touch devices
    if (isTouchDevice) {
      showMobileControls();
    }

    lastFrameTime = 0;
    startEnemySpawner();
    startBackgroundMusic();
    requestAnimationFrame(gameLoop);
  };

  // Activate powerup from hotbar slot
  const activateFromHotbar = (slotIndex) => {
    if (!gameState || !gameState.flags.isRunning) return;

    const slot = getHotbarSlot(gameState, slotIndex);
    if (!slot) return; // Empty slot

    // Activate the powerup
    gameState = activatePowerUp(gameState, slot.name, schedulePowerUpRemoval);

    // Add to HUD display
    if (currentPowerUpInfo) {
      gameState = addActivePowerUp(gameState, currentPowerUpInfo.name, currentPowerUpInfo.duration);
    }

    // Remove one from hotbar
    gameState = removeFromHotbar(gameState, slotIndex);
  };

  // Input handlers
  const handleKeyDown = (event) => {
    if (!gameState) return;

    // Hotbar activation (1, 2, 3 keys)
    if (gameState.flags.isRunning) {
      if (event.key === '1') {
        activateFromHotbar(0);
        return;
      } else if (event.key === '2') {
        activateFromHotbar(1);
        return;
      } else if (event.key === '3') {
        activateFromHotbar(2);
        return;
      }
    }

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
    // Click is now handled by mousedown/mouseup for hold-to-fire
    // This is kept for single clicks that don't trigger hold
  };

  // Mouse hold-to-fire handlers
  const handleMouseDown = (event) => {
    // Don't shoot on UI button clicks
    if (event.target.tagName === 'BUTTON') return;
    // Don't shoot on mobile control touches (handled separately)
    if (isTouchDevice && event.target.closest('.mobile-controls')) return;
    if (!gameState || !gameState.flags.isRunning) return;

    isMouseDown = true;
    mousePos = { clientX: event.clientX, clientY: event.clientY };

    // Fire immediately
    shootProjectile(mousePos);

    // Start auto-fire interval
    if (!mouseHoldInterval) {
      mouseHoldInterval = setInterval(() => {
        if (isMouseDown && gameState && gameState.flags.isRunning) {
          shootProjectile(mousePos);
        }
      }, fireRate);
    }
  };

  const handleMouseUp = () => {
    isMouseDown = false;
    if (mouseHoldInterval) {
      clearInterval(mouseHoldInterval);
      mouseHoldInterval = null;
    }
  };

  const handleMouseMove = (event) => {
    if (isMouseDown) {
      mousePos = { clientX: event.clientX, clientY: event.clientY };
    }
  };

  // Mobile touch detection
  const detectTouchDevice = () => {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (window.matchMedia('(pointer: coarse)').matches);
  };

  // Show/hide mobile controls
  const showMobileControls = () => {
    if (mobileControls) {
      mobileControls.classList.add('active');
    }
  };

  const hideMobileControls = () => {
    if (mobileControls) {
      mobileControls.classList.remove('active');
    }
  };

  // Joystick touch handlers
  const handleJoystickStart = (event) => {
    event.preventDefault();
    if (joystickTouchId !== null) return;

    const touch = event.changedTouches[0];
    joystickTouchId = touch.identifier;
    updateJoystickPosition(touch);
  };

  const handleJoystickMove = (event) => {
    event.preventDefault();
    if (joystickTouchId === null) return;

    for (const touch of event.changedTouches) {
      if (touch.identifier === joystickTouchId) {
        updateJoystickPosition(touch);
        break;
      }
    }
  };

  const handleJoystickEnd = (event) => {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      if (touch.identifier === joystickTouchId) {
        joystickTouchId = null;
        resetJoystick();
        break;
      }
    }
  };

  const updateJoystickPosition = (touch) => {
    if (!joystickBase || !joystickThumb || !gameState) return;

    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = touch.clientX - centerX;
    let deltaY = touch.clientY - centerY;

    // Limit to joystick radius
    const maxRadius = rect.width / 2 - 25; // Account for thumb size
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > maxRadius) {
      deltaX = (deltaX / distance) * maxRadius;
      deltaY = (deltaY / distance) * maxRadius;
    }

    // Move thumb visually
    joystickThumb.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    // Calculate normalized direction (-1 to 1)
    const normalizedX = deltaX / maxRadius;
    const normalizedY = deltaY / maxRadius;

    // Update game input based on joystick position (threshold of 0.3)
    const threshold = 0.3;
    gameState = updateInputInState(gameState, {
      left: normalizedX < -threshold,
      right: normalizedX > threshold,
      up: normalizedY < -threshold,
      down: normalizedY > threshold
    });
  };

  const resetJoystick = () => {
    if (joystickThumb) {
      joystickThumb.style.transform = 'translate(0, 0)';
    }
    if (gameState) {
      gameState = updateInputInState(gameState, {
        left: false,
        right: false,
        up: false,
        down: false
      });
    }
  };

  // Aim joystick touch handlers
  const handleAimStart = (event) => {
    event.preventDefault();
    if (aimTouchId !== null) return;

    const touch = event.changedTouches[0];
    aimTouchId = touch.identifier;
    updateAimPosition(touch);
    startTouchRapidFire();
  };

  const handleAimMove = (event) => {
    event.preventDefault();
    if (aimTouchId === null) return;

    for (const touch of event.changedTouches) {
      if (touch.identifier === aimTouchId) {
        updateAimPosition(touch);
        break;
      }
    }
  };

  const handleAimEnd = (event) => {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      if (touch.identifier === aimTouchId) {
        aimTouchId = null;
        resetAimJoystick();
        stopTouchRapidFire();
        break;
      }
    }
  };

  const updateAimPosition = (touch) => {
    if (!aimBase || !aimThumb || !gameState) return;

    const rect = aimBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = touch.clientX - centerX;
    let deltaY = touch.clientY - centerY;

    // Limit to joystick radius
    const maxRadius = rect.width / 2 - 25;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > maxRadius) {
      deltaX = (deltaX / distance) * maxRadius;
      deltaY = (deltaY / distance) * maxRadius;
    }

    // Move thumb visually
    aimThumb.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    // Store aim direction (normalized)
    if (distance > 10) { // Dead zone
      aimDirection = {
        x: deltaX / distance,
        y: deltaY / distance
      };
    }
  };

  const resetAimJoystick = () => {
    if (aimThumb) {
      aimThumb.style.transform = 'translate(0, 0)';
    }
  };

  const startTouchRapidFire = () => {
    if (touchRapidFireInterval) return;
    // Fire immediately
    fireInAimDirection();
    // Then continue firing
    touchRapidFireInterval = setInterval(() => {
      fireInAimDirection();
    }, fireRate);
  };

  const fireInAimDirection = () => {
    if (!gameState || !gameState.flags.isRunning) return;

    // Calculate target position based on aim direction
    const targetX = gameState.player.x + aimDirection.x * 500;
    const targetY = gameState.player.y + aimDirection.y * 500;

    shootProjectile({ clientX: targetX, clientY: targetY });
  };

  // Setup mobile touch listeners
  const setupMobileControls = () => {
    if (!joystickBase || !aimBase) return;

    // Movement joystick events
    joystickBase.addEventListener('touchstart', handleJoystickStart, { passive: false });
    joystickBase.addEventListener('touchmove', handleJoystickMove, { passive: false });
    joystickBase.addEventListener('touchend', handleJoystickEnd, { passive: false });
    joystickBase.addEventListener('touchcancel', handleJoystickEnd, { passive: false });

    // Aim joystick events
    aimBase.addEventListener('touchstart', handleAimStart, { passive: false });
    aimBase.addEventListener('touchmove', handleAimMove, { passive: false });
    aimBase.addEventListener('touchend', handleAimEnd, { passive: false });
    aimBase.addEventListener('touchcancel', handleAimEnd, { passive: false });

    // Prevent default touch behaviors on canvas during game
    canvas.addEventListener('touchstart', (e) => {
      if (gameState && gameState.flags.isRunning) {
        e.preventDefault();
      }
    }, { passive: false });
  };

  // Prevent scrolling/zooming during gameplay
  const preventDefaultTouchBehaviors = () => {
    document.addEventListener('touchmove', (e) => {
      if (gameState && gameState.flags.isRunning) {
        e.preventDefault();
      }
    }, { passive: false });
  };

  // Initialize on window load
  window.addEventListener('load', () => {
    hideElements([canvas, gameOverScreen, pauseScreen]);
    hideMobileControls();

    // Detect touch device
    isTouchDevice = detectTouchDevice();

    // Button listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    // Game input listeners
    addTrackedListener(window, 'mousedown', handleMouseDown);
    addTrackedListener(window, 'mouseup', handleMouseUp);
    addTrackedListener(window, 'mousemove', handleMouseMove);
    addTrackedListener(window, 'keydown', handleKeyDown);
    addTrackedListener(window, 'keyup', handleKeyUp);
    addTrackedListener(window, 'keypress', handleKeyPress);

    // Setup mobile controls
    setupMobileControls();
    preventDefaultTouchBehaviors();

    // Handle window resize
    window.addEventListener('resize', () => {
      canvas.width = innerWidth;
      canvas.height = innerHeight - 3;
    });
  });
})();
