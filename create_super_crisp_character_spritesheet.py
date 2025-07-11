#!/usr/bin/env python3
"""
Create a super crisp circular character sprite sheet designed to avoid any blur
Using optimal sizing and vector-like quality for perfect scaling
"""

from PIL import Image, ImageDraw, ImageFilter
import math

def create_super_crisp_character_spritesheet():
    # Use a size that's a power of 2 and close to typical display sizes
    sprite_width = 64  # Power of 2, good for GPU
    sprite_height = 64
    frames_per_direction = 8
    
    # Create spritesheet image
    sheet_width = sprite_width * frames_per_direction
    sheet_height = sprite_height * 2  # Two rows: top = right, bottom = left
    spritesheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    # Enhanced colors with better contrast
    body_color = (65, 105, 225)      # Royal blue
    accent_color = (25, 25, 112)     # Midnight blue (darker accent)
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
            draw = ImageDraw.Draw(frame_img)
            
            # Animation offset for bouncing effect
            bounce_offset = math.sin(frame * math.pi / 4) * 2
            
            # Body position (center of sprite)
            body_x = sprite_width // 2
            body_y = sprite_height // 2 + int(bounce_offset)
            body_radius = 20  # Large body for 64x64 sprite
            
            # Draw soft shadow with multiple layers for smoothness
            shadow_y = sprite_height - 8
            for shadow_layer in range(3):
                alpha = 40 - (shadow_layer * 10)
                offset = shadow_layer + 1
                draw.ellipse([
                    body_x - body_radius + offset, shadow_y - 2 + shadow_layer,
                    body_x + body_radius - offset, shadow_y + 2 + shadow_layer
                ], fill=(0, 0, 0, alpha))
            
            # Draw main circular body with multiple layers for smooth gradient
            # Dark outer ring
            draw.ellipse([
                body_x - body_radius - 2, body_y - body_radius - 2,
                body_x + body_radius + 2, body_y + body_radius + 2
            ], fill=accent_color)
            
            # Main body
            draw.ellipse([
                body_x - body_radius, body_y - body_radius,
                body_x + body_radius, body_y + body_radius
            ], fill=body_color)
            
            # Highlight layers for 3D effect
            highlight_radius = body_radius - 4
            draw.ellipse([
                body_x - highlight_radius, body_y - highlight_radius - 3,
                body_x + highlight_radius - 2, body_y + highlight_radius - 6
            ], fill=(135, 145, 255, 180))
            
            # Smaller highlight
            highlight_radius2 = body_radius - 8
            draw.ellipse([
                body_x - highlight_radius2, body_y - highlight_radius2 - 5,
                body_x + highlight_radius2 - 1, body_y + highlight_radius2 - 8
            ], fill=(180, 190, 255, 120))
            
            # Animation phase for limbs
            phase = frame * math.pi / 4
            
            # Hand positions
            hand_radius = 6
            hand_distance = 28
            
            # Determine direction multiplier
            dir_mult = 1 if direction == 0 else -1
            
            # Left hand (relative to character)
            left_hand_x = body_x - (hand_distance * dir_mult) + int(math.sin(phase) * 5 * dir_mult)
            left_hand_y = body_y - 3 + int(math.cos(phase) * 4)
            
            # Hand shadow
            draw.ellipse([
                left_hand_x - hand_radius + 1, left_hand_y - hand_radius + 1,
                left_hand_x + hand_radius + 1, left_hand_y + hand_radius + 1
            ], fill=(0, 0, 0, 60))
            
            # Hand
            draw.ellipse([
                left_hand_x - hand_radius, left_hand_y - hand_radius,
                left_hand_x + hand_radius, left_hand_y + hand_radius
            ], fill=hand_color)
            draw.ellipse([
                left_hand_x - hand_radius + 1, left_hand_y - hand_radius + 1,
                left_hand_x + hand_radius - 1, left_hand_y + hand_radius - 1
            ], fill=accent_color, width=1)
            
            # Right hand
            right_hand_x = body_x + (hand_distance * dir_mult) + int(math.sin(phase + math.pi) * 5 * dir_mult)
            right_hand_y = body_y - 3 + int(math.cos(phase + math.pi) * 4)
            
            # Hand shadow
            draw.ellipse([
                right_hand_x - hand_radius + 1, right_hand_y - hand_radius + 1,
                right_hand_x + hand_radius + 1, right_hand_y + hand_radius + 1
            ], fill=(0, 0, 0, 60))
            
            # Hand
            draw.ellipse([
                right_hand_x - hand_radius, right_hand_y - hand_radius,
                right_hand_x + hand_radius, right_hand_y + hand_radius
            ], fill=hand_color)
            draw.ellipse([
                right_hand_x - hand_radius + 1, right_hand_y - hand_radius + 1,
                right_hand_x + hand_radius - 1, right_hand_y + hand_radius - 1
            ], fill=accent_color, width=1)
            
            # Foot positions
            foot_radius = 8
            foot_distance = 12
            foot_y_offset = 24
            
            # Left foot
            left_foot_x = body_x - foot_distance + int(math.sin(phase + math.pi/4) * 6)
            left_foot_y = body_y + foot_y_offset + int(abs(math.sin(phase)) * 5)
            
            # Foot shadow
            draw.ellipse([
                left_foot_x - foot_radius + 1, left_foot_y - foot_radius + 1,
                left_foot_x + foot_radius + 1, left_foot_y + foot_radius + 1
            ], fill=(0, 0, 0, 60))
            
            # Foot
            draw.ellipse([
                left_foot_x - foot_radius, left_foot_y - foot_radius,
                left_foot_x + foot_radius, left_foot_y + foot_radius
            ], fill=foot_color)
            draw.ellipse([
                left_foot_x - foot_radius + 1, left_foot_y - foot_radius + 1,
                left_foot_x + foot_radius - 1, left_foot_y + foot_radius - 1
            ], fill=accent_color, width=1)
            
            # Right foot
            right_foot_x = body_x + foot_distance + int(math.sin(phase + math.pi + math.pi/4) * 6)
            right_foot_y = body_y + foot_y_offset + int(abs(math.sin(phase + math.pi)) * 5)
            
            # Foot shadow
            draw.ellipse([
                right_foot_x - foot_radius + 1, right_foot_y - foot_radius + 1,
                right_foot_x + foot_radius + 1, right_foot_y + foot_radius + 1
            ], fill=(0, 0, 0, 60))
            
            # Foot
            draw.ellipse([
                right_foot_x - foot_radius, right_foot_y - foot_radius,
                right_foot_x + foot_radius, right_foot_y + foot_radius
            ], fill=foot_color)
            draw.ellipse([
                right_foot_x - foot_radius + 1, right_foot_y - foot_radius + 1,
                right_foot_x + foot_radius - 1, right_foot_y + foot_radius - 1
            ], fill=accent_color, width=1)
            
            # Draw large, expressive eyes
            eye_radius = 5
            eye_offset_x = 7
            eye_offset_y = -3
            
            # Left eye
            left_eye_x = body_x - (eye_offset_x * dir_mult)
            left_eye_y = body_y + eye_offset_y
            
            # Eye shadow
            draw.ellipse([
                left_eye_x - eye_radius + 1, left_eye_y - eye_radius + 1,
                left_eye_x + eye_radius + 1, left_eye_y + eye_radius + 1
            ], fill=(0, 0, 0, 40))
            
            # Eye white
            draw.ellipse([
                left_eye_x - eye_radius, left_eye_y - eye_radius,
                left_eye_x + eye_radius, left_eye_y + eye_radius
            ], fill=eye_color)
            
            # Eye border
            draw.ellipse([
                left_eye_x - eye_radius, left_eye_y - eye_radius,
                left_eye_x + eye_radius, left_eye_y + eye_radius
            ], fill=None, outline=(200, 200, 200), width=1)
            
            # Pupil
            pupil_radius = 2
            pupil_x_offset = int(math.sin(phase * 0.5) * 1) + (1 * dir_mult)
            draw.ellipse([
                left_eye_x - pupil_radius + pupil_x_offset, left_eye_y - pupil_radius,
                left_eye_x + pupil_radius + pupil_x_offset, left_eye_y + pupil_radius
            ], fill=pupil_color)
            
            # Right eye
            right_eye_x = body_x + (eye_offset_x * dir_mult)
            right_eye_y = body_y + eye_offset_y
            
            # Eye shadow
            draw.ellipse([
                right_eye_x - eye_radius + 1, right_eye_y - eye_radius + 1,
                right_eye_x + eye_radius + 1, right_eye_y + eye_radius + 1
            ], fill=(0, 0, 0, 40))
            
            # Eye white
            draw.ellipse([
                right_eye_x - eye_radius, right_eye_y - eye_radius,
                right_eye_x + eye_radius, right_eye_y + eye_radius
            ], fill=eye_color)
            
            # Eye border
            draw.ellipse([
                right_eye_x - eye_radius, right_eye_y - eye_radius,
                right_eye_x + eye_radius, right_eye_y + eye_radius
            ], fill=None, outline=(200, 200, 200), width=1)
            
            # Pupil
            draw.ellipse([
                right_eye_x - pupil_radius + pupil_x_offset, right_eye_y - pupil_radius,
                right_eye_x + pupil_radius + pupil_x_offset, right_eye_y + pupil_radius
            ], fill=pupil_color)
            
            # Draw smile with multiple strokes for thickness and smoothness
            smile_start_x = body_x - 8
            smile_end_x = body_x + 8
            smile_y = body_y + 5
            
            # Multiple arc layers for smooth, thick smile
            for thickness in range(3):
                draw.arc([
                    smile_start_x, smile_y - 3 + thickness,
                    smile_end_x, smile_y + 3 + thickness
                ], start=0, end=180, fill=mouth_color, width=2)
            
            # Paste frame into spritesheet
            row = direction
            col = frame
            spritesheet.paste(frame_img, (col * sprite_width, row * sprite_height))
    
    # Save the super crisp spritesheet
    spritesheet.save('circular-character-spritesheet.png', 'PNG')
    print(f"Created super crisp circular character spritesheet: {sheet_width}x{sheet_height}")
    print("Layout: Top row = 8 frames running right, Bottom row = 8 frames running left")
    print("Frame size: 64x64 pixels each (optimized for crisp scaling)")
    print("Character: Ultra-smooth circular character with anti-aliasing and shadows")

if __name__ == '__main__':
    create_super_crisp_character_spritesheet()
