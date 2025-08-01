/**
 * Game Timer Module
 * Handles timing functionality for the maze game
 */
/**
 * Function Reference (GameTimer)
 * 1. startTimer(timer) - Start the game timer and update display
 * 2. stopTimer() - Stop the current timer
 * 3. resetTimer() - Reset the timer to zero
 * 4. formatTime(time) - Format milliseconds to MM:SS.mmm
 * 5. padTime(value, length=2) - Pad a number with leading zeros
 * 6. getTime() - Get the current elapsed time formatted as a string
 */

console.log('Game Timer module loaded');

const GameTimer = {
  timeElapsed: 0,    // Total time elapsed in milliseconds
  interval: 0,       // Interval ID

  /**
   * Starts the game timer and updates the display
   * @param {HTMLElement} timer - The timer display element
   * @returns {Object} Object containing startTime and interval ID
   */
  startTimer: function(timer) {
    // Record the game start time
    const startTime = new Date();
    
    // Set up interval to update timer display every 10ms for smooth updates
    this.interval = setInterval(() => {
      const currentTime = new Date();
      
      // Calculate elapsed time in milliseconds
      this.timeElapsed = currentTime - startTime;
      
      // Update the timer display with formatted time
      timer.textContent = this.formatTime(this.timeElapsed);
    }, 10);

    // Return both start time and interval for external use
    return { startTime, interval: this.interval };
  },

  /**
   * Stops the current timer
   */
  stopTimer: function() {
    if (this.interval) {
      window.clearInterval(this.interval);
      this.interval = 0;
    }
  },

  /**
   * Resets the timer to zero
   */
  resetTimer: function() {
    this.stopTimer();
    this.timeElapsed = 0;
  },

  /**
   * Formats time in milliseconds to MM:SS.mmm format
   * @param {number} time - Time in milliseconds
   * @returns {string} Formatted time string (e.g., "01:23.456")
   */
  formatTime: function(time) {
    // Extract minutes, seconds, and milliseconds from total time
    const minutes = Math.floor(time / 60000);           // 60000ms = 1 minute
    const seconds = Math.floor((time % 60000) / 1000);  // Remaining seconds
    const milliseconds = time % 1000;                   // Remaining milliseconds
    
    // Format with leading zeros: MM:SS.mmm
    return `${this.padTime(minutes)}:${this.padTime(seconds)}.${this.padTime(milliseconds, 3)}`;
  },

  /**
   * Pads a number with leading zeros to specified length
   * @param {number} value - The number to pad
   * @param {number} length - Desired string length (default: 2)
   * @returns {string} Padded string
   */
  padTime: function(value, length = 2) {
    return value.toString().padStart(length, "0");
  },

  /**
   * Gets the current elapsed time formatted as a string
   * @returns {string} Formatted elapsed time
   */
  getTime: function() {
    return this.formatTime(this.timeElapsed);
  }
};

// Make GameTimer globally available
window.GameTimer = GameTimer;
