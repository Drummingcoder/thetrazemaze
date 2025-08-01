// =================================================================
// START LEVEL MODULE
// =================================================================
// This module handles game level initialization and starting functionality.
// It manages the transition from level selection to actual gameplay.

const startLevel = {
    // Start game with specific level
    startGameWithLevel: function(levelNumber) {
        console.log(`Starting game with level ${levelNumber}...`);
        
        // Set the selected level globally
        window.selectedLevel = levelNumber;
        
        // CRITICAL: Use existing GameInitializer reset functions
        if (window.GameInitializer) {
            window.GameInitializer.restartGame(1);
        }
        
        // Re-initialize maze data for the selected level AFTER reset
        const mazeData = window.MazeRenderer.getMazeData(levelNumber);
        console.log('Loading maze data for level', levelNumber, ':', mazeData);
        
        // Update global maze variables
        window.mazeStructure = mazeData.mazeStructure;
        window.mazeWidth = mazeData.mazeWidth;
        window.mazeHeight = mazeData.mazeHeight;
        window.startRow = mazeData.startRow;
        window.startCol = mazeData.startCol;
        window.endRow = mazeData.endRow;
        window.endCol = mazeData.endCol;
        
        // Recalculate cell size for the new maze dimensions
        const availableWidth = window.innerWidth;
        const availableHeight = window.innerHeight;
        const maxCellSizeWidth = Math.floor(availableWidth / window.mazeWidth);
        const maxCellSizeHeight = Math.floor(availableHeight / window.mazeHeight);
        window.cellSize = Math.min(maxCellSizeWidth, maxCellSizeHeight);
        
        // Ensure minimum cell size
        if (window.cellSize < 3) {
            window.cellSize = 3;
        }
        
        // Update canvas sizes
        const mazeWidthPx = window.mazeWidth * window.cellSize;
        const mazeHeightPx = window.mazeHeight * window.cellSize;

        if (window.canvas) {
            window.canvas.width = mazeWidthPx;
            window.canvas.height = mazeHeightPx;
            console.log('Canvas resized to:', mazeWidthPx, 'x', mazeHeightPx);
        }

        if (window.playerCanvas) {
            window.playerCanvas.width = mazeWidthPx;
            window.playerCanvas.height = mazeHeightPx;
            console.log('Player canvas resized to:', mazeWidthPx, 'x', mazeHeightPx);
        }
        
        // Force reset player position after maze data is updated
        window.playerX = window.startCol * window.cellSize;
        window.playerY = window.startRow * window.cellSize;
        console.log('Player position force-reset to:', window.playerX, window.playerY);
        
        // Force render to ensure maze displays
        if (window.CanvasRenderer) {
            setTimeout(() => {
                console.log('Force rendering maze after level change...');
                window.CanvasRenderer.renderFrame();
            }, 100);
        }
        
        // Start the actual game
        this.startGame(levelNumber);
    },
    
    // Start the actual game (modified to accept level parameter)
    startGame: function(levelNumber = 1) {
        console.log(`Starting game... Level: ${levelNumber}`);
        window.isGameStarted = true;
        
        // Show loading overlay during game initialization
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'block';
            loadingOverlay.style.opacity = '1';
        }
        
        // Hide level select screen (or start screen if coming directly)
        const levelSelectScreen = document.getElementById('level-select-screen');
        const startScreen = document.getElementById('start-screen');
        
        if (levelSelectScreen && levelSelectScreen.style.display === 'flex') {
            levelSelectScreen.classList.add('hidden');
            setTimeout(() => {
                levelSelectScreen.style.display = 'none';
            }, 500);
        } else if (startScreen && startScreen.style.display !== 'none') {
            startScreen.classList.add('hidden');
            setTimeout(() => {
                startScreen.style.display = 'none';
            }, 500);
        }
        
        // Show game elements
        const gameElements = [
            document.getElementById('timer'),
            document.getElementById('dash-indicator'),
            document.getElementById('ground-pound-indicator'),
            document.getElementById('controls-hint'),
            document.getElementById('maze-container')
        ];
        
        gameElements.forEach(element => {
            if (element) {
                element.style.display = 'block';
            }
        });
        
        // Also remove the hidden class from controls hint
        const controlsHint = document.getElementById('controls-hint');
        if (controlsHint) {
            controlsHint.classList.remove('hidden');
        }
        
        // Show heart overlay when game starts
        if (typeof setHeartOverlayVisible === 'function') {
            setHeartOverlayVisible(true);
        } else {
            // Fallback: show heart overlay directly
            const heartOverlay = document.getElementById('heart-overlay');
            if (heartOverlay) {
                heartOverlay.style.display = 'block';
            }
        }
        
        // Initialize the actual game
        setTimeout(() => {
            if (window.GameInitializer.initializeGame) {
                window.GameInitializer.initializeGame();
            }
            
            // Hide loading overlay after game is initialized
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                setTimeout(() => {
                    loadingOverlay.style.opacity = '0';
                    setTimeout(() => {
                        loadingOverlay.style.display = 'none';
                    }, 400);
                }, 500); // Give the game time to fully initialize
            }
        }, 100);
    }   
};

// Make StartLevel available globally
window.StartLevel = startLevel;

// Also expose individual functions globally for backward compatibility
window.startGameWithLevel = startLevel.startGameWithLevel;
window.startGame = startLevel.startGame;


