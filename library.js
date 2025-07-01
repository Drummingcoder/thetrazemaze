console.log('library.js loaded successfully');

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
    startRow = 1;
    startCol = 1;
    endRow = mazeSize - 2;
    endCol = mazeSize - 2;
    
    // Ensure start and end positions are marked as open paths
    if (mazeStructure && mazeStructure[startRow] && mazeStructure[endRow]) {
      mazeStructure[startRow][startCol] = 0;
      mazeStructure[endRow][endCol] = 0;
    }
  },

  generateRandomMaze: function() {
    mazeStructure = [];
    for (let i = 0; i < mazeSize; i++) {
      const row = [];
      for (let j = 0; j < mazeSize; j++) {
        row.push(1);
      }
      mazeStructure.push(row);
    }

    // Ensure start and end positions are open before generating paths
    mazeStructure[startRow][startCol] = 0;
    mazeStructure[endRow][endCol] = 0;

    this.generateClearPath();
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
    mazeStructure[startRow][startCol] = 0;
    mazeStructure[endRow][endCol] = 0;

    function getNeighbor(row, col) {
      const neighbors = [];
      if (row >= 2 && !visited[`${row - 2}-${col}`]) {
        neighbors.push([row - 2, col]);
      }
      if (col >= 2 && !visited[`${row}-${col - 2}`]) {
        neighbors.push([row, col - 2]);
      }
      if (row < mazeSize - 2 && !visited[`${row + 2}-${col}`]) {
        neighbors.push([row + 2, col]);
      }
      if (col < mazeSize - 2 && !visited[`${row}-${col + 2}`]) {
        neighbors.push([row, col + 2]);
      }

      return neighbors;
    }

    const stack = [];
    const visited = {};
    
    let currentRow = startRow;
    let currentCol = startCol;
    
    visited[`${currentRow}-${currentCol}`] = true;

    while (true) {
      const neighbors = getNeighbor(currentRow, currentCol);
      
      if (neighbors.length > 0) {
        const [nextRow, nextCol] = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        visited[`${nextRow}-${nextCol}`] = true;
        mazeStructure[nextRow][nextCol] = 0;
        
        if (nextRow === currentRow) {
          const startCol = Math.min(currentCol, nextCol);
          const endCol = Math.max(currentCol, nextCol);
          for (let c = startCol; c <= endCol; c++) {
            mazeStructure[currentRow][c] = 0;
          }
        } else {
          const startRow = Math.min(currentRow, nextRow);
          const endRow = Math.max(currentRow, nextRow);
          for (let r = startRow; r <= endRow; r++) {
            mazeStructure[r][currentCol] = 0;
          }
        }
        
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
  },

  generateEasyPath: function() {
    mazeStructure[startRow][startCol] = 0;
    mazeStructure[endRow][endCol] = 0;

    function getNeighbor(row, col) {
      const neighbors = [];
      if (row >= 2 && !visited[`${row - 2}-${col}`]) {
        neighbors.push([row - 2, col]);
      }
      if (col >= 2 && !visited[`${row}-${col - 2}`]) {
        neighbors.push([row, col - 2]);
      }
      if (row < mazeSize - 2 && !visited[`${row + 2}-${col}`]) {
        neighbors.push([row + 2, col]);
      }
      if (col < mazeSize - 2 && !visited[`${row}-${col + 2}`]) {
        neighbors.push([row, col + 2]);
      }

      return neighbors;
    }

    const stack = [];
    const visited = {};
    
    let currentRow = startRow;
    let currentCol = startCol;
    
    visited[`${currentRow}-${currentCol}`] = true;

    while (true) {
      const neighbors = getNeighbor(currentRow, currentCol);
      
      if (neighbors.length > 0) {
        const [nextRow, nextCol] = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        visited[`${nextRow}-${nextCol}`] = true;
        mazeStructure[nextRow][nextCol] = 0;
        
        if (nextRow === currentRow) {
          const startCol = Math.min(currentCol, nextCol);
          const endCol = Math.max(currentCol, nextCol);
          for (let c = startCol; c <= endCol; c++) {
            mazeStructure[currentRow][c] = 0;
          }
        } else {
          const startRow = Math.min(currentRow, nextRow);
          const endRow = Math.max(currentRow, nextRow);
          for (let r = startRow; r <= endRow; r++) {
            mazeStructure[r][currentCol] = 0;
          }
        }
        
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

    // Add random wall removal for easier navigation
    for (let i = 1; i < mazeSize - 1; i++) {
      for (let j = 1; j < mazeSize - 1; j++) {
        if (mazeStructure[i][j] === 1 && Math.random() < 0.3) {
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
  },

  createMaze: function() {
    while (maze.firstChild) {
      maze.removeChild(maze.firstChild);
    }
    
    for (let i = 0; i < mazeSize; i++) {
      for (let j = 0; j < mazeSize; j++) {
        const cell = document.createElement("div");
        cell.className = "cell";

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
        
        if (i === startRow && j === startCol) {
          cell.classList.add("start");
        } else if (i === endRow && j === endCol) {
          cell.classList.add("end");
        }
        
        maze.appendChild(cell);
      }
    }
  },

  movePlayer: function(event, endScreen, startTime, endContent, type, personalbest, newpersonalbest, interval ) {
    if (!endScreen.classList.contains("hidden")) {
      // Player is on the end screen, do not allow movement
      return;
    }

    // Account for sprite offset - the player sprite is 48px centered in the cell
    const spriteSize = 48;
    const offsetX = (spriteSize - cellSize) / 2;
    const offsetY = (spriteSize - cellSize) / 2;

    // Get current position accounting for the offset
    let topPos = (parseInt(player.style.top) + offsetY) / cellSize;
    let leftPos = (parseInt(player.style.left) + offsetX) / cellSize;

    if (event.key === "ArrowUp" || event.key === "w") {
      topPos--;
    } else if (event.key === "ArrowDown" || event.key === "s") {
      topPos++;
    } else if (event.key === "ArrowLeft" || event.key === "a") {
      leftPos--;
    } else if (event.key === "ArrowRight" || event.key === "d") {
      leftPos++;
    }

    // Ensure positions are integers and within bounds
    topPos = Math.floor(topPos);
    leftPos = Math.floor(leftPos);

    if (
      topPos >= 0 &&
      topPos < mazeSize &&
      leftPos >= 0 &&
      leftPos < mazeSize &&
      mazeStructure[topPos] &&
      mazeStructure[topPos][leftPos] !== 1
    ) {
      // Apply the offset back when setting position
      player.style.top = (topPos * cellSize - offsetY) + "px";
      player.style.left = (leftPos * cellSize - offsetX) + "px";
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

          // Update the maze visually
          this.createMaze();

          mazecount++;

          // Reset player position with offset
          player.style.top = (startRow * cellSize - offsetY) + "px";
          player.style.left = (startCol * cellSize - offsetX) + "px";
          maze.appendChild(player);
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
};
