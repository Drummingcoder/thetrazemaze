/**
 * Performance Monitor Module
 * Lightweight performance tracking to identify lag spikes
 */

console.log('Performance Monitor module loaded');

const PerformanceMonitor = {
  // Performance tracking variables
  lastFrameTime: 0,
  frameCount: 0,
  performanceData: [],
  maxDataPoints: 100, // Keep last 100 measurements
  
  /**
   * Initialize performance monitoring
   */
  init: function() {
    this.lastFrameTime = performance.now();
    console.log('Performance monitoring initialized');
  },
  
  /**
   * Record a performance measurement
   * @param {string} operation - Name of the operation being measured
   */
  startMeasure: function(operation) {
    if (!performance.mark) return;
    performance.mark(`${operation}-start`);
  },
  
  /**
   * End a performance measurement and log if it's slow
   * @param {string} operation - Name of the operation being measured
   */
  endMeasure: function(operation) {
    if (!performance.mark || !performance.measure) return;
    
    try {
      performance.mark(`${operation}-end`);
      performance.measure(operation, `${operation}-start`, `${operation}-end`);
      
      const measure = performance.getEntriesByName(operation).pop();
      if (measure && measure.duration > 16) { // Log operations taking longer than 16ms (1 frame at 60fps)
        console.warn(`Slow operation detected: ${operation} took ${measure.duration.toFixed(2)}ms`);
        
        // Store performance data
        this.performanceData.push({
          operation: operation,
          duration: measure.duration,
          timestamp: Date.now()
        });
        
        // Keep only recent data
        if (this.performanceData.length > this.maxDataPoints) {
          this.performanceData.shift();
        }
      }
      
      // Clean up performance entries
      performance.clearMarks(`${operation}-start`);
      performance.clearMarks(`${operation}-end`);
      performance.clearMeasures(operation);
    } catch (error) {
      console.warn('Performance measurement failed:', error);
    }
  },
  
  /**
   * Monitor frame rate and detect lag spikes
   */
  monitorFrameRate: function() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    // Log frame drops (frames taking longer than 33ms = less than 30fps)
    if (deltaTime > 33 && this.frameCount > 10) { // Skip first few frames
      console.warn(`Frame drop detected: ${deltaTime.toFixed(2)}ms (${(1000/deltaTime).toFixed(1)} FPS)`);
    }
    
    this.lastFrameTime = currentTime;
    this.frameCount++;
  },
  
  /**
   * Get performance report
   */
  getPerformanceReport: function() {
    if (this.performanceData.length === 0) {
      return 'No performance issues detected';
    }
    
    const slowOperations = this.performanceData.slice(-10); // Last 10 slow operations
    const report = slowOperations.map(data => 
      `${data.operation}: ${data.duration.toFixed(2)}ms`
    ).join('\n');
    
    return `Recent slow operations:\n${report}`;
  }
};

// Make PerformanceMonitor globally available
window.PerformanceMonitor = PerformanceMonitor;