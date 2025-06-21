from PIL import Image, ImageDraw
import math

def create_stickman_spritesheet():
    # Sprite dimensions - smaller to fit in cells better
    sprite_width = 32
    sprite_height = 32
    cols = 4  # 4 directions
    rows = 4  # 4 animation frames
    
    # Create the main image
    img_width = sprite_width * cols
    img_height = sprite_height * rows
    img = Image.new('RGBA', (img_width, img_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    def draw_curved_line(draw, start, end, curve_offset, width=2, color='black'):
        """Draw a curved line using multiple short segments"""
        x1, y1 = start
        x2, y2 = end
        
        # Calculate control point for curve
        mid_x = (x1 + x2) / 2 + curve_offset[0]
        mid_y = (y1 + y2) / 2 + curve_offset[1]
        
        # Draw curve using multiple segments
        segments = 8
        for i in range(segments):
            t1 = i / segments
            t2 = (i + 1) / segments
            
            # Quadratic Bezier curve formula
            x_start = (1-t1)**2 * x1 + 2*(1-t1)*t1 * mid_x + t1**2 * x2
            y_start = (1-t1)**2 * y1 + 2*(1-t1)*t1 * mid_y + t1**2 * y2
            x_end = (1-t2)**2 * x1 + 2*(1-t2)*t2 * mid_x + t2**2 * x2
            y_end = (1-t2)**2 * y1 + 2*(1-t2)*t2 * mid_y + t2**2 * y2
            
            draw.line([x_start, y_start, x_end, y_end], fill=color, width=width)
    
    def draw_stickman(x, y, direction, frame):
        """Draw a cartoony stickman that fits in a 32x32 cell"""
        center_x = x + sprite_width // 2
        center_y = y + sprite_height // 2
        
        # Animation phase for natural running motion
        phase = frame / 4.0
        
        # Smaller, more contained motion
        body_bob = math.sin(phase * 2 * math.pi) * 1.5  # Vertical bob
        arm_cycle = phase * 2 * math.pi
        leg_cycle = phase * 2 * math.pi
        
        # Head positioning - smaller and more contained
        head_radius = 4
        head_x = center_x
        head_y = center_y - 10 - body_bob
        
        # Draw head (white with black outline) - cartoony style
        draw.ellipse([head_x - head_radius, head_y - head_radius, 
                     head_x + head_radius, head_y + head_radius], 
                    fill='white', outline='black', width=2)
        
        # Draw facial features based on direction
        if direction == 'left':
            # Profile view facing left
            # Eye
            draw.ellipse([head_x - 2, head_y - 1, head_x, head_y + 1], fill='black')
            # Smile curve
            draw.arc([head_x - 3, head_y, head_x + 1, head_y + 3], 
                    -30, 60, fill='black', width=1)
        elif direction == 'right':
            # Profile view facing right
            # Eye
            draw.ellipse([head_x, head_y - 1, head_x + 2, head_y + 1], fill='black')
            # Smile curve
            draw.arc([head_x - 1, head_y, head_x + 3, head_y + 3], 
                    120, 210, fill='black', width=1)
        elif direction == 'up':
            # Back view - just hair/head outline visible
            # Small dot for hair/head detail
            draw.ellipse([head_x - 1, head_y - 2, head_x + 1, head_y], fill='black')
        else:  # direction == 'down'
            # Front view
            # Eyes
            draw.ellipse([head_x - 2, head_y - 1, head_x - 1, head_y], fill='black')
            draw.ellipse([head_x + 1, head_y - 1, head_x + 2, head_y], fill='black')
            # Smile
            draw.arc([head_x - 2, head_y, head_x + 2, head_y + 3], 
                    0, 180, fill='black', width=1)
        
        # Body - shorter and more compact
        body_top = head_y + head_radius + 1
        body_bottom = center_y + 3
        draw.line([head_x, body_top, head_x, body_bottom], fill='black', width=2)
        
        # Arms with natural curves and cartoony style
        shoulder_y = body_top + 3
        arm_swing = math.sin(arm_cycle) * 8  # Smaller swing
        
        if direction == 'down' or direction == 'up':
            # Front/back view - both arms visible
            left_arm_angle = math.sin(arm_cycle) * 30
            right_arm_angle = math.sin(arm_cycle + math.pi) * 30
            
            # Left arm with curve
            left_end_x = head_x - 6 + math.sin(math.radians(left_arm_angle)) * 4
            left_end_y = shoulder_y + 4 + abs(math.sin(math.radians(left_arm_angle))) * 2
            curve_offset = (-2 if left_arm_angle > 0 else 2, 1)
            draw_curved_line(draw, (head_x, shoulder_y), (left_end_x, left_end_y), curve_offset, 2)
            
            # Right arm with curve
            right_end_x = head_x + 6 + math.sin(math.radians(right_arm_angle)) * 4
            right_end_y = shoulder_y + 4 + abs(math.sin(math.radians(right_arm_angle))) * 2
            curve_offset = (2 if right_arm_angle > 0 else -2, 1)
            draw_curved_line(draw, (head_x, shoulder_y), (right_end_x, right_end_y), curve_offset, 2)
            
        else:
            # Side view - show arm motion with depth
            front_arm_x = head_x + (-8 if direction == 'left' else 8) + arm_swing * 0.3
            front_arm_y = shoulder_y + 4
            back_arm_x = head_x + (-4 if direction == 'left' else 4) - arm_swing * 0.3
            back_arm_y = shoulder_y + 3
            
            # Back arm (lighter)
            curve_offset = (2 if direction == 'left' else -2, 2)
            draw_curved_line(draw, (head_x, shoulder_y), (back_arm_x, back_arm_y), curve_offset, 1, 'gray')
            
            # Front arm (prominent)
            curve_offset = (-3 if direction == 'left' else 3, 1)
            draw_curved_line(draw, (head_x, shoulder_y), (front_arm_x, front_arm_y), curve_offset, 2)
        
        # Legs with natural running curves
        hip_y = body_bottom
        leg_swing = math.sin(leg_cycle) * 12  # Leg movement
        
        if direction == 'down' or direction == 'up':
            # Front/back view
            left_leg_angle = math.sin(leg_cycle) * 25
            right_leg_angle = math.sin(leg_cycle + math.pi) * 25
            
            # Left leg with curve
            left_foot_x = head_x - 3 + math.sin(math.radians(left_leg_angle)) * 3
            left_foot_y = hip_y + 8 + abs(math.cos(math.radians(left_leg_angle))) * 2
            curve_offset = (-1 if left_leg_angle > 0 else 1, 2)
            draw_curved_line(draw, (head_x, hip_y), (left_foot_x, left_foot_y), curve_offset, 2)
            
            # Right leg with curve
            right_foot_x = head_x + 3 + math.sin(math.radians(right_leg_angle)) * 3
            right_foot_y = hip_y + 8 + abs(math.cos(math.radians(right_leg_angle))) * 2
            curve_offset = (1 if right_leg_angle > 0 else -1, 2)
            draw_curved_line(draw, (head_x, hip_y), (right_foot_x, right_foot_y), curve_offset, 2)
            
            # Feet
            draw.ellipse([left_foot_x - 1, left_foot_y - 1, left_foot_x + 1, left_foot_y + 1], fill='black')
            draw.ellipse([right_foot_x - 1, right_foot_y - 1, right_foot_x + 1, right_foot_y + 1], fill='black')
            
        else:
            # Side view - show running gait
            front_leg_lift = math.sin(leg_cycle) * 6
            back_leg_push = math.sin(leg_cycle + math.pi) * 4
            
            # Back leg
            back_foot_x = head_x + (2 if direction == 'left' else -2) + back_leg_push * 0.5
            back_foot_y = hip_y + 8 + abs(back_leg_push) * 0.2
            curve_offset = (1 if direction == 'left' else -1, 3)
            draw_curved_line(draw, (head_x, hip_y), (back_foot_x, back_foot_y), curve_offset, 1, 'gray')
            
            # Front leg
            front_foot_x = head_x + (-4 if direction == 'left' else 4) + front_leg_lift * 0.2
            front_foot_y = hip_y + 8 - abs(front_leg_lift) * 0.4
            curve_offset = (-2 if direction == 'left' else 2, 2)
            draw_curved_line(draw, (head_x, hip_y), (front_foot_x, front_foot_y), curve_offset, 2)
            
            # Feet
            draw.ellipse([back_foot_x - 1, back_foot_y - 1, back_foot_x + 1, back_foot_y + 1], fill='gray')
            draw.ellipse([front_foot_x - 1, front_foot_y - 1, front_foot_x + 1, front_foot_y + 1], fill='black')
    
    # Generate all sprites
    directions = ['down', 'left', 'right', 'up']
    
    for row, direction in enumerate(directions):
        for col in range(4):  # 4 animation frames
            x = col * sprite_width
            y = row * sprite_height
            draw_stickman(x, y, direction, col)
    
    # Save the image
    img.save('/workspaces/thetrazemaze/stickman-running-spritesheet.png')
    print("Cartoony stickman spritesheet created successfully!")
    print("Features:")
    print("- 32x32 sprites to fit in maze cells")
    print("- Directional faces (front, back, left profile, right profile)")
    print("- Curved, natural arm and leg movement")
    print("- Cartoony style with white smiling face")
    print("- Proper running animation cycle")
    print("Layout:")
    print("Row 0: Down/Front (4 frames)")
    print("Row 1: Left Profile (4 frames)")  
    print("Row 2: Right Profile (4 frames)")
    print("Row 3: Up/Back (4 frames)")

if __name__ == "__main__":
    create_stickman_spritesheet()
