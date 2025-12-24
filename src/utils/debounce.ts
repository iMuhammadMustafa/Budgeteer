/**
 * Debounce utility for performance optimization
 * Delays function execution until after a specified delay has passed since the last call
 */

export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * Throttle utility for performance optimization
 * Limits function execution to at most once per specified interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  interval: number,
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= interval) {
      lastCallTime = now;
      func(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        func(...args);
      }, interval - timeSinceLastCall);
    }
  };
}

/**
 * Creates a debounced version of a validation function
 * Useful for real-time validation without excessive API calls or computations
 */
export function createDebouncedValidator<T>(
  validator: (value: T) => boolean | Promise<boolean>,
  delay: number = 300,
): (value: T) => Promise<boolean> {
  const debouncedFn = debounce(validator, delay);

  return (value: T): Promise<boolean> => {
    return new Promise(resolve => {
      const originalValidator = validator;

      // Create a wrapper that resolves the promise
      const wrappedValidator = async (val: T) => {
        try {
          const result = await originalValidator(val);
          resolve(result);
        } catch (error) {
          resolve(false);
        }
      };

      // Use debounced version
      const debouncedValidator = debounce(wrappedValidator, delay);
      debouncedValidator(value);
    });
  };
}
