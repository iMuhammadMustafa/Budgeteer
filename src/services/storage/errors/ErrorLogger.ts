// Error logging and reporting system for debugging storage issues

import { StorageError, StorageErrorCode } from './StorageErrors';

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  error?: StorageError;
  context?: any;
  storageMode?: 'cloud' | 'demo' | 'local';
  operation?: string;
  table?: string;
  recordId?: string;
  tenantId?: string;
  stackTrace?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface ErrorReport {
  summary: {
    totalErrors: number;
    errorsByCode: Record<StorageErrorCode, number>;
    errorsByStorageMode: Record<string, number>;
    errorsByTable: Record<string, number>;
    timeRange: { start: string; end: string };
  };
  recentErrors: ErrorLogEntry[];
  patterns: {
    mostCommonErrors: Array<{ code: StorageErrorCode; count: number; percentage: number }>;
    errorTrends: Array<{ hour: string; count: number }>;
    affectedTables: Array<{ table: string; count: number }>;
  };
}

export class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogSize: number = 1000;
  private sessionId: string;

  constructor(maxLogSize: number = 1000) {
    this.maxLogSize = maxLogSize;
    this.sessionId = this.generateSessionId();
  }

  /**
   * Logs a storage error with full context
   */
  logError(
    error: StorageError,
    context: {
      operation?: string;
      storageMode?: 'cloud' | 'demo' | 'local';
      table?: string;
      recordId?: string;
      tenantId?: string;
      additionalContext?: any;
    } = {}
  ): void {
    const entry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      error,
      context: context.additionalContext,
      storageMode: context.storageMode,
      operation: context.operation,
      table: context.table,
      recordId: context.recordId,
      tenantId: context.tenantId,
      stackTrace: error.stack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      sessionId: this.sessionId
    };

    this.addLogEntry(entry);
    this.reportToConsole(entry);
    this.reportToExternalService(entry);
  }

  /**
   * Logs a retry attempt
   */
  logRetryAttempt(
    context: { operation: string; storageMode: 'cloud' | 'demo' | 'local' },
    attempt: number,
    error: StorageError
  ): void {
    const entry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: `Retry attempt ${attempt} for operation '${context.operation}' failed: ${error.message}`,
      error,
      context: { attempt, retryOperation: true },
      storageMode: context.storageMode,
      operation: context.operation,
      sessionId: this.sessionId
    };

    this.addLogEntry(entry);
    this.reportToConsole(entry);
  }

  /**
   * Logs successful recovery after retries
   */
  logRecovery(
    context: { operation: string; storageMode: 'cloud' | 'demo' | 'local' },
    successfulAttempt: number,
    lastError: StorageError
  ): void {
    const entry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Operation '${context.operation}' recovered after ${successfulAttempt} attempts`,
      context: { 
        successfulAttempt, 
        lastError: lastError.message,
        recovery: true 
      },
      storageMode: context.storageMode,
      operation: context.operation,
      sessionId: this.sessionId
    };

    this.addLogEntry(entry);
    this.reportToConsole(entry);
  }

  /**
   * Logs retry failure (all attempts exhausted)
   */
  logRetryFailure(
    context: { operation: string; storageMode: 'cloud' | 'demo' | 'local' },
    maxAttempts: number,
    finalError: StorageError
  ): void {
    const entry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `Operation '${context.operation}' failed after ${maxAttempts} attempts: ${finalError.message}`,
      error: finalError,
      context: { maxAttempts, retryFailure: true },
      storageMode: context.storageMode,
      operation: context.operation,
      sessionId: this.sessionId
    };

    this.addLogEntry(entry);
    this.reportToConsole(entry);
  }

  /**
   * Logs fallback attempt
   */
  logFallbackAttempt(
    context: { operation: string; storageMode: 'cloud' | 'demo' | 'local' },
    primaryError: StorageError
  ): void {
    const entry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: `Attempting fallback for operation '${context.operation}' due to: ${primaryError.message}`,
      error: primaryError,
      context: { fallbackAttempt: true },
      storageMode: context.storageMode,
      operation: context.operation,
      sessionId: this.sessionId
    };

    this.addLogEntry(entry);
    this.reportToConsole(entry);
  }

  /**
   * Logs successful fallback
   */
  logFallbackSuccess(
    context: { operation: string; storageMode: 'cloud' | 'demo' | 'local' },
    primaryError: StorageError
  ): void {
    const entry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Fallback successful for operation '${context.operation}'`,
      context: { 
        fallbackSuccess: true,
        primaryError: primaryError.message 
      },
      storageMode: context.storageMode,
      operation: context.operation,
      sessionId: this.sessionId
    };

    this.addLogEntry(entry);
    this.reportToConsole(entry);
  }

  /**
   * Logs fallback failure
   */
  logFallbackFailure(
    context: { operation: string; storageMode: 'cloud' | 'demo' | 'local' },
    primaryError: StorageError,
    fallbackError: any
  ): void {
    const entry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `Both primary and fallback operations failed for '${context.operation}'`,
      error: primaryError,
      context: { 
        fallbackFailure: true,
        fallbackError: fallbackError.message || fallbackError.toString()
      },
      storageMode: context.storageMode,
      operation: context.operation,
      sessionId: this.sessionId
    };

    this.addLogEntry(entry);
    this.reportToConsole(entry);
  }

  /**
   * Logs recovery attempt
   */
  logRecoveryAttempt(
    context: { operation: string; storageMode: 'cloud' | 'demo' | 'local' },
    error: StorageError
  ): void {
    const entry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Attempting recovery for error: ${error.message}`,
      error,
      context: { recoveryAttempt: true },
      storageMode: context.storageMode,
      operation: context.operation,
      sessionId: this.sessionId
    };

    this.addLogEntry(entry);
    this.reportToConsole(entry);
  }

  /**
   * Generates an error report for debugging and monitoring
   */
  generateErrorReport(timeRange?: { start: Date; end: Date }): ErrorReport {
    let filteredLogs = this.logs;
    
    if (timeRange) {
      filteredLogs = this.logs.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= timeRange.start && logTime <= timeRange.end;
      });
    }

    const errorLogs = filteredLogs.filter(log => log.level === 'error');
    
    // Count errors by code
    const errorsByCode: Record<StorageErrorCode, number> = {} as any;
    errorLogs.forEach(log => {
      if (log.error?.code) {
        errorsByCode[log.error.code] = (errorsByCode[log.error.code] || 0) + 1;
      }
    });

    // Count errors by storage mode
    const errorsByStorageMode: Record<string, number> = {};
    errorLogs.forEach(log => {
      if (log.storageMode) {
        errorsByStorageMode[log.storageMode] = (errorsByStorageMode[log.storageMode] || 0) + 1;
      }
    });

    // Count errors by table
    const errorsByTable: Record<string, number> = {};
    errorLogs.forEach(log => {
      if (log.table) {
        errorsByTable[log.table] = (errorsByTable[log.table] || 0) + 1;
      }
    });

    // Most common errors
    const mostCommonErrors = Object.entries(errorsByCode)
      .map(([code, count]) => ({
        code: code as StorageErrorCode,
        count,
        percentage: (count / errorLogs.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Error trends by hour
    const errorTrends = this.calculateErrorTrends(errorLogs);

    // Affected tables
    const affectedTables = Object.entries(errorsByTable)
      .map(([table, count]) => ({ table, count }))
      .sort((a, b) => b.count - a.count);

    return {
      summary: {
        totalErrors: errorLogs.length,
        errorsByCode,
        errorsByStorageMode,
        errorsByTable,
        timeRange: {
          start: filteredLogs.length > 0 ? filteredLogs[0].timestamp : new Date().toISOString(),
          end: filteredLogs.length > 0 ? filteredLogs[filteredLogs.length - 1].timestamp : new Date().toISOString()
        }
      },
      recentErrors: errorLogs.slice(-20), // Last 20 errors
      patterns: {
        mostCommonErrors,
        errorTrends,
        affectedTables
      }
    };
  }

  /**
   * Clears the error log
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Gets all log entries
   */
  getAllLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  /**
   * Gets logs filtered by criteria
   */
  getFilteredLogs(filter: {
    level?: 'error' | 'warn' | 'info' | 'debug';
    storageMode?: 'cloud' | 'demo' | 'local';
    operation?: string;
    table?: string;
    errorCode?: StorageErrorCode;
    timeRange?: { start: Date; end: Date };
  }): ErrorLogEntry[] {
    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.storageMode && log.storageMode !== filter.storageMode) return false;
      if (filter.operation && log.operation !== filter.operation) return false;
      if (filter.table && log.table !== filter.table) return false;
      if (filter.errorCode && log.error?.code !== filter.errorCode) return false;
      
      if (filter.timeRange) {
        const logTime = new Date(log.timestamp);
        if (logTime < filter.timeRange.start || logTime > filter.timeRange.end) return false;
      }
      
      return true;
    });
  }

  private addLogEntry(entry: ErrorLogEntry): void {
    this.logs.push(entry);
    
    // Maintain max log size
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }
  }

  private reportToConsole(entry: ErrorLogEntry): void {
    const message = `[${entry.level.toUpperCase()}] ${entry.timestamp} - ${entry.message}`;
    
    switch (entry.level) {
      case 'error':
        console.error(message, entry.error);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'info':
        console.info(message);
        break;
      case 'debug':
        console.debug(message);
        break;
    }
  }

  private reportToExternalService(entry: ErrorLogEntry): void {
    // This would integrate with external error reporting services
    // like Sentry, LogRocket, or custom analytics
    
    // For now, we'll just store it locally
    // In a real implementation, you might send to an external service:
    /*
    if (entry.level === 'error' && typeof window !== 'undefined') {
      // Send to external error reporting service
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      }).catch(() => {
        // Silently fail if error reporting fails
      });
    }
    */
  }

  private calculateErrorTrends(errorLogs: ErrorLogEntry[]): Array<{ hour: string; count: number }> {
    const hourCounts: Record<string, number> = {};
    
    errorLogs.forEach(log => {
      const hour = new Date(log.timestamp).toISOString().slice(0, 13) + ':00:00.000Z';
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}