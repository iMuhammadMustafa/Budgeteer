import { AutoApplyResult } from '@/src/types/recurring';
import { IAutoApplyService } from './AutoApply.Service';

export interface AutoApplyStartupConfig {
  enabled: boolean;
  delayMs: number;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  enableLogging: boolean;
  enableNotifications: boolean;
  skipOnError: boolean;
}

export const DEFAULT_STARTUP_CONFIG: AutoApplyStartupConfig = {
  enabled: true,
  delayMs: 2000,
  maxRetries: 3,
  retryDelayMs: 5000,
  timeoutMs: 30000,
  enableLogging: true,
  enableNotifications: true,
  skipOnError: true
};

export interface AutoApplyStartupResult {
  success: boolean;
  result?: AutoApplyResult;
  error?: Error;
  retryCount: number;
  executionTimeMs: number;
  timestamp: Date;
}

export interface AutoApplyStartupLogger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, error?: Error, data?: any) => void;
}

export interface AutoApplyStartupNotifier {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

/**
 * Service for managing auto-apply functionality during app startup
 * Provides robust error handling, retry logic, and comprehensive logging
 */
export class AutoApplyStartupService {
  private config: AutoApplyStartupConfig;
  private logger: AutoApplyStartupLogger;
  private notifier: AutoApplyStartupNotifier;
  private isRunning = false;
  private lastResult: AutoApplyStartupResult | null = null;

  constructor(
    private autoApplyService: IAutoApplyService,
    config: Partial<AutoApplyStartupConfig> = {},
    logger?: AutoApplyStartupLogger,
    notifier?: AutoApplyStartupNotifier
  ) {
    this.config = { ...DEFAULT_STARTUP_CONFIG, ...config };
    this.logger = logger || this.createDefaultLogger();
    this.notifier = notifier || this.createDefaultNotifier();
  }

  /**
   * Initialize auto-apply on app startup with delay and error handling
   */
  async initializeOnStartup(): Promise<AutoApplyStartupResult | null> {
    if (!this.config.enabled) {
      this.logger.info('Auto-apply startup is disabled');
      return null;
    }

    if (this.isRunning) {
      this.logger.warn('Auto-apply startup already in progress');
      return this.lastResult;
    }

    this.logger.info(`Scheduling auto-apply startup check in ${this.config.delayMs}ms`);

    // Use setTimeout to delay execution and avoid blocking app startup
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const result = await this.executeWithRetry();
          resolve(result);
        } catch (error) {
          if (this.config.skipOnError) {
            this.logger.error('Auto-apply startup failed but continuing due to skipOnError', error as Error);
            resolve(null);
          } else {
            throw error;
          }
        }
      }, this.config.delayMs);
    });
  }

  /**
   * Execute auto-apply with retry logic and comprehensive error handling
   */
  async executeWithRetry(): Promise<AutoApplyStartupResult> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    let retryCount = 0;

    this.isRunning = true;

    try {
      while (retryCount <= this.config.maxRetries) {
        try {
          this.logger.info(`Executing auto-apply check (attempt ${retryCount + 1}/${this.config.maxRetries + 1})`);

          const result = await this.executeAutoApplyWithTimeout();
          const executionTime = Date.now() - startTime;

          const startupResult: AutoApplyStartupResult = {
            success: true,
            result,
            retryCount,
            executionTimeMs: executionTime,
            timestamp: new Date()
          };

          this.lastResult = startupResult;
          this.handleSuccessfulExecution(result, executionTime);
          
          return startupResult;
        } catch (error) {
          lastError = error as Error;
          retryCount++;

          this.logger.warn(
            `Auto-apply attempt ${retryCount} failed: ${lastError.message}`,
            { retryCount, maxRetries: this.config.maxRetries }
          );

          if (retryCount <= this.config.maxRetries) {
            this.logger.info(`Retrying in ${this.config.retryDelayMs}ms...`);
            await this.delay(this.config.retryDelayMs);
          }
        }
      }

      // All retries exhausted
      const executionTime = Date.now() - startTime;
      const startupResult: AutoApplyStartupResult = {
        success: false,
        error: lastError || new Error('Unknown error after all retries'),
        retryCount: retryCount - 1,
        executionTimeMs: executionTime,
        timestamp: new Date()
      };

      this.lastResult = startupResult;
      this.handleFailedExecution(lastError!, retryCount - 1, executionTime);
      
      return startupResult;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Execute auto-apply with timeout protection
   */
  private async executeAutoApplyWithTimeout(): Promise<AutoApplyResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Auto-apply timed out after ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);

      const checkAndApplyMutation = this.autoApplyService.checkAndApplyDueTransactions();
      
      checkAndApplyMutation.mutate(undefined, {
        onSuccess: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        onError: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });
    });
  }

  /**
   * Handle successful auto-apply execution
   */
  private handleSuccessfulExecution(result: AutoApplyResult, executionTimeMs: number) {
    const totalProcessed = result.appliedCount + result.failedCount + result.pendingCount;
    
    this.logger.info('Auto-apply startup completed successfully', {
      appliedCount: result.appliedCount,
      failedCount: result.failedCount,
      pendingCount: result.pendingCount,
      totalProcessed,
      executionTimeMs
    });

    // Show notifications based on results
    if (result.appliedCount > 0) {
      this.notifier.showSuccess(
        `${result.appliedCount} recurring transaction${result.appliedCount > 1 ? 's' : ''} applied automatically`
      );
    }

    if (result.failedCount > 0) {
      this.notifier.showError(
        `${result.failedCount} recurring transaction${result.failedCount > 1 ? 's' : ''} failed to apply`
      );
    }

    if (result.pendingCount > 0) {
      this.notifier.showInfo(
        `${result.pendingCount} recurring transaction${result.pendingCount > 1 ? 's' : ''} require manual approval`
      );
    }

    if (totalProcessed === 0) {
      this.logger.info('No due recurring transactions found');
    }
  }

  /**
   * Handle failed auto-apply execution
   */
  private handleFailedExecution(error: Error, retryCount: number, executionTimeMs: number) {
    this.logger.error('Auto-apply startup failed after all retries', error, {
      retryCount,
      executionTimeMs,
      maxRetries: this.config.maxRetries
    });

    if (this.config.enableNotifications && !this.config.skipOnError) {
      this.notifier.showError('Failed to check recurring transactions on startup');
    }
  }

  /**
   * Get the last execution result
   */
  getLastResult(): AutoApplyStartupResult | null {
    return this.lastResult;
  }

  /**
   * Check if auto-apply is currently running
   */
  isExecuting(): boolean {
    return this.isRunning;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AutoApplyStartupConfig>) {
    this.config = { ...this.config, ...config };
    this.logger.info('Auto-apply startup configuration updated', config);
  }

  /**
   * Manual trigger for testing or user-initiated checks
   */
  async triggerManualCheck(): Promise<AutoApplyStartupResult> {
    if (this.isRunning) {
      throw new Error('Auto-apply is already running');
    }

    this.logger.info('Manual auto-apply check triggered');
    return await this.executeWithRetry();
  }

  /**
   * Create default console logger
   */
  private createDefaultLogger(): AutoApplyStartupLogger {
    const prefix = '[AutoApply Startup]';
    
    return {
      info: (message: string, data?: any) => {
        if (this.config.enableLogging) {
          console.log(`${prefix} ${message}`, data || '');
        }
      },
      warn: (message: string, data?: any) => {
        if (this.config.enableLogging) {
          console.warn(`${prefix} ${message}`, data || '');
        }
      },
      error: (message: string, error?: Error, data?: any) => {
        if (this.config.enableLogging) {
          console.error(`${prefix} ${message}`, error?.message || '', data || '');
        }
      }
    };
  }

  /**
   * Create default no-op notifier (to be overridden with actual notification system)
   */
  private createDefaultNotifier(): AutoApplyStartupNotifier {
    return {
      showSuccess: () => {},
      showError: () => {},
      showInfo: () => {},
      showWarning: () => {}
    };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create AutoApplyStartupService with notification integration
 */
export function createAutoApplyStartupService(
  autoApplyService: IAutoApplyService,
  notificationSystem: {
    addNotification: (notification: { message: string; type: 'success' | 'error' | 'info' | 'warning' }) => void;
  },
  config: Partial<AutoApplyStartupConfig> = {}
): AutoApplyStartupService {
  const notifier: AutoApplyStartupNotifier = {
    showSuccess: (message) => notificationSystem.addNotification({ message, type: 'success' }),
    showError: (message) => notificationSystem.addNotification({ message, type: 'error' }),
    showInfo: (message) => notificationSystem.addNotification({ message, type: 'info' }),
    showWarning: (message) => notificationSystem.addNotification({ message, type: 'warning' })
  };

  return new AutoApplyStartupService(autoApplyService, config, undefined, notifier);
}