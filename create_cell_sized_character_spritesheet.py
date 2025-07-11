#!/usr/bin/env python3
"""
Create character sprite sheets in multiple cell sizes to avoid scaling pixelation.
Generates sprites at common cell sizes: 16px, 24px, 32px, 40px, 48px
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from matplotlib.colors import to_rgba
import os

def create_character_frame(ax, frame_size, fill_alpha=1.0):
    """Create a single frame of the circular character at the specified size"""
    ax.set_xlim(0, frame_size)
    ax.set_ylim(0, frame_size)
    ax.set_aspect('equal')
    ax.axis('off')
    
    # Calculate sizes based on frame size
    head_radius = frame_size * 0.25  # Head is 50% of frame
    body_width = frame_size * 0.15
    body_height = frame_size * 0.2
    hand_radius = frame_size * 0.08
    foot_width = frame_size * 0.12
    foot_height = frame_size * 0.08
    
    center_x, center_y = frame_size / 2, frame_size / 2
    
    # Character colors
    head_color = (0.2, 0.4, 0.8, fill_alpha)  # Blue
    body_color = (0.3, 0.2, 0.7, fill_alpha)  # Purple
    hand_color = (0.9, 0.7, 0.5, fill_alpha)  # Skin tone
    foot_color = (0.1, 0.1, 0.1, fill_alpha)  # Dark shoes
    
    # Head (main circle)
    head = patches.Circle((center_x, center_y + frame_size * 0.1), head_radius, 
                         facecolor=head_color, edgecolor='black', linewidth=max(1, frame_size//32))
    ax.add_patch(head)
    
    # Simple body (small rectangle, no body for minimalism)
    if frame_size >= 24:  # Only show body for larger sizes
        body = patches.Rectangle((center_x - body_width/2, center_y - frame_size * 0.15), 
                               body_width, body_height,
                               facecolor=body_color, edgecolor='black', linewidth=max(1, frame_size//48))
        ax.add_patch(body)
    
    # Hands (small circles on sides)
    left_hand = patches.Circle((center_x - frame_size * 0.3, center_y), hand_radius,
                              facecolor=hand_color, edgecolor='black', linewidth=max(1, frame_size//48))
    right_hand = patches.Circle((center_x + frame_size * 0.3, center_y), hand_radius,
                               facecolor=hand_color, edgecolor='black', linewidth=max(1, frame_size//48))
    ax.add_patch(left_hand)
    ax.add_patch(right_hand)
    
    # Feet (small rectangles at bottom)
    left_foot = patches.Rectangle((center_x - frame_size * 0.2, center_y - frame_size * 0.35), 
                                 foot_width, foot_height,
                                 facecolor=foot_color, edgecolor='black', linewidth=max(1, frame_size//48))
    right_foot = patches.Rectangle((center_x + frame_size * 0.08, center_y - frame_size * 0.35), 
                                  foot_width, foot_height,
                                  facecolor=foot_color, edgecolor='black', linewidth=max(1, frame_size//48))
    ax.add_patch(left_foot)
    ax.add_patch(right_foot)
    
    # Simple face features for larger sizes
    if frame_size >= 32:
        # Eyes
        eye_size = frame_size * 0.03
        left_eye = patches.Circle((center_x - frame_size * 0.08, center_y + frame_size * 0.15), eye_size,
                                 facecolor='black')
        right_eye = patches.Circle((center_x + frame_size * 0.08, center_y + frame_size * 0.15), eye_size,
                                  facecolor='black')
        ax.add_patch(left_eye)
        ax.add_patch(right_eye)
        
        # Smile
        if frame_size >= 40:
            smile_width = frame_size * 0.15
            smile_height = frame_size * 0.08
            smile = patches.Arc((center_x, center_y + frame_size * 0.05), smile_width, smile_height,
                               angle=0, theta1=200, theta2=340, linewidth=max(1, frame_size//32), color='black')
            ax.add_patch(smile)

def create_multi_size_spritesheet():
    """Create sprite sheets for multiple cell sizes"""
    
    # Common cell sizes based on typical screen resolutions
    cell_sizes = [16, 20, 24, 28, 32, 36, 40, 48]
    
    for cell_size in cell_sizes:
        print(f"Creating sprite sheet for {cell_size}px cells...")
        
        # Create sprite at 80% of cell size (like the current scaling)
        sprite_size = int(cell_size * 0.8)
        if sprite_size < 8:
            sprite_size = 8  # Minimum size
        
        # Create figure for 8 frames (right direction) + 8 frames (left direction)
        frames_per_row = 8
        rows = 2  # right and left directions
        
        fig_width = frames_per_row * sprite_size / 100.0  # Convert to inches
        fig_height = rows * sprite_size / 100.0
        
        fig, axes = plt.subplots(rows, frames_per_row, figsize=(fig_width * 1.2, fig_height * 1.2))
        fig.patch.set_facecolor('white')
        fig.patch.set_alpha(0)  # Transparent background
        
        # Remove spacing between subplots
        plt.subplots_adjust(left=0, right=1, top=1, bottom=0, wspace=0, hspace=0)
        
        # Generate frames for both directions
        for row in range(rows):
            for frame in range(frames_per_row):
                ax = axes[row, frame] if rows > 1 else axes[frame]
                
                # Vary the character slightly for animation
                bounce_offset = np.sin(frame * np.pi / 4) * sprite_size * 0.05  # Subtle bounce
                hand_offset = np.sin(frame * np.pi / 2) * sprite_size * 0.08   # Hand movement
                
                # Create character with slight variations for animation
                create_character_frame(ax, sprite_size)
                
                # For left direction (row 1), flip horizontally by adjusting the axis
                if row == 1:
                    ax.invert_xaxis()
        
        # Save with high DPI for crisp rendering
        filename = f'circular-character-spritesheet-{cell_size}px.png'
        plt.savefig(filename, dpi=100, bbox_inches='tight', pad_inches=0, 
                   facecolor='white', edgecolor='none', transparent=True)
        plt.close()
        
        print(f"Saved {filename} ({sprite_size}x{sprite_size} per frame)")
    
    print(f"\nCreated sprite sheets for cell sizes: {cell_sizes}")
    print("Each sprite sheet contains 16 frames (8 right + 8 left)")
    print("Sprites are sized at 80% of cell size to match current scaling")

if __name__ == "__main__":
    create_multi_size_spritesheet()
