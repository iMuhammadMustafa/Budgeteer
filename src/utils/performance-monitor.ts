/**
 * Performance monitoring utilities for form components
 * Provides tools to measure and optimize form performance
 */

interface PerformanceMetrics {
  renderTime: number;
  validationTime: number;
  submissionTime: number;
  fieldUpdateTime: number;
}

interface FormPerformanceData {
  formName: string;
  metrics: Partial<PerformanceMetrics>;
  timestamp: number;
  fieldCount: number;
  validationRuleCount: number;
}

class FormPerformanceMonitor {
  private static instance: FormPerformanceMonitor;
  private performanceData: Map<string, FormPerformanceData[]> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  static getInstance(): FormPerformanceMonitor {
    if (!FormPerformanceMonitor.instance) {
      FormPerformanceMonitor.instance = new FormPerformanceMonitor();
    }
    return FormPerformanceMonitor.instance;
  }

  /**
   * Start measuring performance for a specific operation
   */
  startMeasurement(operationName: string): () => number {
    if (!this.isEnabled) {
      return () => 0;
    }

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      return endTime - startTime;
    };
  }

  /**
   * Record form performance data
   */
  recordFormPerformance(
    formName: string,
    metrics: Partial<PerformanceMetrics>,
    fieldCount: number = 0,
    validationRuleCount: number = 0
  ): void {
    if (!this.isEnabled) return;

    const data: FormPerformanceData = {
      formName,
      metrics,
      timestamp: Date.now(),
      fieldCount,
      validationRuleCount,
    };

    if (!this.performanceData.has(formName)) {
      this.performanceData.set(formName, []);
    }

    const formData = this.performanceData.get(formName)!;
    formData.push(data);

    // Keep only last 100 measurements per form
    if (formData.length > 100) {
      formData.shift();
    }

    // Log performance warnings
    this.checkPerformanceThresholds(data);
  }

  /**
   * Get performance statistics for a form
   */
  getFormStatistics(formName: string): {
    averageRenderTime: number;
    averageValidationTime: number;
    averageSubmissionTime: number;
    averageFieldUpdateTime: number;
    totalMeasurements: number;
  } | null {
    if (!this.isEnabled) return null;

    const data = this.performanceData.get(formName);
    if (!data || data.length === 0) return null;

    const totals = data.reduce(
      (acc, item) => ({
        renderTime: acc.renderTime + (item.metrics.renderTime || 0),
        validationTime: acc.validationTime + (item.metrics.validationTime || 0),
        submissionTime: acc.submissionTime + (item.metrics.submissionTime || 0),
        fieldUpdateTime: acc.fieldUpdateTime + (item.metrics.fieldUpdateTime || 0),
      }),
      { renderTime: 0, validationTime: 0, submissionTime: 0, fieldUpdateTime: 0 }
    );

    const count = data.length;

    return {
      averageRenderTime: totals.renderTime / count,
      averageValidationTime: totals.validationTime / count,
      averageSubmissionTime: totals.submissionTime / count,
      averageFieldUpdateTime: totals.fieldUpdateTime / count,
      totalMeasurements: count,
    };
  }

  /**
   * Get all performance data for debugging
   */
  getAllPerformanceData(): Map<string, FormPerformanceData[]> {
    return this.performanceData;
  }

  /**
   * Clear performance data
   */
  clearPerformanceData(formName?: string): void {
    if (formName) {
      this.performanceData.delete(formName);
    } else {
      this.performanceData.clear();
    }
  }

  /**
   * Check performance thresholds and log warnings
   */
  private checkPerformanceThresholds(data: FormPerformanceData): void {
    const { metrics, formName } = data;

    // Performance thresholds (in milliseconds)
    const thresholds = {
      renderTime: 16, // 60fps = 16.67ms per frame
      validationTime: 50,
      submissionTime: 1000,
      fieldUpdateTime: 10,
    };

    Object.entries(metrics).forEach(([key, value]) => {
      const threshold = thresholds[key as keyof PerformanceMetrics];
      if (value && threshold && value > threshold) {
        console.warn(
          `Performance warning: ${formName} ${key} took ${value.toFixed(2)}ms (threshold: ${threshold}ms)`
        );
      }
    });
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if performance monitoring is enabled
   */
  isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const performanceMonitor = FormPerformanceMonitor.getInstance();

/**
 * Hook for measuring form component performance
 */
export function useFormPerformanceMonitor(formName: string) {
  const measureRender = () => performanceMonitor.startMeasurement(`${formName}-render`);
  const measureValidation = () => performanceMonitor.startMeasurement(`${formName}-validation`);
  const measureSubmission = () => performanceMonitor.startMeasurement(`${formName}-submission`);
  const measureFieldUpdate = () => performanceMonitor.startMeasurement(`${formName}-field-update`);

  const recordMetrics = (metrics: Partial<PerformanceMetrics>, fieldCount?: number, validationRuleCount?: number) => {
    performanceMonitor.recordFormPerformance(formName, metrics, fieldCount, validationRuleCount);
  };

  const getStatistics = () => performanceMonitor.getFormStatistics(formName);

  return {
    measureRender,
    measureValidation,
    measureSubmission,
    measureFieldUpdate,
    recordMetrics,
    getStatistics,
    isEnabled: performanceMonitor.isMonitoringEnabled(),
  };
}

/**
 * Higher-order component for automatic performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const MonitoredComponent = React.memo((props: P) => {
    const { measureRender, recordMetrics } = useFormPerformanceMonitor(componentName);

    React.useEffect(() => {
      const endMeasurement = measureRender();
      
      return () => {
        const renderTime = endMeasurement();
        recordMetrics({ renderTime });
      };
    });

    return <WrappedComponent {...props} />;
  });

  MonitoredComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  
  return MonitoredComponent;
}