# JavaScript Module Documentation

This document explains the modular structure of the Traze Maze game's JavaScript code. Functions have been organized into focused modules for better maintainability and understanding.

## Module Structure

### 1. Camera System (`js/camera-system.js`)
**Purpose**: Handles camera positioning, zooming, and player following
- Dynamic camera positioning with smooth transforms
- Optimal zoom calculation based on screen size
- Player-centered camera following

**Key Functions**:
- `initializeNewCamera()` - Initialize camera with optimal zoom level
- `centerOnPlayer()` - Center camera on current player position
- `applyCamera()` - Apply camera transformations to canvas
- `updateCamera()` - Update camera position (throttled for performance)
- `resetCamera()` - Reset camera to default state

### 2. Canvas Renderer (`js/canvas-renderer.js`)
**Purpose**: Handles all canvas drawing operations including maze and player rendering
- Optimized batch drawing for better performance
- Throttled rendering to maintain smooth framerates
- Performance monitoring and FPS tracking

**Key Functions**:
- `drawMaze()` - Draw the complete maze structure on canvas
- `drawPlayer()` - Draw the player sprite with proper positioning
- `renderFrame()` - Main rendering function with throttling
- `monitorPerformance()` - Track rendering performance
- `prepareAnimationSystem()` - Pre-warm animation system

### 3. Player Controller (`js/player-controller.js`)
**Purpose**: Handles player movement, collision detection, and input controls
- Smooth pixel-based movement system
- Advanced collision detection with wall sliding
- End condition checking

**Key Functions**:
- `checkCollision(x, y)` - Collision detection for smooth movement
- `checkEndReached()` - Check if player reached maze end
- `smoothMovementLoop()` - Main movement animation loop
- `handleKeyDown(key)` - Process key press events
- `handleKeyUp(key)` - Process key release events
- `cleanupMovementSystems()` - Clean up movement state and animation frames

### 4. Game Initializer (`js/game-initializer.js`)
**Purpose**: Handles game setup, cleanup, and state management
- Complete game system initialization
- Memory leak prevention and resource cleanup
- Window resize handling and responsive design

**Key Functions**:
- `initializeGame()` - Initialize complete game system
- `cleanupGameSystems()` - Comprehensive cleanup to prevent memory leaks
- `resizeMaze()` - Handle window resize events and recalculate dimensions
- `setupEventListeners()` - Setup button event handlers
- `createVirtualPlayer()` - Create player object for library compatibility

### 5. Audio Manager (`js/audio-manager.js`)
**Purpose**: Handles all audio-related functionality
- Audio preloading to reduce lag
- Music playback with fallback handling
- Audio controls (play, pause, stop)

**Key Functions**:
- `preloadAudio()` - Loads background music file
- `playMusic()` - Plays music with error handling
- `stopMusic()` - Stops and resets music
- `pauseMusic()` - Pauses music preserving position

### 6. Game Timer (`js/game-timer.js`)
**Purpose**: Manages all timing functionality
- High-precision timer (updates every 10ms)
- Time formatting (MM:SS.mmm)
- Timer control (start, stop, reset)

**Key Functions**:
- `startTimer(timerElement)` - Starts game timer
- `formatTime(milliseconds)` - Formats time for display
- `stopTimer()` - Stops current timer
- `getElapsedTime()` - Gets current elapsed time

### 7. Personal Best Manager (`js/personal-best-manager.js`)
**Purpose**: Handles saving and displaying personal records
- localStorage management for different game modes
- Personal best calculation and comparison
- Record display and new record detection

**Key Functions**:
- `calculatePersonalBestTime(time, type)` - Determines if new record
- `displayPersonalBestTime(time, type, elements...)` - Updates UI
- `generateMazeIdentifier(type)` - Creates unique storage keys
- `clearAllBests()` - Resets all records

### 8. Maze Generator (`js/maze-generator.js`)
**Purpose**: Creates different types of maze structures
- Random maze generation using recursive backtracking
- Easy mode with additional openings
- Start/end position calculation

**Key Functions**:
- `generateRandomMaze()` - Creates challenging maze
- `generateClearPath()` - Creates standard difficulty maze
- `generateEasyPath()` - Creates easier maze with shortcuts
- `carveWideCorridor(row, col)` - Creates 3-wide pathways

### 5. Maze Renderer (`js/maze-renderer.js`)
**Purpose**: Handles visual representation of the maze
- Viewport-based rendering for performance
- Canvas preview generation
- DOM element management

**Key Functions**:
- `createMaze()` - Sets up complete maze rendering
- `createMazePreview()` - Creates fast canvas overview
- `updateViewport(row, col)` - Updates visible area around player
- `createMazeCell(i, j)` - Creates individual cell elements

### 6. Player Controller (`js/player-controller.js`)
**Purpose**: Manages player movement and game state
- Collision detection
- Movement validation
- Goal completion handling
- Multiple goals mode logic

**Key Functions**:
- `movePlayer(event, ...)` - Handles keyboard input and movement
- `handleSingleGoalMode(...)` - Single goal completion logic
- `handleMultipleGoalsMode(...)` - Multiple goals game logic
- Collision detection with boundary checking

### 7. Game Actions (`js/game-actions.js`)
**Purpose**: Game control and sharing functionality
- Game restart and navigation
- Results sharing to clipboard
- End screen management

**Key Functions**:
- `restartMaze()` - Reloads game
- `goBack()` - Returns to main menu
- `copyMazeAndTime()` - Shares results (hard mode)
- `copyEasyMazeAndTime()` - Shares results (easy mode)

### 8. Main Library (`js/main-library.js`)
**Purpose**: Backwards compatibility layer
- Maintains original `myLibrary` API
- Delegates calls to appropriate modules
- Ensures existing code continues to work

## Loading Order

The modules are loaded in dependency order in `newmaze.html`:

```html
<script src="./js/audio-manager.js"></script>
<script src="./js/game-timer.js"></script>
<script src="./js/personal-best-manager.js"></script>
<script src="./js/maze-generator.js"></script>
<script src="./js/maze-renderer.js"></script>
<script src="./js/player-controller.js"></script>
<script src="./js/game-actions.js"></script>
<script src="./js/main-library.js"></script>
```

## Key Benefits

1. **Modularity**: Each file has a single, clear responsibility
2. **Maintainability**: Easy to find and modify specific functionality
3. **Readability**: Extensive comments explain every function and its purpose
4. **Performance**: Modules can be optimized independently
5. **Testing**: Individual modules can be tested in isolation
6. **Backwards Compatibility**: Original API still works through main-library.js

## Global Objects

Each module creates a global object:
- `AudioManager` - Audio functionality
- `GameTimer` - Timing functionality
- `PersonalBestManager` - Personal records
- `MazeGenerator` - Maze creation
- `MazeRenderer` - Visual rendering
- `PlayerController` - Player movement
- `GameActions` - Game controls
- `myLibrary` - Original API (backwards compatibility)

## Code Style

All modules follow consistent patterns:
- Detailed JSDoc-style comments for every function
- Parameter documentation with types
- Clear variable names and consistent formatting
- Error handling where appropriate
- Separation of concerns with focused responsibilities

This modular approach makes the codebase much easier to understand, maintain, and extend while preserving all original functionality.
