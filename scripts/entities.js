// Entity factory functions - pure functions returning plain objects

const createPlayer = (x, y, radius = 15, color = 'white') => ({
  x,
  y,
  radius,
  color,
  velocity: 3,
  lives: 3,
  score: 0,
  hasPowerUp: false,
  isInvincible: false
});

const createEnemy = (x, y, radius, color, velocity, health) => ({
  x,
  y,
  radius,
  color,
  velocity,
  health
});

const createProjectile = (x, y, radius, color, velocity) => ({
  x,
  y,
  radius,
  color,
  velocity
});

const createParticle = (x, y, radius, color, velocity) => ({
  x,
  y,
  radius,
  color,
  velocity,
  alpha: 1
});

const createPowerUp = (x, y, radius, name) => ({
  x,
  y,
  radius,
  name,
  colorHue: Math.random() * 360
});

// Pure update functions - return new objects instead of mutating

const updateProjectile = (projectile) => ({
  ...projectile,
  x: projectile.x + projectile.velocity.x,
  y: projectile.y + projectile.velocity.y
});

const updateParticle = (particle) => ({
  ...particle,
  x: particle.x + particle.velocity.x,
  y: particle.y + particle.velocity.y,
  alpha: particle.alpha - 0.01
});

const updateEnemy = (enemy, player, difficulty) => {
  const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
  const velocity = {
    x: Math.cos(angle) * difficulty,
    y: Math.sin(angle) * difficulty
  };
  return {
    ...enemy,
    x: enemy.x + enemy.velocity.x,
    y: enemy.y + enemy.velocity.y,
    velocity
  };
};

const updatePlayerPosition = (player, input, canvas) => {
  let { x, y } = player;
  const { velocity, radius } = player;

  if (input.right && x + radius < canvas.width) {
    x += velocity;
  }
  if (input.left && x - radius > 0) {
    x -= velocity;
  }
  if (input.up && y - radius > 0) {
    y -= velocity;
  }
  if (input.down && y + radius < canvas.height) {
    y += velocity;
  }

  return { ...player, x, y };
};

const damageEnemy = (enemy, damage) => ({
  ...enemy,
  health: enemy.health - damage
});

const shrinkEnemy = (enemy) => ({
  ...enemy,
  radius: enemy.radius - 20
});
