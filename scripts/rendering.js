// Pure rendering functions - take context and data, draw to canvas

const drawCircle = (ctx, { x, y, radius, color, alpha = 1 }) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
  ctx.restore();
};

const drawPlayer = (ctx, player) => {
  drawCircle(ctx, player);
};

const drawEnemy = (ctx, enemy) => {
  drawCircle(ctx, enemy);
};

const drawProjectile = (ctx, projectile) => {
  drawCircle(ctx, projectile);
};

const drawParticle = (ctx, particle) => {
  drawCircle(ctx, { ...particle, alpha: particle.alpha });
};

const drawPowerUp = (ctx, powerUp, frameCount) => {
  // Animate hue based on frame count for rainbow effect
  const hue = (powerUp.colorHue + frameCount * 3) % 360;
  drawCircle(ctx, {
    ...powerUp,
    color: `hsl(${hue}, 50%, 50%)`
  });
};

const drawStats = (ctx, player, difficulty) => {
  ctx.fillStyle = 'white';
  ctx.font = '20px Montserrat';
  ctx.fillText(`Score: ${player.score}`, 10, 30);
  ctx.fillText(`Lives: ${player.lives}`, 10, 70);
  ctx.fillText(`Difficulty: ${difficulty}`, 10, 110);
};

const clearCanvas = (ctx, canvas, trailEffect = true) => {
  if (trailEffect) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
  } else {
    ctx.fillStyle = 'rgba(0,0,0,1)';
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const renderGame = (ctx, canvas, state, frameCount) => {
  clearCanvas(ctx, canvas);

  // Draw all game entities
  drawPlayer(ctx, state.player);

  state.enemies.forEach(enemy => drawEnemy(ctx, enemy));
  state.projectiles.forEach(proj => drawProjectile(ctx, proj));
  state.particles.forEach(particle => drawParticle(ctx, particle));
  state.powerUps.forEach(powerUp => drawPowerUp(ctx, powerUp, frameCount));

  drawStats(ctx, state.player, state.settings.difficulty);
};
