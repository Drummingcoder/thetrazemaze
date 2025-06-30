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
  cameraUpdatePending: false,

  /**
   * Initialize the camera system with optimal zoom and position
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
    
    // Enable camera following
    this.cameraEnabled = true;
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
   * Apply camera transformations to the canvas
   */
  applyCamera: function() {
    // Batch transform application - single transform string
    const transform = `scale(${this.currentZoom}) translate(${this.cameraX}px, ${this.cameraY}px)`;
    window.canvas.style.transform = transform;
    window.canvas.style.transformOrigin = '0 0';
  },

  /**
   * Update camera position (throttled)
   */
  updateCamera: function() {
    if (!this.cameraEnabled || this.cameraUpdatePending) return;
    
    this.cameraUpdatePending = true;
    requestAnimationFrame(() => {
      this.centerOnPlayer(); // This already calls applyCamera()
      this.cameraUpdatePending = false;
    });
  },

  /**
   * Reset camera to default state
   */
  resetCamera: function() {
    this.cameraEnabled = false;
    this.currentZoom = 1.0;
    this.cameraX = 0;
    this.cameraY = 0;
    // Force reset the canvas transform
    if (window.canvas) {
      window.canvas.style.transform = 'scale(1) translate(0px, 0px)';
      window.canvas.style.transformOrigin = '0 0';
      // Clear any existing transforms
      window.canvas.style.webkitTransform = 'scale(1) translate(0px, 0px)';
    }
  },

  /**
   * Start camera animation (simplified - no animation needed)
   */
  startCameraAnimation: function() {
    // No animation needed - camera updates instantly
    this.updateCamera();
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