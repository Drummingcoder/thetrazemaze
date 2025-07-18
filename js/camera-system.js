/**
 * Camera System Module
 * Handles camera positioning, zooming, and player following
 */

console.log('Camera System module loaded');

const CameraSystem = {
  // Camera state variables
  cameraX: 0,
  cameraY: 0,
  currentZoom: 1.0,
  cameraEnabled: false,
  
  // Performance optimization - cache transform
  lastTransform: '',
  
  // 60 FPS camera update loop
  cameraAnimationId: null,
  
  // Window resize handling
  resizeHandler: null,
  
  // Track player position before resize to prevent teleporting
  playerPositionBeforeResize: { x: 0, y: 0 },
  
  // Track window dimensions before resize to calculate offsets
  windowSizeBeforeResize: { width: 0, height: 0 },

  /**
   * Initialize the camera system with optimal zoom and position (optimized)
   */
  initializeNewCamera: function() {
    // Calculate optimal zoom level
    this.calculateOptimalZoom();
    
    // Center camera on player immediately
    this.centerOnPlayer();
    
    // Enable camera following and start 60 FPS update loop
    this.cameraEnabled = true;
    this.startCameraLoop();
    
    // Set up window resize handler
    this.setupResizeHandler();
  },

  /**
   * Calculate optimal zoom based on current window size
   */
  calculateOptimalZoom: function() {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const smallerDimension = Math.min(viewportW, viewportH);
    
    // Show about 12-15 cells in the smaller screen dimension
    const targetCellsVisible = 12;
    this.currentZoom = Math.max(1.5, Math.min(4.0, smallerDimension / (targetCellsVisible * window.cellSize)));
  },

  /**
   * Center the camera on the player's current position (optimized)
   */
  centerOnPlayer: function() {
    // Cache frequently used values
    const cellSize = window.cellSize;
    const playerX = window.playerX;
    const playerY = window.playerY;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Get player's center position in world coordinates
    const playerCenterX = playerX + (cellSize / 2);
    const playerCenterY = playerY + (cellSize / 2);
    
    // Calculate where to position the canvas so player appears at screen center
    const screenCenterX = screenWidth / 2;
    const screenCenterY = screenHeight / 2;
    
    // Simple formula: translate = (screenCenter / zoom) - playerCenter
    const newCameraX = (screenCenterX / this.currentZoom) - playerCenterX;
    const newCameraY = (screenCenterY / this.currentZoom) - playerCenterY;
    
    // Only update if position actually changed (avoid unnecessary transforms)
    if (Math.abs(newCameraX - this.cameraX) > 0.1 || Math.abs(newCameraY - this.cameraY) > 0.1) {
      this.cameraX = newCameraX;
      this.cameraY = newCameraY;
      
      // Apply the transform
      this.applyCamera();
    }
  },

  /**
   * Apply camera transformations to canvases and DOM player element (optimized)
   */
  applyCamera: function() {
    // Build transform string
    const transform = `scale(${this.currentZoom}) translate(${this.cameraX}px, ${this.cameraY}px)`;
    
    // Only apply if transform actually changed (major performance optimization)
    if (transform !== this.lastTransform) {
      // Batch DOM updates to prevent multiple reflows
      const elements = [];
      
      // Collect all elements that need transforms (excluding fixed player sprite)
      if (window.canvas) {
        elements.push(window.canvas);
      }
      if (window.playerCanvas) {
        elements.push(window.playerCanvas);
      }
      // NOTE: Don't transform player-sprite anymore since it's fixed to center
      // const playerSprite = document.getElementById('player-sprite');
      // if (playerSprite) {
      //   elements.push(playerSprite);
      // }
      
      // Apply transforms in a single batch to minimize reflow
      elements.forEach(element => {
        element.style.transform = transform;
        element.style.transformOrigin = '0 0';
      });
      
      this.lastTransform = transform;
    }
  },

  /**
   * Start optimized camera update loop - only updates when player moves
   */
  startCameraLoop: function() {
    if (this.cameraAnimationId) {
      cancelAnimationFrame(this.cameraAnimationId);
    }
    
    // Track last known player position to detect movement
    let lastPlayerX = window.playerX;
    let lastPlayerY = window.playerY;
    
    const updateLoop = () => {
      if (this.cameraEnabled) {
        // Only update camera if player has actually moved
        const currentPlayerX = window.playerX;
        const currentPlayerY = window.playerY;
        
        if (currentPlayerX !== lastPlayerX || currentPlayerY !== lastPlayerY) {
          this.centerOnPlayer();
          lastPlayerX = currentPlayerX;
          lastPlayerY = currentPlayerY;
        }
        
        this.cameraAnimationId = requestAnimationFrame(updateLoop);
      }
    };
    
    this.cameraAnimationId = requestAnimationFrame(updateLoop);
  },

  /**
   * Stop camera update loop
   */
  stopCameraLoop: function() {
    if (this.cameraAnimationId) {
      cancelAnimationFrame(this.cameraAnimationId);
      this.cameraAnimationId = null;
    }
  },

  /**
   * Pause camera updates temporarily (for performance)
   */
  pauseCamera: function() {
    this.stopCameraLoop();
  },

  /**
   * Resume camera updates
   */
  resumeCamera: function() {
    if (this.cameraEnabled) {
      this.startCameraLoop();
    }
  },

  /**
   * Update camera position (legacy - now handled by loop)
   */
  updateCamera: function() {
    if (!this.cameraEnabled) return;
    this.centerOnPlayer();
  },

  /**
   * Reset camera to default state (optimized)
   */
  resetCamera: function() {
    this.stopCameraLoop(); // Stop the update loop
    this.cameraEnabled = false;
    this.currentZoom = 1.0;
    this.cameraX = 0;
    this.cameraY = 0;
    this.lastTransform = ''; // Clear cached transform
    
    // Remove resize handler
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    
    // Apply reset transform efficiently to both canvases and DOM player
    if (window.canvas) {
      const resetTransform = 'scale(1) translate(0px, 0px)';
      window.canvas.style.transform = resetTransform;
      window.canvas.style.transformOrigin = '0 0';
      window.canvas.style.webkitTransform = resetTransform; // Webkit compatibility
      
      // Also reset player canvas
      if (window.playerCanvas) {
        window.playerCanvas.style.transform = resetTransform;
        window.playerCanvas.style.transformOrigin = '0 0';
        window.playerCanvas.style.webkitTransform = resetTransform;
      }
      
      // Also reset DOM player element
      const playerSprite = document.getElementById('player-sprite');
      if (playerSprite) {
        playerSprite.style.transform = resetTransform;
        playerSprite.style.transformOrigin = '0 0';
        playerSprite.style.webkitTransform = resetTransform;
      }
      
      this.lastTransform = resetTransform;
    }
  },

  /**
   * Start camera animation (now starts the 60 FPS loop)
   */
  startCameraAnimation: function() {
    this.startCameraLoop();
  },

  /**
   * Set up window resize handler
   */
  setupResizeHandler: function() {
    // Remove existing handler if any
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    
    // Create debounced resize handler to avoid excessive recalculations
    this.resizeHandler = this.debounce(() => {
      if (this.cameraEnabled) {
        // Store current state before any calculations
        this.playerPositionBeforeResize.x = window.playerX;
        this.playerPositionBeforeResize.y = window.playerY;
        this.windowSizeBeforeResize.width = window.innerWidth;
        this.windowSizeBeforeResize.height = window.innerHeight;
        
        // Calculate screen center offset due to window resize
        const oldCenterX = this.windowSizeBeforeResize.width / 2;
        const oldCenterY = this.windowSizeBeforeResize.height / 2;
        const newCenterX = window.innerWidth / 2;
        const newCenterY = window.innerHeight / 2;
        
        const centerOffsetX = newCenterX - oldCenterX;
        const centerOffsetY = newCenterY - oldCenterY;
        
        // Store old zoom for offset calculations
        const oldZoom = this.currentZoom;
        
        // Recalculate zoom for new window size
        this.calculateOptimalZoom();
        
        // Calculate zoom scale factor
        const zoomScaleFactor = this.currentZoom / oldZoom;
        
        // Adjust camera position to account for both center shift and zoom change
        this.cameraX = this.cameraX + (centerOffsetX / this.currentZoom);
        this.cameraY = this.cameraY + (centerOffsetY / this.currentZoom);
        
        // Apply the updated camera transform
        this.applyCamera();
        
        // Force a re-render
        if (window.CanvasRenderer) {
          window.CanvasRenderer.renderFrame();
        }
      }
    }, 100); // Debounce by 100ms
    
    window.addEventListener('resize', this.resizeHandler);
  },

  /**
   * Debounce function to prevent excessive resize calculations
   */
  debounce: function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Legacy function aliases for backward compatibility
  zoomInOnPlayer: function() {
    this.initializeNewCamera();
  },

  centerCameraOnPlayer: function() {
    this.centerOnPlayer();
  },

  updateCameraPosition: function() {
    this.updateCamera();
  }
};

// Make CameraSystem available globally
window.CameraSystem = CameraSystem;