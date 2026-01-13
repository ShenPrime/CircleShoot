// Leaderboard UI management

const Leaderboard = {
  // State
  visitorId: null,
  playerName: null,
  isInitialized: false,

  // DOM element cache
  elements: {
    modal: null,
    leaderboardBody: null,
    yourRank: null,
    yourBest: null,
    usernameInput: null,
    saveNameBtn: null,
    nameStatus: null,
    closeBtn: null,
    leaderboardBtns: null
  },

  /**
   * Initialize the leaderboard system
   * Loads or creates visitor ID, fetches/creates player name
   */
  async init() {
    if (this.isInitialized) return;

    // Load or create visitor ID
    this.visitorId = localStorage.getItem('visitorId');
    if (!this.visitorId) {
      this.visitorId = this.generateUUID();
      localStorage.setItem('visitorId', this.visitorId);
    }

    // Cache DOM elements
    this.cacheElements();

    // Setup event listeners
    this.setupEventListeners();

    // Register player and get name
    try {
      const result = await LeaderboardAPI.registerPlayer(this.visitorId);
      this.playerName = result.name;
      localStorage.setItem('playerName', this.playerName);
      
      // Update username input if it exists
      if (this.elements.usernameInput) {
        this.elements.usernameInput.value = this.playerName;
      }
    } catch (error) {
      console.error('Failed to register player:', error);
      // Use cached name if available
      this.playerName = localStorage.getItem('playerName') || 'Player';
    }

    this.isInitialized = true;
  },

  /**
   * Cache DOM elements for performance
   */
  cacheElements() {
    this.elements.modal = document.querySelector('.leaderboard-modal');
    this.elements.leaderboardBody = document.querySelector('.leaderboard-body');
    this.elements.yourRank = document.querySelector('.your-rank');
    this.elements.yourBest = document.querySelector('.your-best');
    this.elements.usernameInput = document.querySelector('.username-input');
    this.elements.saveNameBtn = document.querySelector('.save-name-btn');
    this.elements.nameStatus = document.querySelector('.name-status');
    this.elements.closeBtn = document.querySelector('.close-leaderboard-btn');
    this.elements.leaderboardBtns = document.querySelectorAll('.leaderboardBtn');
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Leaderboard buttons (may be multiple - start screen and game over)
    this.elements.leaderboardBtns.forEach(btn => {
      btn.addEventListener('click', () => this.showModal());
    });

    // Close button
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', () => this.hideModal());
    }

    // Close on backdrop click
    if (this.elements.modal) {
      this.elements.modal.addEventListener('click', (e) => {
        if (e.target === this.elements.modal) {
          this.hideModal();
        }
      });
    }

    // Save name button
    if (this.elements.saveNameBtn) {
      this.elements.saveNameBtn.addEventListener('click', () => this.handleSaveName());
    }

    // Save on Enter key in username input
    if (this.elements.usernameInput) {
      this.elements.usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSaveName();
        }
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.modal?.style.display !== 'none') {
        this.hideModal();
      }
    });
  },

  /**
   * Show the leaderboard modal
   */
  async showModal() {
    if (!this.elements.modal) return;

    this.elements.modal.style.display = 'flex';
    
    // Show loading state
    if (this.elements.leaderboardBody) {
      this.elements.leaderboardBody.innerHTML = `
        <tr><td colspan="3" class="loading-text">Loading...</td></tr>
      `;
    }

    try {
      // Fetch leaderboard and player stats in parallel
      const [leaderboard, playerInfo] = await Promise.all([
        LeaderboardAPI.getLeaderboard(100),
        LeaderboardAPI.getPlayerInfo(this.visitorId).catch(() => null)
      ]);

      this.renderLeaderboard(leaderboard, playerInfo);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      if (this.elements.leaderboardBody) {
        this.elements.leaderboardBody.innerHTML = `
          <tr><td colspan="3" class="error-text">Failed to load leaderboard</td></tr>
        `;
      }
    }
  },

  /**
   * Hide the leaderboard modal
   */
  hideModal() {
    if (this.elements.modal) {
      this.elements.modal.style.display = 'none';
    }
  },

  /**
   * Render leaderboard data
   * @param {array} leaderboard - Array of scores
   * @param {object|null} playerInfo - Current player's info
   */
  renderLeaderboard(leaderboard, playerInfo) {
    // Update player rank display
    if (this.elements.yourRank) {
      if (playerInfo?.stats?.globalRank) {
        this.elements.yourRank.textContent = `#${playerInfo.stats.globalRank}`;
      } else {
        this.elements.yourRank.textContent = '#--';
      }
    }

    if (this.elements.yourBest) {
      if (playerInfo?.stats?.bestScore) {
        this.elements.yourBest.textContent = playerInfo.stats.bestScore.toLocaleString();
      } else {
        this.elements.yourBest.textContent = '--';
      }
    }

    // Render leaderboard table
    if (!this.elements.leaderboardBody) return;

    if (!leaderboard || leaderboard.length === 0) {
      this.elements.leaderboardBody.innerHTML = `
        <tr><td colspan="3" class="empty-text">No scores yet. Be the first!</td></tr>
      `;
      return;
    }

    const rows = leaderboard.map(entry => {
      const isCurrentPlayer = entry.name === this.playerName;
      const rankClass = this.getRankClass(entry.rank);
      const playerClass = isCurrentPlayer ? 'current-player' : '';

      return `
        <tr class="${playerClass}">
          <td class="rank-col ${rankClass}">#${entry.rank}</td>
          <td class="name-col">${this.escapeHtml(entry.name)}</td>
          <td class="score-col">${entry.score.toLocaleString()}</td>
        </tr>
      `;
    }).join('');

    this.elements.leaderboardBody.innerHTML = rows;
  },

  /**
   * Get CSS class for rank (gold, silver, bronze)
   * @param {number} rank - Player rank
   * @returns {string} CSS class
   */
  getRankClass(rank) {
    switch (rank) {
      case 1: return 'rank-1';
      case 2: return 'rank-2';
      case 3: return 'rank-3';
      default: return '';
    }
  },

  /**
   * Handle save name button click
   */
  async handleSaveName() {
    if (!this.elements.usernameInput || !this.elements.nameStatus) return;

    const newName = this.elements.usernameInput.value.trim();
    
    if (newName === this.playerName) {
      this.showNameStatus('Name unchanged', 'info');
      return;
    }

    if (newName.length < 3) {
      this.showNameStatus('Name must be at least 3 characters', 'error');
      return;
    }

    if (newName.length > 20) {
      this.showNameStatus('Name must be at most 20 characters', 'error');
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(newName)) {
      this.showNameStatus('Only letters and numbers allowed', 'error');
      return;
    }

    // Disable input while saving
    this.elements.usernameInput.disabled = true;
    this.elements.saveNameBtn.disabled = true;
    this.showNameStatus('Saving...', 'info');

    try {
      const result = await LeaderboardAPI.updatePlayerName(this.visitorId, newName);
      this.playerName = result.name;
      localStorage.setItem('playerName', this.playerName);
      this.showNameStatus('Name saved!', 'success');
    } catch (error) {
      this.showNameStatus(error.message || 'Failed to save name', 'error');
      this.elements.usernameInput.value = this.playerName; // Revert
    } finally {
      this.elements.usernameInput.disabled = false;
      this.elements.saveNameBtn.disabled = false;
    }
  },

  /**
   * Show name status message
   * @param {string} message - Message to show
   * @param {string} type - Message type (success, error, info)
   */
  showNameStatus(message, type) {
    if (!this.elements.nameStatus) return;
    
    this.elements.nameStatus.textContent = message;
    this.elements.nameStatus.className = `name-status ${type}`;

    // Auto-clear after 3 seconds
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        if (this.elements.nameStatus.textContent === message) {
          this.elements.nameStatus.textContent = '';
          this.elements.nameStatus.className = 'name-status';
        }
      }, 3000);
    }
  },

  /**
   * Submit game score
   * @param {number} score - Final score
   * @param {number} rankAchieved - Rank achieved in game
   * @param {number} durationMs - Game duration in milliseconds
   */
  async submitGameScore(score, rankAchieved, durationMs) {
    if (!this.visitorId) {
      console.error('Cannot submit score: no visitor ID');
      return;
    }

    try {
      const result = await LeaderboardAPI.submitScore(
        this.visitorId,
        score,
        rankAchieved,
        durationMs
      );

      // Update player name if it was auto-generated
      if (result.playerName && !this.playerName) {
        this.playerName = result.playerName;
        localStorage.setItem('playerName', this.playerName);
        if (this.elements.usernameInput) {
          this.elements.usernameInput.value = this.playerName;
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to submit score:', error);
      // Don't throw - score submission failure shouldn't break the game
    }
  },

  /**
   * Update username input with current player name
   */
  updateUsernameDisplay() {
    if (this.elements.usernameInput && this.playerName) {
      this.elements.usernameInput.value = this.playerName;
    }
  },

  /**
   * Generate a UUID v4
   * @returns {string} UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
