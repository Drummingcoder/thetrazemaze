/**
 * Personal Best Manager Module
 * Handles saving, loading, and displaying personal best times for levels
 * Unified level-based storage system
 *
 * ---
 * PersonalBestManager.js Function Reference
 * ---
 *
 * 1. generateLevelKey: Generates a localStorage key for a specific level.
 * 2. getBestTime: Gets the stored best time for a specific level.
 * 3. setBestTime: Sets the best time for a specific level (if better).
 * 4. displayPersonalBestTime: Displays and updates personal best time.
 * 5. updateLevelDisplay: Updates the best time display for a level card.
 * 6. updateAllLevelDisplays: Updates all level displays with best times.
 * 7. clearBestTime: Clears the best time for a specific level.
 * 8. clearAllBestTimes: Clears all level best times.
 * 9. wouldBeNewBest: Checks if a time would be a new best for a level.
 *
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
      console.log(`New best time for Level ${level}: ${window.GameTimer.formatTime(newTime)}`);
      return true;
    }
    
    return false;
  },

  /**
   * Displays the personal best time and updates it if a new record was set
   * @param {number} currentTime - The current completion time in milliseconds
   * @param {HTMLElement} personalbest - Element to display personal best
   * @param {HTMLElement} newpersonalbest - Element to show for new records
   */
  displayPersonalBestTime: function(currentTime, personalbest, newpersonalbest) {
    const levelNumber = window.selectedLevel || 1;
    const storedBestTime = this.getBestTime(levelNumber);
    
    // Format display text for single goal mode (time-based)
    let bestTimeDisplay = "";
    if (storedBestTime && !isNaN(storedBestTime)) {
      bestTimeDisplay = window.GameTimer.formatTime(storedBestTime);
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
    
    console.log(`Level ${levelNumber} completion: ${window.GameTimer.formatTime(currentTime)}, Best: ${bestTimeDisplay}, New Best: ${isNewBest}`);
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
        displayElement.textContent = `Best: ${window.GameTimer.formatTime(bestTime)}`;
        displayElement.classList.remove('no-time');
      } else {
        displayElement.textContent = 'Best: --:--';
        displayElement.classList.add('no-time');
      }
    }
  },

  /**
   * Updates all level displays with their best times
   * Not in use, but kept for future use
   */
  updateAllLevelDisplays: function() {
    for (let i = 1; i <= 10; i++) {
      this.updateLevelDisplay(i);
    }
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
   * Not in use, but kept for future use; will probably delete
   */
  wouldBeNewBest: function(levelNumber, newTime) {
    const currentBest = this.getBestTime(levelNumber);
    return !currentBest || newTime < currentBest;
  }
};

// Make PersonalBestManager globally available
window.PersonalBestManager = PersonalBestManager;

// Also make it available as LevelBestTimeManager for backward compatibility
window.LevelBestTimeManager = PersonalBestManager;

console.log('PersonalBestManager initialized with level-based storage system');
