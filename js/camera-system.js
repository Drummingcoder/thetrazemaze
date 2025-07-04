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

  /**
   * Initialize the camera system with optimal zoom and position (optimized)
   */
  initializeNewCamera: function() {
    // Calculate optimal zoom level
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const smallerDimension = Math.min(viewportW, viewportH);
    
    // Show about 12-15 cells in the smaller screen dimension
    const targetCellsVisible = 12;
    this.currentZoom = Math.max(1.5, Math.min(4.0, smallerDimension / (targetCellsVisible * window.cellSize)));
    
    // Center camera on player immediately
    this.centerOnPlayer();
    
    // Enable camera following and start 60 FPS update loop
    this.cameraEnabled = true;
    this.startCameraLoop();
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