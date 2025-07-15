/**
 * Canvas Renderer Module - Clean and Simple
 * Renders maze clearly and player sprite without modifications, then scales down
 */

console.log('Canvas Renderer module loaded');

const CanvasRenderer = {
  // Rendering state (for compatibility)
  renderPending: false,
  renderQueued: false,
  mazeDrawn: false, // Track if maze has been drawn to avoid unnecessary redraws

  // Sprite system - DOM-based instead of canvas
  playerSprite: null,
  spriteLoaded: false,
  playerElement: null, // DOM element for the player sprite
  animationFrame: 0,
  lastAnimationTime: 0,
  ANIMATION_SPEED: 50, // milliseconds per frame - 50ms = 20 FPS (fast animation)
  DASH_ANIMATION_SPEED: 15, // milliseconds per frame for dash - 15ms = 67 FPS (8 frames = 120ms, much faster animation)
  lastDirection: 'right',
  currentRow: 1, // 0 = left, 1 = right (matching your spritesheet layout)
  lastMovementTime: 0, // Track when we last detected movement
  MOVEMENT_TIMEOUT: 100, // Keep animating for 100ms after movement stops
  animationUpdateInterval: null, // Store interval ID
  
  // Dash animation properties
  isDashAnimating: false,
  dashAnimationType: 'none', // 'dash-left', 'dash-right', 'recovery-left', 'recovery-right'
  dashAnimationFrame: 0,
  dashRecoveryTimer: 0,
  DASH_RECOVERY_DURATION: 8, // 8 frames for full recovery animation (matches 8-frame spritesheet)
  
  // Sprite scaling properties
  spriteScale: 0.1875, // Default scale (48/256)
  originalFrameWidth: 256,
  originalFrameHeight: 256,

  // Performance optimization - cache last known positions
  lastPlayerX: -1,
  lastPlayerY: -1,
  lastAnimationFrame: -1,
  lastCurrentRow: -1,
  lastRenderTime: 0,
  renderThrottle: 16, // Limit renders to ~60 FPS
  
  // Animation throttling to prevent multiple executions per frame
  lastAnimationUpdateTime: 0,
  animationUpdateThrottle: 16, // Minimum time between animation updates (60 FPS)

  /**
   * Initialize sprite loading - DOM-based approach with FIXED positioning
   */
  initSprites: function() {
    console.log('🔧 Creating DOM-based player sprite...');
    
    // Check if spritesheet image exists
    const testImg = new Image();
    testImg.onload = () => console.log('✅ Spritesheet loaded successfully');
    testImg.onerror = () => console.error('❌ Failed to load spritesheet.png');
    testImg.src = 'spritesheet.png';
    
    // Remove any existing player sprite first
    const existingSprite = document.getElementById('player-sprite');
    if (existingSprite) {
      console.log('🗑️ Removing existing sprite');
      existingSprite.remove();
    }
    
    // Create the player DOM element
    this.playerElement = document.createElement('div');
    this.playerElement.id = 'player-sprite';
    this.playerElement.style.position = 'fixed'; // Use 'fixed' to position relative to viewport
    this.playerElement.style.zIndex = '1000'; // Much higher z-index to ensure visibility
    this.playerElement.style.pointerEvents = 'none';
    this.playerElement.style.imageRendering = 'pixelated'; // Crisp scaling
    this.playerElement.style.backgroundImage = 'url(spritesheet.png)'; // Updated to new spritesheet
    this.playerElement.style.backgroundRepeat = 'no-repeat';
    // this.playerElement.style.border = '2px solid red'; // DEBUG: Removed red border
    
    // Set size based on a fixed size for better visibility (not dependent on cell size)
    const spriteSize = 48; // Fixed size for better visibility when centered
    this.playerElement.style.width = spriteSize + 'px';
    this.playerElement.style.height = spriteSize + 'px';
    
    console.log(`🎯 Sprite size set to: ${spriteSize}px x ${spriteSize}px`);
    
    // Set background size to scale the spritesheet properly
    const frameWidth = 256; // Each frame is 256x256 pixels
    const frameHeight = 256;
    const sheetWidth = 2048; // Your spritesheet width (8 frames of 256px each)
    const sheetHeight = 2560; // Your spritesheet height (10 rows of 256px each)
    
    // Scale the spritesheet so each frame fits exactly in our sprite element (48x48px)
    // We want each 256px frame to be scaled to 48px, so scale factor is 48/256 = 0.1875
    const scaleFactor = spriteSize / frameWidth; // 48/256 = 0.1875
    const scaledSheetWidth = sheetWidth * scaleFactor; // 2048 * 0.1875 = 384px
    const scaledSheetHeight = sheetHeight * scaleFactor; // 2560 * 0.1875 = 480px
    
    this.playerElement.style.backgroundSize = `${scaledSheetWidth}px ${scaledSheetHeight}px`;
    console.log(`📐 Background size set to: ${scaledSheetWidth}px x ${scaledSheetHeight}px (scale factor: ${scaleFactor})`);
    
    // Store original dimensions for position calculations
    this.originalFrameWidth = frameWidth;
    this.originalFrameHeight = frameHeight;
    this.scaleFactor = scaleFactor; // Store scale factor for background position calculations
    
    // Add to the maze container FIRST before positioning
    const mazeContainer = document.getElementById('maze-container');
    if (mazeContainer) {
      console.log('✅ Maze container found, appending sprite');
      mazeContainer.appendChild(this.playerElement);
    } else {
      console.error('❌ Maze container not found! Appending to body as fallback');
      document.body.appendChild(this.playerElement);
    }
    
    // FIXED POSITIONING: Use the actual current player coordinates
    this.updateSpritePosition();
    
    this.spriteLoaded = true;
    console.log('✅ Sprite initialization complete');
    
    // Force initial render
    this.renderFrame();
  },

  /**
   * Update animation - handles movement, dash, and recovery animations
   */
  updateAnimation: function() {
    // Throttle animation updates to prevent multiple executions per frame
    const now = performance.now();
    if (now - this.lastAnimationUpdateTime < this.animationUpdateThrottle) {
      return; // Skip this update cycle
    }
    this.lastAnimationUpdateTime = now;
    
    const isMoving = window.PlayerController && window.PlayerController.playerIsMoving;
    const isGroundPounding = window.PlayerController && window.PlayerController.isGroundPounding;
    const isDashing = window.PlayerController && window.PlayerController.isDashing;
    
    // Don't progress animation during ground pounding
    if (isGroundPounding) {
      return;
    }
    
    // Handle dash animations
    if (isDashing) {
      this.handleDashAnimation();
      return;
    }
    
    // Handle dash recovery animation (after dash ends) - SINGLE CHECK PER FRAME
    if (this.isDashAnimating && !isDashing) {
      if (window.debugLog && this.dashAnimationType.startsWith('dash-')) {
        window.debugLog(`⚡ DASH ENDED: PlayerController.isDashing=false, starting recovery`, 'warn');
      }
      this.handleDashRecovery();
      return;
    }
    
    // Regular movement animation
    if (isMoving) {
      // Reset to normal movement animation if we were in dash mode
      if (this.isDashAnimating) {
        if (window.debugLog) {
          window.debugLog(`🔄 RESET TO MOVEMENT: Was in dash mode, resetting to normal animation`, 'info');
        }
        this.resetToMovementAnimation();
      }
      
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
    
    // Only reset animation frame if we ACTUALLY change from left to right or vice versa
    const previousRow = this.currentRow;
    
    // Map directions to sprite rows (your spritesheet layout: row 0=left, row 1=right)
    // For up/down movement, use the last horizontal direction the player was facing
    if (currentDirection === 'up' || currentDirection === 'down') {
      // Keep using the last horizontal direction for up/down movement
    } else {
      // Update the facing direction for left/right movement
      this.lastDirection = currentDirection;
    }
    
    // Update sprite row based on facing direction (row 0=left, row 1=right)
    this.currentRow = this.lastDirection === 'left' ? 0 : 1; // left=0, right=1
    
    // DON'T reset animation frame when changing directions - let it continue smoothly
    // if (this.currentRow !== previousRow) {
    //   this.animationFrame = 0;
    //   if (window.debugLog) {
    //     window.debugLog(`Direction changed: Row ${previousRow} → ${this.currentRow}, reset to frame 0`, 'warn');
    //   }
    // }
  },

  /**
   * Handle dash animation - 8 frames, rows 2 and 4
   */
  handleDashAnimation: function() {
    const dashDirectionX = window.PlayerController.dashDirectionX;
    
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
    
    // Reset animation if dash type changed or just starting
    if (this.dashAnimationType !== newDashType) {
      this.dashAnimationType = newDashType;
      this.dashAnimationFrame = 0;
      this.isDashAnimating = true;
      if (window.debugLog) {
        window.debugLog(`🚀 DASH START: ${newDashType}, row ${this.currentRow}, frame reset to 0`, 'info');
      }
    }
    
    // Update animation frame
    const now = performance.now();
    const timeSinceLastFrame = now - this.lastAnimationTime;
    
    if (timeSinceLastFrame >= this.DASH_ANIMATION_SPEED) {
      // Advance dash animation frame (clamp to 0-7 range, don't wrap during dash)
      if (this.dashAnimationFrame < 7) {
        this.dashAnimationFrame++;
        this.animationFrame = this.dashAnimationFrame;
        this.lastAnimationTime = now;
        
        if (window.debugLog) {
          window.debugLog(`🎯 DASH FRAME: ${this.dashAnimationType} frame ${this.dashAnimationFrame}/8 on row ${this.currentRow}`, 'info');
        }
        
        // Update the sprite display
        this.updateSpriteFrame();
      }
      // If we've reached frame 7, don't advance further during dash phase
      // The recovery phase will handle continuation
    }
  },

  /**
   * Handle dash recovery animation - 8 frames, rows 3 and 5
   */
  handleDashRecovery: function() {
    // Start recovery animation if not already started
    if (this.dashAnimationType.startsWith('dash-')) {
      if (this.dashAnimationType === 'dash-left') {
        this.dashAnimationType = 'recovery-left';
        this.currentRow = 3; // Row 3 for left recovery
      } else {
        this.dashAnimationType = 'recovery-right';
        this.currentRow = 5; // Row 5 for right recovery
      }
      // Reset to frame 0 for recovery animation to play full sequence
      this.dashAnimationFrame = 0;
      this.dashRecoveryTimer = this.DASH_RECOVERY_DURATION;
      if (window.debugLog) {
        window.debugLog(`🔄 RECOVERY START: ${this.dashAnimationType}, row ${this.currentRow}, starting from frame 0`, 'warn');
      }
    }
    
    // Continue recovery animation ONLY if we're still in recovery and timer is active
    if (this.dashAnimationType.startsWith('recovery-') && this.dashRecoveryTimer > 0) {
      const now = performance.now();
      const timeSinceLastFrame = now - this.lastAnimationTime;
      
      if (timeSinceLastFrame >= this.DASH_ANIMATION_SPEED) {
        // Update the sprite display with current frame first
        this.animationFrame = this.dashAnimationFrame;
        this.updateSpriteFrame();
        
        if (window.debugLog) {
          window.debugLog(`🔧 RECOVERY FRAME: ${this.dashAnimationType} frame ${this.dashAnimationFrame}/8 on row ${this.currentRow}, timer ${this.dashRecoveryTimer}`, 'warn');
        }
        
        // Advance to next frame for next update
        this.dashAnimationFrame = (this.dashAnimationFrame + 1) % 8;
        this.lastAnimationTime = now;
        this.dashRecoveryTimer--;
        
        // End recovery only when timer reaches 0
        if (this.dashRecoveryTimer <= 0) {
          this.isDashAnimating = false;
          this.dashAnimationType = 'none';
          if (window.debugLog) {
            window.debugLog(`✅ DASH COMPLETE: Recovery finished, ending dash system`, 'info');
          }
          // Signal to PlayerController that dash should end
          this.endDash();
        }
      }
    }
  },

  /**
   * Reset to normal movement animation
   */
  resetToMovementAnimation: function() {
    this.isDashAnimating = false;
    this.dashAnimationType = 'none';
    this.dashAnimationFrame = 0;
    this.animationFrame = 0;
    this.dashRecoveryTimer = 0;
    
    // Reset to normal movement rows (0=left, 1=right)
    this.currentRow = this.lastDirection === 'left' ? 0 : 1;
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
   * Update just the sprite frame display
   */
  updateSpriteFrame: function() {
    if (!this.playerElement) return;
    
    // Extract frames using scaled dimensions
    const scaledFrameWidth = this.originalFrameWidth * this.scaleFactor;
    const scaledFrameHeight = this.originalFrameHeight * this.scaleFactor;
    const bgPosX = -(this.animationFrame * scaledFrameWidth); // Move by scaled frame width
    const bgPosY = -(this.currentRow * scaledFrameHeight);     // Move by scaled frame height
    
    this.playerElement.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
  },

  /**
   * Draw the maze - SIMPLIFIED high-performance approach
   */
  drawMaze: function() {
    if (!window.ctx || !window.mazeStructure) return;
    
    // SIMPLE AND FAST: Draw entire maze once and cache it
    // This is actually faster than complex viewport culling for our 48x48 maze
    
    const cellSize = window.cellSize;
    const mazeSize = window.mazeSize;
    const startRow = window.startRow;
    const startCol = window.startCol;
    const endRow = window.endRow;
    const endCol = window.endCol;
    
    // Clear entire canvas efficiently
    window.ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
    
    // Pre-set context properties for maximum performance
    window.ctx.imageSmoothingEnabled = false;
    
    // Batch render with minimal state changes
    let currentFillStyle = '';
    
    for (let row = 0; row < mazeSize; row++) {
      const rowData = window.mazeStructure[row];
      if (!rowData) continue;
      
      const y = row * cellSize;
      
      for (let col = 0; col < mazeSize; col++) {
        const x = col * cellSize;
        
        // Determine color with minimal branching
        let fillStyle;
        if (rowData[col] === 0) {
          // Path cell
          if (row === startRow && col === startCol) {
            fillStyle = '#00FF00'; // Green start
          } else if (row === endRow && col === endCol) {
            fillStyle = '#FF0000'; // Red end
          } else {
            fillStyle = '#87CEEB'; // Light blue paths
          }
        } else {
          fillStyle = '#000000'; // Black walls
        }
        
        // Only change fillStyle when necessary (major performance optimization)
        if (currentFillStyle !== fillStyle) {
          window.ctx.fillStyle = fillStyle;
          currentFillStyle = fillStyle;
        }
        
        window.ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
    
    
    // Removed debug logging for performance
  },

  /**
   * Draw the player - DOM-based positioning with animation
   */
  drawPlayer: function() {
    if (!this.playerElement) return;
    
    // Handle animation when moving
    this.updateAnimation();
  },

  /**
   * Force update player position (called directly by movement system)
   */
  updatePlayerPosition: function() {
    if (!this.playerElement) return;
    
    // Use the dedicated positioning function for consistency
    this.updateSpritePosition();
    
    // The drawPlayer function will handle animation during the regular render cycle
    // No need to duplicate animation logic here
  },

  /**
   * Update sprite position - SIMPLE: Always center on screen (window viewport)
   */
  updateSpritePosition: function() {
    if (!this.playerElement) {
      console.error('❌ Cannot update sprite position - playerElement not found');
      return;
    }
    
    // Get the WINDOW dimensions (viewport), not just the maze container
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate sprite size (fixed size for centered sprite)
    const spriteSize = 48; // Fixed size to match initialization
    
    // Position sprite at the CENTER of the entire window/viewport
    const centerX = (windowWidth / 2) - (spriteSize / 2);
    const centerY = (windowHeight / 2) - (spriteSize / 2);
    
    console.log(`🎯 Positioning sprite at: (${centerX}, ${centerY}) in window ${windowWidth}x${windowHeight}`);
    
    // Apply position immediately
    this.playerElement.style.left = centerX + 'px';
    this.playerElement.style.top = centerY + 'px';
    
    // DON'T force background position here - let the animation system handle it!
    // The animation system will set the correct frame via updateSpriteFrame()
  },

  /**
   * Main rendering function - ULTRA SIMPLIFIED for maximum performance
   */
  renderFrame: function() {
    // Frame rate throttling - don't render more than ~60 FPS
    const now = performance.now();
    if (now - this.lastRenderTime < this.renderThrottle) {
      return; // Skip this frame
    }
    this.lastRenderTime = now;
    
    // CRITICAL PERFORMANCE FIX: Only draw maze ONCE at startup, never again
    // The maze doesn't change, so redrawing it is pure waste
    if (!this.mazeDrawn) {
      this.drawMaze();
      this.mazeDrawn = true;
      // Debug logging removed for performance
    }
    
    // Always update player (this is fast since it's DOM-based)
    this.drawPlayer();
  },

  /**
   * Force a complete redraw (only when maze structure actually changes)
   */
  forceRedraw: function() {
    this.mazeDrawn = false;
    this.renderFrame();
  },

  /**
   * Reset cached positions (call when player teleports or resets)
   */
  resetCache: function() {
    this.lastPlayerX = -1;
    this.lastPlayerY = -1;
    this.lastAnimationFrame = -1;
    this.lastCurrentRow = -1;
    this.lastRenderTime = 0;
    this.mazeDrawn = false;
  },

  /**
   * Initialize the renderer
   */
  init: function() {
    this.configureCanvasForSprites();
    this.initSprites();
    this.renderFrame();
  },

  /**
   * Pre-warm animation system to reduce first-run lag
   */
  prepareAnimationSystem: function() {
    this.configureCanvasForSprites();
    this.initSprites();
    this.renderFrame();
  },

  /**
   * Monitor performance (compatibility function)
   */
  monitorPerformance: function() {
    // Simple performance monitoring - no complex tracking
  },
  
  /**
   * Configure canvases for optimal rendering
   */
  configureCanvasForSprites: function() {
    // Configure maze canvas for crisp geometric shapes
    if (window.ctx) {
      window.ctx.imageSmoothingEnabled = false; // Pixelated for crisp maze edges
    }
    
    // Configure player canvas for crisp sprite rendering (try pixelated approach)
    if (window.playerCtx) {
      // Try disabling smoothing for maximum crispness
      window.playerCtx.imageSmoothingEnabled = false;
      
      // Disable browser-specific smoothing properties for player canvas
      if (window.playerCtx.webkitImageSmoothingEnabled !== undefined) {
        window.playerCtx.webkitImageSmoothingEnabled = false;
      }
      if (window.playerCtx.mozImageSmoothingEnabled !== undefined) {
        window.playerCtx.mozImageSmoothingEnabled = false;
      }
      if (window.playerCtx.msImageSmoothingEnabled !== undefined) {
        window.playerCtx.msImageSmoothingEnabled = false;
      }
      if (window.playerCtx.oImageSmoothingEnabled !== undefined) {
        window.playerCtx.oImageSmoothingEnabled = false;
      }
    }
  },
};

// Make CanvasRenderer available globally
window.CanvasRenderer = CanvasRenderer;