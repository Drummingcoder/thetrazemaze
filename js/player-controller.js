/**
 * Player Controller Module
 * Handles player movement, collision detection, and position tracking
 */

console.log('Player Controller module loaded');

const PlayerController = {
  // Smooth movement system variables
  playerIsMoving: false,
  movementSpeed: 3, // Pixels per frame for faster movement
  smoothMovementKeys: {},
  animationFrameId: null,
  keysPressed: {},
  isMovementActive: false, // Track if movement system is active
  
  // Gravity system variables
  gravityEnabled: true,
  gravitySpeed: 0.5, // Pixels per frame gravity pulls downward (reduced by 2x)
  verticalVelocity: 0, // Current downward velocity
  maxFallSpeed: 4, // Maximum fall speed (reduced by 2x)
  isGrounded: false, // Whether player is on solid ground
  
  // Variable jump system variables
  isJumping: false, // Whether player is currently jumping
  jumpStartTime: 0, // When the jump started
  maxJumpHoldTime: 1000, // Maximum time (ms) to hold jump for extra height (increased from 500ms)
  baseJumpVelocity: -6, // Base jump velocity (reduced by 3x)
  maxJumpVelocity: -30, // Maximum jump velocity when held
  chargedJumpVelocity: null, // Stores the charged jump velocity
  
  // Coyote time variables (jump grace period after leaving platform)
  coyoteTime: 6, // Number of frames player can jump after leaving platform
  coyoteTimeCounter: 0, // Current coyote time remaining
  wasGroundedLastFrame: false, // Whether player was grounded in the previous frame
  
  // Dash system variables
  isDashing: false, // Whether player is currently dashing
  dashSpeed: 8, // Speed during dash (pixels per frame)
  dashDuration: 16, // Number of frames the dash lasts
  dashCooldown: 15, // Frames to wait before next dash (0.25 seconds at 60fps)
  dashTimer: 0, // Current dash timer
  dashCooldownTimer: 0, // Current cooldown timer
  dashDirectionX: 0, // X direction of current dash
  dashDirectionY: 0, // Y direction of current dash


  /**
   * Collision detection for smooth movement
   * @param {number} newX - New X position to check
   * @param {number} newY - New Y position to check
   * @returns {boolean} - True if collision detected
   */
  checkCollision: function(newX, newY) {
    // Calculate sprite boundaries - the actual visual sprite area
    const spriteSize = window.cellSize * 0.8;
    const centerOffset = (window.cellSize - spriteSize) / 2;
    
    // Calculate the exact sprite boundaries (no additional margin - we want tight collision)
    const spriteLeft = newX + centerOffset;
    const spriteRight = newX + centerOffset + spriteSize;
    const spriteTop = newY + centerOffset;
    const spriteBottom = newY + centerOffset + spriteSize;
    
    // Calculate which grid cells the sprite overlaps
    const leftCol = Math.floor(spriteLeft / window.cellSize);
    const rightCol = Math.floor((spriteRight - 1) / window.cellSize); // -1 to handle exact edge cases
    const topRow = Math.floor(spriteTop / window.cellSize);
    const bottomRow = Math.floor((spriteBottom - 1) / window.cellSize); // -1 to handle exact edge cases
    
    // Check bounds first
    if (leftCol < 0 || rightCol >= window.mazeSize || topRow < 0 || bottomRow >= window.mazeSize) {
      return true; // Collision with maze boundary
    }
    
    // Check every cell that the sprite overlaps - if ANY cell is a wall, it's a collision
    for (let row = topRow; row <= bottomRow; row++) {
      for (let col = leftCol; col <= rightCol; col++) {
        if (window.mazeStructure[row] && window.mazeStructure[row][col] === 1) {
          return true; // Collision with wall
        }
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
   * Check if player is standing on solid ground
   * @returns {boolean} - True if player is supported by solid ground
   */
  checkGrounded: function() {
    if (!this.gravityEnabled) return true;
    
    const spriteSize = window.cellSize * 0.8;
    const centerOffset = (window.cellSize - spriteSize) / 2;
    
    // Check one pixel below the player's bottom edge
    const spriteLeft = window.playerX + centerOffset;
    const spriteRight = window.playerX + centerOffset + spriteSize;
    const spriteBottom = window.playerY + centerOffset + spriteSize;
    
    // Check the row just below the player
    const checkY = spriteBottom + 1;
    const bottomRow = Math.floor(checkY / window.cellSize);
    const leftCol = Math.floor(spriteLeft / window.cellSize);
    const rightCol = Math.floor((spriteRight - 1) / window.cellSize);
    
    // Check bounds
    if (bottomRow >= window.mazeSize) return true; // Bottom of maze acts as solid ground
    
    // Check if there's solid ground under any part of the player
    for (let col = leftCol; col <= rightCol; col++) {
      if (col >= 0 && col < window.mazeSize) {
        if (window.mazeStructure[bottomRow] && window.mazeStructure[bottomRow][col] === 1) {
          return true; // Standing on a wall (solid ground)
        }
      }
    }
    
    return false; // No solid ground beneath
  },

  /**
   * Calculate variable jump velocity based on how long jump key is held
   * @returns {number} - The jump velocity to apply
   */
  calculateJumpVelocity: function() {
    if (!this.isJumping) return this.baseJumpVelocity;
    
    const currentTime = Date.now();
    const holdTime = currentTime - this.jumpStartTime;
    const holdRatio = Math.min(holdTime / this.maxJumpHoldTime, 1.0);
    
    // Interpolate between base and max jump velocity
    const jumpVelocity = this.baseJumpVelocity + (this.maxJumpVelocity - this.baseJumpVelocity) * holdRatio;
    return jumpVelocity;
  },

  /**
   * Handle dash movement
   * @returns {boolean} - True if dash movement was applied
   */
  handleDash: function() {
    if (!this.isDashing) return false;
    
    // Decrease dash timer
    this.dashTimer--;
    
    // Calculate dash movement
    const dashX = this.dashDirectionX * this.dashSpeed;
    const dashY = this.dashDirectionY * this.dashSpeed;
    
    // Apply dash movement with collision detection
    const newX = window.playerX + dashX;
    const newY = window.playerY + dashY;
    
    // Check X movement
    if (!this.checkCollision(newX, window.playerY)) {
      window.playerX = newX;
      if (window.player) {
        window.player.style.left = window.playerX + "px";
      }
    }
    
    // Check Y movement
    if (!this.checkCollision(window.playerX, newY)) {
      window.playerY = newY;
      if (window.player) {
        window.player.style.top = window.playerY + "px";
      }
    }
    
    // End dash if timer reaches 0
    if (this.dashTimer <= 0) {
      this.isDashing = false;
      this.dashCooldownTimer = this.dashCooldown;
      console.log('Dash ended, cooldown started');
    }
    
    // Update dash UI
    this.updateDashIndicator();
    
    return true;
  },

  /**
   * Start a dash in the given direction
   * @param {number} dirX - X direction (-1, 0, 1)
   * @param {number} dirY - Y direction (-1, 0, 1)
   */
  startDash: function(dirX, dirY) {
    if (this.isDashing || this.dashCooldownTimer > 0) return;
    
    // Normalize direction if diagonal
    const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
    if (magnitude > 0) {
      this.dashDirectionX = dirX / magnitude;
      this.dashDirectionY = dirY / magnitude;
      
      this.isDashing = true;
      this.dashTimer = this.dashDuration;
      
      // Update dash UI
      this.updateDashIndicator();
      
      console.log(`Dash started: direction (${this.dashDirectionX.toFixed(2)}, ${this.dashDirectionY.toFixed(2)})`);
    }
  },
  applyGravity: function() {
    if (!this.gravityEnabled) return;
    
    // Only check grounded state if we're not in the middle of a jump
    // This prevents immediately canceling a jump before the player moves
    if (this.verticalVelocity >= 0) {
      this.isGrounded = this.checkGrounded();
    }
    
    // Handle coyote time - update counter based on grounded state
    if (this.isGrounded) {
      this.coyoteTimeCounter = this.coyoteTime; // Reset coyote time when grounded
      this.wasGroundedLastFrame = true;
    } else if (this.wasGroundedLastFrame) {
      // Just left the ground, start coyote time countdown
      this.coyoteTimeCounter = this.coyoteTime;
      this.wasGroundedLastFrame = false;
    } else if (this.coyoteTimeCounter > 0) {
      // Decrease coyote time counter
      this.coyoteTimeCounter--;
    }
    
    if (!this.isGrounded) {
      // Apply gravity acceleration ALWAYS (creates smooth parabolic curve)
      this.verticalVelocity += this.gravitySpeed;
      
      // Cap at maximum fall speed (only when falling)
      if (this.verticalVelocity > this.maxFallSpeed) {
        this.verticalVelocity = this.maxFallSpeed;
      }
      
      // Apply vertical movement (both upward and downward)
      const newY = window.playerY + this.verticalVelocity;
      
      // Check for collision with new position
      if (!this.checkCollision(window.playerX, newY)) {
        window.playerY = newY;
        
        // Update virtual player object AND trigger rendering
        if (window.player) {
          window.player.style.top = window.playerY + "px";
        }
        
        // Force render update
        this.updateCameraAndRender();
      } else {
        // Hit obstacle
        if (this.verticalVelocity < 0) {
          // Hit ceiling - stop upward movement
          this.verticalVelocity = 0;
        } else {
          // Hit ground - stop falling
          this.verticalVelocity = 0;
          this.isGrounded = true;
          this.updateJumpIndicator();
        }
        
        // Force render update when hitting obstacle
        this.updateCameraAndRender();
      }
    } else {
      // Reset velocity when grounded
      this.verticalVelocity = 0;
      this.coyoteTimeCounter = this.coyoteTime; // Reset coyote time when landing
      // Only reset jump state when landing if we're not actively charging a jump
      if (this.isJumping && !this.smoothMovementKeys["ArrowUp"] && !this.smoothMovementKeys["w"]) {
        this.isJumping = false;
        this.chargedJumpVelocity = null;
      }
    }
  },

  /**
   * Smooth movement animation loop
   */
  smoothMovementLoop: function() {
    let moved = false;
    let newX = window.playerX;
    let newY = window.playerY;
    
    // Update dash cooldown timer (should always run)
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer--;
      // Update dash UI when cooldown changes
      this.updateDashIndicator();
    }
    
    // Handle dash movement first (overrides normal movement)
    if (this.handleDash()) {
      // Dash is active, skip normal movement but still apply gravity
      if (this.gravityEnabled) {
        this.applyGravity();
      }
      
      // Update camera and render
      this.updateCameraAndRender();
      
      // Continue animation loop
      this.animationFrameId = requestAnimationFrame(() => this.smoothMovementLoop());
      return;
    }
    
    // Track movement direction for dash system
    let currentMovementX = 0;
    let currentMovementY = 0;
    
    // Calculate movement based on pressed keys
    if (this.smoothMovementKeys["ArrowUp"] || this.smoothMovementKeys["w"]) {
      // Handle variable jump when gravity is enabled
      if (this.gravityEnabled) {
        // Allow jumping if grounded OR within coyote time
        if (this.isGrounded || this.coyoteTimeCounter > 0) {
          // Start jump charging if not already jumping
          if (!this.isJumping) {
            this.isJumping = true;
            this.jumpStartTime = Date.now();
            console.log('Started charging jump');
            // Don't apply velocity yet - just start charging
            this.updateJumpIndicator();
          }
          // Continue charging jump while grounded/in coyote time and within time limit
          const currentTime = Date.now();
          if (currentTime - this.jumpStartTime <= this.maxJumpHoldTime) {
            // Calculate current jump velocity but don't apply it yet
            const calculatedVelocity = this.calculateJumpVelocity();
            // Store the charged velocity to apply when we actually jump
            this.chargedJumpVelocity = calculatedVelocity;
            console.log('Charging jump, velocity:', calculatedVelocity);
            this.updateJumpIndicator();
          }
        }
      } else {
        // Non-gravity mode - normal upward movement
        newY -= this.movementSpeed;
        moved = true;
        currentMovementY = -1;
      }
    } else {
      // Jump key released - execute the jump if we were charging
      if (this.isJumping && (this.isGrounded || this.coyoteTimeCounter > 0)) {
        // Apply the charged jump velocity
        const jumpVel = this.chargedJumpVelocity || this.baseJumpVelocity;
        this.verticalVelocity = jumpVel;
        this.isGrounded = false;
        this.isJumping = false;
        this.chargedJumpVelocity = null;
        this.coyoteTimeCounter = 0; // Use up coyote time when jumping
        
        console.log('Jump executed with velocity:', jumpVel);
        this.updateJumpIndicator();
      } else if (this.isJumping) {
        // Stop charging if we release the key while in air (and no coyote time)
        this.isJumping = false;
        this.chargedJumpVelocity = null;
        this.updateJumpIndicator();
      }
    }
    if (this.smoothMovementKeys["ArrowDown"] || this.smoothMovementKeys["s"]) {
      // Downward movement (or faster falling)
      if (!this.gravityEnabled) {
        newY += this.movementSpeed;
        moved = true;
        currentMovementY = 1;
      } else {
        // With gravity, down key increases fall speed
        this.verticalVelocity += this.movementSpeed;
        currentMovementY = 1;
      }
    }
    if (this.smoothMovementKeys["ArrowLeft"] || this.smoothMovementKeys["a"]) {
      newX -= this.movementSpeed;
      moved = true;
      currentMovementX = -1;
    }
    if (this.smoothMovementKeys["ArrowRight"] || this.smoothMovementKeys["d"]) {
      newX += this.movementSpeed;
      moved = true;
      currentMovementX = 1;
    }
    
    // Apply horizontal movement if no collision
    if (moved && newX !== window.playerX) {
      if (!this.checkCollision(newX, window.playerY)) {
        window.playerX = newX;
        
        // Update virtual player object
        if (window.player) {
          window.player.style.left = window.playerX + "px";
        }
      }
    }
    
    // Apply vertical movement (only if gravity is disabled or moving up)
    if (moved && newY !== window.playerY) {
      if (!this.gravityEnabled || newY < window.playerY) {
        if (!this.checkCollision(window.playerX, newY)) {
          window.playerY = newY;
          
          // Update virtual player object
          if (window.player) {
            window.player.style.top = window.playerY + "px";
          }
        }
      }
    }
    
    // Apply gravity ALWAYS when enabled (independent of key movement)
    if (this.gravityEnabled) {
      this.applyGravity();
    }
    
    // Check if player reached the end after any movement
    if (this.checkEndReached()) {
      // Clean up all movement and animation systems
      this.cleanupMovementSystems();
      
      // Trigger end game
      setTimeout(() => {
        if (typeof window.myLibrary !== 'undefined' && typeof window.endScreen !== 'undefined') {
          window.myLibrary.endGame(window.endScreen, window.startTime, window.endContent, window.type, window.personalbest, window.newpersonalbest, window.interval);
        }
      }, 100);
      return; // Exit early to prevent further processing
    }
    
    // Update camera and render if anything changed
    if (moved || (this.gravityEnabled && (!this.isGrounded || this.verticalVelocity !== 0))) {
      this.updateCameraAndRender();
    }
    
    // Update jump indicator during gameplay
    this.updateJumpIndicator();
    
    // Continue animation loop if any keys are pressed OR if gravity is active and player is falling OR if dashing OR if dash cooldown is active
    const anyKeyPressed = Object.values(this.smoothMovementKeys).some(pressed => pressed);
    const needsContinuousUpdate = this.gravityEnabled && (!this.isGrounded || this.verticalVelocity !== 0);
    const dashActive = this.isDashing;
    const dashCooldownActive = this.dashCooldownTimer > 0;
    
    if (anyKeyPressed || needsContinuousUpdate || dashActive || dashCooldownActive) {
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
    
    // Reset jump state
    this.isJumping = false;
    this.jumpStartTime = 0;
    this.chargedJumpVelocity = null;
    
    // Reset coyote time
    this.coyoteTimeCounter = 0;
    this.wasGroundedLastFrame = false;
    
    // Reset dash state
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.lastKeyPressTime = {};
    
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
   * Batched update function - only renders, camera updates automatically
   */
  updateCameraAndRender: function() {
    // Camera updates automatically at 60 FPS, no need to call it manually
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
   * Toggle gravity on/off
   * @param {boolean} enabled - Whether to enable gravity
   */
  setGravity: function(enabled) {
    this.gravityEnabled = enabled;
    if (!enabled) {
      this.verticalVelocity = 0;
      this.isGrounded = true;
      this.isJumping = false;
      this.chargedJumpVelocity = null;
    }
  },

  /**
   * Start the smooth movement system
   */
  startSmoothMovement: function() {
    // Initialize dash indicator UI
    this.updateDashIndicator();
    
    // Initialize jump indicator UI
    this.updateJumpIndicator();
    
    // Mark movement as active
    this.isMovementActive = true;
    
    console.log('Smooth movement system started');
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
  
  /**
   * Update dash indicator UI
   */
  updateDashIndicator: function() {
    const dashIndicator = document.getElementById('dash-indicator');
    if (!dashIndicator) return;
    
    if (this.isDashing) {
      dashIndicator.textContent = 'Dashing!';
      dashIndicator.className = '';
    } else if (this.dashCooldownTimer > 0) {
      const cooldownSeconds = (this.dashCooldownTimer / 60).toFixed(1);
      dashIndicator.textContent = `Dash ${cooldownSeconds}s`;
      dashIndicator.className = 'cooldown';
    } else {
      dashIndicator.textContent = 'Dash Ready';
      dashIndicator.className = '';
    }
  },

  /**
   * Update jump indicator UI
   */
  updateJumpIndicator: function() {
    const jumpIndicator = document.getElementById('jump-indicator');
    if (!jumpIndicator) return;
    
    if (this.isJumping && this.chargedJumpVelocity) {
      // Show jump charge progress
      const currentTime = Date.now();
      const holdTime = currentTime - this.jumpStartTime;
      const chargePercent = Math.min((holdTime / this.maxJumpHoldTime) * 100, 100);
      jumpIndicator.textContent = `Charging ${chargePercent.toFixed(0)}%`;
      jumpIndicator.className = 'charging';
    } else if (this.isGrounded || this.coyoteTimeCounter > 0) {
      jumpIndicator.textContent = 'Jump Ready';
      jumpIndicator.className = 'grounded';
    } else {
      jumpIndicator.textContent = 'In Air';
      jumpIndicator.className = '';
    }
  },

  /**
   * Handle dedicated dash key press (Shift)
   */
  handleDashKey: function() {
    // Don't trigger dash if already dashing or on cooldown
    if (this.isDashing || this.dashCooldownTimer > 0) return;
    
    // Determine dash direction based ONLY on current movement keys
    let dashX = 0;
    let dashY = 0;
    
    // Check current movement keys
    if (this.smoothMovementKeys["ArrowLeft"] || this.smoothMovementKeys["a"]) {
      dashX = -1;
    } else if (this.smoothMovementKeys["ArrowRight"] || this.smoothMovementKeys["d"]) {
      dashX = 1;
    }
    
    if (this.smoothMovementKeys["ArrowUp"] || this.smoothMovementKeys["w"]) {
      dashY = -1;
    } else if (this.smoothMovementKeys["ArrowDown"] || this.smoothMovementKeys["s"]) {
      dashY = 1;
    }
    
    // Only dash if player is currently moving (no fallback to last movement)
    if (dashX === 0 && dashY === 0) {
      console.log('Dash blocked - player must be actively moving to dash');
      return;
    }
    
    // Start the dash (collision checking happens during movement)
    this.startDash(dashX, dashY);
    console.log(`Dash triggered while moving: direction (${dashX}, ${dashY})`);
  },
};

// Make PlayerController globally available
window.PlayerController = PlayerController;
