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
  ANIMATION_SPEED: 150, // milliseconds per frame
  lastDirection: 'right',
  currentRow: 0, // 0 = right, 1 = left

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
    console.log('Creating DOM-based player sprite...');
    
    // Remove any existing player sprite first
    const existingSprite = document.getElementById('player-sprite');
    if (existingSprite) {
      existingSprite.remove();
    }
    
    // Create the player DOM element
    this.playerElement = document.createElement('div');
    this.playerElement.id = 'player-sprite';
    this.playerElement.style.position = 'fixed'; // Use 'fixed' to position relative to viewport
    this.playerElement.style.zIndex = '5'; // Above both canvases
    this.playerElement.style.pointerEvents = 'none';
    this.playerElement.style.imageRendering = 'pixelated'; // Crisp scaling
    this.playerElement.style.backgroundImage = 'url(circular-character-spritesheet.png)';
    this.playerElement.style.backgroundRepeat = 'no-repeat';
    
    // Set size based on a fixed size for better visibility (not dependent on cell size)
    const spriteSize = 48; // Fixed size for better visibility when centered
    this.playerElement.style.width = spriteSize + 'px';
    this.playerElement.style.height = spriteSize + 'px';
    
    // Set background size to scale the spritesheet properly
    const sheetWidth = 32 * 8; // 8 frames of 32px each
    const sheetHeight = 32 * 2; // 2 rows of 32px each
    const scaleX = (spriteSize * 8) / sheetWidth;
    const scaleY = (spriteSize * 2) / sheetHeight;
    this.playerElement.style.backgroundSize = `${sheetWidth * scaleX}px ${sheetHeight * scaleY}px`;
    
    // Add to the maze container FIRST before positioning
    const mazeContainer = document.getElementById('maze-container');
    if (mazeContainer) {
      mazeContainer.appendChild(this.playerElement);
    } else {
      console.error('❌ Maze container not found!');
      return;
    }
    
    // FIXED POSITIONING: Use the actual current player coordinates
    this.updateSpritePosition();
    
    this.spriteLoaded = true;
    
    // Force initial render
    this.renderFrame();
  },

  /**
   * Update animation frame (optimized for performance)
   */
  updateAnimation: function() {
    if (!this.spriteLoaded) return;
    
    const now = performance.now();
    const isMoving = window.PlayerController && window.PlayerController.playerIsMoving;
    
    // Only update animation when actually moving to reduce CPU usage
    if (!isMoving) return;
    
    // Determine movement direction (cached check)
    let currentDirection = this.lastDirection;
    if (window.PlayerController && window.PlayerController.smoothMovementKeys) {
      const keys = window.PlayerController.smoothMovementKeys;
      if (keys['ArrowLeft'] || keys['a']) {
        currentDirection = 'left';
      } else if (keys['ArrowRight'] || keys['d']) {
        currentDirection = 'right';
      }
    }
    
    // Update sprite row based on direction
    this.currentRow = currentDirection === 'left' ? 1 : 0;
    this.lastDirection = currentDirection;
    
    // Only advance animation frame when enough time has passed
    if (now - this.lastAnimationTime > this.ANIMATION_SPEED) {
      this.animationFrame = (this.animationFrame + 1) % 8; // 8 frames per direction
      this.lastAnimationTime = now;
    }
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
   * Draw the player - DOM-based positioning (optimized - no position updates during gameplay)
   */
  drawPlayer: function() {
    if (!this.playerElement) return;
    
    // DON'T update sprite position every frame - it's fixed to center and only needs to be set once
    // (updateSpritePosition is only called on init and when explicitly needed)
    
    // Handle animation only when moving
    const isMoving = window.PlayerController && window.PlayerController.playerIsMoving;
    if (isMoving) {
      this.updateAnimation();
      
      // Only update background position if animation frame or direction changed
      if (this.animationFrame !== this.lastAnimationFrame || this.currentRow !== this.lastCurrentRow) {
        const spriteSize = 48; // Fixed size to match initialization
        const frameWidth = 32;
        const frameHeight = 32;
        const sourceX = this.animationFrame * frameWidth;
        const sourceY = this.currentRow * frameHeight;
        
        // Scale the background position to match the scaled sprite sheet
        const scaleX = spriteSize / frameWidth;
        const scaleY = spriteSize / frameHeight;
        const bgPosX = -(sourceX * scaleX);
        const bgPosY = -(sourceY * scaleY);
        
        this.playerElement.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
        
        // Cache the animation state
        this.lastAnimationFrame = this.animationFrame;
        this.lastCurrentRow = this.currentRow;
      }
    }
  },

  /**
   * Force update player position (called directly by movement system)
   */
  updatePlayerPosition: function() {
    if (!this.playerElement) return;
    
    // Use the dedicated positioning function for consistency
    this.updateSpritePosition();
    
    // Also force animation update if moving
    const isMoving = window.PlayerController && window.PlayerController.playerIsMoving;
    if (isMoving) {
      this.updateAnimation();
      
      // Force animation frame update immediately
      if (this.animationFrame !== this.lastAnimationFrame || this.currentRow !== this.lastCurrentRow) {
        const spriteSize = 48; // Fixed size to match initialization
        const frameWidth = 32;
        const frameHeight = 32;
        const sourceX = this.animationFrame * frameWidth;
        const sourceY = this.currentRow * frameHeight;
        
        const scaleX = spriteSize / frameWidth;
        const scaleY = spriteSize / frameHeight;
        const bgPosX = -(sourceX * scaleX);
        const bgPosY = -(sourceY * scaleY);
        
        this.playerElement.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
        
        this.lastAnimationFrame = this.animationFrame;
        this.lastCurrentRow = this.currentRow;
      }
    }
  },

  /**
   * Update sprite position - SIMPLE: Always center on screen (window viewport)
   */
  updateSpritePosition: function() {
    if (!this.playerElement) return;
    
    // Get the WINDOW dimensions (viewport), not just the maze container
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate sprite size (fixed size for centered sprite)
    const spriteSize = 48; // Fixed size to match initialization
    
    // Position sprite at the CENTER of the entire window/viewport
    const centerX = (windowWidth / 2) - (spriteSize / 2);
    const centerY = (windowHeight / 2) - (spriteSize / 2);
    
    // Apply position immediately
    this.playerElement.style.left = centerX + 'px';
    this.playerElement.style.top = centerY + 'px';
    
    // Debug output removed for performance
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