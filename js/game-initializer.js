/**
 * Game Initializer Module
 * Handles game setup, cleanup, and state management
 */

console.log('Game Initializer module loaded');

const GameInitializer = {
  
  /**
   * Comprehensive cleanup function to prevent memory leaks and accumulation
   */
  cleanupGameSystems: function() {
    // Stop smooth movement
    if (window.PlayerController) {
      window.PlayerController.cleanupMovementSystems();
    }
    
    // Clear any audio check intervals
    if (audioCheckInterval) {
      clearInterval(audioCheckInterval);
      audioCheckInterval = null;
    }
    
    // Reset render state
    if (window.CanvasRenderer) {
      window.CanvasRenderer.renderPending = false;
      window.CanvasRenderer.renderQueued = false;
    }
    
    // Reset camera state
    if (window.CameraSystem) {
      window.CameraSystem.cameraUpdatePending = false;
    }
    
    console.log('Game systems cleaned up');
  },

  /**
   * Initialize the complete game system
   */
  initializeGame: function() {
    // FORCE RESET all state variables
    if (window.PlayerController) {
      window.PlayerController.playerIsMoving = false;
    }
    
    // FORCE RESET player position to starting position
    window.playerX = window.startCol * window.cellSize;
    window.playerY = window.startRow * window.cellSize;
    
    // Force a complete camera reset first
    if (window.CameraSystem) {
      window.CameraSystem.resetCamera();
    }
    
    // Force initial render to ensure maze is visible
    if (window.CanvasRenderer) {
      window.CanvasRenderer.renderFrame();
      window.CanvasRenderer.prepareAnimationSystem();
    }
    
    // Initialize new camera system after reset
    setTimeout(() => {
      if (window.CameraSystem) {
        window.CameraSystem.initializeNewCamera();
      }
      // Force another render to ensure everything is visible
      if (window.CanvasRenderer) {
        window.CanvasRenderer.renderFrame();
      }
      
      // Start lazy audio loading AFTER maze is fully initialized
      setTimeout(() => {
        this.preloadAudioAsync();
      }, 100); // Additional delay to ensure smooth maze startup
    }, 50); // Small delay to ensure reset is complete
  },

  /**
   * Handle window resize to recalculate maze size
   */
  resizeMaze: function() {
    // Recalculate the maximum possible cell size to fill the screen
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight;
    
    // Calculate cell size based on screen dimensions and maze size
    const maxCellSizeWidth = Math.floor(availableWidth / mazeSize);
    const maxCellSizeHeight = Math.floor(availableHeight / mazeSize);
    
    // Use the smaller of the two to ensure the maze fits in both dimensions
    cellSize = Math.min(maxCellSizeWidth, maxCellSizeHeight);
    
    // Ensure minimum cell size for playability
    if (cellSize < 3) {
      cellSize = 3;
    }
    
    // Calculate actual maze dimensions in pixels
    const mazeWidthPx = mazeSize * cellSize;
    const mazeHeightPx = mazeSize * cellSize;
    
    // Update canvas size
    canvas.width = mazeWidthPx;
    canvas.height = mazeHeightPx;
    
    // Update container size
    mazeContainer.style.width = mazeWidthPx + 'px';
    mazeContainer.style.height = mazeHeightPx + 'px';
    
    // Update player position to match new cell size
    const currentCol = Math.round(playerX / (canvas.width / mazeSize));
    const currentRow = Math.round(playerY / (canvas.height / mazeSize));
    playerX = currentCol * cellSize;
    playerY = currentRow * cellSize;
    
    // Re-calculate zoom and camera position for new dimensions
    if (window.CameraSystem && window.CameraSystem.cameraEnabled) {
      // Recalculate zoom scale for new screen size
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const smallerDimension = Math.min(viewportWidth, viewportHeight);
      const targetCellsVisible = 12;
      window.CameraSystem.currentZoom = Math.max(1.5, Math.min(4.0, smallerDimension / (targetCellsVisible * cellSize)));
      
      // Re-center camera on player
      window.CameraSystem.centerOnPlayer();
    }
    
    // Re-render the maze
    if (window.CanvasRenderer) {
      window.CanvasRenderer.renderFrame();
    }
  },

  /**
   * Create virtual player object for library compatibility
   */
  createVirtualPlayer: function() {
    return {
      style: {
        get top() { 
          return playerY + "px"; 
        },
        set top(value) { 
          const newY = parseInt(value);
          playerY = newY;
          // Don't trigger camera/render immediately - let movement system batch updates
        },
        get left() { 
          return playerX + "px"; 
        },
        set left(value) { 
          const newX = parseInt(value);
          playerX = newX;
          // Don't trigger camera/render immediately - let movement system batch updates
        }
      }
    };
  },

  /**
   * Placeholder for audio preloading (if needed)
   */
  preloadAudioAsync: function() {
    // Start audio loading after page is fully loaded and maze is initialized
    setTimeout(() => {
      if (typeof audioPreloaded !== 'undefined' && !audioPreloaded && typeof audioLoadingInProgress !== 'undefined' && !audioLoadingInProgress) {
        // Audio loading logic would go here
        console.log('Audio preloading started');
      }
    }, 200); // Ensure maze has time to fully initialize
  },

  /**
   * Setup event listeners for game controls
   */
  setupEventListeners: function() {
    // Prevent duplicate event listeners
    const restartButton = document.getElementById("restart-button");
    const backButton = document.getElementById("back-button");
    const copyButton = document.getElementById("copy-button");

    if (restartButton && !restartButton.hasAttribute('data-initialized')) {
      restartButton.addEventListener("click", function() {
        GameInitializer.cleanupGameSystems();
        if (window.CameraSystem) {
          window.CameraSystem.resetCamera();
        }
        myLibrary.restartMaze();
      });
      restartButton.setAttribute('data-initialized', 'true');
    }
    
    if (backButton && !backButton.hasAttribute('data-initialized')) {
      backButton.addEventListener("click", myLibrary.goBack);
      backButton.style.display = "inline-block";
      backButton.addEventListener("click", myLibrary.hideEndScreen);
      backButton.setAttribute('data-initialized', 'true');
    }
    
    // Set the appropriate copy function based on mode (prevent duplicates)
    if (copyButton && !copyButton.hasAttribute('data-initialized')) {
      if (typeof easy !== 'undefined' && easy) {
        copyButton.addEventListener("click", myLibrary.copyEasyMazeAndTime);
      } else {
        copyButton.addEventListener("click", myLibrary.copyMazeAndTime);
      }
      copyButton.setAttribute('data-initialized', 'true');
    }

    // Add resize event listener with debouncing (prevent duplicates)
    let resizeTimeout;
    if (!window.resizeHandlerInitialized) {
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => this.resizeMaze(), 100);
      });
      // Mark as initialized
      window.resizeHandlerInitialized = true;
    }
  }
};

// Make GameInitializer available globally
window.GameInitializer = GameInitializer;