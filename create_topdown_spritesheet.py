#!/usr/bin/env python3
"""
Create a top-down perspective player spritesheet for the maze game.
The player is viewed from above with only a circular head and two small feet
positioned right next to the head. As the character moves, the feet animate.
"""

from PIL import Image, ImageDraw
import math

def create_topdown_spritesheet():
    # Spritesheet dimensions (4 frames x 4 directions = 16 sprites total)
    sprite_size = 32
    frames_per_direction = 4
    directions = 4
    
    # Create the spritesheet canvas
    sheet_width = sprite_size * frames_per_direction
    sheet_height = sprite_size * directions
    spritesheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    # Colors
    head_color = (255, 220, 177)  # Skin tone
    foot_color = (139, 69, 19)    # Brown shoes
    
    # Head and foot dimensions
    head_radius = 10  # Larger head since no body
    foot_width = 6
    foot_height = 4
    
    def draw_character(draw, x_offset, y_offset, direction, frame):
        """Draw a single character sprite at the given position"""
        center_x = x_offset + sprite_size // 2
        center_y = y_offset + sprite_size // 2
        
        # Draw head (circle) - centered in the sprite
        head_left = center_x - head_radius
        head_top = center_y - head_radius
        head_right = center_x + head_radius
        head_bottom = center_y + head_radius
        draw.ellipse([head_left, head_top, head_right, head_bottom], 
                    fill=head_color, outline=(200, 150, 100), width=1)
        
        # Draw feet based on direction and animation frame
        # Feet are positioned right next to the head
        
        if direction == 0:  # Down/South
            # Feet below the head
            foot_y = center_y + head_radius + 1
            if frame == 0 or frame == 2:  # Neutral - both feet visible
                # Left foot
                draw.ellipse([center_x - 8, foot_y, center_x - 2, foot_y + foot_height], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                # Right foot
                draw.ellipse([center_x + 2, foot_y, center_x + 8, foot_y + foot_height], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
            elif frame == 1:  # Left foot step
                # Left foot slightly forward
                draw.ellipse([center_x - 8, foot_y + 1, center_x - 2, foot_y + foot_height + 1], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                # Right foot back
                draw.ellipse([center_x + 2, foot_y - 1, center_x + 8, foot_y + foot_height - 1], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
            elif frame == 3:  # Right foot step
                # Left foot back
                draw.ellipse([center_x - 8, foot_y - 1, center_x - 2, foot_y + foot_height - 1], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                # Right foot forward
                draw.ellipse([center_x + 2, foot_y + 1, center_x + 8, foot_y + foot_height + 1], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                
        elif direction == 1:  # Left/West
            # Feet to the left of the head
            foot_x = center_x - head_radius - foot_height - 1
            if frame == 0 or frame == 2:  # Neutral - both feet visible
                # Top foot
                draw.ellipse([foot_x, center_y - 8, foot_x + foot_height, center_y - 2], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                # Bottom foot
                draw.ellipse([foot_x, center_y + 2, foot_x + foot_height, center_y + 8], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
            elif frame == 1:  # Top foot step
                # Top foot forward
                draw.ellipse([foot_x - 1, center_y - 8, foot_x + foot_height - 1, center_y - 2], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                # Bottom foot back
                draw.ellipse([foot_x + 1, center_y + 2, foot_x + foot_height + 1, center_y + 8], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
            elif frame == 3:  # Bottom foot step
                # Top foot back
                draw.ellipse([foot_x + 1, center_y - 8, foot_x + foot_height + 1, center_y - 2], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                # Bottom foot forward
                draw.ellipse([foot_x - 1, center_y + 2, foot_x + foot_height - 1, center_y + 8], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                
        elif direction == 2:  # Right/East
            # Feet to the right of the head
            foot_x = center_x + head_radius + 1
            if frame == 0 or frame == 2:  # Neutral - both feet visible
                # Top foot
                draw.ellipse([foot_x, center_y - 8, foot_x + foot_height, center_y - 2], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                # Bottom foot
                draw.ellipse([foot_x, center_y + 2, foot_x + foot_height, center_y + 8], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
            elif frame == 1:  # Top foot step
                # Top foot forward
                draw.ellipse([foot_x + 1, center_y - 8, foot_x + foot_height + 1, center_y - 2], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                # Bottom foot back
                draw.ellipse([foot_x - 1, center_y + 2, foot_x + foot_height - 1, center_y + 8], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
            elif frame == 3:  # Bottom foot step
                # Top foot back
                draw.ellipse([foot_x - 1, center_y - 8, foot_x + foot_height - 1, center_y - 2], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                # Bottom foot forward
                draw.ellipse([foot_x + 1, center_y + 2, foot_x + foot_height + 1, center_y + 8], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                
        elif direction == 3:  # Up/North
            # Feet above the head
            foot_y = center_y - head_radius - foot_height - 1
            if frame == 0 or frame == 2:  # Neutral - both feet visible
                # Left foot
                draw.ellipse([center_x - 8, foot_y, center_x - 2, foot_y + foot_height], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                # Right foot
                draw.ellipse([center_x + 2, foot_y, center_x + 8, foot_y + foot_height], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
            elif frame == 1:  # Left foot step
                # Left foot back
                draw.ellipse([center_x - 8, foot_y + 1, center_x - 2, foot_y + foot_height + 1], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                # Right foot forward
                draw.ellipse([center_x + 2, foot_y - 1, center_x + 8, foot_y + foot_height - 1], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
            elif frame == 3:  # Right foot step
                # Left foot forward
                draw.ellipse([center_x - 8, foot_y - 1, center_x - 2, foot_y + foot_height - 1], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
                # Right foot back
                draw.ellipse([center_x + 2, foot_y + 1, center_x + 8, foot_y + foot_height + 1], 
                           fill=foot_color, outline=(69, 39, 19), width=1)
    
    # Generate all sprites
    draw = ImageDraw.Draw(spritesheet)
    
    for direction in range(directions):
        for frame in range(frames_per_direction):
            x_offset = frame * sprite_size
            y_offset = direction * sprite_size
            draw_character(draw, x_offset, y_offset, direction, frame)
    
    # Save the spritesheet
    spritesheet.save('/workspaces/thetrazemaze/stickman-topdown-spritesheet.png')
    print("Top-down spritesheet created successfully!")
    
    # Also create a backup of the original spritesheet name for easy switching
    spritesheet.save('/workspaces/thetrazemaze/stickman-running-spritesheet-topdown.png')
    print("Backup copy saved as stickman-running-spritesheet-topdown.png")

if __name__ == "__main__":
    create_topdown_spritesheet()
