var myLibrary = {
  timeElapsed: 0,
  interval: 0,

  generateStartAndEndPositions: function() {
    startRow = 1;
    startCol = 1;
    endRow = window.mazeSize - 2;
    endCol = window.mazeSize - 2;
  },

  generateRandomMaze: function() {
    mazeStructure = [];
    for (let i = 0; i < window.mazeSize; i++) {
      const row = [];
      for (let j = 0; j < window.mazeSize; j++) {
        row.push(1);
      }
      mazeStructure.push(row);
    }
  },

  playMusic: function() {
    var audio = new Audio('Enaudi Experience.mp3');
    audio.play();
  },

  generateClearPath: function() {
    mazeStructure[startRow][startCol] = 0;
    mazeStructure[endRow][endCol] = 0;

    const stack = [];
    const visited = {};

    function getNeighbor(row, col) {
      const neighbors = [];
      if (row >= 2 && !visited[`${row - 2}-${col}`]) {
        neighbors.push([row - 2, col]);
      }
      if (col >= 2 && !visited[`${row}-${col - 2}`]) {
        neighbors.push([row, col - 2]);
      }
      if (row < window.mazeSize - 2 && !visited[`${row + 2}-${col}`]) {
        neighbors.push([row + 2, col]);
      }
      if (col < window.mazeSize - 2 && !visited[`${row}-${col + 2}`]) {
        neighbors.push([row, col + 2]);
      }
      return neighbors;
    }

    function visit(row, col) {
      visited[`${row}-${col}`] = true;
      mazeStructure[row][col] = 0;

      const neighbors = getNeighbor(row, col);
      if (neighbors.length > 0) {
        stack.push([row, col]);
        const [nextRow, nextCol] = neighbors[Math.floor(Math.random() * neighbors.length)];
        const midRow = (row + nextRow) / 2;
        const midCol = (col + nextCol) / 2;
        mazeStructure[midRow][midCol] = 0;
        visit(nextRow, nextCol);
      } else if (stack.length > 0) {
        const [prevRow, prevCol] = stack.pop();
        visit(prevRow, prevCol);
      }
    }

    visit(startRow, startCol);
  },

  generateEasyPath: function() {
    mazeStructure[startRow][startCol] = 0;
    mazeStructure[endRow][endCol] = 0;

    const stack = [];
    const visited = {};

    function getNeighbor(row, col) {
      const neighbors = [];
      if (row >= 2 && !visited[`${row - 2}-${col}`]) {
        neighbors.push([row - 2, col]);
      }
      if (col >= 2 && !visited[`${row}-${col - 2}`]) {
        neighbors.push([row, col - 2]);
      }
      if (row < window.mazeSize - 2 && !visited[`${row + 2}-${col}`]) {
        neighbors.push([row + 2, col]);
      }
      if (col < window.mazeSize - 2 && !visited[`${row}-${col + 2}`]) {
        neighbors.push([row, col + 2]);
      }

      const randomRemoveChance = 0.2;
      const randomReplaceChance = 0.9;
      for (const [nRow, nCol] of neighbors) {
        if (nRow === row) {
          const midCol = (col + nCol) / 2;
          if (mazeStructure[row][midCol] === 1 && Math.random() < randomRemoveChance) {
            mazeStructure[row][midCol] = 0;
          }
        } else if (nCol === col) {
          const midRow = (row + nRow) / 2;
          if (mazeStructure[midRow][col] === 1 && Math.random() < randomRemoveChance) {
            mazeStructure[midRow][col] = 0;
          }
        } else {
          const midRow = (row + nRow) / 2;
          const midCol = (col + nCol) / 2;
          if (mazeStructure[midRow][midCol] === 0 && Math.random() < randomReplaceChance) {
            mazeStructure[midRow][midCol] = 1;
          }
        }
      }

      return neighbors;
    }

    function visit(row, col) {
      visited[`${row}-${col}`] = true;
      mazeStructure[row][col] = 0;

      const neighbors = getNeighbor(row, col);
      if (neighbors.length > 0) {
        stack.push([row, col]);
        const [nextRow, nextCol] = neighbors[Math.floor(Math.random() * neighbors.length)];
        const midRow = (row + nextRow) / 2;
        const midCol = (col + nextCol) / 2;
        mazeStructure[midRow][midCol] = 0;
        visit(nextRow, nextCol);
      } else if (stack.length > 0) {
        const [prevRow, prevCol] = stack.pop();
        visit(prevRow, prevCol);
      }
    }

    visit(startRow, startCol);
  },

  createMaze: function() {
    for (let i = 0; i < window.mazeSize; i++) {
      for (let j = 0; j < window.mazeSize; j++) {
        const cell = document.createElement("div");
        cell.className = "cell";

        if (i === 0 || i === window.mazeSize - 1 || j === 0 || j === window.mazeSize - 1) {
          cell.classList.add("wall");
        } else if (mazeStructure[i][j] === 1) {
          cell.classList.add("wall");
        } else if (mazeStructure[i][j] === 0) {
          if (type === "black")
            cell.classList.add("black");
          else
            cell.classList.add("path");
        }

        cell.style.top = i * window.cellSize + "px";
        cell.style.left = j * window.cellSize + "px";
        maze.appendChild(cell);
      }
    }

    const startCell = document.createElement("div");
    startCell.className = "cell start";
    startCell.style.top = startRow * window.cellSize + "px";
    startCell.style.left = startCol * window.cellSize + "px";
    maze.appendChild(startCell);

    const endCell = document.createElement("div");
    endCell.className = "cell end";
    endCell.style.top = endRow * window.cellSize + "px";
    endCell.style.left = endCol * window.cellSize + "px";
    maze.appendChild(endCell);
  },

  movePlayer: function(event, endScreen, startTime, endContent, type, personalbest, newpersonalbest, interval ) {
    if (!endScreen.classList.contains("hidden")) {
      // Player is on the end screen, do not allow movement
      return;
    }

    // Calculate player size and offset
    const playerSize = Math.floor(Math.max(window.cellSize * 0.8, 8));
    const offset = (window.cellSize - playerSize) / 2;

    // Get current position accounting for offset
    let topPos = (parseInt(window.player.style.top) - offset) / window.cellSize;
    let leftPos = (parseInt(window.player.style.left) - offset) / window.cellSize;

    if (event.key === "ArrowUp" || event.key === "w") {
      topPos--;
    } else if (event.key === "ArrowDown" || event.key === "s") {
      topPos++;
    } else if (event.key === "ArrowLeft" || event.key === "a") {
      leftPos--;
    } else if (event.key === "ArrowRight" || event.key === "d") {
      leftPos++;
    }

    if (
      topPos >= 0 &&
      topPos < window.mazeSize &&
      leftPos >= 0 &&
      leftPos < window.mazeSize &&
      mazeStructure[Math.floor(topPos)][Math.floor(leftPos)] !== 1
    ) {
      // Set position with offset to center the square in the cell
      window.player.style.top = (topPos * window.cellSize + offset) + "px";
      window.player.style.left = (leftPos * window.cellSize + offset) + "px";
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
            newEndRow = Math.floor(Math.random() * (window.mazeSize - 2)) + 1;
            newEndCol = Math.floor(Math.random() * (window.mazeSize - 2)) + 1;
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

          // Calculate player size and offset for proper positioning
          const playerSize = Math.floor(Math.max(window.cellSize * 0.8, 8));
          const offset = (window.cellSize - playerSize) / 2;
          window.player.style.top = (startRow * window.cellSize + offset) + "px";
          window.player.style.left = (startCol * window.cellSize + offset) + "px";
          maze.appendChild(window.player);
        }, 200);
      }
      // Set time limit based on maze size
      let timeLimit;
      if (window.mazeSize === 15) {
        timeLimit = 60000; // 1 min for small maze
      } else if (window.mazeSize === 35) {
        timeLimit = 180000; // 3 min for medium maze
      } else if (window.mazeSize === 61) {
        timeLimit = 300000; // 5 min for big maze
      } else {
        timeLimit = 30000; // fallback default
      }
      if (this.timeElapsed >= timeLimit) {
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
        }, 200);
      }
    }

    event.preventDefault();
  },

  restartMaze: function() {
    window.location.reload();
  },

  goBack: function() {
    window.location.href = "classic.html";
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
    if (window.easy === false) {
      if (window.mazeSize === 15) {
        if (type === "black") {
          mazeIdentifier = 'bsm';
        } else {
          mazeIdentifier = 'sm';
        }
      } else if (window.mazeSize === 35) {
        if (type === "black") {
          mazeIdentifier = 'bmm';
        } else {
          mazeIdentifier = 'mm';
        }
      } else if (window.mazeSize === 61) {
        if (type === "black") {
          mazeIdentifier = 'bbm';
        } else {
          mazeIdentifier = 'bm';
        }
      }
    } else if (easy === true) {
      if (window.mazeSize === 15) {
        if (type === "black") {
          mazeIdentifier = 'besm';
        } else {
          mazeIdentifier = 'esm';
        }
      } else if (window.mazeSize === 35) {
        if (type === "black") {
          mazeIdentifier = 'bemm';
        } else {
          mazeIdentifier = 'emm';
        }
      } else if (window.mazeSize === 61) {
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
      if (window.mazeSize === 15) {
        if (type === "black") {
          mazeIdentifier = "bsm";
        } else {
          mazeIdentifier = "sm";
        }
      } else if (window.mazeSize === 35) {
        if (type === "black") {
          mazeIdentifier = 'bmm';
        } else {
          mazeIdentifier = 'mm';
        }
      } else if (window.mazeSize === 61) {
        if (type === "black") {
          mazeIdentifier = 'bbm';
        } else {
          mazeIdentifier = 'bm';
        }
      }
    } else if (easy === true) {
      if (window.mazeSize === 15) {
        if (type === "black") {
          mazeIdentifier = 'besm';
        } else {
          mazeIdentifier = 'esm';
        }
      } else if (window.mazeSize === 35) {
        if (type === "black") {
          mazeIdentifier = 'bemm';
        } else {
          mazeIdentifier = 'emm';
        }
      } else if (window.mazeSize === 61) {
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

  // Preload audio function (stub for compatibility)
  preloadAudio: function() {
    // Simple audio preload - creates audio element but doesn't load immediately
    // This prevents errors when called from mainmaze.html
  },
};