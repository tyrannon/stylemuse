import { logger } from './DebugLogger';

export interface LogFilter {
  categories?: string[];
  severity?: ('debug' | 'info' | 'warn' | 'error')[];
  searchTerms?: string[];
}

export class LogStreamer {
  private static filters: LogFilter = {
    severity: ['info', 'warn', 'error'], // Skip debug by default
    categories: [], // Empty means all categories
    searchTerms: []
  };

  private static originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };

  /**
   * Start streaming filtered logs
   */
  static startStreaming(filter?: LogFilter) {
    if (filter) {
      this.filters = { ...this.filters, ...filter };
    }

    // Override console methods to filter logs
    console.log = (...args) => {
      if (this.shouldLog('info', args)) {
        this.originalConsole.log(...args);
      }
    };

    console.warn = (...args) => {
      if (this.shouldLog('warn', args)) {
        this.originalConsole.warn(...args);
      }
    };

    console.error = (...args) => {
      if (this.shouldLog('error', args)) {
        this.originalConsole.error(...args);
      }
    };

    console.info('📡 Log streaming started with filters:', this.filters);
  }

  /**
   * Stop streaming and restore original console
   */
  static stopStreaming() {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
    
    console.info('📡 Log streaming stopped');
  }

  /**
   * Update filters on the fly
   */
  static updateFilters(filter: Partial<LogFilter>) {
    this.filters = { ...this.filters, ...filter };
    console.info('📡 Log filters updated:', this.filters);
  }

  /**
   * Check if a log should be displayed
   */
  private static shouldLog(severity: string, args: any[]): boolean {
    // Check severity filter
    if (this.filters.severity && !this.filters.severity.includes(severity as any)) {
      return false;
    }

    const logString = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    // Check category filter
    if (this.filters.categories && this.filters.categories.length > 0) {
      const hasCategory = this.filters.categories.some(cat => 
        logString.includes(`[${cat}]`)
      );
      if (!hasCategory) return false;
    }

    // Check search terms
    if (this.filters.searchTerms && this.filters.searchTerms.length > 0) {
      const hasSearchTerm = this.filters.searchTerms.some(term => 
        logString.toLowerCase().includes(term.toLowerCase())
      );
      if (!hasSearchTerm) return false;
    }

    return true;
  }

  /**
   * Get current filter settings
   */
  static getFilters(): LogFilter {
    return { ...this.filters };
  }
}

// Export convenient presets
export const LogPresets = {
  ERRORS_ONLY: {
    severity: ['error'] as ('error')[],
  },
  IMPORTANT: {
    severity: ['info', 'warn', 'error'] as ('info' | 'warn' | 'error')[],
  },
  OUTFIT_GENERATION: {
    categories: ['outfit.generation', 'RandomOutfit'],
    severity: ['info', 'warn', 'error'] as ('info' | 'warn' | 'error')[],
  },
  PERFORMANCE: {
    categories: ['performance'],
    severity: ['info', 'warn', 'error'] as ('info' | 'warn' | 'error')[],
  },
  USER_ACTIONS: {
    searchTerms: ['onPress', 'navigate', 'save', 'delete'],
    severity: ['info', 'warn', 'error'] as ('info' | 'warn' | 'error')[],
  }
};