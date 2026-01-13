// Frontend API client for leaderboard

const LeaderboardAPI = {
  BASE_URL: '/api',

  /**
   * Submit a score to the leaderboard
   * @param {string} visitorId - Unique visitor identifier
   * @param {number} score - Score achieved
   * @param {number} rankAchieved - Rank achieved in game
   * @param {number} durationMs - Game duration in milliseconds
   * @returns {Promise<object>} Response with scoreId and playerName
   */
  async submitScore(visitorId, score, rankAchieved, durationMs) {
    const response = await fetch(`${this.BASE_URL}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, score, rankAchieved, durationMs })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit score');
    }

    return response.json();
  },

  /**
   * Get the global leaderboard
   * @param {number} limit - Number of scores to fetch (max 100)
   * @returns {Promise<array>} Array of top scores
   */
  async getLeaderboard(limit = 100) {
    const response = await fetch(`${this.BASE_URL}/leaderboard?limit=${limit}`);

    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }

    return response.json();
  },

  /**
   * Get player information and stats
   * @param {string} visitorId - Visitor identifier
   * @returns {Promise<object>} Player info with stats
   */
  async getPlayerInfo(visitorId) {
    const response = await fetch(`${this.BASE_URL}/player/${visitorId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch player info');
    }

    return response.json();
  },

  /**
   * Update player name
   * @param {string} visitorId - Visitor identifier
   * @param {string} name - New name
   * @returns {Promise<object>} Response with success and new name
   */
  async updatePlayerName(visitorId, name) {
    const response = await fetch(`${this.BASE_URL}/player/${visitorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update name');
    }

    return response.json();
  },

  /**
   * Check if a name is available
   * @param {string} name - Name to check
   * @returns {Promise<object>} Object with available boolean
   */
  async checkNameAvailability(name) {
    const response = await fetch(
      `${this.BASE_URL}/name/check?name=${encodeURIComponent(name)}`
    );

    if (!response.ok) {
      throw new Error('Failed to check name availability');
    }

    return response.json();
  },

  /**
   * Generate a new unique name
   * @returns {Promise<object>} Object with generated name
   */
  async generateName() {
    const response = await fetch(`${this.BASE_URL}/name/generate`);

    if (!response.ok) {
      throw new Error('Failed to generate name');
    }

    return response.json();
  },

  /**
   * Register a new player or get existing player info
   * @param {string} visitorId - Visitor identifier
   * @returns {Promise<object>} Player info
   */
  async registerPlayer(visitorId) {
    const response = await fetch(`${this.BASE_URL}/player/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to register player');
    }

    return response.json();
  }
};
