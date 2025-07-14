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
  lastDirection: 'right',
  currentRow: 1, // 0 = left, 1 = right (matching your spritesheet layout)
  lastMovementTime: 0, // Track when we last detected movement
  MOVEMENT_TIMEOUT: 100, // Keep animating for 100ms after movement stops
  animationUpdateInterval: null, // Store interval ID
  
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
   * Update animation - simple system that checks if player is moving
   */
  updateAnimation: function() {
    const isMoving = window.PlayerController && window.PlayerController.playerIsMoving;
    const isGroundPounding = window.PlayerController && window.PlayerController.isGroundPounding;
    
    // Don't progress animation during ground pounding
    if (isGroundPounding) {
      return;
    }
    
    if (isMoving) {
      // Update direction based on current keys
      this.updateDirection();
      
      // Check if enough time has passed to advance the frame
      const now = performance.now();
      const timeSinceLastFrame = now - this.lastAnimationTime;
      
      if (timeSinceLastFrame >= this.ANIMATION_SPEED || this.lastAnimationTime === 0) {
        // Advance animation frame
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