/**
 * URL Parameters Module
 * Handles parsing and processing of URL parameters for game configuration
 */

console.log('URL Parameters module loaded');

const URLParameters = {
  // Parsed URL parameters
  searchParams: null,
  type: null,
  multiple: null,
  difficulty: 'medium', // Default value
  mode: 'hard', // Default value
  easy: false, // Derived from mode
  
  /**
   * Initialize and parse URL parameters
   */
  init: function() {
    this.searchParams = new URLSearchParams(window.location.search);
    this.type = this.searchParams.get('type');
    this.multiple = this.searchParams.get('multiple');
    this.difficulty = this.searchParams.get('difficulty') || 'medium'; // Default to medium if not specified
    this.mode = this.searchParams.get('mode') || 'hard'; // Default to hard mode if not specified
    
    // Set easy flag based on mode
    this.easy = (this.mode === 'easy');
    
    console.log('URL Parameters parsed:', {
      type: this.type,
      multiple: this.multiple,
      difficulty: this.difficulty,
      mode: this.mode,
      easy: this.easy
    });
    
    // Make parameters globally available for compatibility
    window.type = this.type;
    window.multiple = this.multiple;
    window.difficulty = this.difficulty;
    window.mode = this.mode;
    window.easy = this.easy;
  },
  
  /**
   * Get a specific parameter value
   */
  getParameter: function(name) {
    if (!this.searchParams) {
      this.init();
    }
    return this.searchParams.get(name);
  },
  
  /**
   * Check if easy mode is enabled
   */
  isEasyMode: function() {
    return this.easy;
  },
  
  /**
   * Get game difficulty level
   */
  getDifficulty: function() {
    return this.difficulty;
  },
  
  /**
   * Get game mode
   */
  getMode: function() {
    return this.mode;
  }
};

// Make URLParameters globally available
window.URLParameters = URLParameters;

// Auto-initialize when module loads
URLParameters.init();
