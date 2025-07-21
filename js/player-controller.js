/**
 * Player Controller
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
  
  // Jump charge indicator properties
  jumpChargeLingerTimeout: null, // Timeout for linger effect
  JUMP_CHARGE_LINGER_TIME: 500, // 0.5 seconds in milliseconds
  
  // Coyote time variables (jump grace period after leaving platform)
  coyoteTime: 6, // Number of frames player can jump after leaving platform
  coyoteTimeCounter: 0, // Current coyote time remaining
  wasGroundedLastFrame: false, // Whether player was grounded in the previous frame
  
  // Dash system variables
  isDashing: false, // Whether player is currently dashing
  dashSpeed: 16, // Speed during dash (pixels per frame) - increased for faster dash movement
  dashDuration: 15, // Number of frames the dash lasts - reduced from 20 to 15 for quicker, snappier dash
  dashCooldown: 45, // Frames to wait before next dash (0.25 seconds at 60fps)
  dashTimer: 0, // Current dash timer
  dashCooldownTimer: 0, // Current cooldown timer
  dashDirectionX: 0, // X direction of current dash
  dashDirectionY: 0, // Y direction of current dash
  
  // Ground pound system variables
  isGroundPounding: false, // Whether player is currently ground pounding
  groundPoundPhase: 'none', // 'none', 'hovering', 'slamming'
  groundPoundHoverTime: 20, // Frames to hover before slamming (about 0.33 seconds)
  groundPoundHoverTimer: 0, // Current hover timer
  groundPoundVelocity: 20, // How fast the ground pound slams down (increased for more impact)
  groundPoundCooldown: 30, // Frames to wait before next ground pound (0.5 seconds at 60fps)
  groundPoundCooldownTimer: 0, // Current ground pound cooldown timer
  
  // Performance optimization variables
  lastUIUpdate: 0, // Timestamp of last UI update
  uiUpdateInterval: 50, // Update UI every 50ms instead of every frame


  /**
   * Calculate sprite boundaries for consistent collision and ground detection
   * @returns {object} - Object with sprite boundaries
   */
  getSpriteBounds: function(x = window.playerX, y = window.playerY) {
    const spriteSize = window.cellSize * 0.8;
    const centerOffset = (window.cellSize - spriteSize) / 2;
    
    return {
      left: x + centerOffset,
      right: x + centerOffset + spriteSize,
      top: y + centerOffset,
      bottom: y + centerOffset + spriteSize,
      spriteSize: spriteSize,
      centerOffset: centerOffset
    };
  },

  /**
   * Collision detection for smooth movement
   * @param {number} newX - New X position to check
   * @param {number} newY - New Y position to check
   * @returns {boolean} - True if collision detected
   */
  checkCollision: function(newX, newY) {
    // Safety check: ensure we have valid window globals
    if (!window.cellSize || !window.mazeSize || !window.mazeStructure) {
      console.warn('Missing maze globals in checkCollision');
      return true; // Assume collision if globals are missing
    }
    
    // Safety check: ensure coordinates are numbers
    if (typeof newX !== 'number' || typeof newY !== 'number' || isNaN(newX) || isNaN(newY)) {
      console.warn('Invalid coordinates in checkCollision:', newX, newY);
      return true; // Assume collision if coordinates are invalid
    }
    
    // Calculate sprite boundaries using unified function
    const bounds = this.getSpriteBounds(newX, newY);
    
    // Calculate which grid cells the sprite overlaps
    const leftCol = Math.floor(bounds.left / window.cellSize);
    const rightCol = Math.floor((bounds.right - 1) / window.cellSize); // -1 to handle exact edge cases
    const topRow = Math.floor(bounds.top / window.cellSize);
    const bottomRow = Math.floor((bounds.bottom - 1) / window.cellSize); // -1 to handle exact edge cases
    
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
   * Find the first solid ground row below a given Y position
   * @param {number} playerY - The player's Y position
   * @param {number} playerX - The player's X position  
   * @returns {number|null} - The row number of solid ground, or null if none found
   */
  findGroundRow: function(playerY, playerX) {
    const spriteSize = window.cellSize * 0.8;
    const centerOffset = (window.cellSize - spriteSize) / 2;
    
    const spriteLeft = playerX + centerOffset;
    const spriteRight = playerX + centerOffset + spriteSize;
    const spriteBottom = playerY + centerOffset + spriteSize;
    
    const leftCol = Math.floor(spriteLeft / window.cellSize);
    const rightCol = Math.floor((spriteRight - 1) / window.cellSize);
    
    // Start checking from the row where sprite bottom is
    let checkRow = Math.floor(spriteBottom / window.cellSize);
    
    // Look for solid ground below current position
    while (checkRow < window.mazeSize) {
      let foundGround = false;
      for (let col = leftCol; col <= rightCol; col++) {
        if (col >= 0 && col < window.mazeSize && 
            window.mazeStructure[checkRow] && window.mazeStructure[checkRow][col] === 1) {
          foundGround = true;
          break;
        }
      }
      if (foundGround) return checkRow;
      checkRow++;
    }
    
    return null; // No ground found
  },

  /**
   * Check if player is standing on solid ground
   * @param {boolean} isGroundPounding - Whether player is currently ground pounding (for debug)
   * @returns {boolean} - True if player is supported by solid ground
   */
  checkGrounded: function(isGroundPounding = false) {
    if (!this.gravityEnabled) return true;
    
    // Use unified sprite bounds calculation
    const bounds = this.getSpriteBounds();
    
    // Check exactly at sprite bottom
    const checkY = bounds.bottom;
    const bottomRow = Math.floor(checkY / window.cellSize);
    const leftCol = Math.floor(bounds.left / window.cellSize);
    const rightCol = Math.floor((bounds.right - 1) / window.cellSize);
    
    // Check bounds - maze edges act as solid ground
    if (bottomRow >= window.mazeSize) return true;
    if (leftCol < 0 || rightCol >= window.mazeSize) return false;
    
    // Check if there's solid ground under any part of the player
    for (let col = leftCol; col <= rightCol; col++) {
      if (col >= 0 && col < window.mazeSize) {
        if (window.mazeStructure[bottomRow] && window.mazeStructure[bottomRow][col] === 1) {
          return true; // Standing on a wall (solid ground)
        }
      }
    }
    
    // Debug: Log when ground check fails during ground pound
    // Removed excessive logging for better performance
    
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
      if (window.debugLog) {
        window.debugLog(`💨 PLAYER DASH ENDED: Timer reached 0, setting isDashing=false`, 'warn');
      }
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
      
      // Start dash animation
      if (window.PlayerAnimation) {
        window.PlayerAnimation.startDash(dirX);
      }
      
      if (window.debugLog) {
        window.debugLog(`💨 PLAYER DASH STARTED: Timer set to ${this.dashDuration} frames`, 'info');
      }
      
      // Update dash UI
      this.updateDashIndicator();
      
      console.log(`Dash started: direction (${this.dashDirectionX.toFixed(2)}, ${this.dashDirectionY.toFixed(2)})`);
    }
  },

  /**
   * End dash called from animation system
   * This is called when the dash recovery animation completes
   */
  endDashFromAnimation: function() {
    if (this.isDashing) {
      this.isDashing = false;
      this.dashCooldownTimer = this.dashCooldown;
      console.log('Dash ended from animation system, cooldown started');
      
      // Update dash UI
      this.updateDashIndicator();
    }
  },

  /**
   * Handle ground pound landing with precise positioning
   * @param {number} targetY - The Y position the player is trying to move to
   * @returns {object} - Landing result with landed flag and landing position
   */
  handleGroundPoundLanding: function(targetY) {
    // Get sprite boundaries for the target position
    const bounds = this.getSpriteBounds(window.playerX, targetY);
    
    // Calculate which grid cells the sprite would overlap
    const leftCol = Math.floor(bounds.left / window.cellSize);
    const rightCol = Math.floor((bounds.right - 1) / window.cellSize);
    const topRow = Math.floor(bounds.top / window.cellSize);
    const bottomRow = Math.floor((bounds.bottom - 1) / window.cellSize);
    
    // Check if we're going out of bounds
    if (leftCol < 0 || rightCol >= window.mazeSize || topRow < 0 || bottomRow >= window.mazeSize) {
      return { landed: false, landingY: targetY, groundRow: null };
    }
    
    // Check for collision at target position
    let hasCollision = false;
    for (let row = topRow; row <= bottomRow; row++) {
      for (let col = leftCol; col <= rightCol; col++) {
        if (window.mazeStructure[row][col] === 1) { // Wall
          hasCollision = true;
          break;
        }
      }
      if (hasCollision) break;
    }
    
    if (!hasCollision) {
      // No collision at target position, continue falling
      return { landed: false, landingY: targetY, groundRow: null };
    }
    
    // Found collision - now find the exact ground level
    // Scan upward from current position to find the highest valid position
    const originalBounds = this.getSpriteBounds(window.playerX, window.playerY);
    const spriteHeight = originalBounds.bottom - originalBounds.top;
    
    // Start from current position and scan downward pixel by pixel to find exact landing spot
    for (let testY = window.playerY; testY <= targetY; testY++) {
      const testBounds = this.getSpriteBounds(window.playerX, testY);
      const testBottomRow = Math.floor((testBounds.bottom - 1) / window.cellSize);
      
      // Check if this position has a collision
      let testHasCollision = false;
      for (let row = Math.floor(testBounds.top / window.cellSize); row <= testBottomRow; row++) {
        for (let col = leftCol; col <= rightCol; col++) {
          if (row >= 0 && row < window.mazeSize && col >= 0 && col < window.mazeSize) {
            if (window.mazeStructure[row][col] === 1) { // Wall
              testHasCollision = true;
              break;
            }
          }
        }
        if (testHasCollision) break;
      }
      
      if (testHasCollision) {
        // Found the collision point - calculate exact landing position
        // Find the top of the ground tile and position player sprite just above it
        const groundTileRow = Math.floor(testBounds.bottom / window.cellSize);
        const groundTileTopY = groundTileRow * window.cellSize;
        
        // Position player so their sprite bottom aligns with ground tile top
        // Formula: playerY + centerOffset + spriteSize = groundTileTopY
        // Therefore: playerY = groundTileTopY - centerOffset - spriteSize
        const bounds = this.getSpriteBounds();
        const landingY = groundTileTopY - bounds.centerOffset - bounds.spriteSize;
        
        const landingBottomRow = Math.floor((this.getSpriteBounds(window.playerX, landingY).bottom - 1) / window.cellSize);
        
        window.debugLog(`Ground pound precise landing: groundTileRow=${groundTileRow}, groundTileTopY=${groundTileTopY}, landingY=${landingY.toFixed(2)}, spriteBottom=${this.getSpriteBounds(window.playerX, landingY).bottom.toFixed(2)}, groundRow=${landingBottomRow}`, 'info');
        
        return { 
          landed: true, 
          landingY: landingY,
          groundRow: landingBottomRow
        };
      }
    }
    
    // Fallback: if we couldn't find a precise landing, use the target position
    return { landed: true, landingY: targetY, groundRow: bottomRow };
  },

  applyGravity: function() {
    if (!this.gravityEnabled) return;
    
    // Store previous grounded state for comparison
    const wasGrounded = this.isGrounded;
    
    // Robust ground state management: Only re-check ground state when necessary
    // This prevents bouncing after ground pound landings
    if (this.verticalVelocity > 0) {
      // Falling - check if we should be grounded
      this.isGrounded = this.checkGrounded(this.isGroundPounding);
    } else if (this.verticalVelocity === 0) {
      // Zero velocity - ALWAYS check ground to handle walking off platforms
      // This is critical for detecting when player walks off a ledge
      this.isGrounded = this.checkGrounded(false);
    } else if (this.verticalVelocity >= -2 && this.verticalVelocity < 0) {
      // Low upward velocity - check ground but be conservative
      if (!this.isGrounded) {
        this.isGrounded = this.checkGrounded(false);
      }
    } else {
      // Moving upward with significant velocity - definitely not grounded
      this.isGrounded = false;
    }

    // Debug: Log ground state changes with more context
    if (wasGrounded !== this.isGrounded) {
      window.debugLog(`Ground state changed: ${wasGrounded ? 'grounded' : 'airborne'} → ${this.isGrounded ? 'grounded' : 'airborne'} (velocity: ${this.verticalVelocity.toFixed(2)}, Y: ${window.playerY.toFixed(2)}, groundPounding: ${this.isGroundPounding})`, 'info');
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
      
      // If coyote time just expired and player was charging jump, stop charging
      if (this.coyoteTimeCounter === 0 && this.isJumping && !this.isGrounded) {
        console.log('Coyote time expired - stopping jump charge');
        this.isJumping = false;
        this.chargedJumpVelocity = null;
        this.updateJumpChargeIndicator();
      }
    }
    
    if (!this.isGrounded) {
      // Handle ground pound phases
      if (this.isGroundPounding && this.groundPoundPhase === 'hovering') {
        // During hover phase: completely override gravity, stay in place
        this.verticalVelocity = 0;
      } else if (this.isGroundPounding && this.groundPoundPhase === 'slamming') {
        // During slam phase: maintain high downward velocity, no gravity acceleration
        this.verticalVelocity = this.groundPoundVelocity;
      } else {
        // Normal gravity: Apply gravity acceleration ALWAYS (creates smooth parabolic curve)
        this.verticalVelocity += this.gravitySpeed;
        
        // Cap at maximum fall speed (only when falling naturally, not during ground pound)
        if (this.verticalVelocity > this.maxFallSpeed) {
          this.verticalVelocity = this.maxFallSpeed;
        }
      }
      
      // Apply vertical movement (both upward and downward)
      const newY = window.playerY + this.verticalVelocity;
      
      // Safety check: ensure player doesn't go out of bounds
      const minY = 0;
      const maxY = (window.mazeSize - 1) * window.cellSize;
      const safeNewY = Math.max(minY, Math.min(maxY, newY));
      
      // Special handling for ground pound collision
      if (this.isGroundPounding && this.groundPoundPhase === 'slamming') {
        // Use specialized ground pound collision detection
        const landingResult = this.handleGroundPoundLanding(safeNewY);
        if (landingResult.landed) {
          // Successfully landed
          window.playerY = landingResult.landingY;
          this.verticalVelocity = 0;
          this.isGrounded = true;
          this.isGroundPounding = false;
          this.groundPoundPhase = 'recovery';  // Start recovery phase instead of 'none'
          this.groundPoundCooldownTimer = this.groundPoundCooldown;
          
          // Start recovery animation instead of immediately resetting to movement
          if (window.PlayerAnimation) {
            // Don't reset immediately - let PlayerAnimation handle the recovery phase
            // The recovery animation will call resetToMovementAnimation() when it's complete
            window.PlayerAnimation.groundPoundRecovering = true;
            window.PlayerAnimation.groundPoundActive = true; // Keep active during recovery
            window.PlayerAnimation.groundPoundHovering = false;
            window.PlayerAnimation.groundPoundAnimationFrame = 0;
            window.PlayerAnimation.lastGroundPoundAnimationTime = performance.now();
          }
          
          window.debugLog(`Ground pound SMASH! Landed at Y: ${landingResult.landingY.toFixed(2)}, ground row: ${landingResult.groundRow}`, 'info');
          
          // Update virtual player object
          if (window.player) {
            window.player.style.top = window.playerY + "px";
          }
          
          // Update DOM sprite position immediately
          if (window.CanvasRenderer && window.CanvasRenderer.updatePlayerPosition) {
            window.CanvasRenderer.updatePlayerPosition();
          }
          
          // Update indicators immediately after landing (force update, bypass throttling)
          this.updateJumpChargeIndicator();
          this.updateGroundPoundIndicator();
          
          // CRITICAL: Force immediate camera and render update to sync visual position
          this.updateCameraAndRender();
        } else {
          // Still falling, continue movement
          window.playerY = safeNewY;
          if (window.player) {
            window.player.style.top = window.playerY + "px";
          }
        }
      } else {
        // Regular collision detection for normal movement
        if (!this.checkCollision(window.playerX, safeNewY)) {
          window.playerY = safeNewY;
          
          // Update virtual player object
          if (window.player) {
            window.player.style.top = window.playerY + "px";
          }
        } else {
          // Hit obstacle - regular collision handling
          if (this.verticalVelocity < 0) {
            // Hit ceiling - stop upward movement
            this.verticalVelocity = 0;
          } else {
            // Hit ground - stop falling and land
            this.verticalVelocity = 0;
            this.isGrounded = true;
          }
        }
      }
    } else {
      // Already grounded - be very conservative about leaving ground state
      // Only mark as not grounded if we're clearly moving upward with significant velocity
      if (!wasGrounded && this.isGrounded) {
        // Just landed - reset states and ensure we stay grounded
        this.verticalVelocity = 0;
        this.coyoteTimeCounter = this.coyoteTime;
        
        // Reset ground pound state when landing (if not already handled in collision)
        if (this.isGroundPounding) {
          this.isGroundPounding = false;
          this.groundPoundPhase = 'none'; // Reset phase
          this.groundPoundCooldownTimer = this.groundPoundCooldown;
          window.debugLog(`Ground pound SMASH! Landing in gravity logic! Cooldown started: ${this.groundPoundCooldown} frames`, 'info');
        }
        
        // Only reset jump state when landing if we're not actively charging a jump
        if (this.isJumping && !this.smoothMovementKeys["ArrowUp"] && !this.smoothMovementKeys["w"]) {
          this.isJumping = false;
          this.chargedJumpVelocity = null;
        }
      }
      
      // When grounded with zero velocity, stay grounded unless we explicitly jump
      // This prevents bouncing and flickering of grounded state
      this.verticalVelocity = 0;
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
    
    // Update ground pound cooldown timer (should always run)
    if (this.groundPoundCooldownTimer > 0) {
      this.groundPoundCooldownTimer--;
      // Update ground pound UI when cooldown changes
      this.updateGroundPoundIndicator();
    }
    
    // Handle ground pound hover timer and phase transitions
    if (this.isGroundPounding && this.groundPoundPhase === 'hovering') {
      this.groundPoundHoverTimer--;
      if (this.groundPoundHoverTimer <= 0) {
        // Transition from hovering to slamming
        this.groundPoundPhase = 'slamming';
        this.verticalVelocity = this.groundPoundVelocity;
        
        // Update ground pound animation phase
        if (window.PlayerAnimation) {
          window.PlayerAnimation.updateGroundPoundPhase(this.isGroundPounding, this.groundPoundPhase);
        }
        
        window.debugLog(`Ground pound SLAM! Transitioning to slamming phase`, 'warn');
      }
      // Update UI during hover
      this.updateGroundPoundIndicator();
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
            this.updateJumpChargeIndicator();
          }
          // Continue charging jump while grounded/in coyote time and within time limit
          const currentTime = Date.now();
          if (currentTime - this.jumpStartTime <= this.maxJumpHoldTime) {
            // Calculate current jump velocity but don't apply it yet
            const calculatedVelocity = this.calculateJumpVelocity();
            // Store the charged velocity to apply when we actually jump
            this.chargedJumpVelocity = calculatedVelocity;
            console.log('Charging jump, velocity:', calculatedVelocity);
            this.updateJumpChargeIndicator();
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
        this.updateJumpChargeIndicator();
      } else if (this.isJumping) {
        // Stop charging if we release the key while in air (and no coyote time)
        this.isJumping = false;
        this.chargedJumpVelocity = null;
        this.updateJumpChargeIndicator();
      }
    }
    if (this.smoothMovementKeys["ArrowDown"] || this.smoothMovementKeys["s"]) {
      // Handle ground pound when in air, or normal downward movement when on ground
      if (!this.gravityEnabled) {
        newY += this.movementSpeed;
        moved = true;
        currentMovementY = 1;
      } else {
        if (!this.isGrounded && !this.isGroundPounding && this.groundPoundCooldownTimer <= 0) {
          // Start ground pound hover phase if in air, not already ground pounding, and cooldown is finished
          this.isGroundPounding = true;
          this.groundPoundPhase = 'hovering';
          this.groundPoundHoverTimer = this.groundPoundHoverTime;
          this.verticalVelocity = 0; // Stop all vertical movement during hover
          
          // Start ground pound animation
          if (window.PlayerAnimation) {
            window.PlayerAnimation.startGroundPound();
          }
          
          window.debugLog(`Ground pound initiated! Hovering for ${this.groundPoundHoverTime} frames`, 'warn');
        } else if (!this.isGrounded && this.groundPoundCooldownTimer > 0) {
          // Can't ground pound yet - still in cooldown
          window.debugLog(`Ground pound blocked by cooldown: ${this.groundPoundCooldownTimer} frames remaining`, 'info');
        }
        currentMovementY = 1;
      }
    }
    // NOTE: Ground pound is now uncancelable once started - no reset on key release
    
    // Handle horizontal movement (but not during ground pounding OR while down key is held)
    const downKeyHeld = this.smoothMovementKeys["ArrowDown"] || this.smoothMovementKeys["s"];
    if (!this.isGroundPounding && !downKeyHeld) {
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
    }
    
    // Apply horizontal movement if no collision
    if (moved && newX !== window.playerX) {
      if (!this.checkCollision(newX, window.playerY)) {
        window.playerX = newX;
        
        // Update virtual player object
        if (window.player) {
          window.player.style.left = window.playerX + "px";
        }
        
        // Update DOM sprite position immediately
        if (window.CanvasRenderer && window.CanvasRenderer.updatePlayerPosition) {
          window.CanvasRenderer.updatePlayerPosition();
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
          
          // Update DOM sprite position immediately
          if (window.CanvasRenderer && window.CanvasRenderer.updatePlayerPosition) {
            window.CanvasRenderer.updatePlayerPosition();
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
    
    // Update jump indicator less frequently to reduce flickering
    const now = Date.now();
    if (now - this.lastUIUpdate >= this.uiUpdateInterval) {
      this.updateJumpChargeIndicator();
      this.updateGroundPoundIndicator();
    }
    
    // Update jump charge indicator more frequently when actively charging (every frame)
    if (this.isJumping && this.chargedJumpVelocity) {
      this.updateJumpChargeIndicator();
    }
    
    // Continue animation loop if any keys are pressed OR if gravity is active and player is falling OR if dashing OR if dash cooldown is active OR if ground pound cooldown is active OR if ground pound recovery is active
    const anyKeyPressed = Object.values(this.smoothMovementKeys).some(pressed => pressed);
    const needsContinuousUpdate = this.gravityEnabled && (!this.isGrounded || this.verticalVelocity !== 0);
    const dashActive = this.isDashing;
    const dashCooldownActive = this.dashCooldownTimer > 0;
    const groundPoundCooldownActive = this.groundPoundCooldownTimer > 0;
    const groundPoundRecoveryActive = window.PlayerAnimation && window.PlayerAnimation.groundPoundRecovering;
    
    if (anyKeyPressed || needsContinuousUpdate || dashActive || dashCooldownActive || groundPoundCooldownActive || groundPoundRecoveryActive) {
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
    this.isGroundPounding = false;
    
    // Hide and remove jump charge indicator
    const chargeIndicator = document.getElementById('jump-charge-indicator');
    if (chargeIndicator) {
      chargeIndicator.classList.remove('visible');
      // Remove from DOM completely
      if (chargeIndicator.parentNode) {
        chargeIndicator.parentNode.removeChild(chargeIndicator);
      }
    }
    
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
    try {
      // Camera updates automatically at 60 FPS, no need to call it manually
      if (window.CanvasRenderer && window.CanvasRenderer.renderFrame) {
        window.CanvasRenderer.renderFrame();
      } else {
        console.warn('CanvasRenderer not available for rendering');
      }
    } catch (error) {
      console.error('Error in updateCameraAndRender:', error);
      // Try to recover by ensuring player position is valid
      if (window.playerX < 0) window.playerX = 0;
      if (window.playerY < 0) window.playerY = 0;
      if (window.playerX > (window.mazeSize - 1) * window.cellSize) {
        window.playerX = (window.mazeSize - 1) * window.cellSize;
      }
      if (window.playerY > (window.mazeSize - 1) * window.cellSize) {
        window.playerY = (window.mazeSize - 1) * window.cellSize;
      }
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
    // Start timer on first movement after reset
    if (window.timerShouldStart && typeof GameTimer.startTimer === 'function') {
      const timerElement = document.getElementById("timer");
      GameTimer.startTimer(timerElement);
      window.timerShouldStart = false;
    }
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
      if (typeof GameTimer.stopTimer === 'function') {
        GameTimer.stopTimer();
      } else {
        window.clearInterval(GameTimer.interval);
      }
      
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
    if (typeof GameTimer.stopTimer === 'function') {
        GameTimer.stopTimer();
    } else {
      window.clearInterval(GameTimer.interval);
    }
    
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
      this.isGroundPounding = false;
    }
  },

  /**
   * Start the smooth movement system
   */
  startSmoothMovement: function() {
    // Initialize dash indicator UI
    this.updateDashIndicator();
    
    // Initialize jump indicator UI
    this.updateJumpChargeIndicator();
    
    // Mark movement as active
    this.isMovementActive = true;
    
    console.log('Smooth movement system started');
  },

  /**
   * Handle key down events for smooth movement
   * @param {string} key - The key that was pressed
   */
  handleKeyDown: function(key) {
    // Prevent movement if end screen is visible
    if (window.endScreen && !window.endScreen.classList.contains("hidden")) {
      return;
    }
    
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
   * Update jump charge indicator positioned behind player sprite
   */
  updateJumpChargeIndicator: function() {
    let chargeIndicator = document.getElementById('jump-charge-indicator');
    
    // Only show when actively charging a jump AND player can actually jump (grounded or has coyote time)
    if (this.isJumping && this.chargedJumpVelocity && (this.isGrounded || this.coyoteTimeCounter > 0)) {
      // Clear any existing linger timeout since we're actively charging
      if (this.jumpChargeLingerTimeout) {
        clearTimeout(this.jumpChargeLingerTimeout);
        this.jumpChargeLingerTimeout = null;
      }
      
      // Create indicator if it doesn't exist or ensure it's in the right place
      if (!chargeIndicator) {
        chargeIndicator = document.createElement('div');
        chargeIndicator.id = 'jump-charge-indicator';
        
        // Add it to the body so it has fixed positioning like the player sprite
        document.body.appendChild(chargeIndicator);
      }
      
      // Calculate charge percentage
      const currentTime = Date.now();
      const holdTime = currentTime - this.jumpStartTime;
      const chargePercent = Math.min((holdTime / this.maxJumpHoldTime) * 100, 100);
      
      // Update text content
      chargeIndicator.textContent = `${chargePercent.toFixed(0)}%`;
      
      // Get facing direction from PlayerAnimation
      const facingRight = window.PlayerAnimation && window.PlayerAnimation.lastDirection === 'right';
      
      // Calculate player sprite position (same logic as CanvasRenderer.updateSpritePosition)
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const spriteSize = 48; // Fixed sprite size
      const playerCenterX = windowWidth / 2;
      const playerCenterY = windowHeight / 2;
      
      // Position indicator behind the player sprite (increased distance by 10 pixels)
      const offsetDistance = 45; // Increased from 35 to 45 pixels
      let indicatorX, indicatorY;
      
      if (facingRight) {
        // Player facing right, show indicator on the left
        indicatorX = playerCenterX - offsetDistance;
      } else {
        // Player facing left, show indicator on the right  
        indicatorX = playerCenterX + offsetDistance;
      }
      
      // Position slightly above center of player
      indicatorY = playerCenterY - 10;
      
      // Position the indicator using fixed positioning
      chargeIndicator.style.position = 'fixed';
      chargeIndicator.style.left = indicatorX + 'px';
      chargeIndicator.style.top = indicatorY + 'px';
      chargeIndicator.classList.add('visible');
    } else {
      // Not actively charging - check if we should start the linger effect
      if (chargeIndicator && chargeIndicator.classList.contains('visible') && !this.jumpChargeLingerTimeout) {
        // Start linger effect - keep showing for 0.5 seconds
        this.jumpChargeLingerTimeout = setTimeout(() => {
          const indicator = document.getElementById('jump-charge-indicator');
          if (indicator) {
            indicator.classList.remove('visible');
          }
          this.jumpChargeLingerTimeout = null;
        }, this.JUMP_CHARGE_LINGER_TIME);
      }
    }
  },

  /**
   * Handle dedicated dash key press (Shift)
   */
  handleDashKey: function() {
    // Prevent dashing if end screen is visible
    if (window.endScreen && !window.endScreen.classList.contains("hidden")) {
      return;
    }
    
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

  /**
   * Update ground pound indicator UI
   */
  updateGroundPoundIndicator: function() {
    const indicator = document.getElementById('ground-pound-indicator');
    if (!indicator) return;
    
    if (this.isGroundPounding && this.groundPoundPhase === 'hovering') {
      indicator.textContent = `HOVERING ${Math.ceil(this.groundPoundHoverTimer/60*10)/10}s`;
      indicator.className = 'active';
    } else if (this.isGroundPounding && this.groundPoundPhase === 'slamming') {
      indicator.textContent = 'SLAMMING!';
      indicator.className = 'active';
    } else if (this.groundPoundCooldownTimer > 0) {
      const cooldownSeconds = (this.groundPoundCooldownTimer / 60).toFixed(1);
      indicator.textContent = `Ground Pound ${cooldownSeconds}s`;
      indicator.className = 'cooldown';
    } else if (!this.isGrounded) {
      indicator.textContent = 'Ground Pound Ready';
      indicator.className = '';
    } else {
      indicator.textContent = 'Ground Pound (air only)';
      indicator.className = 'disabled';
    }
  },
};

// Make PlayerController globally available
window.PlayerController = PlayerController;
