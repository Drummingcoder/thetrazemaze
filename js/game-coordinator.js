/**
 * Game Coordinator Module
 * Handles high-level game setup, coordination between modules, and initialization sequencing
 */

console.log('Game Coordinator module loaded');

const GameCoordinator = {
  // Game state tracking
  gameInitialized: false,
  modulesLoaded: false,
  
  /**
   * Initialize the game in the correct sequence
   */
  initializeGame: function() {
    console.log('GameCoordinator: Starting game initialization...');
    
    try {
      // Step 1: Setup maze data
      let mazeData;
      if (window.MazeGenerator) {
        mazeData = window.MazeGenerator.setupPredefinedMaze();
        window.mazeWidth = mazeData.mazeWidth;
        window.mazeHeight = mazeData.mazeHeight;
        console.log('✅ Maze data setup complete');
      } else {
        console.error('❌ MazeGenerator module not loaded');
        return false;
      }
      // Step 2: Calculate optimal cell size
      const cellSize = this.calculateOptimalCellSize(mazeData.mazeWidth, mazeData.mazeHeight);
      window.cellSize = cellSize;
      // Step 3: Setup canvas rendering
      let canvasData;
      if (window.CanvasRenderer) {
        canvasData = window.CanvasRenderer.setupCanvas({width: mazeData.mazeWidth, height: mazeData.mazeHeight}, cellSize);
        console.log('✅ Canvas setup complete');
      } else {
        console.error('❌ CanvasRenderer module not loaded');
        return false;
      }
      
      // Step 4: Setup global variables for module access
      this.setupGlobalVariables(mazeData, canvasData);
      
      // Step 5: Initialize player position
      this.initializePlayerPosition(mazeData.startRow, mazeData.startCol, cellSize);
      
      // Step 6: Create virtual player for library compatibility
      this.createVirtualPlayer();
      
      // Step 7: Initialize game systems
      this.initializeGameSystems();
      
      // Step 8: Setup event listeners
      this.setupEventListeners();
      
      console.log('✅ Game initialization complete');
      this.gameInitialized = true;
      return true;
      
    } catch (error) {
      console.error('❌ Game initialization failed:', error);
      return false;
    }
  },
  
  /**
   * Calculate optimal cell size based on screen dimensions
   */
  calculateOptimalCellSize: function(mazeSize) {
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight;
    // Calculate cell size based on screen dimensions and maze dimensions
    const maxCellSizeWidth = Math.floor(availableWidth / (mazeSize.width || mazeSize));
    const maxCellSizeHeight = Math.floor(availableHeight / (mazeSize.height || mazeSize));
    // Use the smaller of the two to ensure the maze fits in both dimensions
    let cellSize = Math.min(maxCellSizeWidth, maxCellSizeHeight);
    // Ensure minimum cell size for playability
    if (cellSize < 3) {
      cellSize = 3; // Minimum viable cell size
    }
    console.log('Calculated cell size:', cellSize, 'for maze dimensions:', mazeSize);
    return cellSize;
  },
  
  /**
   * Setup global variables for module access
   */
  setupGlobalVariables: function(mazeData, canvasData) {
    // DOM element references
    const timerElement = document.getElementById("timer");
    const endScreen = document.getElementById("end-screen");
    const restartButton = document.getElementById("restart-button");
    const backButton = document.getElementById("back-button");
    const endContent = document.getElementById("end-time-taken");
    const personalbest = document.getElementById("personal-best");
    const newpersonalbest = document.getElementById("new-personal-best");
    
    // Make all variables global for module access
    window.maze = document.getElementById("maze-container");
    window.timerElement = timerElement;
    window.endScreen = endScreen;
    window.restartButton = restartButton;
    window.backButton = backButton;
    window.endContent = endContent;
    window.personalbest = personalbest;
    window.newpersonalbest = newpersonalbest;
    
    // Maze and game variables
    window.mazeStructure = mazeData.mazeStructure;
    window.startRow = mazeData.startRow;
    window.startCol = mazeData.startCol;
    window.endRow = mazeData.endRow;
    window.endCol = mazeData.endCol;
    
    // Game state variables
    window.time = 0;
    window.interval = false;
    window.startTime = null;
    window.first = 0;
    window.mazecount = 0;
    
    console.log('Global variables setup complete');
  },
  
  /**
   * Initialize player position
   */
  initializePlayerPosition: function(startRow, startCol, cellSize) {
    // FORCE RESET to prevent any persistence across reloads
    let playerX = 0, playerY = 0;
    
    if (typeof startCol !== 'undefined' && typeof startRow !== 'undefined') {
      playerX = startCol * cellSize;
      playerY = startRow * cellSize;
    } else {
      // Fallback values
      playerX = 2 * cellSize;
      playerY = 2 * cellSize;
    }
    
    // Update global player position
    window.playerX = playerX;
    window.playerY = playerY;
    
    console.log('Player position initialized:', { playerX, playerY, startRow, startCol });
  },
  
  /**
   * Create virtual player object for library compatibility
   */
  createVirtualPlayer: function() {
    const player = {
      style: {
        get top() { 
          return window.playerY + "px"; 
        },
        set top(value) { 
          const newY = parseInt(value);
          window.playerY = newY;
        },
        get left() { 
          return window.playerX + "px"; 
        },
        set left(value) { 
          const newX = parseInt(value);
          window.playerX = newX;
        }
      }
    };
    
    window.player = player;
    console.log('Virtual player created');
  },
  
  /**
   * Initialize game systems
   */
  initializeGameSystems: function() {
    // Initialize camera system
    if (window.CameraSystem) {
      window.CameraSystem.resetCamera();
    }
    
    // Start smooth movement system
    if (window.PlayerController && window.PlayerController.startSmoothMovement) {
      window.PlayerController.startSmoothMovement();
    }
    
    // Prepare animation system
    if (window.CanvasRenderer && window.CanvasRenderer.prepareAnimationSystem) {
      window.CanvasRenderer.prepareAnimationSystem();
    }
    
    // Initial render
    if (window.CanvasRenderer) {
      window.CanvasRenderer.renderFrame();
    }
    
    console.log('Game systems initialized');
  },
  
  /**
   * Setup event listeners
   */
  setupEventListeners: function() {
    // Setup resize handler
    window.addEventListener('resize', () => {
      if (window.GameInitializer && window.GameInitializer.resizeMaze) {
        window.GameInitializer.resizeMaze();
      }
    });
    
    // Setup cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (window.GameInitializer && window.GameInitializer.cleanupGameSystems) {
        window.GameInitializer.cleanupGameSystems();
      }
      if (window.PlayerController && window.PlayerController.cleanupMovementSystems) {
        window.PlayerController.cleanupMovementSystems();
      }
    });
    
    console.log('Event listeners setup complete');
  },
  
  /**
   * Start audio loading after game is fully initialized
   */
  startAudioLoading: function() {
    setTimeout(() => {
      console.log('Checking audio loading conditions...');
      console.log('AudioManager available:', !!window.AudioManager);
      
      if (window.AudioManager && !window.AudioManager.audioPreloaded && !window.AudioManager.audioLoadingInProgress) {
        console.log('Starting audio preload via AudioManager...');
        window.AudioManager.preloadAudioAsync();
      } else {
        console.log('Audio loading conditions not met - skipping preload');
      }
    }, 200); // Ensure maze has time to fully initialize
  },
  
  /**
   * Hide controls hint after a delay
   */
  hideControlsHint: function() {
    setTimeout(() => {
      const controlsHint = document.getElementById('controls-hint');
      if (controlsHint && !controlsHint.classList.contains('hidden')) {
        controlsHint.classList.add('hidden');
      }
    }, 5000);
  }
};

// Make GameCoordinator globally available
window.GameCoordinator = GameCoordinator;
