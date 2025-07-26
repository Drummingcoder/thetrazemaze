// =================================================================
// START SCREEN MANAGER MODULE
// =================================================================
// This module handles all start screen, level select, and navigation functionality

window.StartScreenManager = (function() {
    'use strict';

    // Initialize start screen
    function initializeStartScreen() {
        // Hide game elements initially
        const gameElements = [
            document.getElementById('timer'),
            document.getElementById('dash-indicator'),
            document.getElementById('ground-pound-indicator'),
            document.getElementById('controls-hint'),
            document.getElementById('maze-container')
        ];
        
        // Also hide the controls hint specifically
        const controlsHint = document.getElementById('controls-hint');
        if (controlsHint) {
            controlsHint.classList.add('hidden');
        }
        
        // Hide heart overlay if it exists
        if (typeof setHeartOverlayVisible === 'function') {
            setHeartOverlayVisible(false);
        } else {
            // Fallback: hide heart overlay directly
            const heartOverlay = document.getElementById('heart-overlay');
            if (heartOverlay) {
                heartOverlay.style.display = 'none';
            }
        }
        
        gameElements.forEach(element => {
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // Get element references
        const startGameBtn = document.getElementById('start-game-btn');
        const settingsGear = document.getElementById('settings-gear');
        const upgradesBtn = document.getElementById('upgrades-btn');
        const aboutCorner = document.getElementById('about-corner');
        
        // Start game button handler - now goes to level select
        if (startGameBtn) {
            startGameBtn.addEventListener('click', function() {
                console.log('Start Game clicked - showing level select');
                showLevelSelect();
            });
        }
        // Settings gear icon handler (placeholder for now)
        if (settingsGear) {
            settingsGear.addEventListener('click', function() {
                console.log('Settings gear clicked');
                alert('Settings feature coming soon!');
            });
        }
        
        // Upgrades button handler (placeholder for now)
        if (upgradesBtn) {
            upgradesBtn.addEventListener('click', function() {
                console.log('Upgrades clicked');
                alert('Upgrades feature coming soon! 🚀\n\nUpgrade your player with:\n• Faster movement speed\n• Longer dash distance\n• Reduced cooldowns\n• Special abilities');
            });
        }
        
        // About corner button handler (placeholder for now)
        if (aboutCorner) {
            aboutCorner.addEventListener('click', function() {
                console.log('About corner clicked');
                alert('The Traze Maze v2.0\n\nNavigate through the maze as fast as you can!\n\nControls:\n• Arrow Keys/WASD: Move\n• Shift/Space: Dash\n• Hold Up/W: Charge Jump\n• Down/S (in air): Ground Pound\n\nCreated by Drummingcoder');
            });
        }
    }
    
    // Show level select screen
    function showLevelSelect() {
        console.log('Showing level select screen...');
        
        // Hide start screen
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.classList.add('hidden');
            setTimeout(() => {
                startScreen.style.display = 'none';
            }, 500);
        }
        
        // Show level select screen
        const levelSelectScreen = document.getElementById('level-select-screen');
        if (levelSelectScreen) {
            setTimeout(() => {
                levelSelectScreen.style.display = 'flex';
                setTimeout(() => {
                    levelSelectScreen.classList.remove('hidden');
                    // Always load personal best times when screen is shown
                    loadLevelBestTimes();
                }, 50);
            }, 300);
        }
        
        // Setup level select event listeners
        setupLevelSelectListeners();
    }
    
    // Setup level select event listeners
    function setupLevelSelectListeners() {
        // Level 1 card (unlocked)
        const level1Card = document.getElementById('level-1-card');
        if (level1Card && !level1Card.dataset.listenerAdded) {
            level1Card.addEventListener('click', function() {
                console.log('Level 1 selected');
                if (window.startGameWithLevel) {
                    window.startGameWithLevel(1);
                }
            });
            level1Card.dataset.listenerAdded = 'true';
        }
        
        // Level 2 card (unlocked)
        const level2Card = document.getElementById('level-2-card');
        if (level2Card && !level2Card.dataset.listenerAdded) {
            level2Card.addEventListener('click', function() {
                console.log('Level 2 selected');
                if (window.startGameWithLevel) {
                    window.startGameWithLevel(2);
                }
            });
            level2Card.dataset.listenerAdded = 'true';
        }
        
        // Locked level cards (levels 3-10, show coming soon message)
        const lockedCards = document.querySelectorAll('.level-card.locked');
        lockedCards.forEach(card => {
            if (!card.dataset.listenerAdded) {
                card.addEventListener('click', function() {
                    const levelNum = card.getAttribute('data-level');
                    console.log(`Locked level ${levelNum} clicked`);
                    alert(`Level ${levelNum} is coming soon! 🚧\n\nStay tuned for more challenging mazes!`);
                });
                card.dataset.listenerAdded = 'true';
            }
        });
        
        // Back to menu button
        const backToMenuBtn = document.getElementById('back-to-menu-btn');
        if (backToMenuBtn && !backToMenuBtn.dataset.listenerAdded) {
            backToMenuBtn.addEventListener('click', function() {
                console.log('Back to menu clicked');
                showStartScreen();
            });
            backToMenuBtn.dataset.listenerAdded = 'true';
        }
    }
    
    // Show start screen (back from level select)
    function showStartScreen() {
        console.log('Returning to start screen...');
        
        // Cleanup game systems to stop timers and movement
        if (window.GameInitializer && window.GameInitializer.cleanupGameSystems) {
            window.GameInitializer.cleanupGameSystems();
        }
        
        // Hide end screen if it's showing
        const gameEndScreen = document.getElementById('end-screen');
        if (gameEndScreen && !gameEndScreen.classList.contains('hidden')) {
            gameEndScreen.classList.add('hidden');
        }
        
        // Hide game elements
        const gameElements = [
            document.getElementById('timer'),
            document.getElementById('dash-indicator'),
            document.getElementById('ground-pound-indicator'),
            document.getElementById('controls-hint'),
            document.getElementById('maze-container')
        ];
        
        gameElements.forEach(element => {
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // Reset game started flag
        if (window.isGameStarted !== undefined) {
            window.isGameStarted = false;
        }
        
        // Hide level select screen
        const levelSelectScreen = document.getElementById('level-select-screen');
        if (levelSelectScreen) {
            levelSelectScreen.classList.add('hidden');
            setTimeout(() => {
                levelSelectScreen.style.display = 'none';
            }, 500);
        }
        
        // Show start screen
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            setTimeout(() => {
                startScreen.style.display = 'flex';
                setTimeout(() => {
                    startScreen.classList.remove('hidden');
                }, 50);
            }, 300);
        }
    }
    
    // Load personal best times for all levels
    function loadLevelBestTimes() {
        console.log('Loading personal best times for level select...');
        
        // Update Level 1 (unlocked) using unified PersonalBestManager
        if (window.PersonalBestManager) {
            window.PersonalBestManager.updateLevelDisplay(1);
            window.PersonalBestManager.updateLevelDisplay(2);
        } else {
            console.warn('PersonalBestManager not available when loading level best times');
        }
    }
    
    // Update personal best time for a specific level
    function updateLevelBestTime(levelNumber) {
        console.log('Updating best time for level', levelNumber);
        
        // Update using unified PersonalBestManager
        if (window.PersonalBestManager) {
            window.PersonalBestManager.updateLevelDisplay(levelNumber);
        } else {
            console.warn('PersonalBestManager not available when updating level best time');
        }
    }

    // Public API
    return {
        initializeStartScreen: initializeStartScreen,
        showLevelSelect: showLevelSelect,
        showStartScreen: showStartScreen,
        setupLevelSelectListeners: setupLevelSelectListeners,
        loadLevelBestTimes: loadLevelBestTimes,
        updateLevelBestTime: updateLevelBestTime
    };
})();

// Make functions globally available for backwards compatibility
window.showStartScreen = window.StartScreenManager.showStartScreen;
window.showLevelSelect = window.StartScreenManager.showLevelSelect;
window.loadLevelBestTimes = window.StartScreenManager.loadLevelBestTimes;
window.updateLevelBestTime = window.StartScreenManager.updateLevelBestTime;
