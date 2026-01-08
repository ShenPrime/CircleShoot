// Pure utility functions

const getRandomNumber = (max) => Math.round(Math.random() * max);

const getRandomColor = () => {
  const hue = Math.random() * 360;
  return `hsl(${hue}, 50%, 50%)`;
};

const getAngle = (target, x, y) =>
  Math.atan2(target.y - y, target.x - x);

const getVelocity = (angle, speed) => ({
  x: Math.cos(angle) * speed,
  y: Math.sin(angle) * speed
});

const getEnemySpawnPosition = (canvas, radius) => {
  if (Math.random() < 0.5) {
    return {
      x: Math.random() < 0.5 ? -radius : canvas.width + radius,
      y: Math.random() * canvas.height
    };
  }
  return {
    x: Math.random() * canvas.width,
    y: Math.random() < 0.5 ? -radius : canvas.height + radius
  };
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hideElements = (elements) => {
  elements.forEach(el => { el.style.display = 'none'; });
};

const showElements = (elements) => {
  elements.forEach(el => { el.style.display = 'block'; });
};

const setElementText = (element, text) => {
  element.innerText = text;
};

// Get rank title for game over screen (uses LEVEL_TITLES from rendering.js)
const getRankTitle = (rank) => {
  // LEVEL_TITLES is defined in rendering.js which loads before this
  if (typeof LEVEL_TITLES !== 'undefined') {
    const index = Math.min(rank - 1, LEVEL_TITLES.length - 1);
    return LEVEL_TITLES[Math.max(0, index)];
  }
  return 'RECRUIT';
};

// Get streak title for game over screen (uses STREAK_TITLES from rendering.js)
const getStreakTitle = (tier) => {
  // STREAK_TITLES is defined in rendering.js which loads before this
  if (typeof STREAK_TITLES !== 'undefined' && tier > 0 && tier < STREAK_TITLES.length) {
    return STREAK_TITLES[tier];
  }
  return null;
};
