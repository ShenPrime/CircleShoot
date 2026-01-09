// Cosmic rendering functions with glow effects and star field

// Color constants - vibrant, high contrast
const COLORS = {
  bullet: '#ff6b00',       // Hot orange
  score: '#ffffff',        // Pure white
  health: '#ff2d2d',       // Bright red
  level: '#ffcc00',        // Golden yellow
  powerup: '#00ff88',      // Neon green
  hudText: '#ffffff',      // White text
  hudMuted: '#888888',     // Gray for labels
  powerBarStart: '#ff6b00', // Orange gradient start
  powerBarEnd: '#ffcc00',   // Gold gradient end
  gold: '#ffcc00'          // For score display
};

// Level titles/accolades
const LEVEL_TITLES = [
  'RECRUIT',        // Level 1
  'CADET',          // Level 2
  'PILOT',          // Level 3
  'WARRIOR',        // Level 4
  'VETERAN',        // Level 5
  'ELITE',          // Level 6
  'COMMANDER',      // Level 7
  'CAPTAIN',        // Level 8
  'ADMIRAL',        // Level 9
  'LEGEND',         // Level 10
  'COSMIC HERO',    // Level 11
  'STAR SLAYER',    // Level 12
  'VOID WALKER',    // Level 13
  'GALAXY GUARDIAN',// Level 14
  'CELESTIAL',      // Level 15+
];

const getLevelTitle = (level) => {
  const index = Math.min(level - 1, LEVEL_TITLES.length - 1);
  return LEVEL_TITLES[Math.max(0, index)];
};

// Create star field
const createStarField = (canvas, count = 150) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.02 + Math.random() * 0.03,
      twinkleOffset: Math.random() * Math.PI * 2
    });
  }
  return stars;
};

// Draw star field with twinkling and parallax effect
const drawStarField = (ctx, stars, frameCount, player, canvas) => {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Calculate player offset from center (normalized)
  const offsetX = (player.x - centerX) / centerX;
  const offsetY = (player.y - centerY) / centerY;

  stars.forEach(star => {
    const twinkle = Math.sin(frameCount * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;

    // Parallax: smaller/dimmer stars move less (further away)
    // Larger/brighter stars move more (closer)
    const parallaxStrength = star.brightness * 100;
    const starX = star.x - offsetX * parallaxStrength;
    const starY = star.y - offsetY * parallaxStrength;

    // Wrap stars around screen edges
    const wrappedX = ((starX % canvas.width) + canvas.width) % canvas.width;
    const wrappedY = ((starY % canvas.height) + canvas.height) % canvas.height;

    ctx.globalAlpha = star.brightness * twinkle;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(wrappedX, wrappedY, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
};

// Draw circle with subtle glow effect using shadow
const drawGlowCircle = (ctx, x, y, radius, color, glowIntensity = 1) => {
  ctx.save();

  // Subtle glow using shadow
  ctx.shadowColor = color;
  ctx.shadowBlur = radius * glowIntensity;

  // Main circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

// Draw player with subtle glow - white for clear contrast against colorful enemies
const drawPlayer = (ctx, player, frameCount) => {
  const pulse = Math.sin(frameCount * 0.05) * 0.3 + 1;
  // Use white normally, rainbow when invincible
  const color = player.isInvincible ? player.color : '#ffffff';
  const glowIntensity = player.isInvincible ? pulse * 1.5 : pulse;

  drawGlowCircle(ctx, player.x, player.y, player.radius, color, glowIntensity);
};

// Draw enemy with subtle glow
const drawEnemy = (ctx, enemy) => {
  drawGlowCircle(ctx, enemy.x, enemy.y, enemy.radius, enemy.color, 0.5);
};

// Draw projectile with glow
const drawProjectile = (ctx, projectile) => {
  drawGlowCircle(ctx, projectile.x, projectile.y, projectile.radius, COLORS.bullet, 1.2);
};

// Draw particle with fade
const drawParticle = (ctx, particle) => {
  ctx.globalAlpha = particle.alpha;
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
};

// Powerup color mapping
const POWERUP_COLORS = {
  health: '#00ff88',     // Green
  speed: '#ffdd00',      // Yellow
  cannon: '#ff8800',     // Orange
  tiny: '#cc44ff',       // Purple
  invincible: null,      // Rainbow (handled specially)
  rapidFire: '#ff4444',  // Red
  shockwave: '#00ffff',  // Cyan
  multishot: '#ff66cc'   // Pink
};

// Draw powerup symbol based on type
const drawPowerUpSymbol = (ctx, x, y, size, type, frameCount) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (type) {
    case 'health':
      // Plus/cross symbol
      const crossSize = size * 0.6;
      const crossThick = size * 0.25;
      ctx.beginPath();
      ctx.rect(-crossThick / 2, -crossSize / 2, crossThick, crossSize);
      ctx.rect(-crossSize / 2, -crossThick / 2, crossSize, crossThick);
      ctx.fill();
      break;

    case 'speed':
      // Lightning bolt
      const boltScale = size * 0.08;
      ctx.beginPath();
      ctx.moveTo(2 * boltScale, -6 * boltScale);
      ctx.lineTo(-1 * boltScale, -1 * boltScale);
      ctx.lineTo(1 * boltScale, -1 * boltScale);
      ctx.lineTo(-2 * boltScale, 6 * boltScale);
      ctx.lineTo(1 * boltScale, 1 * boltScale);
      ctx.lineTo(-1 * boltScale, 1 * boltScale);
      ctx.closePath();
      ctx.fill();
      break;

    case 'cannon':
      // Large bullet/projectile shape
      const bulletR = size * 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, bulletR, 0, Math.PI * 2);
      ctx.fill();
      // Inner ring for depth
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, bulletR * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      break;

    case 'tiny':
      // Four arrows pointing inward
      const arrowLen = size * 0.35;
      const arrowHead = size * 0.15;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI / 2);
        // Arrow line
        ctx.beginPath();
        ctx.moveTo(0, -arrowLen);
        ctx.lineTo(0, -arrowHead);
        ctx.stroke();
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(0, -arrowHead * 0.3);
        ctx.lineTo(-arrowHead * 0.5, -arrowHead);
        ctx.lineTo(arrowHead * 0.5, -arrowHead);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      break;

    case 'invincible':
      // Star shape
      const outerR = size * 0.45;
      const innerR = size * 0.2;
      const points = 5;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI / points) - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
      break;

    case 'rapidFire':
      // Three bullets in a row
      const dotR = size * 0.12;
      const dotSpacing = size * 0.28;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(i * dotSpacing, 0, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'shockwave':
      // Expanding wave rings
      const wave1 = size * 0.2;
      const wave2 = size * 0.35;
      const wave3 = size * 0.5;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(0, 0, wave1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, wave2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, wave3, 0, Math.PI * 2);
      ctx.stroke();
      break;

    case 'multishot':
      // Fan of 5 bullets spreading outward
      const bulletSize = size * 0.1;
      const fanRadius = size * 0.35;
      const spreadAngle = Math.PI * 0.6; // 108 degrees total spread
      for (let i = 0; i < 5; i++) {
        const angle = -spreadAngle / 2 + (spreadAngle / 4) * i - Math.PI / 2;
        const bx = Math.cos(angle) * fanRadius;
        const by = Math.sin(angle) * fanRadius;
        ctx.beginPath();
        ctx.arc(bx, by, bulletSize, 0, Math.PI * 2);
        ctx.fill();
      }
      // Center origin dot
      ctx.beginPath();
      ctx.arc(0, size * 0.15, bulletSize * 0.8, 0, Math.PI * 2);
      ctx.fill();
      break;

    default:
      // Fallback: simple dot
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
  }

  ctx.restore();
};

// Draw power-up with unique symbol for each type
const drawPowerUp = (ctx, powerUp, frameCount) => {
  const pulse = Math.sin(frameCount * 0.15) * 0.3 + 1;
  const rotation = frameCount * 0.02;

  // Get color based on powerup type
  let color;
  if (powerUp.name === 'invincible') {
    // Rainbow cycling for invincible
    const hue = (frameCount * 4) % 360;
    color = `hsl(${hue}, 100%, 60%)`;
  } else {
    color = POWERUP_COLORS[powerUp.name] || '#ffffff';
  }

  // Outer pulsing glow ring
  const ringRadius = powerUp.radius + 6 + Math.sin(frameCount * 0.1) * 3;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(powerUp.x, powerUp.y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Inner glowing core
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 25;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(powerUp.x, powerUp.y, powerUp.radius * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Symbol with glow
  ctx.save();
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 15;
  // Slight rotation animation for some powerups
  if (powerUp.name === 'invincible' || powerUp.name === 'shockwave') {
    ctx.translate(powerUp.x, powerUp.y);
    ctx.rotate(rotation);
    ctx.translate(-powerUp.x, -powerUp.y);
  }
  drawPowerUpSymbol(ctx, powerUp.x, powerUp.y, powerUp.radius * 1.8, powerUp.name, frameCount);
  ctx.restore();
};

// Draw text with optional glow
const drawText = (ctx, text, x, y, color = COLORS.hudText, fontSize = 18, glow = false) => {
  ctx.font = `bold ${fontSize}px Orbitron, sans-serif`;
  ctx.fillStyle = color;

  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
  }

  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
};

// Draw health hearts
const drawHealthHearts = (ctx, lives, maxLives, x, y) => {
  const heartSize = 20;
  const spacing = 26;

  for (let i = 0; i < maxLives; i++) {
    const heartX = x + i * spacing;
    const isFilled = i < lives;

    ctx.font = `${heartSize}px Arial`;
    ctx.globalAlpha = isFilled ? 1 : 0.25;
    ctx.fillStyle = isFilled ? COLORS.health : '#444';
    ctx.shadowBlur = 0;

    ctx.fillText('❤', heartX, y);
  }
  ctx.globalAlpha = 1;
};

// Draw rank indicator with title
const drawRankLevel = (ctx, rank, x, y) => {
  const title = getLevelTitle(rank);

  // Rank number
  ctx.font = 'bold 14px Orbitron, sans-serif';
  ctx.fillStyle = COLORS.level;
  ctx.shadowColor = COLORS.level;
  ctx.shadowBlur = 8;
  ctx.fillText(`RANK ${rank}`, x, y);

  // Title - bright and glowing
  ctx.font = 'bold 12px Orbitron, sans-serif';
  ctx.fillStyle = COLORS.powerup;
  ctx.shadowColor = COLORS.powerup;
  ctx.shadowBlur = 10;
  ctx.fillText(title, x + 70, y);
  ctx.shadowBlur = 0;
};

// Draw power-up indicator bar
const drawPowerUpBar = (ctx, activePowerUp, x, y) => {
  if (!activePowerUp || !activePowerUp.name) return;

  const barWidth = 140;
  const barHeight = 8;
  const progress = activePowerUp.timeRemaining / activePowerUp.duration;

  // Power-up name
  const displayName = activePowerUp.name.toUpperCase();
  ctx.font = 'bold 12px Orbitron, sans-serif';
  ctx.fillStyle = COLORS.powerup;
  ctx.shadowColor = COLORS.powerup;
  ctx.shadowBlur = 10;
  ctx.fillText(displayName, x, y);
  ctx.shadowBlur = 0;

  // Background bar
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y + 8, barWidth, barHeight);

  // Progress bar with orange-gold gradient
  ctx.globalAlpha = 1;
  const gradient = ctx.createLinearGradient(x, 0, x + barWidth, 0);
  gradient.addColorStop(0, COLORS.powerBarStart);
  gradient.addColorStop(1, COLORS.powerBarEnd);
  ctx.fillStyle = gradient;
  ctx.shadowColor = COLORS.powerBarEnd;
  ctx.shadowBlur = 10;
  ctx.fillRect(x, y + 8, barWidth * progress, barHeight);
  ctx.shadowBlur = 0;

  // Time remaining
  const timeLeft = Math.ceil(activePowerUp.timeRemaining / 1000);
  ctx.font = 'bold 11px Orbitron, sans-serif';
  ctx.fillStyle = COLORS.hudText;
  ctx.fillText(`${timeLeft}s`, x + barWidth + 10, y + 15);
};

// Draw the complete HUD
const drawHUD = (ctx, state, frameCount) => {
  const padding = 20;

  // Score with glow
  drawText(ctx, `◆ ${state.player.score.toLocaleString()}`, padding, 35, COLORS.gold, 24, true);

  // Health hearts
  drawHealthHearts(ctx, state.player.lives, 5, padding, 65);

  // Rank display
  drawRankLevel(ctx, state.player.rank || 1, padding, 95);

  // Power-up bars (multiple)
  if (state.activePowerUps && state.activePowerUps.length > 0) {
    state.activePowerUps.forEach((powerUp, index) => {
      drawPowerUpBar(ctx, powerUp, padding, 120 + (index * 35));
    });
  }
};

// Draw level up notification
const drawLevelUpNotification = (ctx, canvas, notification) => {
  if (!notification || notification.framesRemaining <= 0) return;

  const { level, framesRemaining } = notification;
  const title = getLevelTitle(level);

  // Fade in/out based on frames remaining
  let alpha;
  if (framesRemaining > 100) {
    // Fade in (frames 120-100)
    alpha = (120 - framesRemaining) / 20;
  } else if (framesRemaining < 30) {
    // Fade out (frames 30-0)
    alpha = framesRemaining / 30;
  } else {
    alpha = 1;
  }

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 3;

  // Scale effect for punch
  const scale = framesRemaining > 100 ? 1 + (120 - framesRemaining) / 40 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);

  // "LEVEL UP" text
  ctx.font = 'bold 18px Orbitron, sans-serif';
  ctx.fillStyle = COLORS.hudMuted;
  ctx.textAlign = 'center';
  ctx.fillText('RANK ACHIEVED', 0, -30);

  // Rank number
  ctx.font = 'bold 48px Orbitron, sans-serif';
  ctx.fillStyle = COLORS.gold;
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 20;
  ctx.fillText(`RANK ${level}`, 0, 10);

  // Title/accolade - bright white with colored glow
  ctx.font = 'bold 28px Orbitron, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = COLORS.powerup;
  ctx.shadowBlur = 25;
  ctx.fillText(title, 0, 55);

  ctx.restore();
};

// Streak tier titles (for HUD display)
const STREAK_TITLES = [
  null,         // Tier 0: no streak
  'FOCUSED',    // Tier 1: 5s
  'UNTOUCHED',  // Tier 2: 10s
  'FLAWLESS',   // Tier 3: 20s
  'GODLIKE',    // Tier 4: 35s
  'IMMORTAL',   // Tier 5: 55s
  'INVINCIBLE', // Tier 6: 80s
  'LEGENDARY',  // Tier 7: 120s
];

const STREAK_COLORS = [
  null,
  '#88ff88',
  '#00ff88',
  '#00ffff',
  '#ff00ff',
  '#ffaa00',
  '#ff0000',
  '#ffffff',
];

// Draw no-hit streak timer and title
const drawStreakTimer = (ctx, canvas, player) => {
  const streakSeconds = Math.floor(player.noHitStreak / 1000);
  const streakTier = player.streakTier || 0;

  // Only show if streak is at least 1 second
  if (streakSeconds < 1) return;

  const x = canvas.width - 20;
  const y = 35;

  // Format time as MM:SS
  const minutes = Math.floor(streakSeconds / 60);
  const seconds = streakSeconds % 60;
  const timeStr = minutes > 0
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `${seconds}s`;

  ctx.save();
  ctx.textAlign = 'right';

  // Streak timer
  ctx.font = 'bold 16px Orbitron, sans-serif';
  ctx.fillStyle = streakTier > 0 ? STREAK_COLORS[streakTier] : '#888888';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = streakTier > 0 ? 10 : 0;
  ctx.fillText(timeStr, x, y);

  // Streak title (if tier > 0)
  if (streakTier > 0 && STREAK_TITLES[streakTier]) {
    ctx.font = 'bold 12px Orbitron, sans-serif';
    ctx.fillText(STREAK_TITLES[streakTier], x, y + 18);
  }

  // Label
  ctx.font = 'bold 10px Orbitron, sans-serif';
  ctx.fillStyle = '#666666';
  ctx.shadowBlur = 0;
  ctx.fillText('NO-HIT STREAK', x, y - 15);

  ctx.restore();
};

// Draw streak notification
const drawStreakNotification = (ctx, canvas, notification) => {
  if (!notification || notification.framesRemaining <= 0) return;

  const { title, color, framesRemaining } = notification;

  // Fade in/out
  let alpha;
  if (framesRemaining > 75) {
    alpha = (90 - framesRemaining) / 15;
  } else if (framesRemaining < 20) {
    alpha = framesRemaining / 20;
  } else {
    alpha = 1;
  }

  const centerX = canvas.width / 2;
  const y = canvas.height - 100;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';

  // Title with glow
  ctx.font = 'bold 36px Orbitron, sans-serif';
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 25;
  ctx.fillText(title, centerX, y);

  // Subtitle
  ctx.font = 'bold 14px Orbitron, sans-serif';
  ctx.fillStyle = '#888888';
  ctx.shadowBlur = 0;
  ctx.fillText('NO-HIT STREAK', centerX, y + 25);

  ctx.restore();
};

// Draw shockwave ring
const drawShockwave = (ctx, shockwave) => {
  if (!shockwave || !shockwave.active) return;

  const { x, y, radius } = shockwave;

  ctx.save();

  // Outer glow
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 8;
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 30;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner bright ring
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 15;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Fading trail ring
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, radius - 20), 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
};

// Draw screen flash effect for damage/heal
const drawScreenFlash = (ctx, canvas, player) => {
  // Damage flash (red vignette)
  if (player.damageFlash && player.damageFlash > 0) {
    const intensity = player.damageFlash / 15;
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.8
    );
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(255, 45, 45, ${intensity * 0.4})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Heal flash (green pulse from center)
  if (player.healFlash && player.healFlash > 0) {
    const intensity = player.healFlash / 20;
    const gradient = ctx.createRadialGradient(
      player.x, player.y, 0,
      player.x, player.y, 200
    );
    gradient.addColorStop(0, `rgba(0, 255, 136, ${intensity * 0.5})`);
    gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
};

// Clear canvas with space background
const clearCanvas = (ctx, canvas, trailEffect = true) => {
  if (trailEffect) {
    ctx.fillStyle = 'rgba(10, 10, 26, 0.25)';
  } else {
    ctx.fillStyle = '#0a0a1a';
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

// Main render function
const renderGame = (ctx, canvas, state, frameCount) => {
  clearCanvas(ctx, canvas);

  // Draw star field first (background) with parallax
  if (state.stars && state.stars.length > 0) {
    drawStarField(ctx, state.stars, frameCount, state.player, canvas);
  }

  // Draw game entities
  drawPlayer(ctx, state.player, frameCount);

  state.enemies.forEach(enemy => drawEnemy(ctx, enemy));
  state.projectiles.forEach(proj => drawProjectile(ctx, proj));
  state.particles.forEach(particle => drawParticle(ctx, particle));
  state.powerUps.forEach(powerUp => drawPowerUp(ctx, powerUp, frameCount));

  // Draw shockwave
  if (state.shockwave) {
    drawShockwave(ctx, state.shockwave);
  }

  // Draw screen flash effects (damage/heal)
  drawScreenFlash(ctx, canvas, state.player);

  // Draw level up notification
  if (state.levelUpNotification) {
    drawLevelUpNotification(ctx, canvas, state.levelUpNotification);
  }

  // Draw streak notification
  if (state.streakNotification) {
    drawStreakNotification(ctx, canvas, state.streakNotification);
  }

  // Draw HUD on top
  drawHUD(ctx, state, frameCount);

  // Draw streak timer (top right)
  drawStreakTimer(ctx, canvas, state.player);
};
