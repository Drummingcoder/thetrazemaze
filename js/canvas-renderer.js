/**
 * Canvas Renderer Module - Clean and Simple
 * Renders maze clearly and player sprite without modifications, then scales down
 *
 * ---
 * CanvasRenderer.js Function Reference
 * ---
 * 1. setupCanvas: Setup and configure canvas elements with proper sizing and rendering contexts
 * 2. initSprites: Initialize sprite loading and DOM-based player sprite
 * 3. getInitialDirectionForLevel: Get initial facing direction for the current level
 * 4. updateAnimation: (Deprecated) Kept for backward compatibility, does nothing
 * 5. updateDirection: Update player sprite direction without resetting animation
 * 6. getMazeDimensions: Get maze dimensions with fallback logic
 * 7. drawMaze: Draw the maze on the canvas
 * 8. drawPlayer: Draw the player using DOM-based positioning and animation
 * 9. updatePlayerPosition: Force update player position (called by movement system)
 * 10. updateSpritePosition: Update sprite position, always center on screen
 * 11. renderFrame: Main rendering function with dirty checking
 * 12. forceRedraw: Force a complete redraw (when maze structure changes)
 * 13. resetCache: Reset cached positions (call when player teleports or resets)
 * 14. init: Initialize the renderer
 * 15. prepareAnimationSystem: Pre-warm animation system to reduce first-run lag
 * 16. monitorPerformance: Monitor performance (compatibility function)
 * 17. configureCanvasForSprites: Configure canvases for optimal rendering
 * 18. setPlayerOpacity: Set player sprite opacity (for blinking)
 * 19. initializeMazeDimensions: Initialize maze dimensions globally
 * 20. updateHeartOverlay: Create/fix heart overlay in top-left of viewport
 * 21. setHeartOverlayVisible: Utility to show/hide heart overlay
 * 22. loseHeart: Lose a heart and trigger invincibility/blink
 * 23. setupEndScreenHeartOverlayObserver: Hide hearts when end screen is shown
 * 24. detectCollisionWithEnemiesAndSpikes: Detect collision with enemies and spikes
 * 25. drawSpike: Draw a spike decoration on the maze
 * 26. drawTorch: Draw a torch decoration on the maze
 * 27. drawCrystal: Draw a crystal decoration on the maze
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
  playerElement: null,
  
  // Performance optimization - cache last known positions
  lastPlayerX: -1,
  lastPlayerY: -1,
  lastRenderTime: 0,

  /**
   * Setup and configure canvas elements with proper sizing and rendering contexts
   * Returns the canvas data
   * Need to initialize maze dimensions first (WIP)
   */
  setupCanvas: function(mazeSize, cellSize) {
    // Initialize maze dimensions first - but preserve existing global values if available
    let dimensions;
    if (window.mazeWidth && window.mazeHeight) {
      // Use existing global dimensions if they're already set
      dimensions = {
        width: window.mazeWidth,
        height: window.mazeHeight
      };
      console.log('✅ Using existing maze dimensions:', dimensions);
    } else {
      // Initialize maze dimensions from parameter
      dimensions = window.initializeMazeDimensions(mazeSize);
    }
    
    const mazeWidth = dimensions.width;
    const mazeHeight = dimensions.height;
    
    console.log('Setting up canvas with maze width:', mazeWidth, 'height:', mazeHeight, 'cell size:', cellSize);
    // Calculate actual maze dimensions in pixels
    const mazeWidthPx = mazeWidth * cellSize;
    const mazeHeightPx = mazeHeight * cellSize;
    
    // Get canvas elements
    const ctx = window.canvas.getContext("2d");
    const playerCtx = window.playerCanvas.getContext("2d");

    // Set canvas sizes to the actual maze size
    window.canvas.width = mazeWidthPx;
    window.canvas.height = mazeHeightPx;
    window.playerCanvas.width = mazeWidthPx;
    window.playerCanvas.height = mazeHeightPx;
    
    // Configure maze canvas for crisp geometric rendering
    ctx.imageSmoothingEnabled = false;
    
    // Configure player canvas for smooth sprite rendering
    playerCtx.imageSmoothingEnabled = true;
    playerCtx.imageSmoothingQuality = 'high';
    if (playerCtx.webkitImageSmoothingEnabled !== undefined) playerCtx.webkitImageSmoothingEnabled = true;
    if (playerCtx.mozImageSmoothingEnabled !== undefined) playerCtx.mozImageSmoothingEnabled = true;
    if (playerCtx.msImageSmoothingEnabled !== undefined) playerCtx.msImageSmoothingEnabled = true;
    if (playerCtx.oImageSmoothingEnabled !== undefined) playerCtx.oImageSmoothingEnabled = true;
    
    // Responsive sizing
    window.mazeContainer.style.width = mazeWidthPx + 'px';
    window.mazeContainer.style.height = mazeHeightPx + 'px';
    
    // Store references globally for module access
    window.ctx = ctx;
    window.playerCtx = playerCtx;
    
    console.log('Canvas setup complete:', {
      canvasSize: [mazeWidthPx, mazeHeightPx],
      mazeWidth: mazeWidth,
      mazeHeight: mazeHeight,
      cellSize: cellSize
    });
    
    return {
      mazeContainer,
      canvas,
      ctx,
      playerCanvas,
      playerCtx,
      mazeWidthPx,
      mazeHeightPx,
      mazeWidth,
      mazeHeight
    };
  },

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
    this.playerElement.style.position = 'fixed';
    this.playerElement.style.zIndex = '1000'; // Much higher z-index to ensure visibility
    this.playerElement.style.pointerEvents = 'none';
    this.playerElement.style.imageRendering = 'pixelated'; // Crisp scaling
    this.playerElement.style.backgroundImage = 'url(spritesheet.png)'; // Updated to new spritesheet
    this.playerElement.style.backgroundRepeat = 'no-repeat';
    // this.playerElement.style.border = '2px solid red'; // DEBUG: Removed red border
    
    // Set size based on cell size for better scaling with maze
    const cellSize = window.cellSize || 32;
    // Clamp sprite size to a larger range (e.g., 1.5x to 2.0x cell size)
    const spriteSize = Math.max(2.5 * cellSize, Math.min(3.5 * cellSize, 128));
    this.playerElement.style.width = spriteSize + 'px';
    this.playerElement.style.height = spriteSize + 'px';
    
    console.log(`🎯 Sprite size set to: ${spriteSize}px x ${spriteSize}px (cell size: ${cellSize})`);
    
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
    console.log(`📐 Spritesheet size set to: ${scaledSheetWidth}px x ${scaledSheetHeight}px (scale factor: ${scaleFactor})`);
    
    this.scaleFactor = scaleFactor; // Store scale factor for background position calculations
    
    // Add to the maze container
    if (window.mazeContainer) {
      console.log('Maze container found, appending sprite');
      window.mazeContainer.appendChild(this.playerElement);
    } else {
      console.error('Maze container not found! Appending to body as fallback');
      document.body.appendChild(this.playerElement);
    }
    
    // FIXED POSITIONING: Use the actual current player coordinates
    this.updateSpritePosition();
    
    // Initialize the PlayerAnimation system with sprite element
    // TODO: Make initial direction based on level system
    const initialDirection = this.getInitialDirectionForLevel();
    if (window.PlayerAnimation) {
      window.PlayerAnimation.init(this.playerElement, scaleFactor, initialDirection);
    } else {
      console.error('❌ PlayerAnimation module not loaded!');
    }
    
    this.spriteLoaded = true;
    
    // Force initial render
    this.renderFrame();
  },

  /**
   * Get initial facing direction for the current level
   * TODO: Update this when level system is implemented
   */
  getInitialDirectionForLevel: function() {
    // For now, always face right
    return 'right';
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
    
    // Only reset animation frame if we change direction
    const previousRow = this.currentRow;
    
    if (currentDirection === 'left' || currentDirection === 'right') {
      this.lastDirection = currentDirection;
    }
    
    // Update sprite row based on facing direction (row 0=left, row 1=right)
    this.currentRow = this.lastDirection === 'left' ? 0 : 1; // left=0, right=1
    
    // Will either keep or delete this code, but later
    // if (this.currentRow !== previousRow) {
    //   this.animationFrame = 0;
    //   if (window.debugLog) {
    //     window.debugLog(`Direction changed: Row ${previousRow} → ${this.currentRow}, reset to frame 0`, 'warn');
    //   }
    // }
  },

  /**
   * Safe maze dimensions getter
   * @returns {object} {width, height} object with maze dimensions
   */
  getMazeDimensions: function() {
    // If dimensions aren't set, try to initialize them
    if (!window.mazeWidth || !window.mazeHeight) {
      if (window.initializeMazeDimensions) {
        window.initializeMazeDimensions(null); // Auto-detect from mazeStructure
      }
    }
    
    return {
      width: window.mazeWidth || window.mazeSize || 48,
      height: window.mazeHeight || window.mazeSize || 48
    };
  },

  /**
   * Draw the maze - SIMPLIFIED high-performance approach
   */
  drawMaze: function() {
    if (!window.ctx || !window.mazeStructure) {
      console.error('❌ DrawMaze: Missing ctx or mazeStructure');
      return;
    }
    
    // Clear entire canvas efficiently
    window.ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
    
    // Pre-set context properties for maximum performance
    window.ctx.imageSmoothingEnabled = false;
    
    for (let row = 0; row < window.mazeHeight; row++) {
      const rowData = window.mazeStructure[row];
      if (!rowData) continue;
      const y = row * window.cellSize;
      for (let col = 0; col < window.mazeWidth; col++) {
        const x = col * window.cellSize;
        const cell = rowData[col];
        // Start tile
        if (row === window.startRow && col === window.startCol) {
          window.ctx.fillStyle = '#C0C0C0';
          window.ctx.fillRect(x, y, window.cellSize, window.cellSize);
          window.ctx.strokeStyle = '#A0A4AA';
          window.ctx.lineWidth = Math.max(1, window.cellSize * 0.07);
          window.ctx.strokeRect(x + 1, y + 1, window.cellSize - 2, window.cellSize - 2);
          continue;
        }
        // End tile
        if (row === window.endRow && col === window.endCol) {
          const endGradient = window.ctx.createRadialGradient(
            x + window.cellSize/2, y + window.cellSize/2, window.cellSize * 0.1,
            x + window.cellSize/2, y + window.cellSize/2, window.cellSize * 0.5
          );
          endGradient.addColorStop(0, '#FF1744');
          endGradient.addColorStop(0.5, '#FF5252');
          endGradient.addColorStop(1, '#B71C1C');
          window.ctx.fillStyle = endGradient;
          window.ctx.fillRect(x, y, window.cellSize, window.cellSize);
          continue;
        }
        // Wall tile
        if (cell === 1) {
          window.ctx.fillStyle = '#E5E7EB';
          window.ctx.fillRect(x, y, window.cellSize, window.cellSize);
          continue;
        }
        // Path tile
        if (cell === 0) {
          window.ctx.fillStyle = '#7B7F85';
          window.ctx.fillRect(x, y, window.cellSize, window.cellSize);
          continue;
        }
        // Torch tile
        if (cell === 3) {
          window.ctx.fillStyle = '#7B7F85';
          window.ctx.fillRect(x, y, window.cellSize, window.cellSize);
          if (typeof drawTorch === 'function') drawTorch(window.ctx, x, y, window.cellSize); // Draw torch
          continue;
        }
        // Crystal tile
        if (cell === 2) {
          window.ctx.fillStyle = '#7B7F85';
          window.ctx.fillRect(x, y, window.cellSize, window.cellSize);
          if (typeof drawCrystal === 'function') drawCrystal(window.ctx, x, y, window.cellSize); // Draw crystal
          continue;
        }
        // Spike tile
        if (cell === 4) {
          window.ctx.fillStyle = '#7B7F85';
          window.ctx.fillRect(x, y, window.cellSize, window.cellSize);
          if (typeof drawSpike === 'function') drawSpike(window.ctx, x, y, window.cellSize); // Draw spike
          continue;
        }
      }
    }
  },

  /**
   * Update player position (called by movement system)
   */
  updatePlayerPosition: function() {
    if (!this.playerElement) return;

    // Use the dedicated positioning function for consistency
    this.updateSpritePosition();

    // Detect collision with spikes/enemies in a square around the player using maze coordinates
    if (window.player) {
      // Calculate player position in maze grid
      const top = parseInt(window.player.style.top);
      const left = parseInt(window.player.style.left);
      const playerRow = Math.round(top / window.cellSize);
      const playerCol = Math.round(left / window.cellSize);
      if (detectCollisionWithEnemiesAndSpikes(playerRow, playerCol, 1)) {
        // Collision detected: lose a heart or trigger game logic
        if (typeof window.loseHeart === 'function') {
          window.loseHeart();
        }
      }
    }
  },

  /**
   * Update sprite position by always centering on screen
   */
  updateSpritePosition: function() {
    if (!this.playerElement) {
      console.error('❌ Cannot update sprite position - playerElement not found');
      return;
    }
    
    // Get the viewport dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate sprite size (fixed size for centered sprite)
    const spriteSize = 48; // Fixed size to match initialization
    
    // Position sprite at the CENTER of the entire window/viewport
    const centerX = (windowWidth / 2) - (spriteSize / 2);
    const centerY = (windowHeight / 2) - (spriteSize / 2);
    
    // Only update DOM if position actually changed (avoid unnecessary reflows)
    const currentLeft = parseInt(this.playerElement.style.left) || 0;
    const currentTop = parseInt(this.playerElement.style.top) || 0;
    
    if (Math.abs(currentLeft - centerX) > 1 || Math.abs(currentTop - centerY) > 1) {
      this.playerElement.style.left = centerX + 'px';
      this.playerElement.style.top = centerY + 'px';
    }
    
    // DON'T force background position here - let the animation system handle it!
    // The animation system will set the correct frame via updateSpriteFrame()
  },

  /**
   * Main rendering function - OPTIMIZED with dirty checking
   */
  renderFrame: function() {
    // CRITICAL PERFORMANCE FIX: Only draw maze ONCE at startup, never again
    // The maze doesn't change, so redrawing it is pure waste
    if (!this.mazeDrawn) {
      this.drawMaze();
      this.mazeDrawn = true;
    }
    
    // DIRTY RENDERING: Only update player if position actually changed
    const currentPlayerX = window.playerX || 0;
    const currentPlayerY = window.playerY || 0;
    
    if (currentPlayerX !== this.lastPlayerX || currentPlayerY !== this.lastPlayerY) {
      // Player position changed - update sprite
      this.updateSpritePosition();
      this.lastPlayerX = currentPlayerX;
      this.lastPlayerY = currentPlayerY;
    }
    // If player hasn't moved, skip the expensive player update
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
    this.lastRenderTime = 0;
    this.mazeDrawn = false;
    
    // Reset animation system
    if (window.PlayerAnimation) {
      window.PlayerAnimation.resetToMovementAnimation();
    }
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

/**
 * Initialize maze dimensions globally
 * This ensures mazeWidth and mazeHeight are available throughout the application
 * @param {number|object} mazeSize - Either a number (for square mazes) or {width, height} object
 */
function initializeMazeDimensions(mazeSize) {
  console.log('DEBUG: initializeMazeDimensions called with:', mazeSize);
  if (typeof mazeSize === 'object' && mazeSize !== null) {
    // Handle {width, height} object
    window.mazeWidth = mazeSize.width;
    window.mazeHeight = mazeSize.height;
    console.log('DEBUG: Set from object - width:', window.mazeWidth, 'height:', window.mazeHeight);
  } else if (typeof mazeSize === 'number') {
    // Handle square maze (single number)
    window.mazeWidth = mazeSize;
    window.mazeHeight = mazeSize;
    console.log('DEBUG: Set from number - width:', window.mazeWidth, 'height:', window.mazeHeight);
  } else {
    // Fallback: try to detect from mazeStructure
    if (window.mazeStructure && Array.isArray(window.mazeStructure)) {
      window.mazeHeight = window.mazeStructure.length;
      window.mazeWidth = window.mazeStructure[0] ? window.mazeStructure[0].length : 0;
      console.log('DEBUG: Set from mazeStructure - width:', window.mazeWidth, 'height:', window.mazeHeight);
    } else {
      // Last resort: use legacy mazeWidth/mazeHeight if available
      window.mazeWidth = window.mazeWidth || 48;
      window.mazeHeight = window.mazeHeight || 48;
      console.log('DEBUG: Set from fallback - width:', window.mazeWidth, 'height:', window.mazeHeight);
    }
  }
  console.log('Maze dimensions initialized:', {
    width: window.mazeWidth,
    height: window.mazeHeight
  });
  return {
    width: window.mazeWidth,
    height: window.mazeHeight
  };
}

// Make the function globally available
window.initializeMazeDimensions = initializeMazeDimensions;

// Heart system: player starts with 3 hearts
window.playerHearts = 3;
window.playerInvincible = false;
window.playerInvincibleTimeout = null;

// Create heart overlay in top-left of viewport
function updateHeartOverlay() {
  let heartDiv = document.getElementById('heart-overlay');
  if (!heartDiv) {
    heartDiv = document.createElement('div');
    heartDiv.id = 'heart-overlay';
    heartDiv.style.position = 'fixed';
    heartDiv.style.top = '18px';
    heartDiv.style.left = '18px';
    heartDiv.style.zIndex = '3000';
    heartDiv.style.pointerEvents = 'none';
    heartDiv.style.fontSize = '32px';
    heartDiv.style.fontFamily = 'Arial, sans-serif';
    heartDiv.style.color = '#FF1744';
    heartDiv.style.textShadow = '0 2px 8px #FF5252';
    heartDiv.style.display = 'none'; // Hidden by default
    document.body.appendChild(heartDiv);
  }
  let hearts = '';
  for (let i = 0; i < window.playerHearts; i++) {
    hearts += '❤';
  }
  heartDiv.innerHTML = hearts;
}

// Make updateHeartOverlay globally accessible
window.updateHeartOverlay = updateHeartOverlay;

// Utility to show/hide heart overlay
function setHeartOverlayVisible(visible) {
  const heartDiv = document.getElementById('heart-overlay');
  if (heartDiv) {
    heartDiv.style.display = visible ? 'block' : 'none';
  }
}

// Make setHeartOverlayVisible globally accessible
window.setHeartOverlayVisible = setHeartOverlayVisible;

// Lose a heart and trigger invincibility/blink
window.loseHeart = function() {
  if (window.playerInvincible) return; // Can't lose heart while invincible
  if (window.playerHearts > 0) {
    window.playerHearts--;
    updateHeartOverlay();
    if (window.CanvasRenderer) window.CanvasRenderer.forceRedraw();
    // Start invincibility and blinking
    window.playerInvincible = true;
    let blinkCount = 0;
    const blinkTotal = 10;
    const blinkInterval = 100; // ms
    if (window.CanvasRenderer && window.CanvasRenderer.setPlayerOpacity) {
      window.CanvasRenderer.setPlayerOpacity(0);
    }
    window.playerInvincibleTimeout = setInterval(() => {
      blinkCount++;
      if (window.CanvasRenderer && window.CanvasRenderer.setPlayerOpacity) {
        window.CanvasRenderer.setPlayerOpacity(blinkCount % 2 === 0 ? 0 : 1);
      }
      if (blinkCount >= blinkTotal) {
        clearInterval(window.playerInvincibleTimeout);
        window.playerInvincibleTimeout = null;
        window.playerInvincible = false;
        if (window.CanvasRenderer && window.CanvasRenderer.setPlayerOpacity) {
          window.CanvasRenderer.setPlayerOpacity(1);
        }
      }
    }, blinkInterval);
    if (window.playerHearts === 0) {
      // Game over: show end screen with failure message
      if (window.endScreen) {
        window.endScreen.classList.remove('hidden');
        // Set failure message and hide personal best
        var personalBestElem = document.getElementById('personal-best');
        var newPersonalBestElem = document.getElementById('new-personal-best');
        var endContentElem = document.getElementById('end-content');
        var endTimeTakenElem = document.getElementById('end-time-taken');
        
        if (endContentElem) {
          endContentElem.textContent = 'Level Failed...';
        }
        if (personalBestElem) {
          personalBestElem.style.display = 'none';
        }
        if (newPersonalBestElem) {
          newPersonalBestElem.style.display = 'none';
        }
        // Hide the time taken display since the level wasn't completed
        if (endTimeTakenElem) {
          endTimeTakenElem.style.display = 'none';
        }
      }
      setHeartOverlayVisible(false);
    }
  }
};

// Hide hearts when end screen is shown (player wins)
// Robustly hide hearts whenever end screen is visible, even if window.endScreen is defined later
let endScreenObserverInitialized = false;
function setupEndScreenHeartOverlayObserver() {
  if (endScreenObserverInitialized) return;
  endScreenObserverInitialized = true;
  function observeEndScreen(endScreen) {
    // Initial check in case end screen is already visible
    if (!endScreen.classList.contains('hidden')) {
      setHeartOverlayVisible(false);
    }
    // Only one observer per endScreen
    if (endScreen._heartOverlayObserverAttached) return;
    endScreen._heartOverlayObserverAttached = true;
    const observer = new MutationObserver(() => {
      if (!endScreen.classList.contains('hidden')) {
        setHeartOverlayVisible(false);
      }
    });
    observer.observe(endScreen, { attributes: true, attributeFilter: ['class'] });
  }

  if (window.endScreen) {
    observeEndScreen(window.endScreen);
  } else {
    // Wait for endScreen to be added to window, only one interval
    let checkInterval = null;
    function checkForEndScreen() {
      if (window.endScreen) {
        if (checkInterval) clearInterval(checkInterval);
        observeEndScreen(window.endScreen);
      }
    }
    checkInterval = setInterval(checkForEndScreen, 100);
  }
}
setupEndScreenHeartOverlayObserver();

// Set player sprite opacity (for blinking)
CanvasRenderer.setPlayerOpacity = function(opacity) {
  if (this.playerElement) {
    this.playerElement.style.opacity = opacity;
  }
};

// Update heart overlay on startup and after maze redraw
if (typeof updateHeartOverlay === 'function') updateHeartOverlay();
const origForceRedraw = CanvasRenderer.forceRedraw;
CanvasRenderer.forceRedraw = function() {
  if (typeof updateHeartOverlay === 'function') updateHeartOverlay();
  origForceRedraw.call(this);
};

/**
 * Detect collision with enemies and spikes in a square around the player sprite
 * Checks for spikes (cell value 4) and enemies (cell value 5 or custom logic)
 * @param {number} playerRow
 * @param {number} playerCol
 * @param {number} radius
 * @returns {boolean} true if collision detected
 */
function detectCollisionWithEnemiesAndSpikes(playerRow, playerCol, radius = 1) {
  if (!window.mazeStructure) return false;
  
  // Use safer dimension getter
  const dimensions = window.CanvasRenderer ? window.CanvasRenderer.getMazeDimensions() : {
    width: window.mazeWidth || window.mazeSize || 48,
    height: window.mazeHeight || window.mazeSize || 48
  };
  const mazeWidth = dimensions.width;
  const mazeHeight = dimensions.height;
  
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const r = playerRow + dr;
      const c = playerCol + dc;
      if (r >= 0 && r < mazeHeight && c >= 0 && c < mazeWidth) {
        const cell = window.mazeStructure[r][c];
        if (cell === 4) {
          // Spike collision
          return true;
        }
        // Example: enemies could be cell value 5, or you can add custom logic here
        if (cell === 5) {
          // Enemy collision
          return true;
        }
      }
    }
  }
  return false;
}
/**
 * Draw a spike decoration on the maze
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} cellSize
 */
function drawSpike(ctx, x, y, cellSize) {
  ctx.save();
  // Position at bottom center of cell
  ctx.translate(x + cellSize/2, y + cellSize);
  // Draw spike base (triangle fills cell vertically)
  ctx.beginPath();
  ctx.moveTo(-cellSize*0.4, 0); // left base
  ctx.lineTo(0, -cellSize);    // tip at top of cell
  ctx.lineTo(cellSize*0.4, 0); // right base
  ctx.closePath();
  ctx.fillStyle = '#B0BEC5'; // Light gray for spike
  ctx.fill();
  // Spike highlight
  ctx.beginPath();
  ctx.moveTo(0, -cellSize);
  ctx.lineTo(0, 0);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
/**
 * Draw a torch decoration on the maze
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} cellSize
 */
function drawTorch(ctx, x, y, cellSize) {
  ctx.save();
  ctx.translate(x + cellSize/2, y + cellSize*0.65);
  // Torch stick
  ctx.beginPath();
  ctx.rect(-2, 0, 4, cellSize*0.22);
  ctx.fillStyle = '#8D5524';
  ctx.fill();
  // Flame (yellow)
  ctx.beginPath();
  ctx.arc(0, -4, 7, 0, Math.PI, true);
  ctx.fillStyle = '#FFD600';
  ctx.fill();
  // Flame (orange)
  ctx.beginPath();
  ctx.arc(0, -7, 4, 0, 2*Math.PI);
  ctx.fillStyle = '#FF6F00';
  ctx.fill();
  ctx.restore();
}

/**
 * Draw a crystal decoration on the maze
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} cellSize
 */
function drawCrystal(ctx, x, y, cellSize) {
  ctx.save();
  ctx.translate(x + cellSize/2, y + cellSize/2);
  // Crystal shape (diamond)
  ctx.beginPath();
  ctx.moveTo(0, -cellSize*0.28);
  ctx.lineTo(cellSize*0.18, 0);
  ctx.lineTo(0, cellSize*0.28);
  ctx.lineTo(-cellSize*0.18, 0);
  ctx.closePath();
  ctx.fillStyle = '#4FC3F7';
  ctx.shadowColor = '#B3E5FC';
  ctx.shadowBlur = 6;
  ctx.fill();
  ctx.shadowBlur = 0;
  // Crystal highlight
  ctx.beginPath();
  ctx.moveTo(0, -cellSize*0.28);
  ctx.lineTo(0, cellSize*0.28);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}