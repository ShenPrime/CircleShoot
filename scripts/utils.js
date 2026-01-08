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
