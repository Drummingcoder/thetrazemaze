/**
 * Main Library Module
 * Provides backwards compatibility with the original newlibrary.js interface
 * Acts as a facade that delegates to the specialized modules
 */

console.log('Main Library compatibility layer loaded');

// Create the main library object that maintains the original API
var myLibrary = {
  // Timer properties (delegated to GameTimer)
  get timeElapsed() { return GameTimer.timeElapsed; },
  set timeElapsed(value) { GameTimer.timeElapsed = value; },
  
  get interval() { return GameTimer.interval; },
  set interval(value) { GameTimer.interval = value; },

  // Audio properties (delegated to AudioManager)
  get preloadedAudio() { return AudioManager.preloadedAudio; },
  set preloadedAudio(value) { AudioManager.preloadedAudio = value; },

  // === AUDIO METHODS ===
  /**
   * Preloads audio for the game
   * @see AudioManager.preloadAudio
   */
  preloadAudio: function() {
    return AudioManager.preloadAudio();
  },

  /**
   * Plays the background music
   * @see AudioManager.playMusic
   */
  playMusic: function() {
    return AudioManager.playMusic();
  },

  // === MAZE GENERATION METHODS ===
  /**
   * Generates start and end positions for the maze
   * @see MazeGenerator.generateStartAndEndPositions
   */
  generateStartAndEndPositions: function() {
    return MazeGenerator.generateStartAndEndPositions();
  },

  /**
   * Generates a random maze structure
   * @see MazeGenerator.generateRandomMaze
   */
  generateRandomMaze: function() {
    return MazeGenerator.generateRandomMaze();
  },

  /**
   * Generates a maze with clear pathways (normal difficulty)
   * @see MazeGenerator.generateClearPath
   */
  generateClearPath: function() {
    return MazeGenerator.generateClearPath();
  },

  // === MAZE RENDERING METHODS ===
  /**
   * Creates the maze visual representation
   * @see MazeRenderer.createMaze
   */
  createMaze: function() {
    return MazeRenderer.createMaze();
  },

  /**
   * Creates a preview image of the maze
   * @see MazeRenderer.createMazePreview
   */
  createMazePreview: function() {
    return MazeRenderer.createMazePreview();
  },

  /**
   * Initializes viewport-based rendering
   * @see MazeRenderer.initializeViewportRendering
   */
  initializeViewportRendering: function() {
    return MazeRenderer.initializeViewportRendering();
  },

  /**
   * Updates the viewport based on player position
   * @see MazeRenderer.updateViewport
   */
  updateViewport: function(playerRow, playerCol, forceUpdate = false) {
    return MazeRenderer.updateViewport(playerRow, playerCol, forceUpdate);
  },

  /**
   * Creates a single maze cell element
   * @see MazeRenderer.createMazeCell
   */
  createMazeCell: function(i, j) {
    return MazeRenderer.createMazeCell(i, j);
  },

  /**
   * Helper function to create wide pathways
   * @see MazeGenerator.carveWideCorridor (adapted for legacy API)
   */
  createWidePathway: function(centerRow, centerCol) {
    // Create 3x3 open area around the center point
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const row = centerRow + i;
        const col = centerCol + j;
        if (row >= 0 && row < mazeSize && col >= 0 && col < mazeSize) {
          mazeStructure[row][col] = 0;
        }
      }
    }
  },

  /**
   * Helper function to create wide corridors between points
   * @param {number} startRow - Starting row
   * @param {number} startCol - Starting column
   * @param {number} endRow - Ending row
   * @param {number} endCol - Ending column
   */
  createWideCorridor: function(startRow, startCol, endRow, endCol) {
    const deltaRow = endRow - startRow;
    const deltaCol = endCol - startCol;
    
    // Create horizontal corridor
    if (deltaCol !== 0) {
      const direction = deltaCol > 0 ? 1 : -1;
      for (let col = startCol; col !== endCol + direction; col += direction) {
        for (let i = -1; i <= 1; i++) {
          const row = startRow + i;
          if (row >= 0 && row < mazeSize && col >= 0 && col < mazeSize) {
            mazeStructure[row][col] = 0;
          }
        }
      }
    }
    
    // Create vertical corridor
    if (deltaRow !== 0) {
      const direction = deltaRow > 0 ? 1 : -1;
      for (let row = startRow; row !== endRow + direction; row += direction) {
        for (let j = -1; j <= 1; j++) {
          const col = startCol + j;
          if (row >= 0 && row < mazeSize && col >= 0 && col < mazeSize) {
            mazeStructure[row][col] = 0;
          }
        }
      }
    }
  },

  // === PLAYER CONTROL METHODS ===
  /**
   * Handles player movement
   * @see PlayerController.movePlayer
   */
  movePlayer: function(event, endScreen, startTime, endContent, type, personalbest, newpersonalbest, interval) {
    return PlayerController.movePlayer(event, endScreen, startTime, endContent, type, personalbest, newpersonalbest, interval);
  },

  // === GAME ACTION METHODS ===
  /**
   * Restarts the maze game
   * @see GameActions.restartMaze
   */
  restartMaze: function() {
    return GameActions.restartMaze();
  },

  /**
   * Navigates back to main menu
   * @see GameActions.goBack
   */
  goBack: function() {
    return GameActions.goBack();
  },

  /**
   * Hides the end screen
   * @see GameActions.hideEndScreen
   */
  hideEndScreen: function() {
    return GameActions.hideEndScreen();
  },

  /**
   * Copies maze and time to clipboard
   * @see GameActions.copyMazeAndTime
   */
  copyMazeAndTime: function() {
    return GameActions.copyMazeAndTime();
  },

  /**
   * End game functionality
   * @see GameActions.endGame
   */
  endGame: function(endScreen, startTime, endContent, personalbest, newpersonalbest, interval) {
    return GameActions.endGame(endScreen, startTime, endContent, personalbest, newpersonalbest, interval);
  },

  // === TIMER METHODS ===
  /**
   * Starts the game timer
   * @see GameTimer.startTimer
   */
  startTimer: function(timer) {
    return GameTimer.startTimer(timer);
  },

  /**
   * Formats time for display
   * @see GameTimer.formatTime
   */
  formatTime: function(time) {
    return GameTimer.formatTime(time);
  },

  /**
   * Pads numbers with leading zeros
   * @see GameTimer.padTime
   */
  padTime: function(value, length = 2) {
    return GameTimer.padTime(value, length);
  },

  // === PERSONAL BEST METHODS ===
  /**
   * Calculates personal best time
   * @see PersonalBestManager.calculatePersonalBestTime
   */
  calculatePersonalBestTime: function(currentTime, type) {
    return PersonalBestManager.calculatePersonalBestTime(currentTime, type);
  },

  /**
   * Displays personal best time
   * @see PersonalBestManager.displayPersonalBestTime
   */
  displayPersonalBestTime: function(currentTime, type, personalbest, newpersonalbest) {
    return PersonalBestManager.displayPersonalBestTime(currentTime, type, personalbest, newpersonalbest);
  },

  // === RENDERING CACHE METHODS ===
  /**
   * Invalidates canvas maze cache
   * @see MazeRenderer.invalidateCache
   */
  invalidateCanvasMazeCache: function() {
    return MazeRenderer.invalidateCache();
  },

  /**
   * Forces re-render of the maze
   * @see MazeRenderer.forceRerenderMaze
   */
  forceRerenderMaze: function() {
    return MazeRenderer.forceRerenderMaze();
  }
};

// Make the main library globally available for backwards compatibility
window.myLibrary = myLibrary;
