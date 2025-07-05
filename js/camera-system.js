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
   * Center the camera on the player's current position
   */
  centerOnPlayer: function() {
    // Get player's center position in world coordinates
    const playerCenterX = window.playerX + (window.cellSize / 2);
    const playerCenterY = window.playerY + (window.cellSize / 2);
    
    // Calculate where to position the canvas so player appears at screen center
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    
    // Simple formula: translate = (screenCenter / zoom) - playerCenter
    this.cameraX = (screenCenterX / this.currentZoom) - playerCenterX;
    this.cameraY = (screenCenterY / this.currentZoom) - playerCenterY;
    
    // Apply the transform immediately
    this.applyCamera();
  },

  /**
   * Apply camera transformations to the canvas (optimized with caching)
   */
  applyCamera: function() {
    // Build transform string
    const transform = `scale(${this.currentZoom}) translate(${this.cameraX}px, ${this.cameraY}px)`;
    
    // Only apply if transform actually changed (major performance optimization)
    if (transform !== this.lastTransform) {
      window.canvas.style.transform = transform;
      window.canvas.style.transformOrigin = '0 0';
      this.lastTransform = transform;
    }
  },

  /**
   * Start 60 FPS camera update loop
   */
  startCameraLoop: function() {
    if (this.cameraAnimationId) {
      cancelAnimationFrame(this.cameraAnimationId);
    }
    
    const updateLoop = () => {
      if (this.cameraEnabled) {
        this.centerOnPlayer();
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
    
    // Apply reset transform efficiently
    if (window.canvas) {
      const resetTransform = 'scale(1) translate(0px, 0px)';
      window.canvas.style.transform = resetTransform;
      window.canvas.style.transformOrigin = '0 0';
      window.canvas.style.webkitTransform = resetTransform; // Webkit compatibility
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