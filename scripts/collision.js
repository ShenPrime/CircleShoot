// Pure collision detection functions

const getDistance = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const isColliding = (a, b) =>
  getDistance(a, b) - a.radius - b.radius < 1;

const isOutOfBounds = (entity, canvas) =>
  entity.x + entity.radius < 0 ||
  entity.x - entity.radius > canvas.width ||
  entity.y + entity.radius < 0 ||
  entity.y - entity.radius > canvas.height;

const removeOutOfBounds = (entities, canvas) =>
  entities.filter(entity => !isOutOfBounds(entity, canvas));

// Helper to create explosion particles (must be defined before processCollisions)
const createExplosionParticles = (x, y, color, count) => {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(
      x,
      y,
      Math.random() * 4,
      color,
      {
        x: (Math.random() - 0.5) * (Math.random() * 6),
        y: (Math.random() - 0.5) * (Math.random() * 6)
      }
    ));
  }
  return particles;
};

// Process all collisions and return updated state
const processCollisions = (state, canvas, onGameOver) => {
  let { player, enemies, projectiles, particles, powerUps, settings } = state;
  let newEnemies = [];
  let newProjectiles = [...projectiles];
  let newParticles = [...particles];
  let newPlayer = { ...player };
  let scoreIncrease = 0;
  let powerUpToActivate = null;

  // Check enemy collisions
  for (const enemy of enemies) {
    const playerCollision = isColliding(player, enemy);

    if (playerCollision && player.isInvincible) {
      // Destroy enemy when invincible
      newParticles = newParticles.concat(
        createExplosionParticles(player.x, player.y, enemy.color, 25)
      );
      continue; // Skip adding this enemy
    }

    if (playerCollision && !player.isInvincible) {
      if (player.lives <= 1) {
        onGameOver();
        return null; // Signal game over
      }
      // Add damage particles around player
      newParticles = newParticles.concat(
        createExplosionParticles(player.x, player.y, '#ff2d2d', 30)
      );
      newPlayer = {
        ...newPlayer,
        lives: newPlayer.lives - 1,
        color: 'red',
        damageFlash: 15, // Frames of screen flash
        noHitStreak: 0,  // Reset streak on hit
        streakTier: 0
      };
      continue; // Remove the enemy that hit us
    }

    // Check projectile collisions with this enemy
    let enemyHit = false;
    let enemyDestroyed = false;
    let updatedEnemy = enemy;

    const remainingProjectiles = [];
    for (const projectile of newProjectiles) {
      if (isColliding(enemy, projectile)) {
        enemyHit = true;
        updatedEnemy = damageEnemy(updatedEnemy, settings.projectileDamage);

        if (updatedEnemy.health >= 1) {
          // Enemy damaged but not destroyed
          updatedEnemy = shrinkEnemy(updatedEnemy);
          scoreIncrease += 20;
          newParticles = newParticles.concat(
            createExplosionParticles(projectile.x, projectile.y, enemy.color, 8)
          );
        } else {
          // Enemy destroyed
          enemyDestroyed = true;
          scoreIncrease += 10;
          newParticles = newParticles.concat(
            createExplosionParticles(projectile.x, projectile.y, enemy.color, 25)
          );

          // Check for power-up drop (1 in 10 chance, max 3 on ground)
          const dropChance = Math.floor(Math.random() * 10);
          if (dropChance === 0 && powerUps.length < 3) {
            powerUpToActivate = { x: projectile.x, y: projectile.y };
          }
        }
        // Don't add this projectile back (it hit something)
      } else {
        remainingProjectiles.push(projectile);
      }
    }
    newProjectiles = remainingProjectiles;

    if (!enemyDestroyed) {
      newEnemies.push(enemyHit ? updatedEnemy : enemy);
    }
  }

  // Check power-up collisions
  let newPowerUps = [];
  let collectedPowerUp = null;
  for (const powerUp of powerUps) {
    if (isColliding(player, powerUp)) {
      collectedPowerUp = powerUp.name;
    } else {
      newPowerUps.push(powerUp);
    }
  }

  return {
    ...state,
    player: {
      ...newPlayer,
      score: newPlayer.score + scoreIncrease
    },
    enemies: newEnemies,
    projectiles: newProjectiles,
    particles: newParticles,
    powerUps: newPowerUps,
    pendingPowerUpDrop: powerUpToActivate,
    collectedPowerUp: collectedPowerUp
  };
};
