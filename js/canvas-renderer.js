/**
 * Canvas Renderer Module
 * Handles all canvas drawing operations including maze and player rendering
 */

console.log('Canvas Renderer module loaded');

const CanvasRenderer = {
  // Rendering state
  renderPending: false,
  lastRenderTime: 0,
  RENDER_THROTTLE: 8, // 120 FPS max for smoother movement
  renderQueued: false,

  // Performance monitoring
  frameCount: 0,
  lastPerformanceCheck: performance.now(),

  /**
   * Draw the maze with viewport culling for performance
   */
  drawMaze: function() {
    // Clear canvas
    window.ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
    
    // Set maze colors
    const wallColor = '#000000';      // Black walls
    const pathColor = '#87CEEB';      // Light blue paths
    const startColor = '#00FF00';     // Green start
    const endColor = '#FF0000';       // Red end
    
    // Calculate viewport boundaries with camera transform
    const zoom = window.CameraSystem ? window.CameraSystem.currentZoom : 1.0;
    const cameraX = window.CameraSystem ? window.CameraSystem.cameraX : 0;
    const cameraY = window.CameraSystem ? window.CameraSystem.cameraY : 0;
    
    // Calculate visible area in world coordinates (corrected formula)
    const viewportLeft = -cameraX;
    const viewportTop = -cameraY;
    const viewportRight = viewportLeft + (window.innerWidth / zoom);
    const viewportBottom = viewportTop + (window.innerHeight / zoom);
    
    // Add buffer around viewport to prevent edge artifacts
    const buffer = window.cellSize * 2;
    const startCol = Math.max(0, Math.floor((viewportLeft - buffer) / window.cellSize));
    const endCol = Math.min(window.mazeSize, Math.ceil((viewportRight + buffer) / window.cellSize));
    const startRow = Math.max(0, Math.floor((viewportTop - buffer) / window.cellSize));
    const endRow = Math.min(window.mazeSize, Math.ceil((viewportBottom + buffer) / window.cellSize));
    
    // Collect visible cells by color for batched drawing
    const walls = [];
    const paths = [];
    let startCell = null;
    let endCell = null;
    
    // Only process visible cells
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const x = col * window.cellSize;
        const y = row * window.cellSize;
        
        if (window.mazeStructure && window.mazeStructure[row] && window.mazeStructure[row][col] === 0) {
          if (row === window.startRow && col === window.startCol) {
            startCell = [x, y];
          } else if (row === window.endRow && col === window.endCol) {
            endCell = [x, y];
          } else {
            paths.push([x, y]);
          }
        } else {
          walls.push([x, y]);
        }
      }
    }
    
    // Second pass: draw all cells of same color together
    // Draw walls
    if (walls.length > 0) {
      window.ctx.fillStyle = wallColor;
      window.ctx.beginPath();
      for (const [x, y] of walls) {
        window.ctx.rect(x, y, window.cellSize, window.cellSize);
      }
      window.ctx.fill();
    }
    
    // Draw paths
    if (paths.length > 0) {
      window.ctx.fillStyle = pathColor;
      window.ctx.beginPath();
      for (const [x, y] of paths) {
        window.ctx.rect(x, y, window.cellSize, window.cellSize);
      }
      window.ctx.fill();
    }
    
    // Draw start cell
    if (startCell) {
      window.ctx.fillStyle = startColor;
      window.ctx.fillRect(startCell[0], startCell[1], window.cellSize, window.cellSize);
    }
    
    // Draw end cell
    if (endCell) {
      window.ctx.fillStyle = endColor;
      window.ctx.fillRect(endCell[0], endCell[1], window.cellSize, window.cellSize);
    }
  },

  /**
   * Draw the player on the canvas
   */
  drawPlayer: function() {
    // Simple player drawing - let the render throttling handle performance
    const spriteSize = window.cellSize * 0.8; // 80% of cell size to avoid wall clipping
    const centerOffset = (window.cellSize - spriteSize) / 2;
    const destX = window.playerX + centerOffset;
    const destY = window.playerY + centerOffset;
    
    // Ensure player is visible by using high contrast colors
    window.ctx.fillStyle = '#0066FF'; // Blue player square
    window.ctx.fillRect(destX, destY, spriteSize, spriteSize);
    
    // Add a white border around the player for better visibility
    window.ctx.strokeStyle = '#FFFFFF';
    window.ctx.lineWidth = Math.max(1, window.cellSize * 0.05); // Scale border with cell size
    window.ctx.strokeRect(destX, destY, spriteSize, spriteSize);
  },

  /**
   * Monitor rendering performance
   */
  monitorPerformance: function() {
    this.frameCount++;
    const now = performance.now();
    
    // Check performance every 5 seconds
    if (now - this.lastPerformanceCheck > 5000) {
      const fps = this.frameCount / ((now - this.lastPerformanceCheck) / 1000);
      if (fps < 30) {
        console.warn(`Low FPS detected: ${fps.toFixed(1)} FPS`);
      }
      this.frameCount = 0;
      this.lastPerformanceCheck = now;
    }
  },

  /**
   * Main rendering function with throttling
   */
  renderFrame: function() {
    // Prevent multiple pending renders
    if (this.renderPending) return;
    
    const now = performance.now();
    if (now - this.lastRenderTime < this.RENDER_THROTTLE) {
      // Use requestAnimationFrame instead of setTimeout to avoid accumulation
      if (!this.renderQueued) {
        this.renderQueued = true;
        requestAnimationFrame(() => {
          this.renderQueued = false;
          if (performance.now() - this.lastRenderTime >= this.RENDER_THROTTLE) {
            this.renderFrame();
          }
        });
      }
      return;
    }
    
    this.renderPending = true;
    this.lastRenderTime = now;
    
    requestAnimationFrame(() => {
      try {
        // Simple approach: always redraw everything 
        this.drawMaze();
        this.drawPlayer();
        
        // Monitor performance
        this.monitorPerformance();
      } catch (error) {
        console.error('Error in renderFrame:', error);
      } finally {
        this.renderPending = false;
      }
    });
  },

  /**
   * Pre-warm animation system to reduce first-run lag
   */
  prepareAnimationSystem: function() {
    // Create a test animation cycle to warm up the browser's animation engine
    this.renderFrame();
  }
};

// Make CanvasRenderer available globally
window.CanvasRenderer = CanvasRenderer;