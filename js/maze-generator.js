/**
 * Maze Generator Module
 * Handles the creation of different types of maze structures
 */

console.log('Maze Generator module loaded');

const MazeGenerator = {
  
  /**
   * Sets the start and end positions for the maze
   * Uses fixed positions optimized for the predefined maze layout
   */
  generateStartAndEndPositions: function() {
    // Start position: top-left area in a clear path
    startRow = 2; // Row 2 provides clearance from border walls
    startCol = 2; // Column 2 provides clearance from border walls
    
    // End position: bottom-right area in a clear path
    endRow = mazeSize - 3; // 3 cells from bottom to avoid border walls
    endCol = mazeSize - 3; // 3 cells from right to avoid border walls
  },

  /**
   * Generates a random maze using recursive backtracking algorithm
   * Creates 3-cell wide corridors with 1-cell walls for better navigation
   */
  generateRandomMaze: function() {
    // Initialize entire maze as walls (1 = wall, 0 = path)
    mazeStructure = [];
    for (let i = 0; i < mazeSize; i++) {
      const row = [];
      for (let j = 0; j < mazeSize; j++) {
        row.push(1); // Start with all walls
      }
      mazeStructure.push(row);
    }

    // Calculate grid size for corridor placement
    // Each "grid cell" represents a 4x4 block (3 corridor cells + 1 wall)
    const gridSize = Math.floor(mazeSize / 4);
    
    // Track which grid cells have been visited during generation
    const visited = [];
    for (let i = 0; i < gridSize; i++) {
      visited[i] = [];
      for (let j = 0; j < gridSize; j++) {
        visited[i][j] = false;
      }
    }

    // Stack for backtracking algorithm
    const stack = [];
    
    // Choose random starting position in the grid
    let currentRow = Math.floor(Math.random() * gridSize);
    let currentCol = Math.floor(Math.random() * gridSize);
    
    // Mark starting cell as visited and create corridor
    visited[currentRow][currentCol] = true;
    this.carveWideCorridor(currentRow, currentCol);
    
    // Add starting position to stack
    stack.push([currentRow, currentCol]);

    // Main maze generation loop using recursive backtracking
    while (stack.length > 0) {
      // Get unvisited neighbors of current cell
      const neighbors = this.getUnvisitedNeighbors(currentRow, currentCol, gridSize, visited);
      
      if (neighbors.length > 0) {
        // Choose random unvisited neighbor
        const nextCell = neighbors[Math.floor(Math.random() * neighbors.length)];
        const [nextRow, nextCol] = nextCell;
        
        // Mark neighbor as visited and create corridor
        visited[nextRow][nextCol] = true;
        this.carveWideCorridor(nextRow, nextCol);
        
        // Create connection between current cell and neighbor
        this.carveConnection(currentRow, currentCol, nextRow, nextCol);
        
        // Push current position to stack and move to neighbor
        stack.push([currentRow, currentCol]);
        currentRow = nextRow;
        currentCol = nextCol;
      } else {
        // No unvisited neighbors, backtrack to previous cell
        if (stack.length > 0) {
          [currentRow, currentCol] = stack.pop();
        }
      }
    }
  },

  /**
   * Creates a 3x3 corridor area in the maze grid
   * @param {number} gridRow - Grid row position (not maze cell position)
   * @param {number} gridCol - Grid column position (not maze cell position)
   */
  carveWideCorridor: function(gridRow, gridCol) {
    // Convert grid coordinates to maze coordinates
    // Add 1 to skip border and provide wall spacing
    const startRow = gridRow * 4 + 1;
    const startCol = gridCol * 4 + 1;
    
    // Carve out 3x3 area for wide corridor
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const row = startRow + r;
        const col = startCol + c;
        
        // Ensure we stay within maze boundaries
        if (row >= 0 && row < mazeSize && col >= 0 && col < mazeSize) {
          mazeStructure[row][col] = 0; // 0 = open path
        }
      }
    }
  },

  /**
   * Creates a connection corridor between two adjacent grid cells
   * @param {number} fromRow - Source grid row
   * @param {number} fromCol - Source grid column
   * @param {number} toRow - Destination grid row
   * @param {number} toCol - Destination grid column
   */
  carveConnection: function(fromRow, fromCol, toRow, toCol) {
    // Calculate center positions of both corridors
    const fromCenterRow = fromRow * 4 + 2; // Center of 3x3 corridor
    const fromCenterCol = fromCol * 4 + 2;
    const toCenterRow = toRow * 4 + 2;
    const toCenterCol = toCol * 4 + 2;
    
    // Determine connection direction and carve appropriate corridor
    if (fromRow === toRow) {
      // Horizontal connection (same row)
      const minCol = Math.min(fromCenterCol, toCenterCol);
      const maxCol = Math.max(fromCenterCol, toCenterCol);
      const row = fromCenterRow;
      
      // Carve 3-wide horizontal corridor
      for (let c = minCol; c <= maxCol; c++) {
        for (let r = row - 1; r <= row + 1; r++) {
          if (r >= 0 && r < mazeSize && c >= 0 && c < mazeSize) {
            mazeStructure[r][c] = 0;
          }
        }
      }
    } else {
      // Vertical connection (same column)
      const minRow = Math.min(fromCenterRow, toCenterRow);
      const maxRow = Math.max(fromCenterRow, toCenterRow);
      const col = fromCenterCol;
      
      // Carve 3-wide vertical corridor
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
          if (r >= 0 && r < mazeSize && c >= 0 && c < mazeSize) {
            mazeStructure[r][c] = 0;
          }
        }
      }
    }
  },

  /**
   * Finds all unvisited neighboring grid cells
   * @param {number} row - Current grid row
   * @param {number} col - Current grid column
   * @param {number} gridSize - Size of the grid
   * @param {Array} visited - 2D array tracking visited cells
   * @returns {Array} Array of [row, col] coordinates of unvisited neighbors
   */
  getUnvisitedNeighbors: function(row, col, gridSize, visited) {
    const neighbors = [];
    // Check all four directions: up, down, left, right
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      // Check if neighbor is within grid bounds and unvisited
      if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
        if (!visited[newRow][newCol]) {
          neighbors.push([newRow, newCol]);
        }
      }
    }
    
    return neighbors;
  },

  /**
   * Generates a maze with clear pathways (normal difficulty)
   * Uses recursive backtracking with 3-wide corridors
   */
  generateClearPath: function() {
    // Ensure start and end positions are clear
    mazeStructure[startRow][startCol] = 0;
    mazeStructure[endRow][endCol] = 0;

    // Initialize tracking structures
    const stack = []; // For backtracking algorithm
    const visited = {}; // Track visited positions using string keys

    /**
     * Gets valid unvisited neighbors for maze generation
     * @param {number} row - Current row position
     * @param {number} col - Current column position
     * @returns {Array} Array of neighbor coordinates
     */
    function getNeighbor(row, col) {
      const neighbors = [];
      // Use 4-cell spacing to create 3-wide corridors with 1-cell walls
      
      // Check up neighbor
      if (row >= 4 && !visited[`${row - 4}-${col}`]) {
        neighbors.push([row - 4, col]);
      }
      // Check left neighbor
      if (col >= 4 && !visited[`${row}-${col - 4}`]) {
        neighbors.push([row, col - 4]);
      }
      // Check down neighbor
      if (row < mazeSize - 4 && !visited[`${row + 4}-${col}`]) {
        neighbors.push([row + 4, col]);
      }
      // Check right neighbor
      if (col < mazeSize - 4 && !visited[`${row}-${col + 4}`]) {
        neighbors.push([row, col + 4]);
      }
      return neighbors;
    }

    /**
     * Creates a 3x3 pathway at the specified position
     * @param {number} row - Center row of the pathway
     * @param {number} col - Center column of the pathway
     */
    function carveWideCorridor(row, col) {
      // Create 3-wide pathway centered on given position
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const newRow = row + i;
          const newCol = col + j;
          // Ensure we stay within maze boundaries
          if (newRow >= 0 && newRow < mazeSize && newCol >= 0 && newCol < mazeSize) {
            mazeStructure[newRow][newCol] = 0;
          }
        }
      }
    }

    /**
     * Creates a connection corridor between two positions
     * @param {number} row - Current row
     * @param {number} col - Current column
     * @param {number} nextRow - Target row
     * @param {number} nextCol - Target column
     */
    function carveConnection(row, col, nextRow, nextCol) {
      if (nextRow === row) {
        // Horizontal corridor connection
        const startCol = Math.min(col, nextCol);
        const endCol = Math.max(col, nextCol);
        for (let c = startCol; c <= endCol; c++) {
          for (let r = row - 1; r <= row + 1; r++) {
            if (r >= 0 && r < mazeSize && c >= 0 && c < mazeSize) {
              mazeStructure[r][c] = 0;
            }
          }
        }
      } else {
        // Vertical corridor connection
        const startRow = Math.min(row, nextRow);
        const endRow = Math.max(row, nextRow);
        for (let r = startRow; r <= endRow; r++) {
          for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < mazeSize && c >= 0 && c < mazeSize) {
              mazeStructure[r][c] = 0;
            }
          }
        }
      }
    }

    // Start maze generation from the starting position
    let currentRow = startRow;
    let currentCol = startCol;
    
    // Mark starting position as visited and create corridor
    visited[`${currentRow}-${currentCol}`] = true;
    carveWideCorridor(currentRow, currentCol);

    // Main generation loop
    while (true) {
      const neighbors = getNeighbor(currentRow, currentCol);
      
      if (neighbors.length > 0) {
        // Choose random unvisited neighbor
        const [nextRow, nextCol] = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Mark neighbor as visited and create corridor
        visited[`${nextRow}-${nextCol}`] = true;
        carveWideCorridor(nextRow, nextCol);
        carveConnection(currentRow, currentCol, nextRow, nextCol);
        
        // Push current position for backtracking and move to neighbor
        stack.push([currentRow, currentCol]);
        currentRow = nextRow;
        currentCol = nextCol;
      } else {
        // No unvisited neighbors, backtrack
        if (stack.length > 0) {
          [currentRow, currentCol] = stack.pop();
        } else {
          // No more cells to visit, generation complete
          break;
        }
      }
    }
  },

  /**
   * Generates an easy maze with additional openings for easier navigation
   * Similar to generateClearPath but with random wall removal
   */
  generateEasyPath: function() {
    // Ensure start and end positions are clear
    mazeStructure[startRow][startCol] = 0;
    mazeStructure[endRow][endCol] = 0;

    const stack = [];
    const visited = {};

    // Same neighbor-finding function as generateClearPath
    function getNeighbor(row, col) {
      const neighbors = [];
      if (row >= 4 && !visited[`${row - 4}-${col}`]) {
        neighbors.push([row - 4, col]);
      }
      if (col >= 4 && !visited[`${row}-${col - 4}`]) {
        neighbors.push([row, col - 4]);
      }
      if (row < mazeSize - 4 && !visited[`${row + 4}-${col}`]) {
        neighbors.push([row + 4, col]);
      }
      if (col < mazeSize - 4 && !visited[`${row}-${col + 4}`]) {
        neighbors.push([row, col + 4]);
      }
      return neighbors;
    }

    // Same corridor carving functions as generateClearPath
    function carveWideCorridor(row, col) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const newRow = row + i;
          const newCol = col + j;
          if (newRow >= 0 && newRow < mazeSize && newCol >= 0 && newCol < mazeSize) {
            mazeStructure[newRow][newCol] = 0;
          }
        }
      }
    }

    function carveConnection(row, col, nextRow, nextCol) {
      if (nextRow === row) {
        const startCol = Math.min(col, nextCol);
        const endCol = Math.max(col, nextCol);
        for (let c = startCol; c <= endCol; c++) {
          for (let r = row - 1; r <= row + 1; r++) {
            if (r >= 0 && r < mazeSize && c >= 0 && c < mazeSize) {
              mazeStructure[r][c] = 0;
            }
          }
        }
      } else {
        const startRow = Math.min(row, nextRow);
        const endRow = Math.max(row, nextRow);
        for (let r = startRow; r <= endRow; r++) {
          for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < mazeSize && c >= 0 && c < mazeSize) {
              mazeStructure[r][c] = 0;
            }
          }
        }
      }
    }

    /**
     * Adds random openings to make the maze easier to navigate
     * Removes walls that have sufficient open neighbors
     */
    function addRandomOpenings() {
      const randomRemoveChance = 0.3; // 30% chance to remove eligible walls
      
      for (let i = 1; i < mazeSize - 1; i++) {
        for (let j = 1; j < mazeSize - 1; j++) {
          // Only consider walls for removal
          if (mazeStructure[i][j] === 1 && Math.random() < randomRemoveChance) {
            // Count open neighbors (adjacent cells that are paths)
            const openNeighbors = [
              i > 0 && mazeStructure[i-1][j] === 0,        // up
              i < mazeSize-1 && mazeStructure[i+1][j] === 0, // down
              j > 0 && mazeStructure[i][j-1] === 0,        // left
              j < mazeSize-1 && mazeStructure[i][j+1] === 0  // right
            ].filter(Boolean).length;
            
            // Only remove wall if it has at least 2 open neighbors
            // This creates useful shortcuts without making maze too easy
            if (openNeighbors >= 2) {
              mazeStructure[i][j] = 0;
            }
          }
        }
      }
    }

    // Generate base maze structure (same as generateClearPath)
    let currentRow = startRow;
    let currentCol = startCol;
    
    visited[`${currentRow}-${currentCol}`] = true;
    carveWideCorridor(currentRow, currentCol);

    while (true) {
      const neighbors = getNeighbor(currentRow, currentCol);
      
      if (neighbors.length > 0) {
        const [nextRow, nextCol] = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        visited[`${nextRow}-${nextCol}`] = true;
        carveWideCorridor(nextRow, nextCol);
        carveConnection(currentRow, currentCol, nextRow, nextCol);
        
        stack.push([currentRow, currentCol]);
        currentRow = nextRow;
        currentCol = nextCol;
      } else {
        if (stack.length > 0) {
          [currentRow, currentCol] = stack.pop();
        } else {
          break;
        }
      }
    }

    // Add random openings to make it easier (this is what makes it "easy mode")
    addRandomOpenings();
  }
};

// Make MazeGenerator globally available
window.MazeGenerator = MazeGenerator;
