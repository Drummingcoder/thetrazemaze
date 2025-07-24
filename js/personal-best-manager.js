/**
 * Personal Best Manager Module
 * Handles saving, loading, and displaying personal best times for levels
 * Unified level-based storage system
 */

console.log('Personal Best Manager module loaded');

const PersonalBestManager = {

  /**
   * Generates a localStorage key for a specific level
   * @param {number} levelNumber - The level number (1-10), or uses window.selectedLevel if not provided
   * @returns {string} The localStorage key for this level
   */
  generateLevelKey: function(levelNumber) {
    const level = levelNumber || window.selectedLevel || 1;
    return `level_${level}_best_time`;
  },

  /**
   * Gets the stored best time for a specific level
   * @param {number} levelNumber - The level number (1-10), or uses window.selectedLevel if not provided
   * @returns {number|null} The best time in milliseconds, or null if no time exists
   */
  getBestTime: function(levelNumber) {
    const key = this.generateLevelKey(levelNumber);
    const storedTime = localStorage.getItem(key);
    return storedTime ? parseFloat(storedTime) : null;
  },

  /**
   * Sets the best time for a specific level (only if it's better than existing)
   * @param {number} levelNumber - The level number (1-10), or uses window.selectedLevel if not provided
   * @param {number} newTime - The new completion time in milliseconds
   * @returns {boolean} True if a new best time was set, false otherwise
   */
  setBestTime: function(levelNumber, newTime) {
    const level = levelNumber || window.selectedLevel || 1;
    const currentBest = this.getBestTime(level);
    
    if (!currentBest || newTime < currentBest) {
      const key = this.generateLevelKey(level);
      localStorage.setItem(key, newTime.toString());
      console.log(`New best time for Level ${level}: ${this.formatTime(newTime)}`);
      return true;
    }
    
    return false;
  },

  /**
   * Formats time in milliseconds to MM:SS.mmm format using GameTimer
   * @param {number} timeMs - Time in milliseconds
   * @returns {string} Formatted time string
   */
  formatTime: function(timeMs) {
    if (!timeMs || isNaN(timeMs)) {
      return '--:--';
    }
    
    // Use the same formatting as GameTimer to ensure consistency
    if (window.GameTimer && window.GameTimer.formatTime) {
      return window.GameTimer.formatTime(timeMs);
    }
    
    // Fallback formatting if GameTimer not available
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(timeMs % 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  },

  /**
   * Displays the personal best time and updates it if a new record was set
   * @param {number} currentTime - The current completion time in milliseconds
   * @param {string} type - Game type (deprecated, kept for compatibility)
   * @param {HTMLElement} personalbest - Element to display personal best
   * @param {HTMLElement} newpersonalbest - Element to show for new records
   */
  displayPersonalBestTime: function(currentTime, type, personalbest, newpersonalbest) {
    const levelNumber = window.selectedLevel || 1;
    const storedBestTime = this.getBestTime(levelNumber);
    
    // Format display text for single goal mode (time-based)
    let bestTimeDisplay = "";
    if (storedBestTime && !isNaN(storedBestTime)) {
      bestTimeDisplay = this.formatTime(storedBestTime);
    } else {
      bestTimeDisplay = "--:--"; // No previous record
    }

    // Update personal best display
    if (personalbest) {
      personalbest.textContent = "Personal Best: " + bestTimeDisplay;
    }

    // Check if this is a new personal best and update accordingly
    const isNewBest = this.setBestTime(levelNumber, currentTime);
    
    if (newpersonalbest) {
      newpersonalbest.style.display = isNewBest ? "block" : "none";
    }
    
    console.log(`Level ${levelNumber} completion: ${this.formatTime(currentTime)}, Best: ${bestTimeDisplay}, New Best: ${isNewBest}`);
  },

  /**
   * Updates the best time display for a specific level card in the level select screen
   * @param {number} levelNumber - The level number (1-10)
   */
  updateLevelDisplay: function(levelNumber) {
    const bestTime = this.getBestTime(levelNumber);
    const displayElement = document.getElementById(`level-${levelNumber}-best-time`);
    
    if (displayElement) {
      if (bestTime) {
        displayElement.textContent = `Best: ${this.formatTime(bestTime)}`;
        displayElement.classList.remove('no-time');
      } else {
        displayElement.textContent = 'Best: --:--';
        displayElement.classList.add('no-time');
      }
    }
  },

  /**
   * Updates all level displays with their best times
   */
  updateAllLevelDisplays: function() {
    for (let i = 1; i <= 10; i++) {
      this.updateLevelDisplay(i);
    }
  },

  /**
   * Gets the personal best time for a specific level (formatted for display)
   * @param {number} levelNumber - The level number (1-10)
   * @returns {string} Formatted personal best time or "Best: --:--" if none exists
   */
  getPersonalBestForLevel: function(levelNumber) {
    const bestTime = this.getBestTime(levelNumber);
    
    if (bestTime && !isNaN(bestTime)) {
      const formattedTime = this.formatTime(bestTime);
      return `Best: ${formattedTime}`;
    } else {
      return "Best: --:--"; // No previous record
    }
  },

  /**
   * Gets the raw personal best time for a specific level (for comparison)
   * @param {number} levelNumber - The level number (1-10)
   * @returns {number|null} The raw time in milliseconds, or null if none exists
   */
  getRawPersonalBestForLevel: function(levelNumber) {
    return this.getBestTime(levelNumber);
  },

  /**
   * Clears the best time for a specific level
   * @param {number} levelNumber - The level number (1-10)
   */
  clearBestTime: function(levelNumber) {
    const key = this.generateLevelKey(levelNumber);
    localStorage.removeItem(key);
    this.updateLevelDisplay(levelNumber);
    console.log(`Cleared best time for level ${levelNumber}`);
  },

  /**
   * Clears all level best times
   */
  clearAllBestTimes: function() {
    for (let i = 1; i <= 10; i++) {
      this.clearBestTime(i);
    }
    console.log('Cleared all level best times');
  },

  /**
   * Checks if a time would be a new best for a level (without setting it)
   * @param {number} levelNumber - The level number (1-10)
   * @param {number} newTime - The time to check in milliseconds
   * @returns {boolean} True if this would be a new best time
   */
  wouldBeNewBest: function(levelNumber, newTime) {
    const currentBest = this.getBestTime(levelNumber);
    return !currentBest || newTime < currentBest;
  },

  /**
   * Gets formatted best time for display
   * @param {number} levelNumber - The level number (1-10)
   * @returns {string} Formatted best time or "--:--"
   */
  getFormattedBestTime: function(levelNumber) {
    const bestTime = this.getBestTime(levelNumber);
    return bestTime ? this.formatTime(bestTime) : '--:--';
  },

  // Legacy compatibility methods (deprecated but kept for backward compatibility)
  
  /**
   * @deprecated Use getBestTime() instead
   */
  getStoredBest: function(type) {
    console.warn('getStoredBest() is deprecated, use getBestTime() instead');
    return this.getBestTime();
  },

  /**
   * @deprecated Use setBestTime() instead
   */
  setBest: function(type, time) {
    console.warn('setBest() is deprecated, use setBestTime() instead');
    return this.setBestTime(null, time);
  },

  /**
   * @deprecated Use clearBestTime() or clearAllBestTimes() instead
   */
  clearBest: function(type) {
    console.warn('clearBest() is deprecated, use clearBestTime() or clearAllBestTimes() instead');
    this.clearBestTime();
  },

  /**
   * @deprecated Use clearAllBestTimes() instead
   */
  clearAllBests: function() {
    console.warn('clearAllBests() is deprecated, use clearAllBestTimes() instead');
    this.clearAllBestTimes();
  }
};

// Make PersonalBestManager globally available
window.PersonalBestManager = PersonalBestManager;

// Also make it available as LevelBestTimeManager for backward compatibility
window.LevelBestTimeManager = PersonalBestManager;

console.log('PersonalBestManager initialized with level-based storage system');
