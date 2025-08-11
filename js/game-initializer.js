/**
 * Game Initializer Module
 * Handles game setup, cleanup, and state management
 */
/**
 * Function Reference (GameInitializer)
 * 1. initializeStartScreen() - Set up the start screen using StartScreenManager
 * 2. restartGame(num) - Restart the game (num=0: full restart, num!=0: level/maze restart)
 * 3. clearCanvases() - Clear all game canvases
 * 4. stopAllSystems() - Stop all running game systems and intervals
 * 5. resetGameState() - Reset all game state variables
 * 6. resetPlayerState() - Reset player position and state
 * 7. resetUIElements() - Reset UI elements to initial state
 * 8. resetModules() - Reset all modules to initial state
 * 9. cleanupGameSystems() - Comprehensive cleanup to prevent memory leaks
 * 10. initializeGame() - Initialize the complete game system
 * 11. createVirtualPlayer() - Create virtual player object for compatibility
 * 12. preloadAudioAsync() - Placeholder for audio preloading
 * 13. setupEventListeners() - Set up event listeners for controls and lifecycle
 */

console.log('Game Initializer module loaded');

const GameInitializer = {
  
  /**
   * Initialize start screen using StartScreenManager module
   */
  initializeStartScreen: function() {
    if (window.GameActions && window.GameActions.showOverlay) {
      window.GameActions.showOverlay();
    }
    
    if (window.StartScreenManager) {
      window.StartScreenManager.initializeStartScreen();
    } else {
      console.error('StartScreenManager module not loaded');
    }
  },

  /**
   * Complete game restart function - equivalent to page reload
   * Resets all game state and reinitializes everything from scratch
   */
  restartGame: function(num) {
    window.GameActions.showOverlay();
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
    
    // Step 6: Reinitialize the complete game or clear canvases to prepare for new maze
    if (num == 0)
      this.initializeGame();
    else
      this.clearCanvases();
    
    console.log('GameInitializer: Complete game restart finished');
  },

  /**
   * Clear all canvases
   */
  clearCanvases: function() {
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
    if (window.AudioManager) {
      window.AudioManager.musicStarted = false;
      // Don't reset audioPreloaded - keep loaded audio
      // Gently initialize music in background (non-blocking)
      setTimeout(() => {
        if (window.AudioManager && window.AudioManager.initMusicSafely) {
          window.AudioManager.initMusicSafely();
        }
      }, 2000); // Wait 2 seconds after game start to avoid interference
    }
    
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
    window.personalbest.style.display = '';
    window.newpersonalbest.style.display = 'none';
    window.endContent.style.display = ''; // Ensure time display is visible for new games
    
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
   * Comprehensive cleanup function to prevent memory leaks and accumulation
   */
  cleanupGameSystems: function() {
    // Stop smooth movement
    if (window.PlayerController) {
      window.PlayerController.cleanupMovementSystems();
    }
    
    if (window.playerAnimation && typeof window.playerAnimation.cleanup === 'function') {
      window.playerAnimation.cleanup();
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
   * Initialize the complete game system (combined high-level and low-level logic)
   */
  initializeGame: function() {
    // Low-level resets
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

      // Ensure virtual player is created
      const virtualPlayer = GameInitializer.createVirtualPlayer();
      if (virtualPlayer) {
        window.player = virtualPlayer;
      }
      
      // Start lazy audio loading AFTER maze is fully initialized
      /* DISABLED: Audio loading commented out for performance
      setTimeout(() => {
        this.preloadAudioAsync();
      }, 100); // Additional delay to ensure smooth maze startup
      */
    }, 50); // Small delay to ensure reset is complete
    // Start the smooth movement system
    if (window.PlayerController && window.PlayerController.startSmoothMovement) {
      window.PlayerController.startSmoothMovement();
    }
      
    // Prepare animation system
    if (window.CanvasRenderer && window.CanvasRenderer.prepareAnimationSystem) {
      window.CanvasRenderer.prepareAnimationSystem();
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
   * Setup event listeners for game controls and page lifecycle
   */
  setupEventListeners: function() {
    // Prevent duplicate event listeners
    const restartButton = document.getElementById("restart-button");
    const backButton = document.getElementById("back-button");
    const copyButton = document.getElementById("copy-button");

    if (restartButton && !restartButton.hasAttribute('data-initialized')) {
      restartButton.addEventListener("click", function() {
        console.log('Restart button clicked - starting complete game restart');
        window.GameActions.showOverlay();
        GameInitializer.restartGame(0);
      });
      restartButton.setAttribute('data-initialized', 'true');
    }
    
    if (backButton && !backButton.hasAttribute('data-initialized')) {
      backButton.addEventListener("click", window.GameActions.goBack);
      backButton.style.display = "inline-block";
      backButton.addEventListener("click", window.GameActions.hideEndScreen);
      backButton.setAttribute('data-initialized', 'true');
    }

    // Setup DOMContentLoaded listener to initialize start screen
    if (!window.domContentLoadedInitialized) {
      window.addEventListener('DOMContentLoaded', function() {
        window.GameInitializer.initializeStartScreen();
      });
      window.domContentLoadedInitialized = true;
    }

    // Window load listener - initialize game if started
    if (!window.windowLoadInitialized) {
      window.addEventListener('load', function() {
        // Only initialize if game has been started
        if (window.isGameStarted) {
          if (window.CameraSystem) {
            window.CameraSystem.resetCamera();
          }
          window.GameInitializer.initializeGame();
          
          // Start audio loading after page is fully loaded and maze is initialized
          setTimeout(() => {
            console.log('Starting audio preload via AudioManager...');
            if (window.AudioManager) {
              console.log('AudioManager available:', !!window.AudioManager);
              console.log('AudioManager.isAudioPreloaded():', window.AudioManager.isAudioPreloaded());
              console.log('AudioManager.isAudioLoading():', window.AudioManager.isAudioLoading());
              
              if (!window.AudioManager.isAudioPreloaded() && !window.AudioManager.isAudioLoading()) {
                console.log('Starting audio preload via AudioManager...');
                window.AudioManager.preloadAudioAsync();
              } else {
                console.log('Audio already preloaded or loading - skipping preload');
              }
            } else {
              console.warn('AudioManager not available - audio preload skipped');
            }
          }, 200); // Ensure maze has time to fully initialize
        }
      });
      window.windowLoadInitialized = true;
    }
  }
};

// Make GameInitializer available globally
window.GameInitializer = GameInitializer;

// Create convenient global alias for the restart function
window.restartMaze = function() {
  console.log('Global restartMaze() called');
  GameInitializer.restartGame(0);
};

// Also make it available as a shorter alias
window.restart = window.restartMaze;