/**
 * Debug Console System
 * Provides debug logging functionality for development
 */
/**
 * Function Reference (DebugConsole)
 * 1. log(message, type = 'info') - Log a message to the debug console with timestamp and type
 * 2. clear() - Clear all entries from the debug console
 * 3. window.debugLog(message, type = 'info') - Global shortcut for logging
 * 4. window.clearDebug() - Global shortcut for clearing the console
 */

console.log('Debug Console module loaded');

const DebugConsole = {
  /**
   * Log a message to the debug console
   * @param {string} message - The message to log
   * @param {string} type - The type of message ('info', 'warn', 'error')
   */
  log: function(message, type = 'info') {
    const debugConsole = document.getElementById('debug-console');
    if (!debugConsole) return;
    
    const timestamp = new Date().toLocaleTimeString() + '.' + String(new Date().getMilliseconds()).padStart(3, '0');
    const entry = document.createElement('div');
    entry.className = `debug-entry debug-${type}`;
    entry.innerHTML = `<span class="debug-timestamp">[${timestamp}]</span> ${message}`;
    
    debugConsole.appendChild(entry);
    
    // Auto-scroll to bottom
    debugConsole.scrollTop = debugConsole.scrollHeight;
    
    // Keep only last 100 entries to prevent memory issues
    const entries = debugConsole.querySelectorAll('.debug-entry');
    if (entries.length > 100) {
      entries[0].remove();
    }
  },

  /**
   * Clear the debug console
   */
  clear: function() {
    const debugConsole = document.getElementById('debug-console');
    if (debugConsole) debugConsole.innerHTML = '';
  }
};

// Make DebugConsole globally available
window.DebugConsole = DebugConsole;

// Also create global functions for backwards compatibility
window.debugLog = function(message, type = 'info') {
  DebugConsole.log(message, type);
};

window.clearDebug = function() {
  DebugConsole.clear();
};
