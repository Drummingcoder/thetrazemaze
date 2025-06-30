/**
 * Maze Renderer Module
 * Handles the visual representation and rendering of the maze
 */

console.log('Maze Renderer module loaded');

const MazeRenderer = {
  // Viewport rendering properties
  viewportRadius: 25,           // How many cells to render around player
  renderedCells: new Map(),     // Cache of rendered DOM elements
  lastPlayerRow: undefined,     // Last known player row position
  lastPlayerCol: undefined,     // Last known player column position

  /**
   * Creates the main maze structure and initializes rendering
   * Sets up both preview and viewport-based rendering systems
   */
  createMaze: function() {
    // Clear any existing maze elements from the container
    while (maze.firstChild) {
      maze.removeChild(maze.firstChild);
    }
    
    // Create a static preview image first for instant visual feedback
    this.createMazePreview();
    
    // Initialize viewport-based rendering for performance
    this.initializeViewportRendering();
  },

  /**
   * Creates a canvas-based preview of the entire maze
   * Provides instant visual feedback while detailed rendering loads
   */
  createMazePreview: function() {
    // Create canvas element for maze preview
    const canvas = document.createElement('canvas');
    canvas.id = 'maze-preview';
    
    // Set canvas size to match maze dimensions (1 pixel per cell)
    canvas.width = mazeSize;
    canvas.height = mazeSize;
    
    // Scale canvas to fit container size
    canvas.style.width = maze.style.width || '750px';
    canvas.style.height = maze.style.height || '750px';
    
    // Use pixelated rendering for sharp edges
    canvas.style.imageRendering = 'pixelated';
    
    // Position canvas
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '1'; // Below detailed maze elements
    
    // Get canvas drawing context
    const ctx = canvas.getContext('2d');
    
    // Draw each maze cell as a single pixel
    for (let i = 0; i < mazeSize; i++) {
      for (let j = 0; j < mazeSize; j++) {
        // Determine cell color based on position and type
        if (i === 0 || i === mazeSize - 1 || j === 0 || j === mazeSize - 1) {
          // Border walls are brown
          ctx.fillStyle = '#8B4513';
        } else if (mazeStructure[i][j] === 1) {
          // Interior walls: black for hidden mode, brown for normal
          ctx.fillStyle = type === "black" ? '#000000' : '#8B4513';
        } else {
          // Paths: black for hidden mode, beige for normal
          ctx.fillStyle = type === "black" ? '#000000' : '#F5F5DC';
        }
        
        // Draw single pixel for this cell
        ctx.fillRect(j, i, 1, 1);
      }
    }
    
    // Mark start position in green
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(startCol, startRow, 1, 1);
    
    // Mark end position in red
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(endCol, endRow, 1, 1);
    
    // Add canvas to maze container
    maze.appendChild(canvas);
  },

  /**
   * Sets up viewport-based rendering system for performance optimization
   * Only renders maze cells visible around the player
   */
  initializeViewportRendering: function() {
    // Calculate optimal viewport radius based on maze size and cell size
    this.viewportRadius = Math.max(25, Math.floor(Math.min(mazeSize, 600) / cellSize / 4));
    
    // Initialize rendering cache and player position tracking
    this.renderedCells = new Map();
    this.lastPlayerRow = startRow;
    this.lastPlayerCol = startCol;
    
    console.log('Viewport radius set to:', this.viewportRadius);
    
    // Perform initial viewport render around starting position
    this.updateViewport(startRow, startCol, true);
  },

  /**
   * Updates the viewport rendering based on player position
   * @param {number} playerRow - Current player row position
   * @param {number} playerCol - Current player column position  
   * @param {boolean} forceUpdate - Whether to force update regardless of movement
   */
  updateViewport: function(playerRow, playerCol, forceUpdate = false) {
    // Safety check: ensure viewport rendering is properly initialized
    if (!this.renderedCells || this.lastPlayerRow === undefined || this.lastPlayerCol === undefined) {
      return;
    }
    
    // Calculate how far the player has moved
    const rowDiff = Math.abs(playerRow - this.lastPlayerRow);
    const colDiff = Math.abs(playerCol - this.lastPlayerCol);
    
    // Only update if player moved significantly or update is forced
    if (!forceUpdate && rowDiff < 3 && colDiff < 3) {
      return; // Skip update if movement is too small
    }
    
    // Update tracked player position
    this.lastPlayerRow = playerRow;
    this.lastPlayerCol = playerCol;
    
    // Calculate viewport boundaries (what cells should be visible)
    const minRow = Math.max(0, playerRow - this.viewportRadius);
    const maxRow = Math.min(mazeSize - 1, playerRow + this.viewportRadius);
    const minCol = Math.max(0, playerCol - this.viewportRadius);
    const maxCol = Math.min(mazeSize - 1, playerCol + this.viewportRadius);
    
    // Remove cells that are now outside the viewport
    this.renderedCells.forEach((cell, key) => {
      const [row, col] = key.split(',').map(Number);
      
      // Check if cell is outside new viewport bounds
      if (row < minRow || row > maxRow || col < minCol || col > maxCol) {
        // Remove from DOM if it exists
        if (cell.parentNode) {
          cell.parentNode.removeChild(cell);
        }
        // Remove from cache
        this.renderedCells.delete(key);
      }
    });
    
    // Add cells that are now within the viewport
    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        const key = `${i},${j}`;
        
        // Only create cell if it doesn't already exist
        if (!this.renderedCells.has(key)) {
          const cell = this.createMazeCell(i, j);
          if (cell) {
            maze.appendChild(cell);
            this.renderedCells.set(key, cell);
          }
        }
      }
    }
    
    // Hide preview canvas when we start with detailed rendering
    if (forceUpdate) {
      const preview = document.getElementById('maze-preview');
      if (preview) {
        preview.style.display = 'none'; // Hide since we start zoomed in
      }
    }
  },

  /**
   * Creates a single maze cell DOM element
   * @param {number} i - Row position of the cell
   * @param {number} j - Column position of the cell
   * @returns {HTMLElement} The created cell element
   */
  createMazeCell: function(i, j) {
    // Create div element for the cell
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.style.zIndex = '2'; // Above preview canvas

    // Determine cell type and apply appropriate CSS class
    if (i === 0 || i === mazeSize - 1 || j === 0 || j === mazeSize - 1) {
      // Border cells are always walls
      cell.classList.add("wall");
    } else if (mazeStructure[i][j] === 1) {
      // Interior wall cells
      cell.classList.add("wall");
    } else if (mazeStructure[i][j] === 0) {
      // Path cells - different styling based on maze type
      if (type === "black") {
        cell.classList.add("black"); // Hidden maze mode
      } else {
        cell.classList.add("path"); // Normal maze mode
      }
    }

    // Position the cell in the maze
    cell.style.top = i * cellSize + "px";
    cell.style.left = j * cellSize + "px";
    
    // Add special markers for start and end positions
    if (i === startRow && j === startCol) {
      cell.classList.add("start"); // Green start marker
    } else if (i === endRow && j === endCol) {
      cell.classList.add("end"); // Red end marker
    }
    
    return cell;
  },

  /**
   * Forces a complete re-render of the maze
   * Used when maze structure changes (like in multiple goals mode)
   */
  forceRerenderMaze: function() {
    // Clear all cached rendered cells
    this.renderedCells.clear();
    
    // Remove all cell elements from DOM
    const cells = maze.querySelectorAll('.cell');
    cells.forEach(cell => {
      if (cell.parentNode) {
        cell.parentNode.removeChild(cell);
      }
    });
    
    // Recreate the maze with current player position
    if (this.lastPlayerRow !== undefined && this.lastPlayerCol !== undefined) {
      this.updateViewport(this.lastPlayerRow, this.lastPlayerCol, true);
    }
    
    // Call external render function if available (for canvas rendering)
    if (typeof renderFrame === 'function') {
      renderFrame();
    }
  },

  /**
   * Invalidates any cached maze rendering data
   * Used when maze structure changes
   */
  invalidateCache: function() {
    // Call external cache invalidation if available
    if (typeof invalidateMazeCache === 'function') {
      invalidateMazeCache();
    }
    
    // Clear local rendering cache
    this.renderedCells.clear();
  }
};

// Make MazeRenderer globally available
window.MazeRenderer = MazeRenderer;
