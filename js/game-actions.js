/**
 * Game Actions Module
 * Handles game control actions like restart, navigation, and sharing
 */

console.log('Game Actions module loaded');

const GameActions = {

  /**
   * Show loading overlay and fade it out after a delay
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
    const endScreen = document.getElementById("end-screen");
    if (endScreen) {
      endScreen.classList.add("hidden");
    }
  },

  /**
   * Copies the maze structure and completion time to clipboard
   * Creates a shareable text representation of the maze and results
   */
  copyMazeAndTime: function() {
    // Convert maze structure to emoji representation
    const mazeString = JSON.stringify(mazeStructure)
      .replace(/1/g, "⬛️")    // Replace walls (1) with black squares
      .replace(/0/g, "⬜️")    // Replace paths (0) with white squares
      .replace(/],\[/g, "\n") // Replace array separators with newlines
      .replace(/\[|\]|,/g, ""); // Remove JSON formatting characters

    // Get the completion time from the end screen
    const timeTaken = document.getElementById("end-time-taken").textContent;

    // Create sharing text
    const textToCopy = "The Traze Maze Challenge\n" + 
                      "Maze:\n" + mazeString + "\n\n" + timeTaken + "\n" + 
                      "Try The Traze Maze here: drummingcoder.github.io";

    // Copy to clipboard using temporary textarea method
    this.copyToClipboard(textToCopy);
    
    // Show confirmation to user
    alert("Maze and time have been copied to the clipboard!");
  },

  /**
   * Utility function to copy text to clipboard
   * Uses the legacy document.execCommand method for broad browser support
   * @param {string} text - The text to copy to clipboard
   */
  copyToClipboard: function(text) {
    // Create temporary textarea element
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = text;
    
    // Add to DOM temporarily
    document.body.appendChild(tempTextArea);
    
    // Select the text
    tempTextArea.select();
    
    // Copy to clipboard using legacy method
    document.execCommand("copy");
    
    // Remove temporary element
    document.body.removeChild(tempTextArea);
  },

  /**
   * Modern clipboard API implementation (for future use)
   * @param {string} text - The text to copy to clipboard
   * @returns {Promise} Promise that resolves when copy is complete
   */
  copyToClipboardModern: function(text) {
    // Check if modern Clipboard API is available
    if (navigator.clipboard && window.isSecureContext) {
      // Use modern Clipboard API
      return navigator.clipboard.writeText(text);
    } else {
      // Fall back to legacy method
      return new Promise((resolve, reject) => {
        try {
          this.copyToClipboard(text);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
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
      
      // Keep the h2 title as "Congratulations!" - don't overwrite it
      // endContent should remain "Congratulations!" from initialization
      
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
