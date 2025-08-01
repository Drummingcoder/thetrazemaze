/**
 * Game Actions Module
 * Handles game control actions like restart, navigation, and sharing
 *
 * ---
 * GameActions.js Function Reference
 * ---
 * 1. showOverlay: Show loading overlay and fade it out
 * 2. goBack: Navigates back to the level selection screen
 * 3. hideEndScreen: Hides the end screen to allow continued play
 * 4. copyToClipboard: Copies the current level and time to clipboard (modern API)
 * 5. endGame: Ends the current game session and shows results
 */

console.log('Game Actions module loaded');

const GameActions = {

  /**
   * Show loading overlay and fade it out
   */
  showOverlay: function() {
    var loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      setTimeout(function() {
        loadingOverlay.style.opacity = '0';
        setTimeout(function() {
          loadingOverlay.style.display = 'none';
        }, 400);
      }, 750);
    }
  },

  /**
   * Navigates back to the level selection screen
   */
  goBack: function() {
    // Show the level select screen to see updated best times
    if (typeof window.showLevelSelect === 'function') {
      window.showLevelSelect();
    } else if (typeof window.showStartScreen === 'function') {
      window.showStartScreen();
    } else {
      // Fallback to redirect if function not available
      window.location.href = "index.html";
    }
  },

  /**
   * Hides the end screen to allow continued play (if applicable)
   */
  hideEndScreen: function() {
    if (window.endScreen) {
      window.endScreen.classList.add("hidden");
    }
  },

  /**
   * Modern clipboard API implementation (for future use)
   * @returns {Promise} Promise that resolves when copy is complete
   */
  copyToClipboard: function() {
    const level = window.selectedLevel || 1;
    const timeTaken = window.GameTimer.getTime();

    // Create sharing text
    const textToCopy = "The Traze Maze\n" + 
                      "Level:\n" + level + "\n\n" + timeTaken + "\n" + 
                      "Try The Traze Maze here: drummingcoder.github.io/thetrazemaze\n\n";

    // Use modern Clipboard API if available
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          alert("Maze and time have been copied to the clipboard!");
        })
        .catch(err => {
          alert("Failed to copy to clipboard: " + err);
        });
    } else {
      // Fallback to legacy method
      const tempTextArea = document.createElement("textarea");
      tempTextArea.value = textToCopy;
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      document.execCommand("copy");
      document.body.removeChild(tempTextArea);
      alert("Maze and time have been copied to the clipboard!");
    }
  },

  /**
   * Ends the current game session
   * Stops timer, shows end screen, and handles cleanup
   * @param {HTMLElement} endScreen - The end screen element
   * @param {Date} startTime - When the game started
   * @param {HTMLElement} endContent - Element to show completion info
   * @param {HTMLElement} personalbest - Personal best display element
   * @param {HTMLElement} newpersonalbest - New record notification element
   * @param {boolean} interval - Whether timer is running
   */
  endGame: function(endScreen, startTime, endContent, personalbest, newpersonalbest, interval) {
    // Stop the game timer
    GameTimer.stopTimer();
    
    // Calculate final time
    const endTime = new Date();
    const timeTaken = endTime - startTime;
    const formattedTime = GameTimer.formatTime(timeTaken);

    // Show completion information
    setTimeout(() => {
      // Set time in the dedicated time element, not the h2 title
      const timeElement = document.getElementById('end-time-taken');
      if (timeElement) {
        timeElement.textContent = "Time taken: " + formattedTime;
      }
      
      // Handle personal best tracking (now level-aware)
      PersonalBestManager.displayPersonalBestTime(timeTaken, personalbest, newpersonalbest);
      
      // Update level selector display if we're in level mode
      if (window.PersonalBestManager && window.selectedLevel) {
        window.PersonalBestManager.updateLevelDisplay(window.selectedLevel);
      }
      
      // Show end screen
      endScreen.classList.remove("hidden");
      
      // Stop background music
      AudioManager.pauseMusic();
    }, 200);
  }
};

// Make GameActions globally available
window.GameActions = GameActions;