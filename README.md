# The Traze Maze

A maze platformer game made by me. Still under development and online @ https://summer.hackclub.com/projects/1408.

This game is a level by level game that you have to navigate the maze using arrow keys or WASD to reach the end. 
Simply go to the website: https://drummingcoder.github.io/thetrazemaze/ to play the game or learn more about it!

AI (Github Copilot) is used to help design the look of the website and augment its functionality. I just did some of
the maze generation and movement.

Going to add more levels and upgrades, as well as more features soon!

The goal of the maze: 10 levels, progressively getting harder and bigger (not so much bigger than harder), a 
Settings menu, and an Upgrades shop. After reaching the point of having 10 functioning levels (hopefully by Aug 31st), I will slow down
development of the game (although I'll come back from time to time). 

## Details:
- 10 levels, starting from easy to hard (1 level already implemented)
- Running, dashing, ground pounding (implemented), jumping, and shooting mechanics (want to separate charge jump and jump)
- After grabbing coins in the maze, you could use those to buy upgrades.
- Upgrades are: faster dashes, faster running, ability to crouch, ability to charge jump (right now granted automatically, but will
remove), better guns, and faster shooting.
- The maze have enemies that you need to shoot and spikes and obstacles you need to dodge to reach the end (only spike implemented)
- The end goal is to reach the final level and defeat the boss.
- Settings menu would allow you to turn off the volume, rebind keys, clear best time data, and perhaps more.
- There might also be a leaderboard showing the best times on the maze.

### Things to fix/add:
- Better start screen and level select
- More exciting maze
- Enemies
- Guns
- Better organization and commenting of code
- Functioning music and a better soundtrack

### Bugs:
- Timer doesn't immediately stop upon touching the end square
- Dashing while ground pound recovery is still ongoing allows the player to dash and no dash animation to play
- Resizing the window breaks the maze
- Collision detection is still funky and not the best
- Spike detection is too wide

### Future features to add (beyond Aug 31st):
- Leaderboard (if not done yet)
- Hub world (with shop and levels)
- More levels
