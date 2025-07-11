#!/usr/bin/env python3
"""
Create a pixel-perfect character sprite sheet with no anti-aliasing
Hard edges, pixel art style for maximum crispness
"""

from PIL import Image, ImageDraw
import math

def create_pixel_perfect_character_spritesheet():
    # Use a size that's a power of 2
    sprite_width = 64
    sprite_height = 64
    frames_per_direction = 8
    
    # Create spritesheet image
    sheet_width = sprite_width * frames_per_direction
    sheet_height = sprite_height * 2  # Two rows: top = right, bottom = left
    spritesheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    # Pixel-perfect colors (solid, no gradients)
    body_color = (65, 105, 225)      # Royal blue
    accent_color = (25, 25, 112)     # Midnight blue
    hand_color = (255, 182, 193)     # Light pink
    foot_color = (255, 140, 0)       # Dark orange
    eye_color = (255, 255, 255)      # White
    pupil_color = (0, 0, 0)          # Black
    mouth_color = (220, 20, 60)      # Crimson
    
    # Create frames for both directions
    for direction in range(2):  # 0 = right, 1 = left
        for frame in range(frames_per_direction):
            # Create individual frame
            frame_img = Image.new('RGBA', (sprite_width, sprite_height), (0, 0, 0, 0))
            
            # Get pixel array for direct manipulation
            pixels = frame_img.load()
            
            # Animation offset for bouncing effect (integer only)
            bounce_offset = int(math.sin(frame * math.pi / 4) * 2)
            
            # Body position (center of sprite)
            body_x = sprite_width // 2
            body_y = sprite_height // 2 + bounce_offset
            body_radius = 18  # Slightly smaller for cleaner pixels
            
            # Draw circular body using pixel-perfect circle algorithm
            for y in range(sprite_height):
                for x in range(sprite_width):
                    dx = x - body_x
                    dy = y - body_y
                    distance = math.sqrt(dx*dx + dy*dy)
                    
                    # Main body circle
                    if distance <= body_radius:
                        pixels[x, y] = body_color
                    # Accent border
                    elif distance <= body_radius + 1:
                        pixels[x, y] = accent_color
            
            # Animation phase for limbs (integer positions only)
            phase = frame * math.pi / 4
            
            # Hand positions (pixel-perfect)
            hand_radius = 4
            hand_distance = 24
            
            # Determine direction multiplier
            dir_mult = 1 if direction == 0 else -1
            
            # Left hand (relative to character)
            left_hand_x = body_x - (hand_distance * dir_mult) + int(math.sin(phase) * 4 * dir_mult)
            left_hand_y = body_y - 2 + int(math.cos(phase) * 3)
            
            # Draw hand (pixel-perfect circle)
            for y in range(max(0, left_hand_y - hand_radius), min(sprite_height, left_hand_y + hand_radius + 1)):
                for x in range(max(0, left_hand_x - hand_radius), min(sprite_width, left_hand_x + hand_radius + 1)):
                    dx = x - left_hand_x
                    dy = y - left_hand_y
                    if dx*dx + dy*dy <= hand_radius*hand_radius:
                        pixels[x, y] = hand_color
            
            # Right hand
            right_hand_x = body_x + (hand_distance * dir_mult) + int(math.sin(phase + math.pi) * 4 * dir_mult)
            right_hand_y = body_y - 2 + int(math.cos(phase + math.pi) * 3)
            
            # Draw hand (pixel-perfect circle)
            for y in range(max(0, right_hand_y - hand_radius), min(sprite_height, right_hand_y + hand_radius + 1)):
                for x in range(max(0, right_hand_x - hand_radius), min(sprite_width, right_hand_x + hand_radius + 1)):
                    dx = x - right_hand_x
                    dy = y - right_hand_y
                    if dx*dx + dy*dy <= hand_radius*hand_radius:
                        pixels[x, y] = hand_color
            
            # Foot positions (pixel-perfect)
            foot_radius = 5
            foot_distance = 10
            foot_y_offset = 20
            
            # Left foot
            left_foot_x = body_x - foot_distance + int(math.sin(phase + math.pi/4) * 4)
            left_foot_y = body_y + foot_y_offset + int(abs(math.sin(phase)) * 3)
            
            # Draw foot (pixel-perfect circle)
            for y in range(max(0, left_foot_y - foot_radius), min(sprite_height, left_foot_y + foot_radius + 1)):
                for x in range(max(0, left_foot_x - foot_radius), min(sprite_width, left_foot_x + foot_radius + 1)):
                    dx = x - left_foot_x
                    dy = y - left_foot_y
                    if dx*dx + dy*dy <= foot_radius*foot_radius:
                        pixels[x, y] = foot_color
            
            # Right foot
            right_foot_x = body_x + foot_distance + int(math.sin(phase + math.pi/4 + math.pi) * 4)
            right_foot_y = body_y + foot_y_offset + int(abs(math.sin(phase + math.pi)) * 3)
            
            # Draw foot (pixel-perfect circle)
            for y in range(max(0, right_foot_y - foot_radius), min(sprite_height, right_foot_y + foot_radius + 1)):
                for x in range(max(0, right_foot_x - foot_radius), min(sprite_width, right_foot_x + foot_radius + 1)):
                    dx = x - right_foot_x
                    dy = y - right_foot_y
                    if dx*dx + dy*dy <= foot_radius*foot_radius:
                        pixels[x, y] = foot_color
            
            # Eyes (pixel-perfect)
            eye_radius = 3
            pupil_radius = 1
            eye_y_offset = -6
            eye_x_offset = 6
            
            # Direction-based eye positioning
            if direction == 0:  # Looking right
                pupil_x_offset = 1
            else:  # Looking left
                pupil_x_offset = -1
            
            # Left eye
            left_eye_x = body_x - eye_x_offset
            left_eye_y = body_y + eye_y_offset
            
            # Eye white (pixel-perfect circle)
            for y in range(max(0, left_eye_y - eye_radius), min(sprite_height, left_eye_y + eye_radius + 1)):
                for x in range(max(0, left_eye_x - eye_radius), min(sprite_width, left_eye_x + eye_radius + 1)):
                    dx = x - left_eye_x
                    dy = y - left_eye_y
                    if dx*dx + dy*dy <= eye_radius*eye_radius:
                        pixels[x, y] = eye_color
            
            # Pupil
            pupil_x = left_eye_x + pupil_x_offset
            pupil_y = left_eye_y
            for y in range(max(0, pupil_y - pupil_radius), min(sprite_height, pupil_y + pupil_radius + 1)):
                for x in range(max(0, pupil_x - pupil_radius), min(sprite_width, pupil_x + pupil_radius + 1)):
                    dx = x - pupil_x
                    dy = y - pupil_y
                    if dx*dx + dy*dy <= pupil_radius*pupil_radius:
                        pixels[x, y] = pupil_color
            
            # Right eye
            right_eye_x = body_x + eye_x_offset
            right_eye_y = body_y + eye_y_offset
            
            # Eye white (pixel-perfect circle)
            for y in range(max(0, right_eye_y - eye_radius), min(sprite_height, right_eye_y + eye_radius + 1)):
                for x in range(max(0, right_eye_x - eye_radius), min(sprite_width, right_eye_x + eye_radius + 1)):
                    dx = x - right_eye_x
                    dy = y - right_eye_y
                    if dx*dx + dy*dy <= eye_radius*eye_radius:
                        pixels[x, y] = eye_color
            
            # Pupil
            pupil_x = right_eye_x + pupil_x_offset
            pupil_y = right_eye_y
            for y in range(max(0, pupil_y - pupil_radius), min(sprite_height, pupil_y + pupil_radius + 1)):
                for x in range(max(0, pupil_x - pupil_radius), min(sprite_width, pupil_x + pupil_radius + 1)):
                    dx = x - pupil_x
                    dy = y - pupil_y
                    if dx*dx + dy*dy <= pupil_radius*pupil_radius:
                        pixels[x, y] = pupil_color
            
            # Mouth (simple pixel line)
            mouth_y = body_y + 4
            mouth_start_x = body_x - 6
            mouth_end_x = body_x + 6
            
            # Draw mouth line
            for x in range(mouth_start_x, mouth_end_x + 1):
                if 0 <= x < sprite_width and 0 <= mouth_y < sprite_height:
                    pixels[x, mouth_y] = mouth_color
                # Add slight curve
                curve_y = mouth_y + 1
                if x in [mouth_start_x + 1, mouth_start_x + 2, mouth_end_x - 1, mouth_end_x - 2]:
                    if 0 <= x < sprite_width and 0 <= curve_y < sprite_height:
                        pixels[x, curve_y] = mouth_color
            
            # Paste frame into spritesheet
            row = direction
            col = frame
            spritesheet.paste(frame_img, (col * sprite_width, row * sprite_height))
    
    # Save the pixel-perfect spritesheet
    spritesheet.save('circular-character-spritesheet.png', 'PNG')
    print(f"Created pixel-perfect circular character spritesheet: {sheet_width}x{sheet_height}")
    print("Layout: Top row = 8 frames running right, Bottom row = 8 frames running left")
    print("Frame size: 64x64 pixels each (pixel-perfect, no anti-aliasing)")
    print("Character: Hard-edged circular character for maximum crispness")

if __name__ == '__main__':
    create_pixel_perfect_character_spritesheet()
