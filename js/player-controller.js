/**
 * Player Controller Module
 * Handles player movement, collision detection, and position tracking
 */

console.log('Player Controller module loaded');

const PlayerController = {
  // Smooth movement system variables
  playerIsMoving: false,
  movementSpeed: 6, // Pixels per frame for faster movement
  smoothMovementKeys: {},
  animationFrameId: null,
  keysPressed: {},

  /**
   * Collision detection for smooth movement
   * @param {number} newX - New X position to check
   * @param {number} newY - New Y position to check
   * @returns {boolean} - True if collision detected
   */
  checkCollision: function(newX, newY) {
    // Calculate which cells the player would occupy
    const spriteSize = window.cellSize * 0.8;
    const centerOffset = (window.cellSize - spriteSize) / 2;
    
    // Check all four corners of the player sprite plus center
    const checkPoints = [
      { x: newX + centerOffset + 2, y: newY + centerOffset + 2 }, // Top-left (with small margin)
      { x: newX + centerOffset + spriteSize - 3, y: newY + centerOffset + 2 }, // Top-right
      { x: newX + centerOffset + 2, y: newY + centerOffset + spriteSize - 3 }, // Bottom-left
      { x: newX + centerOffset + spriteSize - 3, y: newY + centerOffset + spriteSize - 3 }, // Bottom-right
      { x: newX + centerOffset + spriteSize/2, y: newY + centerOffset + spriteSize/2 } // Center
    ];
    
    // Check if any point is in a wall
    for (const point of checkPoints) {
      const col = Math.floor(point.x / window.cellSize);
      const row = Math.floor(point.y / window.cellSize);
      
      // Check bounds
      if (row < 0 || row >= window.mazeSize || col < 0 || col >= window.mazeSize) {
        return true; // Collision with maze boundary
      }
      
      // Check if this cell is a wall
      if (window.mazeStructure[row] && window.mazeStructure[row][col] === 1) {
        return true; // Collision with wall
      }
    }
    
    return false; // No collision
  },

  /**
   * Check if player reached the end
   * @returns {boolean} - True if player reached end position
   */
  checkEndReached: function() {
    const spriteSize = window.cellSize * 0.8;
    const centerOffset = (window.cellSize - spriteSize) / 2;
    const playerCenterX = window.playerX + centerOffset + spriteSize / 2;
    const playerCenterY = window.playerY + centerOffset + spriteSize / 2;
    
    const playerCol = Math.floor(playerCenterX / window.cellSize);
    const playerRow = Math.floor(playerCenterY / window.cellSize);
    
    return (playerRow === window.endRow && playerCol === window.endCol);
  },

  /**
   * Smooth movement animation loop
   */
  smoothMovementLoop: function() {
    let moved = false;
    let newX = window.playerX;
    let newY = window.playerY;
    
    // Calculate movement based on pressed keys
    if (this.smoothMovementKeys["ArrowUp"] || this.smoothMovementKeys["w"]) {
      newY -= this.movementSpeed;
      moved = true;
    }
    if (this.smoothMovementKeys["ArrowDown"] || this.smoothMovementKeys["s"]) {
      newY += this.movementSpeed;
      moved = true;
    }
    if (this.smoothMovementKeys["ArrowLeft"] || this.smoothMovementKeys["a"]) {
      newX -= this.movementSpeed;
      moved = true;
    }
    if (this.smoothMovementKeys["ArrowRight"] || this.smoothMovementKeys["d"]) {
      newX += this.movementSpeed;
      moved = true;
    }
    
    // Apply movement if no collision - check each axis separately for wall sliding
    if (moved) {
      let finalX = window.playerX;
      let finalY = window.playerY;
      
      // Try horizontal movement first
      if (newX !== window.playerX && !this.checkCollision(newX, window.playerY)) {
        finalX = newX;
      }
      
      // Try vertical movement
      if (newY !== window.playerY && !this.checkCollision(finalX, newY)) {
        finalY = newY;
      }
      
      // Update player position if it changed
      if (finalX !== window.playerX || finalY !== window.playerY) {
        window.playerX = finalX;
        window.playerY = finalY;
        
        // Update virtual player object for library compatibility
        window.player.style.left = window.playerX + "px";
        window.player.style.top = window.playerY + "px";
        
        // Check if player reached the end
        if (this.checkEndReached()) {
          // Clean up all movement and animation systems
          this.cleanupMovementSystems();
          
          // Trigger end game
          setTimeout(() => {
            if (typeof window.myLibrary !== 'undefined' && typeof window.endScreen !== 'undefined') {
              window.myLibrary.endGame(window.endScreen, window.startTime, window.endContent, window.type, window.personalbest, window.newpersonalbest, window.interval);
            }
          }, 100);
        }
        
        // Update camera and render (throttled to reduce excessive redraws)
        this.updateCameraAndRender();
      }
    }
    
    // Continue animation loop if any keys are pressed
    const anyKeyPressed = Object.values(this.smoothMovementKeys).some(pressed => pressed);
    if (anyKeyPressed) {
      this.animationFrameId = requestAnimationFrame(() => this.smoothMovementLoop());
    } else {
      this.animationFrameId = null;
      this.playerIsMoving = false;
    }
  },

  /**
   * Cleanup movement systems
   */
  cleanupMovementSystems: function() {
    // Stop smooth movement
    this.smoothMovementKeys = {};
    this.keysPressed = {};
    this.playerIsMoving = false;
    
    // Cancel any pending animation frames
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('Movement systems cleaned up');
  },

  /**
   * Update player position (for compatibility with library)
   * @param {number} newRow - New row position
   * @param {number} newCol - New column position
   */
  updatePlayerPosition: function(newRow, newCol) {
    // For smooth movement, this function is simplified
    // Position updates happen directly in smoothMovementLoop()
    if (newRow !== undefined && newCol !== undefined) {
      playerX = newCol * cellSize;
      playerY = newRow * cellSize;
      this.updateCameraAndRender();
    }
  },

  /**
   * Batched update function - combines camera and render
   */
  updateCameraAndRender: function() {
    if (window.CameraSystem && window.CameraSystem.cameraEnabled) {
      window.CameraSystem.updateCamera();
    }
    if (window.CanvasRenderer) {
      window.CanvasRenderer.renderFrame();
    }
  },

  /**
   * Handles player movement based on keyboard input
   * Includes collision detection and boundary checking
   * @param {KeyboardEvent} event - The keyboard event containing key information
   * @param {HTMLElement} endScreen - The end screen element
   * @param {Date} startTime - When the game timer started
   * @param {HTMLElement} endContent - Element to display completion time
   * @param {string} type - Game type ("black" for hidden mode)
   * @param {HTMLElement} personalbest - Element showing personal best time
   * @param {HTMLElement} newpersonalbest - Element shown for new records
   * @param {boolean} interval - Whether timer is running
   */
  movePlayer: function(event, endScreen, startTime, endContent, type, personalbest, newpersonalbest, interval) {
    // Prevent movement if end screen is visible
    if (!endScreen.classList.contains("hidden")) {
      return;
    }

    // Calculate player position offsets
    // Using simple positioning for the blue square player (no sprite offsets needed)
    const offsetX = 0; // No offset needed for simple square player
    const offsetY = 0; // No offset needed for simple square player

    // Get current player position in grid coordinates
    let topPos = (parseInt(player.style.top) + offsetY) / cellSize;
    let leftPos = (parseInt(player.style.left) + offsetX) / cellSize;

    // Update position based on key pressed
    if (event.key === "ArrowUp" || event.key === "w") {
      topPos--; // Move up (decrease row)
    } else if (event.key === "ArrowDown" || event.key === "s") {
      topPos++; // Move down (increase row)
    } else if (event.key === "ArrowLeft" || event.key === "a") {
      leftPos--; // Move left (decrease column)
    } else if (event.key === "ArrowRight" || event.key === "d") {
      leftPos++; // Move right (increase column)
    }

    // Enhanced boundary and collision checking
    if (
      topPos >= 1 &&                    // Keep player away from top border (row 0)
      topPos < mazeSize - 1 &&          // Keep player away from bottom border
      leftPos >= 1 &&                   // Keep player away from left border (col 0)
      leftPos < mazeSize - 1 &&         // Keep player away from right border
      mazeStructure[Math.floor(topPos)] &&                              // Ensure row exists
      mazeStructure[Math.floor(topPos)][Math.floor(leftPos)] !== undefined && // Ensure cell exists
      mazeStructure[Math.floor(topPos)][Math.floor(leftPos)] !== 1      // Ensure it's not a wall
    ) {
      // Movement is valid - update player position
      player.style.top = (topPos * cellSize - offsetY) + "px";
      player.style.left = (leftPos * cellSize - offsetX) + "px";
      
      // Update viewport rendering based on new player position
      MazeRenderer.updateViewport(Math.floor(topPos), Math.floor(leftPos));
      
      // Update camera position if zoom/camera system is enabled
      if (typeof updatePlayerPosition === 'function') {
        updatePlayerPosition();
      }
      if (typeof updateCamera === 'function') {
        updateCamera();
      }
    }

    // Handle multiple goals mode
    if (multiple === "true") {
      this.handleMultipleGoalsMode(topPos, leftPos);
    } else {
      // Handle single goal mode - check for completion
      this.handleSingleGoalMode(topPos, leftPos, endScreen, startTime, endContent, type, personalbest, newpersonalbest, interval);
    }

    // Prevent default browser behavior for movement keys
    event.preventDefault();
  },

  /**
   * Handles logic for multiple goals mode
   * @param {number} topPos - Current player row position
   * @param {number} leftPos - Current player column position
   */
  handleMultipleGoalsMode: function(topPos, leftPos) {
    // Check if player reached the current goal
    if (Math.floor(topPos) === endRow && Math.floor(leftPos) === endCol) {
      setTimeout(() => {
        // Move start position to current end position
        mazeStructure[startRow][startCol] = 0; // Clear old start
        startRow = endRow;
        startCol = endCol;

        // Generate new random end position
        let newEndRow, newEndCol;
        do {
          // Pick random position within maze bounds (avoiding borders)
          newEndRow = Math.floor(Math.random() * (mazeSize - 2)) + 1;
          newEndCol = Math.floor(Math.random() * (mazeSize - 2)) + 1;
        } while (
          mazeStructure[newEndRow][newEndCol] === 1 ||           // Avoid walls
          (newEndRow === endRow && newEndCol === endCol)         // Avoid current position
        );

        // Update end position
        mazeStructure[newEndRow][newEndCol] = 0;
        endRow = newEndRow;
        endCol = newEndCol;

        // Invalidate rendering caches due to structure change
        MazeRenderer.invalidateCache();

        // Update maze visual representation
        MazeRenderer.createMaze();
        
        // Force re-render for canvas mode
        MazeRenderer.forceRerenderMaze();

        // Increment goal counter
        mazecount++;

        // Position player at new start location
        const playerSize = Math.max(6, cellSize * 3);
        const offsetX = (playerSize - cellSize) / 2;
        const offsetY = (playerSize - cellSize) / 2;
        
        player.style.top = (startRow * cellSize - offsetY) + "px";
        player.style.left = (startCol * cellSize - offsetX) + "px";
        maze.appendChild(player);
        
        // Update viewport for new position
        MazeRenderer.updateViewport(startRow, startCol, true);
        
        // Update camera position if zoom is enabled
        if (typeof updateCamera === 'function') {
          updateCamera();
        }
      }, 200);
    }

    // Check if time limit reached (30 seconds for multiple goals mode)
    if (GameTimer.timeElapsed >= 30000) {
      this.endMultipleGoalsGame();
    }
  },

  /**
   * Handles logic for single goal mode completion
   * @param {number} topPos - Current player row position
   * @param {number} leftPos - Current player column position
   * @param {HTMLElement} endScreen - The end screen element
   * @param {Date} startTime - When the game timer started
   * @param {HTMLElement} endContent - Element to display completion time
   * @param {string} type - Game type ("black" for hidden mode)
   * @param {HTMLElement} personalbest - Element showing personal best time
   * @param {HTMLElement} newpersonalbest - Element shown for new records
   * @param {boolean} interval - Whether timer is running
   */
  handleSingleGoalMode: function(topPos, leftPos, endScreen, startTime, endContent, type, personalbest, newpersonalbest, interval) {
    // Check if player reached the goal
    if (Math.floor(topPos) === endRow && Math.floor(leftPos) === endCol) {
      // Stop the timer
      window.clearInterval(GameTimer.interval);
      
      // Calculate completion time
      const endTime = new Date();
      const timeTaken = endTime - startTime;
      const formattedTime = GameTimer.formatTime(timeTaken);

      // Show completion screen after brief delay
      setTimeout(() => {
        endContent.textContent = "Time taken: " + formattedTime;
        
        // Calculate and display personal best
        const bestTime = PersonalBestManager.calculatePersonalBestTime(timeTaken, type);
        PersonalBestManager.displayPersonalBestTime(bestTime, type, personalbest, newpersonalbest);
        
        // Show end screen
        endScreen.classList.remove("hidden");
        
        // Stop background music
        if (AudioManager.preloadedAudio) {
          AudioManager.preloadedAudio.pause();
        }
      }, 200);
    }
  },

  /**
   * Ends the multiple goals game when time limit is reached
   */
  endMultipleGoalsGame: function() {
    // Stop the timer
    window.clearInterval(GameTimer.interval);
    
    // Calculate final score (number of goals reached)
    const finalScore = mazecount;
    const formattedScore = GameTimer.formatTime(finalScore);

    setTimeout(() => {
      // Display final score
      const endContent = document.getElementById("end-time-taken");
      endContent.textContent = "Number of Goals Reached: " + mazecount;
      
      // Calculate and display personal best for multiple goals mode
      const bestScore = PersonalBestManager.calculatePersonalBestTime(finalScore, type);
      const personalbest = document.getElementById("personal-best");
      const newpersonalbest = document.getElementById("new-personal-best");
      PersonalBestManager.displayPersonalBestTime(bestScore, type, personalbest, newpersonalbest);
      
      // Show end screen
      const endScreen = document.getElementById("end-screen");
      endScreen.classList.remove("hidden");
    }, 200);
  },

  /**
   * Handle key down events for smooth movement
   * @param {string} key - The key that was pressed
   */
  handleKeyDown: function(key) {
    // Mark player as moving
    this.playerIsMoving = true;
    
    // Add key to smooth movement keys
    this.smoothMovementKeys[key] = true;
    
    // Start smooth movement loop if not already running
    if (!this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(() => this.smoothMovementLoop());
    }
  },

  /**
   * Handle key up events for smooth movement
   * @param {string} key - The key that was released
   */
  handleKeyUp: function(key) {
    // Remove key from smooth movement keys
    this.smoothMovementKeys[key] = false;
    
    // Check if any movement keys are still pressed
    const anyKeyPressed = Object.values(this.smoothMovementKeys).some(pressed => pressed);
    
    // Stop movement if no keys are pressed
    if (!anyKeyPressed) {
      this.playerIsMoving = false;
      // Animation loop will stop itself when no keys are pressed
    }
  },
};

// Make PlayerController globally available
window.PlayerController = PlayerController;
