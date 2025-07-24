/**
 * EventHandler Module
 * Manages all keyboard and window event handling for the maze game
 */

const EventHandler = {
  // State for first movement tracking
  firstMovement: 0,
  audioCheckInterval: null,

  /**
   * Sets up all event listeners for the game
   */
  setupEventListeners: function() {
    console.log('EventHandler: Setting up game event listeners');
    
    // Set up keyboard event listeners
    this.setupKeyboardEvents();
    
    // Set up window event listeners
    this.setupWindowEvents();
    
    console.log('EventHandler: All event listeners registered');
  },

  /**
   * Sets up keyboard event listeners
   */
  setupKeyboardEvents: function() {
    // Keydown event handler
    window.addEventListener("keydown", (event) => {
      this.handleKeyDown(event);
    });

    // Keyup event handler
    window.addEventListener("keyup", (event) => {
      this.handleKeyUp(event);
    });
  },

  /**
   * Sets up window event listeners
   */
  setupWindowEvents: function() {
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.handlePageUnload();
    });
  },

  /**
   * Handles keydown events
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyDown: function(event) {
    // Prevent movement if end screen is visible
    if (window.endScreen && !window.endScreen.classList.contains("hidden")) {
      return;
    }
    
    // Handle debug key
    if (event.key === "y" || event.key === "Y") {
      this.handleDebugKey();
      return;
    }
    
    // Handle dash key separately
    if (event.key === "Shift" || event.key === " ") {
      event.preventDefault();
      this.handleDashKey();
      return;
    }
    
    // Handle movement keys
    if (this.isMovementKey(event.key)) {
      event.preventDefault();
      this.handleMovementKey(event.key);
    }
  },

  /**
   * Handles keyup events
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyUp: function(event) {
    if (this.isMovementKey(event.key)) {
      // Handle key release through PlayerController
      if (window.PlayerController) {
        window.PlayerController.handleKeyUp(event.key);
      }
    }
  },

  /**
   * Checks if a key is a movement key
   * @param {string} key - The key pressed
   * @returns {boolean} True if it's a movement key
   */
  isMovementKey: function(key) {
    return key.includes("Arrow") || 
           key === "w" || key === "a" || key === "s" || key === "d";
  },

  /**
   * Handles debug key press (Y)
   */
  handleDebugKey: function() {
    // Calculate player's grid position for debugging
    const playerGridRow = Math.round(window.playerY / window.cellSize);
    const playerGridCol = Math.round(window.playerX / window.cellSize);
    const mazeCenter = Math.round(window.mazeSize / 2);
    const distanceFromCenter = Math.sqrt(
      Math.pow(playerGridRow - mazeCenter, 2) + 
      Math.pow(playerGridCol - mazeCenter, 2)
    );
    
    console.log(`Player Position: Row ${playerGridRow}, Col ${playerGridCol} ` +
               `(Pixel: ${window.playerX}, ${window.playerY}) ` +
               `(distance from center: ${distanceFromCenter.toFixed(2)})`);
  },

  /**
   * Handles dash key press (Shift or Space)
   */
  handleDashKey: function() {
    if (window.PlayerController) {
      window.PlayerController.handleDashKey();
    }
  },

  /**
   * Handles movement key press
   * @param {string} key - The movement key pressed
   */
  handleMovementKey: function(key) {
    // Start timer and music only once
    if (!window.interval) {
      this.startGameTimer();
    }
    
    if (this.firstMovement === 0) {
      this.startGameMusic();
      this.firstMovement++;
    }
    
    // Handle player movement
    this.handlePlayerMovement(key);
  },

  /**
   * Starts the game timer
   */
  startGameTimer: function() {
    window.interval = true;
    if (window.GameTimer) {
      console.log('Starting timer via GameTimer module...');
      const timerResult = window.GameTimer.startTimer(window.timerElement);
      if (timerResult && timerResult.startTime) {
        window.startTime = timerResult.startTime;
      }
    } else {
      console.warn('GameTimer module not available, using myLibrary fallback');
      const timerResult = window.myLibrary.startTimer(window.timerElement);
      if (timerResult && timerResult.startTime) {
        window.startTime = timerResult.startTime;
      }
    }
  },

  /**
   * Starts game music
   */
  startGameMusic: function() {
    // Smart music playback - play immediately if loaded, queue if still loading
    if (window.AudioManager && window.AudioManager.isAudioPreloaded() && !window.AudioManager.isMusicStarted()) {
      // Audio ready - start music immediately
      setTimeout(() => {
        this.playMusic();
      }, 0);
    } else if (window.AudioManager && !window.AudioManager.isMusicStarted() && !this.audioCheckInterval) {
      // Audio not ready - set up a check to start music when available
      console.log('Audio still loading, will start music when ready...');
      this.setupAudioCheck();
    }
  },

  /**
   * Plays music using available audio system
   */
  playMusic: function() {
    try {
      // Use AudioManager directly instead of myLibrary
      if (window.AudioManager) {
        window.AudioManager.playMusic();
        console.log('Music started successfully via AudioManager');
      } else {
        console.warn('AudioManager not available, trying myLibrary fallback');
        window.myLibrary.playMusic();
        window.musicStarted = true;
        console.log('Music started successfully via myLibrary');
      }
    } catch (error) {
      console.warn('Could not start music:', error);
    }
  },

  /**
   * Sets up audio check interval for delayed music start
   */
  setupAudioCheck: function() {
    this.audioCheckInterval = setInterval(() => {
      if (window.AudioManager && window.AudioManager.isAudioPreloaded() && !window.AudioManager.isMusicStarted()) {
        this.playMusic();
        clearInterval(this.audioCheckInterval);
        this.audioCheckInterval = null;
      }
    }, 250); // Check every 250ms
    
    // Safety timeout to prevent infinite checking (stop trying after 10 seconds)
    setTimeout(() => {
      if (window.AudioManager && !window.AudioManager.isMusicStarted() && this.audioCheckInterval) {
        console.warn('Audio loading timeout - continuing without music');
        clearInterval(this.audioCheckInterval);
        this.audioCheckInterval = null;
      }
    }, 10000);
  },

  /**
   * Handles player movement through PlayerController
   * @param {string} key - The movement key pressed
   */
  handlePlayerMovement: function(key) {
    if (window.PlayerController) {
      // Hide controls hint when user starts moving
      const controlsHint = document.getElementById('controls-hint');
      if (controlsHint && !controlsHint.classList.contains('hidden')) {
        controlsHint.classList.add('hidden');
      }
      
      // Start smooth movement system if not already running
      if (window.PlayerController.startSmoothMovement && !window.PlayerController.isMovementActive) {
        window.PlayerController.startSmoothMovement();
      }
      
      window.PlayerController.handleKeyDown(key);
    }
  },

  /**
   * Handles page unload cleanup
   */
  handlePageUnload: function() {
    if (window.GameInitializer && window.GameInitializer.cleanupGameSystems) {
      window.GameInitializer.cleanupGameSystems();
    }
    
    // Clear any intervals
    if (this.audioCheckInterval) {
      clearInterval(this.audioCheckInterval);
      this.audioCheckInterval = null;
    }
  }
};

// Make EventHandler globally available
window.EventHandler = EventHandler;
