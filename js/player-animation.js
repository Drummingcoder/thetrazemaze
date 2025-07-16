/**
 * Player Animation System
 * Handles all player sprite animations including movement, dash, and ground pound
 */

console.log('Player Animation module loaded');

const PlayerAnimation = {
  // Core animation state
  animationFrame: 0,
  lastAnimationTime: 0,
  currentRow: 1, // 0 = left, 1 = right (matching spritesheet layout)
  lastDirection: 'right',
  
  // Animation speeds and timing
  ANIMATION_SPEED: 50, // milliseconds per frame - 50ms = 20 FPS (fast animation)
  DASH_ANIMATION_SPEED: 15, // milliseconds per frame for dash - 15ms = 67 FPS
  GROUND_POUND_HOVER_SPEED: 30, // milliseconds per frame for hover
  GROUND_POUND_RECOVERY_SPEED: 15, // milliseconds per frame for recovery (2x faster than before)
  
  // Movement animation properties
  lastMovementTime: 0,
  MOVEMENT_TIMEOUT: 100, // Keep animating for 100ms after movement stops
  animationUpdateInterval: null,
  
  // Dash animation properties
  isDashAnimating: false,          // DEPRECATED - will be removed
  dashAnimation: false,            // True when dash animation is playing
  recoveryDash: false,             // True when recovery animation is playing
  dashAnimationType: 'none',       // 'dash-left', 'dash-right', 'recovery-left', 'recovery-right'
  dashAnimationFrame: 0,
  dashRecoveryTimer: 0,
  DASH_RECOVERY_DURATION: 5,       // 5 frames for faster recovery animation
  
  // Ground pound animation properties
  groundPoundActive: false,        // Master flag: ground pound is happening
  groundPoundHovering: false,      // Hover animation playing
  groundPoundRecovering: false,    // Recovery animation playing
  groundPoundDirection: 'right',   // Direction player was facing when ground pound started
  groundPoundAnimationFrame: 0,    // Current animation frame
  lastGroundPoundAnimationTime: 0,
  
  // Performance optimization
  lastAnimationUpdateTime: 0,
  animationUpdateThrottle: 16, // Minimum time between animation updates (60 FPS)
  
  // Debug tracking
  lastLoggedDashState: false,
  dashRecoveryCompleteTime: 0, // Track when dash recovery completed
  DASH_RECOVERY_SETTLE_TIME: 100, // Time to wait before idle reset after dash recovery (ms)
  
  // Independent animation loop
  animationLoopId: null,
  isAnimationLoopRunning: false,
  
  // Reference to player element (set by renderer)
  playerElement: null,
  scaleFactor: 0.1875,
  originalFrameWidth: 256,
  originalFrameHeight: 256,

  /**
   * Initialize the animation system
   * @param {HTMLElement} playerElement - The player DOM element
   * @param {number} scaleFactor - Scale factor for sprite rendering
   * @param {string} initialDirection - Initial facing direction ('left' or 'right')
   */
  init: function(playerElement, scaleFactor, initialDirection = 'right') {
    this.playerElement = playerElement;
    this.scaleFactor = scaleFactor;
    
    // Set initial direction based on level
    this.lastDirection = initialDirection;
    this.currentRow = initialDirection === 'left' ? 0 : 1; // 0 = left, 1 = right
    this.animationFrame = 0; // Start at frame 0
    
    console.log('🎬 PlayerAnimation initialized with scale factor:', scaleFactor, 'initial direction:', initialDirection);
    
    // IMMEDIATELY update the sprite frame to show the correct direction
    this.updateSpriteFrame();
    
    // Start the independent animation loop
    this.startAnimationLoop();
  },

  /**
   * Start the independent animation loop
   */
  startAnimationLoop: function() {
    if (this.isAnimationLoopRunning) return; // Already running
    
    this.isAnimationLoopRunning = true;
    console.log('🔄 Starting independent animation loop');
    
    const animationLoop = () => {
      if (!this.isAnimationLoopRunning) return;
      
      // Update animations
      this.updateAnimation();
      
      // Continue the loop
      this.animationLoopId = requestAnimationFrame(animationLoop);
    };
    
    this.animationLoopId = requestAnimationFrame(animationLoop);
  },

  /**
   * Stop the independent animation loop
   */
  stopAnimationLoop: function() {
    if (this.animationLoopId) {
      cancelAnimationFrame(this.animationLoopId);
      this.animationLoopId = null;
    }
    this.isAnimationLoopRunning = false;
    console.log('⏹️ Stopped independent animation loop');
  },

  /**
   * Check if any animations need to continue running
   */
  shouldAnimationContinue: function() {
    // Continue if any special animations are active
    if (this.dashAnimation || 
        this.recoveryDash ||
        this.groundPoundActive || 
        this.groundPoundHovering || 
        this.groundPoundRecovering) {
      return true;
    }
    
    // Continue if player is moving
    const isMoving = window.PlayerController && window.PlayerController.playerIsMoving;
    if (isMoving) {
      return true;
    }
    
    // Continue if we have any active animation frames that aren't at rest
    if (this.animationFrame !== 0) {
      return true;
    }
    
    // Default: keep animating at 1 FPS for idle state
    return true;
  },

  /**
   * Update animation - main entry point called by independent animation loop
   */
  updateAnimation: function() {
    // Check if we should continue animating
    if (!this.shouldAnimationContinue()) {
      return;
    }
    
    // Throttle animation updates to prevent multiple executions per frame
    const now = performance.now();
    if (now - this.lastAnimationUpdateTime < this.animationUpdateThrottle) {
      return; // Skip this update cycle
    }
    this.lastAnimationUpdateTime = now;
    
    const isMoving = window.PlayerController && window.PlayerController.playerIsMoving;
    const isGroundPounding = window.PlayerController && window.PlayerController.isGroundPounding;
    const isDashing = window.PlayerController && window.PlayerController.isDashing;
    
    // DEBUG: Log animation state every second when dashing or in recovery
    if ((this.dashAnimation || this.recoveryDash) && (now % 1000 < 50)) {
      console.log('🔍 ANIMATION STATE:', {
        isDashing,
        dashAnimation: this.dashAnimation,
        recoveryDash: this.recoveryDash,
        animationFrame: this.animationFrame,
        currentRow: this.currentRow
      });
    }
    
    // DEBUG: Log dash state changes
    if (this.lastLoggedDashState !== isDashing && (this.dashAnimation || this.recoveryDash)) {
      if (window.debugLog) window.debugLog(`🔍 DASH STATE CHANGE: isDashing=${isDashing}, dashAnimation=${this.dashAnimation}, recoveryDash=${this.recoveryDash}, isMoving=${isMoving}`, 'warn');
      this.lastLoggedDashState = isDashing;
    }
    
    // Handle ground pound animations (highest priority)
    if (this.groundPoundActive || isGroundPounding) {
      this.updateGroundPoundAnimationState(isGroundPounding);
      this.handleGroundPoundAnimation();
      return;
    }
    
    // Check if dash just ended by PlayerController - transition from dash to recovery
    if (!isDashing && this.dashAnimation) {
      console.log('� DASH ENDED: Transitioning from dash to recovery - isDashing=', isDashing, 'dashAnimation=', this.dashAnimation);
      if (window.debugLog) window.debugLog('🔄 DASH ENDED BY CONTROLLER: Transitioning to recovery', 'info');
      this.dashAnimation = false;
      this.startDashRecovery();
      this.handleDashRecovery();
      return;
    }
    
    // Handle dash animations (when isDashing=true and dashAnimation=true)
    if (isDashing && this.dashAnimation) {
      console.log('� DASH: Calling handleDashAnimation - isDashing=', isDashing, 'dashAnimation=', this.dashAnimation);
      this.handleDashAnimation();
      return;
    }
    
    // Handle dash recovery animation (when recoveryDash=true)
    if (this.recoveryDash) {
      console.log('🏃 RECOVERY: Calling handleDashRecovery - recoveryDash=', this.recoveryDash);
      this.handleDashRecovery();
      return;
    }
    
    // Regular movement animation (when not dashing or when dashing but in recovery and moving)
    if (isMoving && !this.dashAnimation) {
      // Update direction based on current keys
      this.updateDirection();
      
      // Check if enough time has passed to advance the frame
      const timeSinceLastFrame = now - this.lastAnimationTime;
      
      if (timeSinceLastFrame >= this.ANIMATION_SPEED || this.lastAnimationTime === 0) {
        // Advance animation frame (7 frames for movement)
        this.animationFrame = (this.animationFrame + 1) % 7;
        this.lastAnimationTime = now;
        
        // Update the sprite display
        this.updateSpriteFrame();
      }
    } else if (!isMoving && !this.dashAnimation && !this.recoveryDash) {
      // When not moving and no special animations, ensure we're on frame 0 for idle state
      if (this.animationFrame !== 0) {
        if (window.debugLog) window.debugLog(`🔄 IDLE RESET: animationFrame=${this.animationFrame} → 0`, 'info');
        this.animationFrame = 0;
        this.updateSpriteFrame();
      }
    }
  },

  /**
   * Update direction without resetting animation
   */
  updateDirection: function() {
    if (!window.PlayerController || !window.PlayerController.smoothMovementKeys) return;
    
    const keys = window.PlayerController.smoothMovementKeys;
    let currentDirection = this.lastDirection;
    
    // Check for primary movement directions
    if (keys['ArrowLeft'] || keys['a']) {
      currentDirection = 'left';
    } else if (keys['ArrowRight'] || keys['d']) {
      currentDirection = 'right';
    } else if (keys['ArrowUp'] || keys['w']) {
      currentDirection = 'up';
    } else if (keys['ArrowDown'] || keys['s']) {
      currentDirection = 'down';
    }
    
    // For diagonal movement, prioritize horizontal direction for sprite facing
    if ((keys['ArrowLeft'] || keys['a']) && (keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s'])) {
      currentDirection = 'left';
    } else if ((keys['ArrowRight'] || keys['d']) && (keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s'])) {
      currentDirection = 'right';
    }
    
    // Update facing direction for left/right movement
    if (currentDirection === 'left' || currentDirection === 'right') {
      this.lastDirection = currentDirection;
    }
    
    // Update sprite row based on facing direction (row 0=left, row 1=right)
    this.currentRow = this.lastDirection === 'left' ? 0 : 1;
  },

  /**
   * Handle dash animation - 8 frames, rows 2 and 4
   */
  handleDashAnimation: function() {
    console.log('🚀 handleDashAnimation called');
    const dashDirectionX = window.PlayerController.dashDirectionX;
    console.log('🚀 dashDirectionX:', dashDirectionX);
    
    // Determine dash animation type based on direction
    let newDashType;
    if (dashDirectionX < 0) {
      newDashType = 'dash-left';
      this.currentRow = 2; // Row 2 for dashing left
    } else if (dashDirectionX > 0) {
      newDashType = 'dash-right';
      this.currentRow = 4; // Row 4 for dashing right
    } else {
      // Vertical dash - use last direction
      if (this.lastDirection === 'left') {
        newDashType = 'dash-left';
        this.currentRow = 2;
      } else {
        newDashType = 'dash-right';
        this.currentRow = 4;
      }
    }
    
    // Initialize dash animation if just starting
    if (this.dashAnimationType !== newDashType) {
      this.dashAnimationType = newDashType;
      this.dashAnimationFrame = 0;
      this.dashAnimation = true;
      this.recoveryDash = false;
      if (window.debugLog) window.debugLog('🚀 DASH ANIMATION START: type=' + newDashType + ', row=' + this.currentRow, 'info');
    }
    
    // Update animation frame
    const now = performance.now();
    const timeSinceLastFrame = now - this.lastAnimationTime;
    
    if (timeSinceLastFrame >= this.DASH_ANIMATION_SPEED) {
      // Advance dash animation frame but don't end until PlayerController ends the dash
      if (this.dashAnimationFrame < 7) {
        this.dashAnimationFrame++;
        this.animationFrame = this.dashAnimationFrame;
        this.lastAnimationTime = now;
        
        if (window.debugLog) window.debugLog('🚀 DASH FRAME: frame=' + this.dashAnimationFrame, 'info');
        
        // Update the sprite display
        this.updateSpriteFrame();
      } else {
        // Hold on the last frame (frame 7) until PlayerController ends the dash
        this.animationFrame = 7;
        this.updateSpriteFrame();
        // DON'T set dashAnimation = false here - wait for PlayerController
      }
    }
  },

  /**
   * Start dash recovery animation
   */
  startDashRecovery: function() {
    // Transition from dash to recovery animation
    if (this.dashAnimationType === 'dash-left') {
      this.dashAnimationType = 'recovery-left';
      this.currentRow = 3; // Row 3 for left recovery
    } else {
      this.dashAnimationType = 'recovery-right';
      this.currentRow = 5; // Row 5 for right recovery
    }
    
    this.dashAnimation = false;
    this.recoveryDash = true;
    this.dashAnimationFrame = 0;
    this.dashRecoveryTimer = this.DASH_RECOVERY_DURATION;
    
    if (window.debugLog) window.debugLog('🏃 DASH RECOVERY START: type=' + this.dashAnimationType + ', timer=' + this.DASH_RECOVERY_DURATION + ', row=' + this.currentRow, 'info');
  },

  /**
   * Handle dash recovery animation - 8 frames, rows 3 and 5
   */
  handleDashRecovery: function() {
    // Continue recovery animation
    if (this.dashAnimationType.startsWith('recovery-') && this.dashRecoveryTimer > 0) {
      const now = performance.now();
      const timeSinceLastFrame = now - this.lastAnimationTime;
      
      if (timeSinceLastFrame >= this.DASH_ANIMATION_SPEED) {
        this.animationFrame = this.dashAnimationFrame;
        this.updateSpriteFrame();
        
        if (window.debugLog) window.debugLog('🏃 DASH RECOVERY FRAME: frame=' + this.dashAnimationFrame + ', timer=' + this.dashRecoveryTimer + ', row=' + this.currentRow, 'info');
        
        this.dashAnimationFrame = (this.dashAnimationFrame + 1) % 8;
        this.lastAnimationTime = now;
        this.dashRecoveryTimer--;
        
        // End recovery when timer reaches 0
        if (this.dashRecoveryTimer <= 0) {
          this.completeDashRecovery();
        }
      }
    }
  },

  /**
   * Complete dash recovery and return to normal state
   */
  completeDashRecovery: function() {
    if (window.debugLog) window.debugLog('✅ DASH RECOVERY COMPLETE: Returning to normal state', 'info');
    
    this.recoveryDash = false;
    this.dashAnimationType = 'none';
    this.dashAnimationFrame = 0;
    
    // Signal to PlayerController that dash should end completely
    if (window.PlayerController && window.PlayerController.endDashFromAnimation) {
      window.PlayerController.endDashFromAnimation();
    }
    
    // Reset to normal movement rows (0=left, 1=right)
    this.currentRow = this.lastDirection === 'left' ? 0 : 1;
  },

  /**
   * Start dash animation
   */
  startDash: function(directionX) {
    // This will be called by PlayerController when dash starts
    console.log('🚀 Starting dash animation, direction:', directionX);
    console.log('🚀 Before: dashAnimation=', this.dashAnimation, 'recoveryDash=', this.recoveryDash);
    
    // Initialize dash animation state
    this.dashAnimation = true;
    this.recoveryDash = false;
    this.dashAnimationFrame = 0;
    this.dashAnimationType = 'none'; // Will be set in handleDashAnimation
    
    console.log('🚀 After: dashAnimation=', this.dashAnimation, 'recoveryDash=', this.recoveryDash);
    
    if (window.debugLog) {
      window.debugLog('🚀 DASH ANIMATION INITIALIZED: dashAnimation=true, recoveryDash=false', 'info');
    }
    
    // Also log to regular console for immediate visibility
    console.log('🚀 DASH ANIMATION INITIALIZED: dashAnimation=true, recoveryDash=false');
  },

  /**
   * Start ground pound animation
   */
  startGroundPound: function() {
    this.groundPoundActive = true;
    this.groundPoundHovering = true;
    this.groundPoundRecovering = false;
    this.groundPoundDirection = this.lastDirection;
    this.groundPoundAnimationFrame = 0;
    this.lastGroundPoundAnimationTime = performance.now();
    if (window.debugLog) window.debugLog('🌪️ GROUND POUND START: direction=' + this.groundPoundDirection + ', hovering=true, frame=0', 'info');
  },

  /**
   * Update ground pound animation state
   */
  updateGroundPoundAnimationState: function(isGroundPounding) {
    if (isGroundPounding && !this.groundPoundActive) {
      this.startGroundPound();
    } else if (!isGroundPounding && this.groundPoundActive && this.groundPoundHovering) {
      // Ground pound ended while hovering - start recovery
      this.groundPoundHovering = false;
      this.groundPoundRecovering = true;
      this.groundPoundAnimationFrame = 0;
      this.lastGroundPoundAnimationTime = performance.now();
      if (window.debugLog) window.debugLog('🔄 HOVER→RECOVERY: Ground pound ended during hover, starting recovery', 'info');
    } else if (!isGroundPounding && this.groundPoundActive && !this.groundPoundHovering && !this.groundPoundRecovering) {
      // Ground pound ended during slam phase - should start recovery (this handles landing case)
      this.groundPoundRecovering = true;
      this.groundPoundAnimationFrame = 0;
      this.lastGroundPoundAnimationTime = performance.now();
      if (window.debugLog) window.debugLog('🔄 SLAM→RECOVERY: Ground pound landed, starting recovery animation', 'info');
    }
  },

  /**
   * Handle ground pound animation phases
   */
  handleGroundPoundAnimation: function() {
    const now = performance.now();
    const playerController = window.PlayerController;
    const isStillGroundPounding = playerController && playerController.isGroundPounding;
    const groundPoundPhase = playerController && playerController.groundPoundPhase;
    
    // Handle phase transitions
    if (isStillGroundPounding && groundPoundPhase === 'slamming' && this.groundPoundHovering) {
      // Stop hover animation during slam but KEEP the current frame
      this.groundPoundHovering = false;
      // CRITICAL: Set animationFrame to the current hover frame to freeze it
      this.animationFrame = this.groundPoundAnimationFrame;
      if (window.debugLog) window.debugLog('💥 SLAM TRANSITION: Freezing hover frame=' + this.groundPoundAnimationFrame, 'warn');
      // Make sure we update the sprite to show this frozen frame
      this.currentRow = this.groundPoundDirection === 'left' ? 6 : 8;
      this.updateSpriteFrame();
      return; // Don't update animation during slam phase
    }
    
    // If we're in slam phase, just maintain the current frame without updating
    if (isStillGroundPounding && groundPoundPhase === 'slamming') {
      // Keep the sprite on the correct row and frame during slam
      this.currentRow = this.groundPoundDirection === 'left' ? 6 : 8; // Keep hover row
      // CRITICAL: Make sure animationFrame stays frozen at the last hover frame
      this.updateSpriteFrame();
      return;
    }
    
    // Handle transition to recovery phase (either from controller or from slam ending)
    if ((groundPoundPhase === 'recovery' || (!isStillGroundPounding && this.groundPoundActive)) && 
        !this.groundPoundRecovering && !this.groundPoundHovering) {
      this.groundPoundRecovering = true;
      this.groundPoundHovering = false;
      this.groundPoundAnimationFrame = 0;
      this.lastGroundPoundAnimationTime = now;
      if (window.debugLog) window.debugLog('🔄 RECOVERY START: Starting recovery animation', 'info');
    }
    
    // Use different speeds for hover vs recovery
    let animationSpeed = this.groundPoundHovering ? this.GROUND_POUND_HOVER_SPEED : this.GROUND_POUND_RECOVERY_SPEED;
    const timeSinceLastFrame = now - this.lastGroundPoundAnimationTime;
    
    if (timeSinceLastFrame >= animationSpeed) {
      if (this.groundPoundHovering) {
        // Hover animation - advance until last frame, then freeze
        if (this.groundPoundAnimationFrame < 7) {
          this.groundPoundAnimationFrame++;
        }
        // Freeze on frame 7 (last frame) once reached
        this.currentRow = this.groundPoundDirection === 'left' ? 6 : 8; // Row 6 = left hover, Row 8 = right hover
        this.animationFrame = this.groundPoundAnimationFrame;
        
        this.lastGroundPoundAnimationTime = now;
        this.updateSpriteFrame();
        
      } else if (this.groundPoundRecovering) {
        // Recovery animation - play once
        this.groundPoundAnimationFrame++;
        this.currentRow = this.groundPoundDirection === 'left' ? 7 : 9; // Row 7 = left recovery, Row 9 = right recovery
        this.animationFrame = this.groundPoundAnimationFrame - 1;
        
        if (window.debugLog) window.debugLog('🔧 RECOVERY FRAME: frame=' + (this.groundPoundAnimationFrame - 1) + ', row=' + this.currentRow, 'info');
        
        this.lastGroundPoundAnimationTime = now;
        this.updateSpriteFrame();
        
        // Check if recovery is complete
        if (this.groundPoundAnimationFrame >= 8) {
          if (window.debugLog) window.debugLog('✅ RECOVERY COMPLETE: Resetting to movement animation', 'info');
          this.resetToMovementAnimation();
        }
      }
    }
  },

  /**
   * Update ground pound phase (called by PlayerController)
   */
  updateGroundPoundPhase: function(isGroundPounding, controllerPhase) {
    // This method allows PlayerController to notify us of phase changes
    if (controllerPhase === 'slamming' && this.groundPoundHovering) {
      if (window.debugLog) window.debugLog('🎯 PHASE TRANSITION: hover → slam, currentFrame=' + this.groundPoundAnimationFrame + ', freezing animationFrame=' + this.groundPoundAnimationFrame, 'warn');
      this.groundPoundHovering = false;
      // CRITICAL: Set the main animationFrame to the current hover frame to freeze it
      this.animationFrame = this.groundPoundAnimationFrame;
      // Make sure the sprite shows this frozen frame
      this.currentRow = this.groundPoundDirection === 'left' ? 6 : 8;
      this.updateSpriteFrame();
    }
  },

  /**
   * Reset to normal movement animation
   */
  resetToMovementAnimation: function() {
    if (window.debugLog) window.debugLog(`🔄 RESET TO MOVEMENT: Before - dashAnimation=${this.dashAnimation}, recoveryDash=${this.recoveryDash}, animationFrame=${this.animationFrame}, currentRow=${this.currentRow}`, 'warn');
    
    // Reset dash animation state
    this.isDashAnimating = false; // Keep for compatibility
    this.dashAnimation = false;
    this.recoveryDash = false;
    this.dashAnimationType = 'none';
    this.dashAnimationFrame = 0;
    this.animationFrame = 0;
    this.dashRecoveryTimer = 0;
    this.dashRecoveryCompleteTime = 0; // Reset recovery complete timer
    
    // Reset ground pound animation state
    this.groundPoundActive = false;
    this.groundPoundHovering = false;
    this.groundPoundRecovering = false;
    this.groundPoundAnimationFrame = 0;
    
    // Reset to normal movement rows (0=left, 1=right)
    this.currentRow = this.lastDirection === 'left' ? 0 : 1;
    
    if (window.debugLog) window.debugLog(`🔄 RESET TO MOVEMENT: After - dashAnimation=${this.dashAnimation}, recoveryDash=${this.recoveryDash}, animationFrame=${this.animationFrame}, currentRow=${this.currentRow}`, 'warn');
  },

  /**
   * Signal to PlayerController that dash should end
   */
  endDash: function() {
    if (window.PlayerController && window.PlayerController.endDashFromAnimation) {
      window.PlayerController.endDashFromAnimation();
    }
  },

  /**
   * Update the sprite frame display
   */
  updateSpriteFrame: function() {
    if (!this.playerElement) return;
    
    // Extract frames using scaled dimensions
    const scaledFrameWidth = this.originalFrameWidth * this.scaleFactor;
    const scaledFrameHeight = this.originalFrameHeight * this.scaleFactor;
    const bgPosX = -(this.animationFrame * scaledFrameWidth);
    const bgPosY = -(this.currentRow * scaledFrameHeight);
    
    this.playerElement.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
  },

  /**
   * Get current animation state for debugging
   */
  getAnimationState: function() {
    return {
      animationFrame: this.animationFrame,
      currentRow: this.currentRow,
      lastDirection: this.lastDirection,
      isDashAnimating: this.isDashAnimating, // Legacy
      dashAnimation: this.dashAnimation,
      recoveryDash: this.recoveryDash,
      dashAnimationType: this.dashAnimationType,
      groundPoundActive: this.groundPoundActive,
      groundPoundHovering: this.groundPoundHovering,
      groundPoundRecovering: this.groundPoundRecovering,
      isAnimationLoopRunning: this.isAnimationLoopRunning,
      animationLoopId: this.animationLoopId
    };
  },

  /**
   * Cleanup method for when the game ends or resets
   */
  cleanup: function() {
    this.stopAnimationLoop();
    this.resetToMovementAnimation();
    console.log('🧹 PlayerAnimation cleaned up');
  }
};

// Make PlayerAnimation available globally
window.PlayerAnimation = PlayerAnimation;
