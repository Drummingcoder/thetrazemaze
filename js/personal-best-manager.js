/**
 * Personal Best Manager Module
 * Handles saving, loading, and displaying personal best times
 */

console.log('Personal Best Manager module loaded');

const PersonalBestManager = {

  /**
   * Generates a unique identifier for the current game configuration
   * Used as localStorage key for personal best times
   * @param {string} type - Game type ("black" for hidden mode)
   * @returns {string} Unique identifier for this game configuration
   */
  generateMazeIdentifier: function(type) {
    let mazeIdentifier;
    
    // Determine base identifier based on difficulty and mode
    if (easy === false) {
      // Hard mode identifiers
      if (mazeSize === 15) {
        mazeIdentifier = type === "black" ? 'bsm' : 'sm';  // small maze
      } else if (mazeSize === 35) {
        mazeIdentifier = type === "black" ? 'bmm' : 'mm';  // medium maze
      } else if (mazeSize === 61) {
        mazeIdentifier = type === "black" ? 'bbm' : 'bm';  // big maze
      }
    } else {
      // Easy mode identifiers (prefixed with 'e')
      if (mazeSize === 15) {
        mazeIdentifier = type === "black" ? 'besm' : 'esm'; // easy small maze
      } else if (mazeSize === 35) {
        mazeIdentifier = type === "black" ? 'bemm' : 'emm'; // easy medium maze
      } else if (mazeSize === 61) {
        mazeIdentifier = type === "black" ? 'bebm' : 'ebm'; // easy big maze
      }
    }

    // Add suffix for multiple goals mode
    if (multiple === "true") {
      mazeIdentifier += 'm';
    }

    return mazeIdentifier;
  },

  /**
   * Calculates the personal best time for the current game configuration
   * @param {number} currentTime - The current completion time/score
   * @param {string} type - Game type ("black" for hidden mode)
   * @returns {number} The personal best time (lowest for single goal, highest for multiple goals)
   */
  calculatePersonalBestTime: function(currentTime, type) {
    // Get unique identifier for this game configuration
    const mazeIdentifier = this.generateMazeIdentifier(type);
    
    // Retrieve stored personal best from localStorage
    const storedBestTime = localStorage.getItem(mazeIdentifier);
    let bestTime = currentTime;

    if (multiple === "true") {
      // Multiple goals mode: higher score is better
      if (storedBestTime) {
        bestTime = Math.max(currentTime, parseFloat(storedBestTime));
      }
    } else {
      // Single goal mode: lower time is better
      if (storedBestTime) {
        bestTime = Math.min(currentTime, parseFloat(storedBestTime));
      }
    }

    return bestTime;
  },

  /**
   * Displays the personal best time and updates it if a new record was set
   * @param {number} currentTime - The current completion time/score
   * @param {string} type - Game type ("black" for hidden mode)
   * @param {HTMLElement} personalbest - Element to display personal best
   * @param {HTMLElement} newpersonalbest - Element to show for new records
   */
  displayPersonalBestTime: function(currentTime, type, personalbest, newpersonalbest) {
    // Get unique identifier for this game configuration
    const mazeIdentifier = this.generateMazeIdentifier(type);
    
    // Retrieve stored personal best from localStorage
    const storedBestTime = localStorage.getItem(mazeIdentifier);
    let bestTimeDisplay = "";

    // Format display text based on game mode
    if (multiple === "true") {
      // Multiple goals mode: display number of goals
      if (!isNaN(storedBestTime)) {
        bestTimeDisplay = storedBestTime;
      } else {
        bestTimeDisplay = "--"; // No previous record
      }
    } else {
      // Single goal mode: display formatted time
      if (storedBestTime && !isNaN(storedBestTime)) {
        const bestTime = parseFloat(storedBestTime);
        bestTimeDisplay = GameTimer.formatTime(bestTime);
      } else {
        bestTimeDisplay = "--:--"; // No previous record
      }
    }

    // Update personal best display
    personalbest.textContent = "Personal Best: " + bestTimeDisplay;

    // Check if this is a new personal best and update accordingly
    if (multiple === "true") {
      // Multiple goals mode: higher score is better
      if (!storedBestTime || currentTime > parseFloat(storedBestTime)) {
        // New high score achieved
        newpersonalbest.style.display = "block";
        localStorage.setItem(mazeIdentifier, currentTime.toString());
      } else {
        // No new record
        newpersonalbest.style.display = "none";
      }
    } else {
      // Single goal mode: lower time is better
      if (!storedBestTime || currentTime < parseFloat(storedBestTime)) {
        // New best time achieved
        newpersonalbest.style.display = "block";
        localStorage.setItem(mazeIdentifier, currentTime.toString());
      } else {
        // No new record
        newpersonalbest.style.display = "none";
      }
    }
  },

  /**
   * Gets the stored personal best for the current game configuration
   * @param {string} type - Game type ("black" for hidden mode)
   * @returns {number|null} The stored personal best, or null if none exists
   */
  getStoredBest: function(type) {
    const mazeIdentifier = this.generateMazeIdentifier(type);
    const storedBest = localStorage.getItem(mazeIdentifier);
    
    return storedBest ? parseFloat(storedBest) : null;
  },

  /**
   * Manually sets a personal best time (useful for testing or data migration)
   * @param {string} type - Game type ("black" for hidden mode)
   * @param {number} time - The time to set as personal best
   */
  setBest: function(type, time) {
    const mazeIdentifier = this.generateMazeIdentifier(type);
    localStorage.setItem(mazeIdentifier, time.toString());
  },

  /**
   * Clears the personal best for the current game configuration
   * @param {string} type - Game type ("black" for hidden mode)
   */
  clearBest: function(type) {
    const mazeIdentifier = this.generateMazeIdentifier(type);
    localStorage.removeItem(mazeIdentifier);
  },

  /**
   * Clears all personal best records
   */
  clearAllBests: function() {
    // List of all possible maze identifiers
    const identifiers = [
      'sm', 'bsm', 'mm', 'bmm', 'bm', 'bbm',        // Hard mode
      'esm', 'besm', 'emm', 'bemm', 'ebm', 'bebm',  // Easy mode
      'smm', 'bsmm', 'mmm', 'bmmm', 'bmm', 'bbmm',  // Hard mode multiple goals
      'esmm', 'besmm', 'emmm', 'bemmm', 'ebmm', 'bebmm' // Easy mode multiple goals
    ];
    
    // Remove each identifier from localStorage
    identifiers.forEach(id => {
      localStorage.removeItem(id);
    });
  }
};

// Make PersonalBestManager globally available
window.PersonalBestManager = PersonalBestManager;
