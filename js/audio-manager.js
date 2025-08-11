/**
 * Audio Manager Module
 * Handles all audio-related functionality including preloading and playback
 */

console.log('Audio Manager module loaded');

const AudioManager = {
  // Audio instance for background music
  preloadedAudio: null,
  
  // Audio loading state management
  audioPreloaded: false,
  musicStarted: false,
  audioLoadingInProgress: false,
  audioCheckInterval: null,

  /**
   * Preloads the background music to reduce lag when first played
   * Uses the 'Enaudi Experience.mp3' file
   */
  preloadAudio: function() {
    console.log('AudioManager.preloadAudio() called');
    
    // Create new Audio object with the music file
    this.preloadedAudio = new Audio('Enaudi Experience.mp3');
    
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
   * Manual music trigger - only plays when explicitly called
   * Safe for user interaction without disrupting gameplay
   */
  startMusicManually: function() {
    if (this.musicStarted) {
      console.log('Music already started');
      return;
    }
    
    console.log('Manual music start requested...');
    
    if (this.audioPreloaded && this.preloadedAudio) {
      try {
        this.playMusic();
        this.musicStarted = true;
        console.log('Music started successfully via manual trigger');
      } catch (error) {
        console.warn('Manual music start failed:', error);
      }
    } else {
      console.log('Audio not ready for manual start, initializing...');
      this.initMusicSafely();
    }
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
  },

  /**
   * Safe music initialization - only preloads, doesn't auto-play
   * This prevents performance issues during game startup
   */
  initMusicSafely: function() {
    // Only initialize if not already done and game is stable
    if (this.audioPreloaded || this.audioLoadingInProgress) {
      console.log('Audio already initialized, skipping...');
      return;
    }
    
    console.log('Safe music initialization starting...');
    this.preloadAudioAsync();
  },

  /**
   * Lazy audio loading system - loads audio after maze initialization
   */
  preloadAudioAsync: function() {
    if (this.audioPreloaded || this.audioLoadingInProgress) return;
    
    this.audioLoadingInProgress = true;
    console.log('Starting lazy audio preload...');
    
    // Use setTimeout to prevent blocking the main thread
    setTimeout(() => {
      try {
        console.log('Calling AudioManager.preloadAudio()...');
        this.preloadAudio();
        
        // Add event listeners to check if audio actually loads
        if (this.preloadedAudio) {
          this.preloadedAudio.addEventListener('canplaythrough', () => {
            this.audioPreloaded = true;
            this.audioLoadingInProgress = false;
            console.log('Audio preloaded successfully via AudioManager - canplaythrough event');
          });
          
          this.preloadedAudio.addEventListener('error', (e) => {
            console.error('Audio loading error:', e);
            this.audioPreloaded = false;
            this.audioLoadingInProgress = false;
          });
          
          // Fallback timeout - mark as loaded after 2 seconds even if no event fires
          setTimeout(() => {
            if (this.audioLoadingInProgress) {
              console.log('Audio preload timeout - assuming loaded');
              this.audioPreloaded = true;
              this.audioLoadingInProgress = false;
            }
          }, 2000);
        } else {
          console.warn('AudioManager.preloadedAudio is null after preloadAudio call');
          this.audioPreloaded = false;
          this.audioLoadingInProgress = false;
        }
      } catch (error) {
        console.warn('Audio preload failed:', error);
        this.audioPreloaded = false;
        this.audioLoadingInProgress = false;
      }
    }, 150); // Small delay to ensure maze is fully rendered first
  },

  /**
   * Handles smart music playback with loading checks
   */
  startMusicWhenReady: function() {
    // Smart music playback - play immediately if loaded, queue if still loading
    if (this.audioPreloaded && !this.musicStarted) {
      // Audio ready - start music immediately
      setTimeout(() => {
        try {
          this.playMusic();
          this.musicStarted = true;
          console.log('Music started successfully via AudioManager');
        } catch (error) {
          console.warn('Music playback failed:', error);
        }
      }, 0);
    } else if (!this.musicStarted && !this.audioCheckInterval) {
      // Audio not ready - set up a check to start music when available
      console.log('Audio still loading, will start music when ready...');
      this.audioCheckInterval = setInterval(() => {
        if (this.audioPreloaded && !this.musicStarted) {
          try {
            this.playMusic();
            this.musicStarted = true;
            console.log('Music started after audio loading completed via AudioManager');
            clearInterval(this.audioCheckInterval);
            this.audioCheckInterval = null;
          } catch (error) {
            console.warn('Music playback failed:', error);
            clearInterval(this.audioCheckInterval);
            this.audioCheckInterval = null;
          }
        }
      }, 250); // Check every 250ms instead of 100ms to reduce overhead
      
      // Safety timeout to prevent infinite checking (stop trying after 10 seconds)
      setTimeout(() => {
        if (!this.musicStarted && this.audioCheckInterval) {
          console.warn('Audio loading timeout - continuing without music');
          clearInterval(this.audioCheckInterval);
          this.audioCheckInterval = null;
        }
      }, 10000);
    }
  },

  /**
   * Starts background music when audio is ready, with interval checking
   */
  startBackgroundMusicIfReady: function() {
    if (this.musicStarted || this.audioCheckInterval) return;
    
    console.log('Setting up background music check interval...');
    this.audioCheckInterval = setInterval(() => {
      if (this.audioPreloaded && !this.musicStarted) {
        try {
          this.playMusic();
          console.log('Music started after audio loading completed via AudioManager');
          clearInterval(this.audioCheckInterval);
          this.audioCheckInterval = null;
        } catch (error) {
          console.warn('Music playback failed:', error);
          clearInterval(this.audioCheckInterval);
          this.audioCheckInterval = null;
        }
      }
    }, 250);
    
    // Safety timeout to prevent infinite checking (stop trying after 10 seconds)
    setTimeout(() => {
      if (!this.musicStarted && this.audioCheckInterval) {
        console.warn('Audio loading timeout - continuing without music');
        clearInterval(this.audioCheckInterval);
        this.audioCheckInterval = null;
      }
    }, 10000);
  },

  /**
   * Gets the current audio preloading status
   * @returns {boolean} True if audio is preloaded and ready
   */
  isAudioPreloaded: function() {
    return this.audioPreloaded;
  },

  /**
   * Gets the current music playing status
   * @returns {boolean} True if music has been started
   */
  isMusicStarted: function() {
    return this.musicStarted;
  },

  /**
   * Gets the current audio loading status
   * @returns {boolean} True if audio is currently being loaded
   */
  isAudioLoading: function() {
    return this.audioLoadingInProgress;
  }
};

// Make AudioManager globally available
window.AudioManager = AudioManager;
