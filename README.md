# The Traze Maze

A maze game made by me. Still under development.
Hopefully, this game can turn out to be a combination between a shooter and a platformer game and the element of a maze mixed in. 

AI is used to help design the look of the website and augment its functionality.

## Code Organization

The game code has been modularized into separate JavaScript files for better organization and maintainability:

### JavaScript Modules (in /js/)

- **camera-system.js** - Camera positioning, zooming, and player following
  - `CameraSystem.initializeNewCamera()` - Initialize camera with optimal zoom
  - `CameraSystem.centerOnPlayer()` - Center camera on player position
  - `CameraSystem.resetCamera()` - Reset camera to default state
  - `CameraSystem.updateCamera()` - Update camera position (throttled)

- **canvas-renderer.js** - Canvas drawing operations for maze and player
  - `CanvasRenderer.drawMaze()` - Draw the complete maze on canvas
  - `CanvasRenderer.drawPlayer()` - Draw the player on canvas
  - `CanvasRenderer.renderFrame()` - Main rendering function with throttling
  - `CanvasRenderer.prepareAnimationSystem()` - Pre-warm animation system

- **player-controller.js** - Player movement, collision detection, and controls
  - `PlayerController.checkCollision(x, y)` - Collision detection for smooth movement
  - `PlayerController.checkEndReached()` - Check if player reached maze end
  - `PlayerController.smoothMovementLoop()` - Main movement animation loop
  - `PlayerController.handleKeyDown(key)` - Handle key press events
  - `PlayerController.handleKeyUp(key)` - Handle key release events
  - `PlayerController.cleanupMovementSystems()` - Clean up movement state

- **game-initializer.js** - Game setup, cleanup, and state management
  - `GameInitializer.initializeGame()` - Initialize complete game system
  - `GameInitializer.cleanupGameSystems()` - Comprehensive cleanup function
  - `GameInitializer.resizeMaze()` - Handle window resize events
  - `GameInitializer.setupEventListeners()` - Setup button event handlers

- **audio-manager.js** - Audio system management
- **game-timer.js** - Game timing functionality
- **personal-best-manager.js** - Personal best score tracking
- **maze-generator.js** - Maze generation logic
- **maze-renderer.js** - Maze rendering utilities
- **game-actions.js** - Game action handlers
- **main-library.js** - Main game library functions

### Module Integration

Functions have been moved from `newmaze.html` into their appropriate modules while preserving all functionality. The main HTML file now acts as a coordinator that calls module functions rather than containing all logic inline.

All modules are globally accessible (e.g., `window.CameraSystem`, `window.PlayerController`) to maintain compatibility with existing code.
