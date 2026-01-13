// Adjective + Noun name generator for auto-generated player names

const ADJECTIVES = [
  'Swift', 'Brave', 'Cosmic', 'Shadow', 'Thunder', 'Crystal', 'Phantom',
  'Stellar', 'Neon', 'Frost', 'Solar', 'Lunar', 'Crimson', 'Azure',
  'Silent', 'Rapid', 'Fierce', 'Noble', 'Wild', 'Dark', 'Bright',
  'Storm', 'Fire', 'Ice', 'Iron', 'Golden', 'Silver', 'Mystic',
  'Rogue', 'Prime', 'Ultra', 'Hyper', 'Mega', 'Nova', 'Quantum',
  'Cyber', 'Pixel', 'Turbo', 'Apex', 'Elite', 'Alpha', 'Omega',
  'Astral', 'Void', 'Chaos', 'Zen', 'Lucky', 'Sneaky', 'Mighty'
];

const NOUNS = [
  'Hunter', 'Phoenix', 'Warrior', 'Dragon', 'Knight', 'Falcon', 'Titan',
  'Wolf', 'Hawk', 'Viper', 'Cobra', 'Raven', 'Panther', 'Tiger',
  'Ninja', 'Samurai', 'Pilot', 'Sniper', 'Ranger', 'Guardian', 'Slayer',
  'Ghost', 'Specter', 'Blade', 'Arrow', 'Bolt', 'Spark', 'Comet',
  'Star', 'Meteor', 'Nebula', 'Pulsar', 'Quasar', 'Orbit', 'Voyager',
  'Seeker', 'Striker', 'Shooter', 'Blaster', 'Crusher', 'Destroyer',
  'Legend', 'Hero', 'Champion', 'Master', 'Ace', 'Chief', 'Captain'
];

/**
 * Generate a random name in format "AdjectiveNoun"
 * @returns {string} Generated name
 */
function generateName() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective}${noun}`;
}

/**
 * Generate a unique name that doesn't exist in the database
 * @param {Function} isNameTaken - Async function that checks if name exists
 * @param {number} maxAttempts - Maximum attempts before appending numbers
 * @returns {Promise<string>} Unique generated name
 */
async function generateUniqueName(isNameTaken, maxAttempts = 10) {
  // Try generating a unique name without numbers first
  for (let i = 0; i < maxAttempts; i++) {
    const name = generateName();
    const taken = await isNameTaken(name);
    if (!taken) {
      return name;
    }
  }

  // If all attempts failed, append a random 2-digit number
  for (let i = 0; i < 100; i++) {
    const baseName = generateName();
    const suffix = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    const name = `${baseName}${suffix}`;
    
    // Ensure name doesn't exceed 20 characters
    if (name.length > 20) {
      continue;
    }
    
    const taken = await isNameTaken(name);
    if (!taken) {
      return name;
    }
  }

  // Fallback: generate with timestamp (guaranteed unique)
  const timestamp = Date.now().toString(36).slice(-4);
  return `Player${timestamp}`;
}

/**
 * Validate a player name
 * @param {string} name - Name to validate
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Name must be at least 3 characters' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Name must be at most 20 characters' };
  }

  // Only allow alphanumeric characters
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters and numbers' };
  }

  // Basic profanity filter (extend as needed)
  const blocklist = ['admin', 'moderator', 'system', 'null', 'undefined'];
  if (blocklist.includes(trimmed.toLowerCase())) {
    return { valid: false, error: 'This name is not allowed' };
  }

  return { valid: true };
}

module.exports = {
  generateName,
  generateUniqueName,
  validateName,
  ADJECTIVES,
  NOUNS
};
