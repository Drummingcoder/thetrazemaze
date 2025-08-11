# The Traze Maze

A maze platformer game made by me. Still under development and online @ https://summer.hackclub.com/projects/1408.

This game is a level by level game that you have to navigate the maze using arrow keys or WASD to reach the end. 
Simply go to the website: https://drummingcoder.github.io/thetrazemaze/ to play the game or learn more about it!

AI (Github Copilot) is used to help design the look of the website and augment its functionality. I just did some of
the maze generation and movement.

Going to add more levels and upgrades, as well as more features soon!

## Updated Goals (08/10/2025):
I want to transition to a different kind of game, for two reasons. Number one:
this kind of game (building the physics engine and rendering from scratch) is
good for learning, but it's slow to develop and isn't a good long-term project.
I pretty much understand the concepts of game design now and to keep going
with this project won't benefit me as much anymore compared to starting a new
project with an engine like Unity or Godot.
Number two: the whole premise of the game is boring, running through a maze
sounded like a good and fun thing to do, but its implementation proved to be 
not the funnest. It's hard to tell what makes you good in this game and 
honestly it's hard for me to recommend this project. I leave the original goals
of this game at the bottom in case I ever want to come back and redesign the 
game so that it's more fun, but for right now, I'm putting this project into
quick wrap-up mode.

## New Goals (to be achieved 08/12/2025):
- Make level 2 maze

## Original Details:
- 10 levels, starting from easy to hard (1 level already implemented)
- Running, dashing, ground pounding (implemented), jumping, and shooting mechanics (want to separate charge jump and jump)
- After grabbing coins in the maze, you could use those to buy upgrades.
- Upgrades are: faster dashes, faster running, ability to crouch, ability to charge jump (right now granted automatically, but will
remove), better guns, and faster shooting.
- The maze have enemies that you need to shoot and spikes and obstacles you need to dodge to reach the end (only spike implemented)
- The end goal is to reach the final level and defeat the boss.
- Settings menu would allow you to turn off the volume, rebind keys, clear best time data, and perhaps more.

### Things to fix/add:
- Better start screen and level select
- More exciting maze
- Enemies
- Guns
- Functioning music and a better soundtrack
- Pause menu

### Bugs:
- Timer doesn't immediately stop upon touching the end square (sometimes)
- Collision detection is still funky and not the best
- Spike detection is too wide
- Player can start running even if sprite isn't loaded in
- Game runs slowly if chromebook is on battery saver

### Future features to add (beyond Aug 31st):
- Leaderboard (if not done yet)
- Hub world (with shop and levels)
- More levels

Timeline:
Organize code and comments, fix as many bugs as possible, add enemies and guns, add level 2 and 3, add Settings menu, add Upgrades menu, add Pause menu, etc.
