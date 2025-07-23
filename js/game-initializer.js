/**
 * Game Initializer Module
 * Handles game setup, cleanup, and state management
 */

console.log('Game Initializer module loaded');

const GameInitializer = {
  
  /**
   * Complete game restart function - equivalent to page reload
   * Resets all game state and reinitializes everything from scratch
   */
  restartGameFromScratch: function() {
    console.log('GameInitializer: Starting complete game restart...');
    
    // Step 1: Stop all running systems
    this.stopAllSystems();
    
    // Step 2: Reset all game state variables
    this.resetGameState();
    
    // Step 3: Reset player position and state
    this.resetPlayerState();
    
    // Step 4: Reset UI elements
    this.resetUIElements();
    
    // Step 5: Reset modules
    this.resetModules();
    
    // Step 6: Reinitialize the complete game
    this.initializeGame();
    
    console.log('GameInitializer: Complete game restart finished');
  },

  /**
   * Restart for new level - similar to restartGameFromScratch but optimized for level switching
   */
  restartForNewLevel: function() {
    console.log('GameInitializer: Starting restart for new level...');
    
    // Step 1: Stop all running systems
    this.stopAllSystems();
    
    // Step 2: Reset all game state variables (including timer)
    this.resetGameState();
    
    // Step 3: Reset player position and state (will be updated after maze data loads)
    this.resetPlayerState();
    
    // Step 4: Reset UI elements completely
    this.resetUIElements();
    
    // Step 5: Reset modules
    this.resetModules();
    
    // Step 6: Clear canvases to prepare for new maze
    this.clearCanvases();
    
    console.log('GameInitializer: Restart for new level complete');
  },

  /**
   * Clear all canvases
   */
  clearCanvases: function() {
    console.log('GameInitializer: Clearing canvases...');
    
    if (window.canvas && window.ctx) {
      window.ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
    }
    
    if (window.playerCanvas && window.playerCtx) {
      window.playerCtx.clearRect(0, 0, window.playerCanvas.width, window.playerCanvas.height);
    }
  },

  /**
   * Stop all running systems and intervals
   */
  stopAllSystems: function() {
    console.log('GameInitializer: Stopping all systems...');
    
    // Stop PlayerController systems
    if (window.PlayerController && window.PlayerController.cleanupMovementSystems) {
      window.PlayerController.cleanupMovementSystems();
    }
    
    // Stop timer systems
    if (window.GameTimer && window.GameTimer.stopTimer) {
      window.GameTimer.stopTimer();
    }
    
    // Stop audio systems
    /* DISABLED: Audio systems commented out for performance
    if (window.AudioManager) {
      if (window.AudioManager.stopMusic) {
        window.AudioManager.stopMusic();
      }
      if (window.AudioManager.audioCheckInterval) {
        clearInterval(window.AudioManager.audioCheckInterval);
        window.AudioManager.audioCheckInterval = null;
      }
    }
    */
    
    // Stop EventHandler intervals
    /* DISABLED: Audio-related intervals commented out for performance
    if (window.EventHandler && window.EventHandler.audioCheckInterval) {
      clearInterval(window.EventHandler.audioCheckInterval);
      window.EventHandler.audioCheckInterval = null;
    }
    */
    
    // Clear any global intervals
    if (window.interval) {
      window.interval = false;
    }
  },

  /**
   * Reset all game state variables to initial values
   */
  resetGameState: function() {
    console.log('GameInitializer: Resetting game state...');
    
    // Reset timing variables
    window.time = 0;
    window.interval = false;
    window.startTime = null;
    window.first = 0;
    
    // Reset movement variables
    if (window.PlayerController) {
      window.PlayerController.playerIsMoving = false;
      if (window.PlayerController.smoothMovementKeys) {
        window.PlayerController.smoothMovementKeys = {};
      }
    }
    
    // Reset audio state through AudioManager
    /* DISABLED: Audio state reset commented out for performance
    if (window.AudioManager) {
      window.AudioManager.musicStarted = false;
      // Don't reset audioPreloaded - keep loaded audio
    }
    */
    
    // Reset EventHandler state
    if (window.EventHandler) {
      window.EventHandler.firstMovement = 0;
    }
  },

  /**
   * Reset player position and state to starting values
   */
  resetPlayerState: function() {
    console.log('GameInitializer: Resetting player state...');
    
    // FORCE RESET player position to starting position
    window.playerX = window.startCol * window.cellSize;
    window.playerY = window.startRow * window.cellSize;
    
    // Update virtual player object if it exists
    if (window.player && window.player.style) {
      window.player.style.left = window.playerX + "px";
      window.player.style.top = window.playerY + "px";
    }
    
    // Reset player movement state in PlayerController
    if (window.PlayerController) {
      if (window.PlayerController.resetPlayerState) {
        window.PlayerController.resetPlayerState();
      }
    }
  },

  /**
   * Reset UI elements to initial state
   */
  resetUIElements: function() {
    console.log('GameInitializer: Resetting UI elements...');
    
    // Reset timer display
    if (window.timerElement) {
      window.timerElement.textContent = '00:00.000';
    }
    
    // Reset GameTimer completely
    if (window.GameTimer && window.GameTimer.resetTimer) {
      window.GameTimer.resetTimer();
    }
    
    // Hide end screen
    if (window.endScreen) {
      window.endScreen.classList.add('hidden');
    }
    
    // Reset end screen content back to default "Congratulations!"
    if (window.endText) {
      window.endText.textContent = 'Congratulations!';
    }
    
    // Reset personal best display
    const personalBestElem = document.getElementById('personal-best');
    const newPersonalBestElem = document.getElementById('new-personal-best');
    if (personalBestElem) personalBestElem.style.display = '';
    if (newPersonalBestElem) newPersonalBestElem.style.display = 'none';
    
    // Reset heart system
    window.playerHearts = 3;
    window.playerInvincible = false;
    if (window.playerInvincibleTimeout) {
      clearInterval(window.playerInvincibleTimeout);
      window.playerInvincibleTimeout = null;
    }
    
    // Update heart overlay and ensure it's visible
    if (typeof updateHeartOverlay === 'function') {
      updateHeartOverlay();
    }
    if (typeof setHeartOverlayVisible === 'function') {
      setHeartOverlayVisible(true);
    }
    
    // Show controls hint
    const controlsHint = document.getElementById('controls-hint');
    if (controlsHint) {
      controlsHint.classList.remove('hidden');
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (controlsHint && !controlsHint.classList.contains('hidden')) {
          controlsHint.classList.add('hidden');
        }
      }, 5000);
    }
    
    // Reset dash indicator completely
    const dashIndicator = document.getElementById('dash-indicator');
    if (dashIndicator) {
      dashIndicator.textContent = 'Dash Ready';
      dashIndicator.classList.remove('cooldown');
      // Reset any PlayerController dash state
      if (window.PlayerController) {
        window.PlayerController.dashCooldownTimer = 0;
      }
    }
    
    // Reset ground pound indicator completely
    const groundPoundIndicator = document.getElementById('ground-pound-indicator');
    if (groundPoundIndicator) {
      groundPoundIndicator.textContent = 'Ground Pound Ready';
      groundPoundIndicator.classList.remove('cooldown', 'active', 'disabled');
      // Reset any PlayerController ground pound state
      if (window.PlayerController) {
        window.PlayerController.groundPoundCooldownTimer = 0;
        window.PlayerController.isGroundPounding = false;
      }
    }
    
    // Reset jump charge indicator
    const jumpChargeIndicator = document.getElementById('jump-charge-indicator');
    if (jumpChargeIndicator) {
      jumpChargeIndicator.classList.remove('visible');
      jumpChargeIndicator.style.opacity = '0';
      // Reset any PlayerController jump state
      if (window.PlayerController) {
        window.PlayerController.jumpCharging = false;
      }
    }
  },

  /**
   * Reset all modules to initial state
   */
  resetModules: function() {
    console.log('GameInitializer: Resetting modules...');
    
    // Reset camera system
    if (window.CameraSystem) {
      window.CameraSystem.resetCamera();
      window.CameraSystem.cameraUpdatePending = false;
    }
    
    // Reset canvas renderer
    if (window.CanvasRenderer) {
      window.CanvasRenderer.renderPending = false;
      window.CanvasRenderer.renderQueued = false;
      if (window.CanvasRenderer.resetCache) {
        window.CanvasRenderer.resetCache();
      }
    }
    
    // Reset player controller movement state
    if (window.PlayerController) {
      if (window.PlayerController.isMovementActive) {
        window.PlayerController.isMovementActive = false;
      }
    }
  },

  /**
   * Setup debug console system
   */
  setupDebugConsole: function() {
    // Debug logging function
    window.debugLog = function(message, type = 'info') {
      const debugConsole = document.getElementById('debug-console');
      if (!debugConsole) return;
      
      const timestamp = new Date().toLocaleTimeString() + '.' + String(new Date().getMilliseconds()).padStart(3, '0');
      const entry = document.createElement('div');
      entry.className = `debug-entry debug-${type}`;
      entry.innerHTML = `<span class="debug-timestamp">[${timestamp}]</span> ${message}`;
      
      debugConsole.appendChild(entry);
      
      // Auto-scroll to bottom
      debugConsole.scrollTop = debugConsole.scrollHeight;
      
      // Keep only last 100 entries to prevent memory issues
      const entries = debugConsole.querySelectorAll('.debug-entry');
      if (entries.length > 100) {
        entries[0].remove();
      }
    };

    // Clear debug console function
    window.clearDebug = function() {
      const debugConsole = document.getElementById('debug-console');
      if (debugConsole) debugConsole.innerHTML = '';
    };
  },

  /**
   * Setup loading overlay with fade out effect
   */
  setupLoadingOverlay: function() {
    window.addEventListener('DOMContentLoaded', function() {
      var loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        setTimeout(function() {
          loadingOverlay.style.opacity = '0';
          setTimeout(function() {
            loadingOverlay.style.display = 'none';
          }, 400);
        }, 750);
      }
    });
  },

  /**
   * Comprehensive cleanup function to prevent memory leaks and accumulation
   */
  cleanupGameSystems: function() {
    // Stop smooth movement
    if (window.PlayerController) {
      window.PlayerController.cleanupMovementSystems();
    }
    
    // Clear any audio check intervals
    /* DISABLED: Audio intervals commented out for performance
    if (audioCheckInterval) {
      clearInterval(audioCheckInterval);
      audioCheckInterval = null;
    }
    */
    
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
      /* DISABLED: Audio loading commented out for performance
      setTimeout(() => {
        this.preloadAudioAsync();
      }, 100); // Additional delay to ensure smooth maze startup
      */
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
    /* DISABLED: Audio preloading commented out for performance
    // Start audio loading after page is fully loaded and maze is initialized
    setTimeout(() => {
      if (typeof audioPreloaded !== 'undefined' && !audioPreloaded && typeof audioLoadingInProgress !== 'undefined' && !audioLoadingInProgress) {
        // Audio loading logic would go here
        console.log('Audio preloading started');
      }
    }, 200); // Ensure maze has time to fully initialize
    */
    console.log('Audio preloading disabled for performance');
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
        console.log('Restart button clicked - starting complete game restart');
        GameInitializer.restartGameFromScratch();
      });
      restartButton.setAttribute('data-initialized', 'true');
    }
    
    if (backButton && !backButton.hasAttribute('data-initialized')) {
      backButton.addEventListener("click", myLibrary.goBack);
      backButton.style.display = "inline-block";
      backButton.addEventListener("click", myLibrary.hideEndScreen);
      backButton.setAttribute('data-initialized', 'true');
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

// Create convenient global alias for the restart function
window.restartMaze = function() {
  console.log('Global restartMaze() called');
  GameInitializer.restartGameFromScratch();
};

// Also make it available as a shorter alias
window.restart = window.restartMaze;