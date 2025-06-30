/**
 * Audio Manager Module
 * Handles all audio-related functionality including preloading and playback
 */

console.log('Audio Manager module loaded');

const AudioManager = {
  // Audio instance for background music
  preloadedAudio: null,

  /**
   * Preloads the background music to reduce lag when first played
   * Uses the 'Enaudi Experience.mp3' file
   */
  preloadAudio: function() {
    console.log('AudioManager.preloadAudio() called');
    
    // Create new Audio object with the music file
    this.preloadedAudio = new Audio('Enaudi Experience.mp3');
    
    console.log('Audio object created with src:', this.preloadedAudio.src);
    
    // Set preload strategy to 'auto' (download entire file)
    this.preloadedAudio.preload = 'auto';
    
    // Set volume to maximum (1.0 = 100%)
    this.preloadedAudio.volume = 1.0;
    
    // Add error handling
    this.preloadedAudio.addEventListener('error', (e) => {
      console.error('Audio preload error:', e);
      console.error('Audio error details:', this.preloadedAudio.error);
    });
    
    this.preloadedAudio.addEventListener('loadstart', () => {
      console.log('Audio loading started');
    });
    
    this.preloadedAudio.addEventListener('canplay', () => {
      console.log('Audio can start playing');
    });
    
    // Trigger the actual loading process without playing
    this.preloadedAudio.load();
    console.log('Audio load() method called');
  },

  /**
   * Plays the background music
   * Handles both preloaded audio and fallback scenarios
   */
  playMusic: function() {
    // Check if we have a preloaded audio instance
    if (this.preloadedAudio) {
      // Reset playback position to the beginning
      this.preloadedAudio.currentTime = 0;
      
      // Attempt to play the preloaded audio
      this.preloadedAudio.play().catch(e => {
        console.log('Preloaded audio play failed:', e);
        
        // Fallback: create new audio instance if preloaded fails
        var audio = new Audio('Enaudi Experience.mp3');
        audio.play();
      });
    } else {
      // Fallback: create new audio instance if preloading didn't work
      console.log('No preloaded audio found, creating new instance');
      var audio = new Audio('Enaudi Experience.mp3');
      audio.play();
    }
  },

  /**
   * Stops the currently playing music
   */
  stopMusic: function() {
    if (this.preloadedAudio) {
      this.preloadedAudio.pause();
      this.preloadedAudio.currentTime = 0;
    }
  },

  /**
   * Pauses the currently playing music (preserves current position)
   */
  pauseMusic: function() {
    if (this.preloadedAudio) {
      this.preloadedAudio.pause();
    }
  }
};

// Make AudioManager globally available
window.AudioManager = AudioManager;
