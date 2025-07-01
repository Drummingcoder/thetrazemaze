#!/usr/bin/env python3
"""
Generate a waving stickman spritesheet that matches the logo style
Creates simple waving animations for background decorations
"""

from PIL import Image, ImageDraw

def create_waving_stickman_spritesheet():
    # Sprite dimensions
    sprite_width = 24
    sprite_height = 24
    cols = 3  # 3 animation frames for waving
    rows = 1  # Just one animation type
    
    # Create the spritesheet canvas
    sheet_width = sprite_width * cols
    sheet_height = sprite_height * rows
    spritesheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(spritesheet)
    
    # Colors matching the logo style
    head_color = (255, 235, 205, 200)  # Cream/beige head like in logo
    body_color = (30, 58, 95, 200)     # Dark blue body
    limb_color = (30, 58, 95, 200)     # Dark blue limbs
    wave_arm_color = (255, 140, 0, 200) # Orange for waving arm
    
    def draw_waving_stickman(x, y, frame):
        # Base positions
        head_x = x + sprite_width // 2
        head_y = y + 4
        body_x = x + sprite_width // 2
        body_y = y + 8
        
        # Head (larger circle like in logo)
        head_radius = 3
        draw.ellipse([head_x-head_radius, head_y-head_radius, 
                     head_x+head_radius, head_y+head_radius], fill=head_color)
        
        # Simple smiley face
        # Eyes
        draw.ellipse([head_x-2, head_y-1, head_x-1, head_y], fill=body_color)
        draw.ellipse([head_x+1, head_y-1, head_x+2, head_y], fill=body_color)
        
        # Smile
        draw.arc([head_x-2, head_y, head_x+2, head_y+2], 0, 180, fill=body_color)
        
        # Body (thicker line)
        draw.line([body_x, body_y+2, body_x, body_y+12], fill=body_color, width=3)
        
        # Legs (static)
        draw.line([body_x, body_y+12, body_x-3, body_y+18], fill=limb_color, width=2)
        draw.line([body_x, body_y+12, body_x+3, body_y+18], fill=limb_color, width=2)
        
        # Arms - one static, one waving
        # Static arm (left)
        draw.line([body_x, body_y+4, body_x-4, body_y+8], fill=limb_color, width=2)
        
        # Waving arm (right) - changes position based on frame
        if frame == 0:  # Arm down
            draw.line([body_x, body_y+4, body_x+4, body_y+8], fill=wave_arm_color, width=2)
        elif frame == 1:  # Arm middle
            draw.line([body_x, body_y+4, body_x+5, body_y+2], fill=wave_arm_color, width=2)
        else:  # frame == 2, Arm up
            draw.line([body_x, body_y+4, body_x+4, body_y], fill=wave_arm_color, width=2)
    
    # Generate all frames
    for col in range(cols):
        x = col * sprite_width
        y = 0
        draw_waving_stickman(x, y, col)
    
    # Save the spritesheet
    spritesheet.save('waving-stickman-spritesheet.png')
    print("Waving stickman spritesheet created: waving-stickman-spritesheet.png")
    print(f"Size: {sheet_width}x{sheet_height} pixels")
    print("Layout: 3 waving animation frames")

if __name__ == "__main__":
    create_waving_stickman_spritesheet()
