console.log('newlibrary.js loaded successfully');

var myLibrary = {
  timeElapsed: 0,
  interval: 0,
  preloadedAudio: null,

  // Preload audio to reduce lag on first play
  preloadAudio: function() {
    this.preloadedAudio = new Audio('Enaudi Experience.mp3');
    this.preloadedAudio.preload = 'auto';
    this.preloadedAudio.volume = 1.0;
    // Trigger loading without playing
    this.preloadedAudio.load();
  },

  generateStartAndEndPositions: function() {
    // Use smaller spacing for dense corridor maze with 3-wide pathways
    startRow = 2; // Start in a 3-wide corridor
    startCol = 2;
    endRow = mazeSize - 3; // End in a 3-wide corridor  
    endCol = mazeSize - 3;
  },

  generateRandomMaze: function() {
    // Initialize maze as all walls
    mazeStructure = [];
    for (let i = 0; i < mazeSize; i++) {
      const row = [];
      for (let j = 0; j < mazeSize; j++) {
        row.push(1);
      }
      mazeStructure.push(row);
    }

    // Generate maze with 3-cell wide corridors using modified recursive backtracking
    // We'll work on a grid where each "cell" represents a 4x4 block (3 corridor + 1 wall)
    const gridSize = Math.floor(mazeSize / 4);
    const visited = [];
    for (let i = 0; i < gridSize; i++) {
      visited[i] = [];
      for (let j = 0; j < gridSize; j++) {
        visited[i][j] = false;
      }
    }

    // Stack for backtracking
    const stack = [];
    
    // Start from a random position
    let currentRow = Math.floor(Math.random() * gridSize);
    let currentCol = Math.floor(Math.random() * gridSize);
    
    // Mark starting cell as visited and carve it out (3x3 corridor)
    visited[currentRow][currentCol] = true;
    this.carveWideCorridor(currentRow, currentCol);
    
    stack.push([currentRow, currentCol]);

    while (stack.length > 0) {
      const neighbors = this.getUnvisitedNeighbors(currentRow, currentCol, gridSize, visited);
      
      if (neighbors.length > 0) {
        // Choose a random neighbor
        const nextCell = neighbors[Math.floor(Math.random() * neighbors.length)];
        const [nextRow, nextCol] = nextCell;
        
        // Mark as visited and carve corridor
        visited[nextRow][nextCol] = true;
        this.carveWideCorridor(nextRow, nextCol);
        
        // Carve connection between current and next cell
        this.carveConnection(currentRow, currentCol, nextRow, nextCol);
        
        // Push current cell to stack and move to next
        stack.push([currentRow, currentCol]);
        currentRow = nextRow;
        currentCol = nextCol;
      } else {
        // Backtrack
        if (stack.length > 0) {
          [currentRow, currentCol] = stack.pop();
        }
      }
    }
  },

  // Helper function to carve out a 3x3 corridor in the maze
  carveWideCorridor: function(gridRow, gridCol) {
    const startRow = gridRow * 4 + 1; // Skip border and leave space for walls
    const startCol = gridCol * 4 + 1;
    
    // Carve 3x3 area
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const row = startRow + r;
        const col = startCol + c;
        if (row >= 0 && row < mazeSize && col >= 0 && col < mazeSize) {
          mazeStructure[row][col] = 0; // 0 = open path
        }
      }
    }
  },

  // Helper function to carve connection between two adjacent grid cells
  carveConnection: function(fromRow, fromCol, toRow, toCol) {
    const fromCenterRow = fromRow * 4 + 2; // Center of 3x3 corridor
    const fromCenterCol = fromCol * 4 + 2;
    const toCenterRow = toRow * 4 + 2;
    const toCenterCol = toCol * 4 + 2;
    
    // Determine direction and carve 3-wide connection
    if (fromRow === toRow) {
      // Horizontal connection
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
      // Vertical connection
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

  // Helper function to get unvisited neighbors in grid coordinates
  getUnvisitedNeighbors: function(row, col, gridSize, visited) {
    const neighbors = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
    
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
        if (!visited[newRow][newCol]) {
          neighbors.push([newRow, newCol]);
        }
      }
    }
    
    return neighbors;
  },

  playMusic: function() {
    if (this.preloadedAudio) {
      this.preloadedAudio.currentTime = 0; // Reset to beginning
      this.preloadedAudio.play().catch(e => {
        console.log('Audio play failed:', e);
        // Fallback to creating new audio if preloaded fails
        var audio = new Audio('Enaudi Experience.mp3');
        audio.play();
      });
    } else {
      // Fallback if preloading didn't work
      var audio = new Audio('Enaudi Experience.mp3');
      audio.play();
    }
  },

  generateClearPath: function() {
    // Create dense maze with 3-wide corridors like original but wider
    mazeStructure[startRow][startCol] = 0;
    mazeStructure[endRow][endCol] = 0;

    const stack = [];
    const visited = {};

    function getNeighbor(row, col) {
      const neighbors = [];
      // Use 4-cell spacing to create 3-wide corridors with 1-cell walls
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

    function carveWideCorridor(row, col) {
      // Create 3-wide pathway at this position
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
      // Create 3-wide corridor connection
      if (nextRow === row) {
        // Horizontal corridor
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
        // Vertical corridor
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

    // Iterative maze generation to avoid stack overflow
    let currentRow = startRow;
    let currentCol = startCol;
    
    visited[`${currentRow}-${currentCol}`] = true;
    carveWideCorridor(currentRow, currentCol);

    while (true) {
      const neighbors = getNeighbor(currentRow, currentCol);
      
      if (neighbors.length > 0) {
        // Choose a random neighbor
        const [nextRow, nextCol] = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Mark as visited and carve corridor
        visited[`${nextRow}-${nextCol}`] = true;
        carveWideCorridor(nextRow, nextCol);
        carveConnection(currentRow, currentCol, nextRow, nextCol);
        
        // Push current position to stack and move to next
        stack.push([currentRow, currentCol]);
        currentRow = nextRow;
        currentCol = nextCol;
      } else {
        // Backtrack
        if (stack.length > 0) {
          [currentRow, currentCol] = stack.pop();
        } else {
          // No more cells to visit
          break;
        }
      }
    }
  },

  // Helper function to create a 3x3 open area
  createWidePathway: function(centerRow, centerCol) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const row = centerRow + i;
        const col = centerCol + j;
        if (row >= 0 && row < mazeSize && col >= 0 && col < mazeSize) {
          mazeStructure[row][col] = 0;
        }
      }
    }
  },

  // Helper function to create wide corridors between two points
  createWideCorridor: function(startRow, startCol, endRow, endCol) {
    const deltaRow = endRow - startRow;
    const deltaCol = endCol - startCol;
    
    // Create horizontal corridor
    if (deltaCol !== 0) {
      const direction = deltaCol > 0 ? 1 : -1;
      for (let col = startCol; col !== endCol + direction; col += direction) {
        for (let i = -1; i <= 1; i++) {
          const row = startRow + i;
          if (row >= 0 && row < mazeSize && col >= 0 && col < mazeSize) {
            mazeStructure[row][col] = 0;
          }
        }
      }
    }
    
    // Create vertical corridor
    if (deltaRow !== 0) {
      const direction = deltaRow > 0 ? 1 : -1;
      for (let row = startRow; row !== endRow + direction; row += direction) {
        for (let j = -1; j <= 1; j++) {
          const col = startCol + j;
          if (row >= 0 && row < mazeSize && col >= 0 && col < mazeSize) {
            mazeStructure[row][col] = 0;
          }
        }
      }
    }
  },

  generateEasyPath: function() {
    // Create dense maze with 3-wide corridors like original but wider + easier
    mazeStructure[startRow][startCol] = 0;
    mazeStructure[endRow][endCol] = 0;

    const stack = [];
    const visited = {};

    function getNeighbor(row, col) {
      const neighbors = [];
      // Use 4-cell spacing to create 3-wide corridors with 1-cell walls
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

    function carveWideCorridor(row, col) {
      // Create 3-wide pathway at this position
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
      // Create 3-wide corridor connection
      if (nextRow === row) {
        // Horizontal corridor
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
        // Vertical corridor
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

    function addRandomOpenings() {
      // Add random wall removal for easier navigation
      const randomRemoveChance = 0.3;
      for (let i = 1; i < mazeSize - 1; i++) {
        for (let j = 1; j < mazeSize - 1; j++) {
          if (mazeStructure[i][j] === 1 && Math.random() < randomRemoveChance) {
            // Check if removing this wall creates a useful opening
            const openNeighbors = [
              i > 0 && mazeStructure[i-1][j] === 0,
              i < mazeSize-1 && mazeStructure[i+1][j] === 0,
              j > 0 && mazeStructure[i][j-1] === 0,
              j < mazeSize-1 && mazeStructure[i][j+1] === 0
            ].filter(Boolean).length;
            
            if (openNeighbors >= 2) {
              mazeStructure[i][j] = 0;
            }
          }
        }
      }
    }

    // Iterative maze generation to avoid stack overflow
    let currentRow = startRow;
    let currentCol = startCol;
    
    visited[`${currentRow}-${currentCol}`] = true;
    carveWideCorridor(currentRow, currentCol);

    while (true) {
      const neighbors = getNeighbor(currentRow, currentCol);
      
      if (neighbors.length > 0) {
        // Choose a random neighbor
        const [nextRow, nextCol] = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Mark as visited and carve corridor
        visited[`${nextRow}-${nextCol}`] = true;
        carveWideCorridor(nextRow, nextCol);
        carveConnection(currentRow, currentCol, nextRow, nextCol);
        
        // Push current position to stack and move to next
        stack.push([currentRow, currentCol]);
        currentRow = nextRow;
        currentCol = nextCol;
      } else {
        // Backtrack
        if (stack.length > 0) {
          [currentRow, currentCol] = stack.pop();
        } else {
          // No more cells to visit
          break;
        }
      }
    }

    // Add random openings to make it easier
    addRandomOpenings();
  },

  createMaze: function() {
    // Clear any existing maze elements
    while (maze.firstChild) {
      maze.removeChild(maze.firstChild);
    }
    
    // Create a static preview image first for instant visual feedback
    this.createMazePreview();
    
    // Initialize viewport-based rendering
    this.initializeViewportRendering();
  },

  createMazePreview: function() {
    // Create a canvas-based preview of the entire maze for instant loading
    const canvas = document.createElement('canvas');
    canvas.id = 'maze-preview';
    canvas.width = mazeSize;
    canvas.height = mazeSize;
    canvas.style.width = maze.style.width || '750px';
    canvas.style.height = maze.style.height || '750px';
    canvas.style.imageRendering = 'pixelated';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '1';
    
    const ctx = canvas.getContext('2d');
    
    // Draw the maze structure as pixels
    for (let i = 0; i < mazeSize; i++) {
      for (let j = 0; j < mazeSize; j++) {
        if (i === 0 || i === mazeSize - 1 || j === 0 || j === mazeSize - 1) {
          ctx.fillStyle = '#8B4513'; // Brown for border walls
        } else if (mazeStructure[i][j] === 1) {
          ctx.fillStyle = type === "black" ? '#000000' : '#8B4513'; // Wall color
        } else {
          ctx.fillStyle = type === "black" ? '#000000' : '#F5F5DC'; // Path color
        }
        ctx.fillRect(j, i, 1, 1);
      }
    }
    
    // Mark start and end positions
    ctx.fillStyle = '#00FF00'; // Green for start
    ctx.fillRect(startCol, startRow, 1, 1);
    ctx.fillStyle = '#FF0000'; // Red for end
    ctx.fillRect(endCol, endRow, 1, 1);
    
    maze.appendChild(canvas);
  },

  initializeViewportRendering: function() {
    // Define viewport size (how many cells to render around the player)
    this.viewportRadius = Math.max(25, Math.floor(Math.min(mazeSize, 600) / cellSize / 4));
    this.renderedCells = new Map(); // Track rendered DOM elements
    this.lastPlayerRow = startRow;
    this.lastPlayerCol = startCol;
    
    console.log('Viewport radius:', this.viewportRadius);
    
    // Initial viewport render around starting position
    this.updateViewport(startRow, startCol, true);
  },

  updateViewport: function(playerRow, playerCol, forceUpdate = false) {
    // Safety check: ensure viewport rendering is initialized
    if (!this.renderedCells || this.lastPlayerRow === undefined || this.lastPlayerCol === undefined) {
      return;
    }
    
    const rowDiff = Math.abs(playerRow - this.lastPlayerRow);
    const colDiff = Math.abs(playerCol - this.lastPlayerCol);
    
    // Only update if player moved significantly or forced
    if (!forceUpdate && rowDiff < 3 && colDiff < 3) {
      return;
    }
    
    this.lastPlayerRow = playerRow;
    this.lastPlayerCol = playerCol;
    
    // Calculate viewport bounds
    const minRow = Math.max(0, playerRow - this.viewportRadius);
    const maxRow = Math.min(mazeSize - 1, playerRow + this.viewportRadius);
    const minCol = Math.max(0, playerCol - this.viewportRadius);
    const maxCol = Math.min(mazeSize - 1, playerCol + this.viewportRadius);
    
    // Remove cells outside viewport
    this.renderedCells.forEach((cell, key) => {
      const [row, col] = key.split(',').map(Number);
      if (row < minRow || row > maxRow || col < minCol || col > maxCol) {
        if (cell.parentNode) {
          cell.parentNode.removeChild(cell);
        }
        this.renderedCells.delete(key);
      }
    });
    
    // Add cells within viewport
    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        const key = `${i},${j}`;
        
        if (!this.renderedCells.has(key)) {
          const cell = this.createMazeCell(i, j);
          if (cell) {
            maze.appendChild(cell);
            this.renderedCells.set(key, cell);
          }
        }
      }
    }
    
    // Hide preview canvas immediately since we start zoomed in
    if (forceUpdate) {
      const preview = document.getElementById('maze-preview');
      if (preview) {
        preview.style.display = 'none'; // Hide completely since we start zoomed
      }
    }
  },

  createMazeCell: function(i, j) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.style.zIndex = '2'; // Above preview

    if (i === 0 || i === mazeSize - 1 || j === 0 || j === mazeSize - 1) {
      cell.classList.add("wall");
    } else if (mazeStructure[i][j] === 1) {
      cell.classList.add("wall");
    } else if (mazeStructure[i][j] === 0) {
      if (type === "black")
        cell.classList.add("black");
      else
        cell.classList.add("path");
    }

    cell.style.top = i * cellSize + "px";
    cell.style.left = j * cellSize + "px";
    
    // Add start and end markers if this is the right position
    if (i === startRow && j === startCol) {
      cell.classList.add("start");
    } else if (i === endRow && j === endCol) {
      cell.classList.add("end");
    }
    
    return cell;
  },

  movePlayer: function(event, endScreen, startTime, endContent, type, personalbest, newpersonalbest, interval ) {
    if (!endScreen.classList.contains("hidden")) {
      // Player is on the end screen, do not allow movement
      return;
    }

    // Use simple positioning for the blue square player (no sprite offsets needed)
    // Since we're using a centered square that's 80% of cell size, no offset is needed
    const offsetX = 0; // No offset needed for simple square player
    const offsetY = 0; // No offset needed for simple square player

    let topPos = (parseInt(player.style.top) + offsetY) / cellSize; // No offset applied
    let leftPos = (parseInt(player.style.left) + offsetX) / cellSize; // No offset applied

    if (event.key === "ArrowUp" || event.key === "w") {
      topPos--;
    } else if (event.key === "ArrowDown" || event.key === "s") {
      topPos++;
    } else if (event.key === "ArrowLeft" || event.key === "a") {
      leftPos--;
    } else if (event.key === "ArrowRight" || event.key === "d") {
      leftPos++;
    }

    // Enhanced boundary checking - ensure player stays within maze bounds
    // and cannot move into walls (including outer border walls)
    if (
      topPos >= 1 && // Keep player away from top border (row 0)
      topPos < mazeSize - 1 && // Keep player away from bottom border (row mazeSize-1)
      leftPos >= 1 && // Keep player away from left border (col 0)
      leftPos < mazeSize - 1 && // Keep player away from right border (col mazeSize-1)
      mazeStructure[Math.floor(topPos)] && // Ensure row exists
      mazeStructure[Math.floor(topPos)][Math.floor(leftPos)] !== undefined && // Ensure cell exists
      mazeStructure[Math.floor(topPos)][Math.floor(leftPos)] !== 1 // Ensure it's not a wall
    ) {
      player.style.top = (topPos * cellSize - offsetY) + "px"; // No offset subtracted
      player.style.left = (leftPos * cellSize - offsetX) + "px"; // No offset subtracted
      
      // Update viewport based on new player position
      this.updateViewport(Math.floor(topPos), Math.floor(leftPos));
      
      // Update player position variables and camera position if zoom is enabled
      if (typeof updatePlayerPosition === 'function') {
        updatePlayerPosition();
      }
      if (typeof updateCamera === 'function') {
        updateCamera();
      }
    }
    if (multiple === "true") {
      if (Math.floor(topPos) === endRow && Math.floor(leftPos) === endCol) {
        setTimeout(() => {
          // Move start square to the position of the end square
          mazeStructure[startRow][startCol] = 0;
          startRow = endRow;
          startCol = endCol;

          // Generate new random position for the end square
          let newEndRow, newEndCol;
          do {
            newEndRow = Math.floor(Math.random() * (mazeSize - 2)) + 1;
            newEndCol = Math.floor(Math.random() * (mazeSize - 2)) + 1;
          } while (
            mazeStructure[newEndRow][newEndCol] === 1 ||
            (newEndRow === endRow && newEndCol === endCol)
          );

          // Update end square position
          mazeStructure[newEndRow][newEndCol] = 0;
          endRow = newEndRow;
          endCol = newEndCol;

          // Invalidate canvas maze cache due to structure change
          this.invalidateCanvasMazeCache();

          // Update the maze visually
          this.createMaze();
          
          // Force re-render for canvas mode
          this.forceRerenderMaze();

          mazecount++;

          // Calculate dynamic sprite offset for proper positioning
          const playerSize = Math.max(6, cellSize * 3);
          const offsetX = (playerSize - cellSize) / 2;
          const offsetY = (playerSize - cellSize) / 2;
          
          player.style.top = (startRow * cellSize - offsetY) + "px";
          player.style.left = (startCol * cellSize - offsetX) + "px";
          maze.appendChild(player);
          
          // Update viewport for new position
          this.updateViewport(startRow, startCol, true);
          
          // Update camera position if zoom is enabled
          if (typeof updateCamera === 'function') {
            updateCamera();
          }
        }, 200);
      }
      if (this.timeElapsed >= 30000) {
        window.clearInterval(this.interval);
        const endTime = new Date();
        const timeTaken = mazecount;
        const formattedTime = this.formatTime(timeTaken);

        setTimeout(() => {
          endContent.textContent = "Number of Goals Reached: " + mazecount;
          const bestTime = this.calculatePersonalBestTime(timeTaken, type);
          this.displayPersonalBestTime(bestTime, type, personalbest, newpersonalbest);
          endScreen.classList.remove("hidden");
        }, 200);
      }
    } else {
      if (Math.floor(topPos) === endRow && Math.floor(leftPos) === endCol) {
        window.clearInterval(this.interval);
        const endTime = new Date();
        const timeTaken = endTime - startTime;
        const formattedTime = this.formatTime(timeTaken);

        setTimeout(() => {
          endContent.textContent = "Time taken: " + formattedTime;
          const bestTime = this.calculatePersonalBestTime(timeTaken, type);
          this.displayPersonalBestTime(bestTime, type, personalbest, newpersonalbest);
          endScreen.classList.remove("hidden");
          if (myLibrary.preloadedAudio) {
            myLibrary.preloadedAudio.pause();
          }
        }, 200);
      }
    }

    event.preventDefault();
  },

  restartMaze: function() {
    window.location.reload();
  },

  goBack: function() {
    window.location.href = "index.html";
  },

  startTimer: function(timer) {
    const startTime = new Date();
    this.interval = setInterval(() => {
      const currentTime = new Date();
      this.timeElapsed = currentTime - startTime;
      timer.textContent = this.formatTime(this.timeElapsed); // Use "this" to refer to the myLibrary object
    }, 10);

    return { startTime, interval };
  },


  copyMazeAndTime: function() {
    const mazeString = JSON.stringify(mazeStructure)
      .replace(/1/g, "⬛️")
      .replace(/0/g, "⬜️")
      .replace(/],\[/g, "\n")
      .replace(/\[|\]|,/g, "");

    const timeTaken = document.getElementById("end-time-taken").textContent;

    let textToCopy;

    if (multiple === "true") {
      // Multiple goals mode
      if (type === "black") {
        textToCopy = "Mode: Hidden One-way Speedrun (Multiple Goals)\n" + "Maze:\n" + mazeString + "\n\n" + timeTaken + "\n" + "Try The Traze Maze here: " + "drummingcoder.github.io";
      } else {
        textToCopy = "Mode: One-way Speedrun (Multiple Goals)\n" + "Maze:\n" + mazeString + "\n\n" + timeTaken + "\n" + "Try The Traze Maze here: " + "drummingcoder.github.io";
      }
    } else {
      // Single goal mode
      if (type === "black") {
        textToCopy = "Mode: Hidden One-way Speedrun\n" + "Maze:\n" + mazeString + "\n\n" + timeTaken + "\n" + "Try The Traze Maze here: " + "drummingcoder.github.io";
      } else {
        textToCopy = "Mode: One-way Speedrun\n" + "Maze:\n" + mazeString + "\n\n" + timeTaken + "\n" + "Try The Traze Maze here: " + "drummingcoder.github.io";
      }
    }

    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = textToCopy;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand("copy");
    document.body.removeChild(tempTextArea);

    alert("Maze and time have been copied to the clipboard!");
  },

  copyEasyMazeAndTime: function() {
    const mazeString = JSON.stringify(mazeStructure)
      .replace(/1/g, "⬛️")
      .replace(/0/g, "⬜️")
      .replace(/],\[/g, "\n")
      .replace(/\[|\]|,/g, "");

    const timeTaken = document.getElementById("end-time-taken").textContent;

    let textToCopy;

    if (multiple === "true") {
      // Multiple goals mode
      if (type === "black")
        textToCopy = "Mode: Hidden Multi-way Explorer (Multiple Goals)\n" + "Maze:\n" + mazeString + "\n\n" + timeTaken + "\n" + "Try The Traze Maze here: " + "drummingcoder.github.io";
      else
        textToCopy = "Mode: Multi-way Explorer (Multiple Goals)\n" + "Maze:\n" + mazeString + "\n\n" + timeTaken + "\n" + "Try The Traze Maze here: " + "drummingcoder.github.io";
    } else {
      // Single goal mode
      if (type === "black")
        textToCopy = "Mode: Hidden Multi-way Explorer\n" + "Maze:\n" + mazeString + "\n\n" + timeTaken + "\n" + "Try The Traze Maze here: " + "drummingcoder.github.io";
      else
        textToCopy = "Mode: Multi-way Explorer\n" + "Maze:\n" + mazeString + "\n\n" + timeTaken + "\n" + "Try The Traze Maze here: " + "drummingcoder.github.io";
    }

    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = textToCopy;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand("copy");
    document.body.removeChild(tempTextArea);

    alert("Maze and time have been copied to the clipboard!");
  },

  hideEndScreen: function() {
    endScreen.classList.add("hidden");
  },

  // Calculate and store the personal best time
  calculatePersonalBestTime: function(currentTime, type) {
    let mazeIdentifier;
    if (easy === false) {
      if (mazeSize === 15) {
        if (type === "black") {
          mazeIdentifier = 'bsm';
        } else {
          mazeIdentifier = 'sm';
        }
      } else if (mazeSize === 35) {
        if (type === "black") {
          mazeIdentifier = 'bmm';
        } else {
          mazeIdentifier = 'mm';
        }
      } else if (mazeSize === 61) {
        if (type === "black") {
          mazeIdentifier = 'bbm';
        } else {
          mazeIdentifier = 'bm';
        }
      }
    } else if (easy === true) {
      if (mazeSize === 15) {
        if (type === "black") {
          mazeIdentifier = 'besm';
        } else {
          mazeIdentifier = 'esm';
        }
      } else if (mazeSize === 35) {
        if (type === "black") {
          mazeIdentifier = 'bemm';
        } else {
          mazeIdentifier = 'emm';
        }
      } else if (mazeSize === 61) {
        if (type === "black") {
          mazeIdentifier = 'bebm';
        } else {
          mazeIdentifier = 'ebm';
        }
      }
    }

    if (multiple === "true") {
      mazeIdentifier += 'm';
    }

    const storedBestTime = localStorage.getItem(mazeIdentifier);
    let bestTime = currentTime;

    if (multiple === "true") {
      bestTime = Math.max(currentTime, storedBestTime);
    } else if (storedBestTime) {
      bestTime = Math.min(currentTime, parseFloat(storedBestTime));
    }

    return bestTime;
  },

  displayPersonalBestTime: function(currentTime, type, personalbest, newpersonalbest) {
    let mazeIdentifier;
    if (easy === false) {
      if (mazeSize === 15) {
        if (type === "black") {
          mazeIdentifier = "bsm";
        } else {
          mazeIdentifier = "sm";
        }
      } else if (mazeSize === 35) {
        if (type === "black") {
          mazeIdentifier = 'bmm';
        } else {
          mazeIdentifier = 'mm';
        }
      } else if (mazeSize === 61) {
        if (type === "black") {
          mazeIdentifier = 'bbm';
        } else {
          mazeIdentifier = 'bm';
        }
      }
    } else if (easy === true) {
      if (mazeSize === 15) {
        if (type === "black") {
          mazeIdentifier = 'besm';
        } else {
          mazeIdentifier = 'esm';
        }
      } else if (mazeSize === 35) {
        if (type === "black") {
          mazeIdentifier = 'bemm';
        } else {
          mazeIdentifier = 'emm';
        }
      } else if (mazeSize === 61) {
        if (type === "black") {
          mazeIdentifier = 'bebm';
        } else {
          mazeIdentifier = 'ebm';
        }
      }
    }

    if (multiple === "true") {
      mazeIdentifier += 'm';
    }

    const storedBestTime = localStorage.getItem(mazeIdentifier);
    let bestTimeDisplay = "";

    if (multiple === "true") {
      if (!isNaN(storedBestTime)) {
        bestTimeDisplay = currentTime;
      }
    } else if (storedBestTime && !isNaN(storedBestTime)) {
      const bestTime = parseFloat(storedBestTime);
      bestTimeDisplay = this.formatTime(bestTime);
    } else if (multiple === true) {
      bestTimeDisplay = "--";
    } else {
      bestTimeDisplay = "--:--"; // Display a placeholder if no valid stored time
    }

    const personalBestElem = personalbest;
    const newPersonalBestElem = newpersonalbest;

    personalBestElem.textContent = "Personal Best: " + bestTimeDisplay;

    if (multiple === "true") {
      if (!storedBestTime || currentTime > storedBestTime) {
        newPersonalBestElem.style.display = "block";
        localStorage.setItem(mazeIdentifier, currentTime);
      } else {
        newPersonalBestElem.style.display = "none";
      }
    } else {
      if (!storedBestTime || currentTime < parseFloat(storedBestTime)) {
        newPersonalBestElem.style.display = "block";
        localStorage.setItem(mazeIdentifier, currentTime.toString());
      } else {
        newPersonalBestElem.style.display = "none";
      }
    }
  },

  // Format the time as mm:ss.sss
  formatTime: function(time) {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = time % 1000;
    return `${this.padTime(minutes)}:${this.padTime(seconds)}.${this.padTime(milliseconds, 3)}`;
  },

  // Pad the value with leading zeros and optional length
  padTime: function(value, length = 2) {
    return value.toString().padStart(length, "0");
  },

  // Canvas maze cache invalidation for performance optimization
  invalidateCanvasMazeCache: function() {
    // Call the global invalidation function if it exists (for canvas rendering)
    if (typeof invalidateMazeCache === 'function') {
      invalidateMazeCache();
    }
  },

  // Function to force cache regeneration and render
  forceRerenderMaze: function() {
    // Call the global cache invalidation and render functions if they exist
    if (typeof invalidateMazeCache === 'function') {
      invalidateMazeCache();
    }
    if (typeof renderFrame === 'function') {
      renderFrame();
    }
  },
};
