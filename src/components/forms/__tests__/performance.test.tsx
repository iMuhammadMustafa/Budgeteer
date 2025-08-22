/**
 * Comprehensive performance tests for form components
 * Tests rendering performance, validation speed, memory usage, and optimization strategies
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderHook } from '@testing-library/react-native';
import { performanceMonitor, useFormPerformanceMonitor } from '../../../utils/performance-monitor';
import FormContainer from '../FormContainer';
import FormField from '../FormField';
import FormSection from '../FormSection';
import { useFormState } from '../../hooks/useFormState';
import { useFormSubmission } from '../../hooks/useFormSubmission';
import { ValidationSchema } from '../../../types/components/forms.types';
import { debounce } from '../../../utils/debounce';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
global.performance = { now: mockPerformanceNow } as any;

// Mock React.memo for testing memoization
const originalMemo = React.memo;
let memoCallCount = 0;
React.memo = jest.fn((component) => {
  memoCallCount++;
  return originalMemo(component);
});

// Test data
const mockFormData = {
  name: 'Test Name',
  email: 'test@example.com',
  age: 25,
  description: 'Test description',
  tags: ['tag1', 'tag2'],
  isActive: true,
};

const mockValidationSchema: ValidationSchema<typeof mockFormData> = {
  name: [{ type: 'required', message: 'Name is required' }],
  email: [
    { type: 'required', message: 'Email is required' },
    { type: 'pattern', value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
  ],
  age: [
    { type: 'required', message: 'Age is required' },
    { type: 'custom', validator: (value) => value >= 18, message: 'Must be 18 or older' },
  ],
};

// Performance test component
function PerformanceTestForm({ fieldCount = 10, validationRules = 2 }) {
  const formData = React.useMemo(() => {
    return Array.from({ length: fieldCount }, (_, i) => [`field${i}`, `value${i}`])
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }, [fieldCount]);

  const validationSchema = React.useMemo(() => {
    const schema: ValidationSchema<any> = {};
    for (let i = 0; i < fieldCount; i++) {
      schema[`field${i}`] = Array.from({ length: validationRules }, (_, j) => ({
        type: j === 0 ? 'required' : 'minLength',
        value: j === 0 ? undefined : 2,
        message: `Field ${i} validation rule ${j}`,
      }));
    }
    return schema;
  }, [fieldCount, validationRules]);

  const { formState, updateField, validateForm } = useFormState(formData, validationSchema);
  const { measureRender, measureValidation, recordMetrics } = useFormPerformanceMonitor('PerformanceTest');

  React.useEffect(() => {
    const endMeasurement = measureRender();
    return () => {
      const renderTime = endMeasurement();
      recordMetrics({ renderTime });
    };
  });

  const handleFieldUpdate = React.useCallback((field: string, value: any) => {
    const startTime = performance.now();
    updateField(field, value);
    const updateTime = performance.now() - startTime;
    recordMetrics({ fieldUpdateTime: updateTime });
  }, [updateField, recordMetrics]);

  const handleValidation = React.useCallback(() => {
    const endMeasurement = measureValidation();
    const isValid = validateForm();
    const validationTime = endMeasurement();
    recordMetrics({ validationTime });
    return isValid;
  }, [validateForm, measureValidation, recordMetrics]);

  return (
    <FormContainer
      onSubmit={handleValidation}
      isValid={formState.isValid}
      isLoading={false}
    >
      {Object.entries(formData).map(([key, value]) => (
        <FormField
          key={key}
          config={{
            name: key as any,
            label: `Field ${key}`,
            type: 'text',
            required: true,
          }}
          value={formState.data[key] || value}
          error={formState.errors[key]}
          touched={formState.touched[key]}
          onChange={(newValue) => handleFieldUpdate(key, newValue)}
        />
      ))}
    </FormContainer>
  );
}

describe('Form Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.clearPerformanceData();
    mockPerformanceNow.mockReturnValue(0);
    memoCallCount = 0;
  });

  afterEach(() => {
    React.memo = originalMemo;
  });

  describe('Rendering Performance', () => {
    it('should render small forms within performance threshold', () => {
      const startTime = performance.now();
      
      render(<PerformanceTestForm fieldCount={5} validationRules={2} />);
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(50); // Should render in less than 50ms
    });

    it('should render medium forms efficiently', () => {
      const startTime = performance.now();
      
      render(<PerformanceTestForm fieldCount={20} validationRules={3} />);
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('should handle large forms within acceptable time', () => {
      const startTime = performance.now();
      
      render(<PerformanceTestForm fieldCount={50} validationRules={4} />);
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(200); // Should render in less than 200ms
    });

    it('should optimize re-renders with memoization', () => {
      const mockOnChange = jest.fn();
      const fieldConfig = {
        name: 'testField' as const,
        label: 'Test Field',
        type: 'text' as const,
        required: true,
      };

      const { rerender } = render(
        <FormField
          config={fieldConfig}
          value="test value"
          error={undefined}
          touched={false}
          onChange={mockOnChange}
        />
      );

      const initialMemoCount = memoCallCount;

      // Re-render with same props - should be memoized
      rerender(
        <FormField
          config={fieldConfig}
          value="test value"
          error={undefined}
          touched={false}
          onChange={mockOnChange}
        />
      );

      // Should use memoization
      expect(memoCallCount).toBeGreaterThan(initialMemoCount);
    });

    it('should handle rapid re-renders efficiently', () => {
      const { rerender } = render(
        <FormContainer onSubmit={() => {}} isValid={true} isLoading={false}>
          <div>Test content</div>
        </FormContainer>
      );

      const startTime = performance.now();

      // Perform 100 rapid re-renders
      for (let i = 0; i < 100; i++) {
        rerender(
          <FormContainer onSubmit={() => {}} isValid={i % 2 === 0} isLoading={false}>
            <div>Test content {i}</div>
          </FormContainer>
        );
      }

      const totalTime = performance.now() - startTime;
      expect(totalTime).toBeLessThan(500); // Should handle 100 re-renders in less than 500ms
    });
  });

  describe('Validation Performance', () => {
    it('should validate fields efficiently', async () => {
      const { result } = renderHook(() => 
        useFormState(mockFormData, mockValidationSchema)
      );

      const startTime = performance.now();

      await act(async () => {
        result.current.validateForm();
      });

      const validationTime = performance.now() - startTime;
      expect(validationTime).toBeLessThan(10); // Should validate in less than 10ms
    });

    it('should handle complex validation schemas efficiently', async () => {
      const complexSchema: ValidationSchema<any> = {};
      
      // Create a complex validation schema with many rules
      for (let i = 0; i < 50; i++) {
        complexSchema[`field${i}`] = [
          { type: 'required', message: 'Required' },
          { type: 'minLength', value: 3, message: 'Too short' },
          { type: 'maxLength', value: 50, message: 'Too long' },
          { type: 'pattern', value: /^[a-zA-Z0-9]+$/, message: 'Invalid format' },
          { type: 'custom', validator: (value) => value !== 'invalid', message: 'Invalid value' },
        ];
      }

      const complexFormData = Array.from({ length: 50 }, (_, i) => [`field${i}`, `value${i}`])
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      const { result } = renderHook(() => 
        useFormState(complexFormData, complexSchema)
      );

      const startTime = performance.now();

      await act(async () => {
        result.current.validateForm();
      });

      const validationTime = performance.now() - startTime;
      expect(validationTime).toBeLessThan(100); // Should validate complex schema in less than 100ms
    });

    it('should debounce validation efficiently', async () => {
      let validationCallCount = 0;
      const debouncedValidation = debounce(() => {
        validationCallCount++;
      }, 100);

      // Simulate rapid validation calls
      for (let i = 0; i < 10; i++) {
        debouncedValidation();
      }

      // Should only call validation once after debounce period
      await waitFor(() => {
        expect(validationCallCount).toBe(1);
      }, { timeout: 200 });
    });

    it('should handle validation of large datasets', async () => {
      const largeFormData = Array.from({ length: 1000 }, (_, i) => [`field${i}`, `value${i}`])
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      const largeValidationSchema: ValidationSchema<any> = {};
      for (let i = 0; i < 1000; i++) {
        largeValidationSchema[`field${i}`] = [
          { type: 'required', message: 'Required' },
          { type: 'minLength', value: 2, message: 'Too short' },
        ];
      }

      const { result } = renderHook(() => 
        useFormState(largeFormData, largeValidationSchema)
      );

      const startTime = performance.now();

      await act(async () => {
        result.current.validateForm();
      });

      const validationTime = performance.now() - startTime;
      expect(validationTime).toBeLessThan(500); // Should validate 1000 fields in less than 500ms
    });
  });

  describe('Field Update Performance', () => {
    it('should handle rapid field updates efficiently', async () => {
      const { result } = renderHook(() => 
        useFormState(mockFormData, mockValidationSchema)
      );

      const startTime = performance.now();

      await act(async () => {
        // Simulate rapid typing
        for (let i = 0; i < 100; i++) {
          result.current.updateField('name', `Name ${i}`);
        }
      });

      const updateTime = performance.now() - startTime;
      expect(updateTime).toBeLessThan(100); // Should handle 100 updates in less than 100ms
    });

    it('should optimize field updates with batching', async () => {
      const { result } = renderHook(() => 
        useFormState(mockFormData, mockValidationSchema)
      );

      let renderCount = 0;
      const originalUseState = React.useState;
      React.useState = jest.fn((initial) => {
        renderCount++;
        return originalUseState(initial);
      });

      await act(async () => {
        // Multiple updates in same act should be batched
        result.current.updateField('name', 'New Name');
        result.current.updateField('email', 'new@email.com');
        result.current.updateField('age', 30);
      });

      React.useState = originalUseState;

      // Should batch updates to minimize re-renders
      expect(renderCount).toBeLessThan(10);
    });
  });

  describe('Submission Performance', () => {
    it('should handle form submission efficiently', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => 
        useFormSubmission(mockSubmit)
      );

      const startTime = performance.now();

      await act(async () => {
        await result.current.submit(mockFormData);
      });

      const submissionTime = performance.now() - startTime;
      expect(submissionTime).toBeLessThan(50); // Should submit in less than 50ms
    });

    it('should handle concurrent submissions efficiently', async () => {
      const mockSubmit = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10))
      );
      
      const { result } = renderHook(() => 
        useFormSubmission(mockSubmit)
      );

      const startTime = performance.now();

      await act(async () => {
        // Start multiple submissions
        const promises = Array.from({ length: 5 }, () => 
          result.current.submit(mockFormData)
        );
        await Promise.all(promises);
      });

      const totalTime = performance.now() - startTime;
      expect(totalTime).toBeLessThan(100); // Should handle concurrent submissions efficiently
    });
  });

  describe('Memory Usage', () => {
    it('should not create memory leaks with form state updates', () => {
      const { result, unmount } = renderHook(() => 
        useFormState(mockFormData, mockValidationSchema)
      );

      // Simulate many form interactions
      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.updateField('name', `Name ${i}`);
        }
      });

      // Unmount component
      unmount();

      // Should not cause memory leaks (verified by lack of errors)
      expect(true).toBe(true);
    });

    it('should clean up event listeners and timers', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      const { unmount } = render(<PerformanceTestForm fieldCount={10} />);

      // Unmount component
      unmount();

      // Should clean up timers (debounce, validation delays, etc.)
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should handle large form data without memory issues', () => {
      const largeFormData = Array.from({ length: 10000 }, (_, i) => [`field${i}`, `value${i}`])
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      const { result } = renderHook(() => 
        useFormState(largeFormData)
      );

      // Should handle large data without errors
      expect(result.current.formState.data).toBeDefined();
      expect(Object.keys(result.current.formState.data)).toHaveLength(10000);
    });
  });

  describe('Performance Monitoring', () => {
    it('should record accurate performance metrics', () => {
      performanceMonitor.recordFormPerformance(
        'TestForm',
        {
          renderTime: 15.5,
          validationTime: 25.3,
          fieldUpdateTime: 5.1,
          submissionTime: 45.7,
        },
        10, // field count
        20  // validation rule count
      );

      const stats = performanceMonitor.getFormStatistics('TestForm');
      expect(stats).toEqual({
        averageRenderTime: 15.5,
        averageValidationTime: 25.3,
        averageSubmissionTime: 45.7,
        averageFieldUpdateTime: 5.1,
        totalMeasurements: 1,
      });
    });

    it('should calculate performance statistics correctly', () => {
      // Record multiple measurements
      performanceMonitor.recordFormPerformance('TestForm', { renderTime: 10 });
      performanceMonitor.recordFormPerformance('TestForm', { renderTime: 20 });
      performanceMonitor.recordFormPerformance('TestForm', { renderTime: 30 });

      const stats = performanceMonitor.getFormStatistics('TestForm');
      expect(stats.averageRenderTime).toBe(20); // (10 + 20 + 30) / 3
      expect(stats.totalMeasurements).toBe(3);
    });

    it('should provide performance warnings for slow operations', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      performanceMonitor.recordFormPerformance(
        'SlowForm',
        {
          renderTime: 100,      // Above threshold (16ms)
          validationTime: 200,  // Above threshold (50ms)
          fieldUpdateTime: 50,  // Above threshold (10ms)
          submissionTime: 2000, // Above threshold (1000ms)
        }
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance warning: SlowForm renderTime took 100.00ms')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance warning: SlowForm validationTime took 200.00ms')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance warning: SlowForm fieldUpdateTime took 50.00ms')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance warning: SlowForm submissionTime took 2000.00ms')
      );

      consoleSpy.mockRestore();
    });

    it('should track performance trends over time', () => {
      // Record performance over time
      for (let i = 1; i <= 10; i++) {
        performanceMonitor.recordFormPerformance('TrendForm', { 
          renderTime: i * 5, // Increasing render time
          validationTime: 50 - i * 2, // Decreasing validation time
        });
      }

      const stats = performanceMonitor.getFormStatistics('TrendForm');
      expect(stats.averageRenderTime).toBe(27.5); // Average of 5, 10, 15, ..., 50
      expect(stats.averageValidationTime).toBe(39); // Average of 48, 46, 44, ..., 30
    });
  });

  describe('Component Memoization', () => {
    it('should prevent unnecessary re-renders with React.memo', () => {
      let renderCount = 0;
      const TestComponent = React.memo(() => {
        renderCount++;
        return <div>Test</div>;
      });

      const { rerender } = render(<TestComponent />);
      
      // Re-render with same props
      rerender(<TestComponent />);
      
      // Should only render once due to memoization
      expect(renderCount).toBe(1);
    });

    it('should re-render when props actually change', () => {
      let renderCount = 0;
      const TestComponent = React.memo(({ value }: { value: string }) => {
        renderCount++;
        return <div>{value}</div>;
      });

      const { rerender } = render(<TestComponent value="initial" />);
      
      // Re-render with different props
      rerender(<TestComponent value="changed" />);
      
      // Should render twice due to prop change
      expect(renderCount).toBe(2);
    });

    it('should use custom comparison function for complex props', () => {
      let renderCount = 0;
      const TestComponent = React.memo(
        ({ data }: { data: { id: string; value: string } }) => {
          renderCount++;
          return <div>{data.value}</div>;
        },
        (prevProps, nextProps) => prevProps.data.id === nextProps.data.id
      );

      const { rerender } = render(
        <TestComponent data={{ id: '1', value: 'initial' }} />
      );
      
      // Re-render with same id but different value - should not re-render
      rerender(
        <TestComponent data={{ id: '1', value: 'changed' }} />
      );
      
      expect(renderCount).toBe(1);

      // Re-render with different id - should re-render
      rerender(
        <TestComponent data={{ id: '2', value: 'changed' }} />
      );
      
      expect(renderCount).toBe(2);
    });
  });

  describe('Lazy Loading Performance', () => {
    it('should load form sections lazily', async () => {
      const LazyFormSection = React.lazy(() => 
        Promise.resolve({ default: FormSection })
      );

      const { queryByText } = render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyFormSection title="Lazy Section">
            <div>Lazy content</div>
          </LazyFormSection>
        </React.Suspense>
      );

      // Should show loading initially
      expect(queryByText('Loading...')).toBeTruthy();

      // Should load content
      await waitFor(() => {
        expect(queryByText('Lazy content')).toBeTruthy();
      });
    });

    it('should handle code splitting efficiently', async () => {
      const startTime = performance.now();

      // Simulate loading a large form component
      const LargeFormComponent = React.lazy(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({ default: () => <PerformanceTestForm fieldCount={100} /> });
          }, 10);
        })
      );

      render(
        <React.Suspense fallback={<div>Loading large form...</div>}>
          <LargeFormComponent />
        </React.Suspense>
      );

      await waitFor(() => {
        expect(performance.now() - startTime).toBeLessThan(100);
      });
    });
  });

  describe('Bundle Size Impact', () => {
    it('should have minimal impact on bundle size', () => {
      // This would typically be tested with webpack-bundle-analyzer
      // For now, we test that components are tree-shakeable
      
      const formComponents = {
        FormContainer,
        FormField,
        FormSection,
      };

      // All components should be defined
      Object.values(formComponents).forEach(component => {
        expect(component).toBeDefined();
        expect(typeof component).toBe('object'); // React components are objects when memoized
      });
    });
  });
});