/**
 * Focus management utilities for form components
 * Provides tools for managing focus in accessible ways
 */

import { RefObject } from 'react';

export interface FocusableElement {
  focus(): void;
  blur(): void;
}

export interface FocusManagerOptions {
  trapFocus?: boolean;
  restoreFocus?: boolean;
  initialFocus?: RefObject<FocusableElement>;
}

/**
 * Focus management class for form components
 */
export class FormFocusManager {
  private previouslyFocusedElement: FocusableElement | null = null;
  private focusableElements: FocusableElement[] = [];
  private currentFocusIndex = -1;
  private options: FocusManagerOptions;

  constructor(options: FocusManagerOptions = {}) {
    this.options = {
      trapFocus: false,
      restoreFocus: true,
      ...options,
    };
  }

  /**
   * Initialize focus management
   */
  initialize(containerRef: RefObject<any>): void {
    if (this.options.restoreFocus) {
      // Store currently focused element to restore later
      this.previouslyFocusedElement = document.activeElement as FocusableElement;
    }

    // Find all focusable elements in the container
    this.updateFocusableElements(containerRef);

    // Set initial focus
    if (this.options.initialFocus?.current) {
      this.options.initialFocus.current.focus();
    } else if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
      this.currentFocusIndex = 0;
    }
  }

  /**
   * Update the list of focusable elements
   */
  updateFocusableElements(containerRef: RefObject<any>): void {
    if (!containerRef.current) return;

    // In React Native, we need to handle this differently
    // This is a placeholder for web-specific focus management
    // For React Native, focus management would be handled through refs and navigation
    this.focusableElements = [];
  }

  /**
   * Move focus to the next focusable element
   */
  focusNext(): boolean {
    if (this.focusableElements.length === 0) return false;

    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
    this.focusableElements[this.currentFocusIndex].focus();
    return true;
  }

  /**
   * Move focus to the previous focusable element
   */
  focusPrevious(): boolean {
    if (this.focusableElements.length === 0) return false;

    this.currentFocusIndex = this.currentFocusIndex <= 0 
      ? this.focusableElements.length - 1 
      : this.currentFocusIndex - 1;
    this.focusableElements[this.currentFocusIndex].focus();
    return true;
  }

  /**
   * Focus the first element with an error
   */
  focusFirstError(errorFields: string[], fieldRefs: Record<string, RefObject<FocusableElement>>): boolean {
    for (const fieldName of errorFields) {
      const fieldRef = fieldRefs[fieldName];
      if (fieldRef?.current) {
        fieldRef.current.focus();
        return true;
      }
    }
    return false;
  }

  /**
   * Focus a specific field by name
   */
  focusField(fieldName: string, fieldRefs: Record<string, RefObject<FocusableElement>>): boolean {
    const fieldRef = fieldRefs[fieldName];
    if (fieldRef?.current) {
      fieldRef.current.focus();
      return true;
    }
    return false;
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.options.trapFocus) return false;

    switch (event.key) {
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          return this.focusPrevious();
        } else {
          return this.focusNext();
        }
      case 'Escape':
        this.cleanup();
        return true;
      default:
        return false;
    }
  }

  /**
   * Cleanup focus management
   */
  cleanup(): void {
    if (this.options.restoreFocus && this.previouslyFocusedElement) {
      try {
        this.previouslyFocusedElement.focus();
      } catch (error) {
        // Element might no longer be focusable
        console.warn('Could not restore focus to previous element:', error);
      }
    }

    this.previouslyFocusedElement = null;
    this.focusableElements = [];
    this.currentFocusIndex = -1;
  }
}

/**
 * React hook for focus management
 */
export function useFocusManager(options: FocusManagerOptions = {}) {
  const focusManager = new FormFocusManager(options);

  const initializeFocus = (containerRef: RefObject<any>) => {
    focusManager.initialize(containerRef);
  };

  const focusFirstError = (errorFields: string[], fieldRefs: Record<string, RefObject<FocusableElement>>) => {
    return focusManager.focusFirstError(errorFields, fieldRefs);
  };

  const focusField = (fieldName: string, fieldRefs: Record<string, RefObject<FocusableElement>>) => {
    return focusManager.focusField(fieldName, fieldRefs);
  };

  const cleanup = () => {
    focusManager.cleanup();
  };

  return {
    initializeFocus,
    focusFirstError,
    focusField,
    cleanup,
    handleKeyDown: (event: KeyboardEvent) => focusManager.handleKeyDown(event),
  };
}

/**
 * Accessibility announcer for screen readers
 */
export class AccessibilityAnnouncer {
  private static instance: AccessibilityAnnouncer;
  private announceElement: HTMLElement | null = null;

  static getInstance(): AccessibilityAnnouncer {
    if (!AccessibilityAnnouncer.instance) {
      AccessibilityAnnouncer.instance = new AccessibilityAnnouncer();
    }
    return AccessibilityAnnouncer.instance;
  }

  constructor() {
    this.createAnnounceElement();
  }

  private createAnnounceElement(): void {
    // This is web-specific - for React Native, announcements would be handled differently
    if (typeof document === 'undefined') return;

    this.announceElement = document.createElement('div');
    this.announceElement.setAttribute('aria-live', 'polite');
    this.announceElement.setAttribute('aria-atomic', 'true');
    this.announceElement.style.position = 'absolute';
    this.announceElement.style.left = '-10000px';
    this.announceElement.style.width = '1px';
    this.announceElement.style.height = '1px';
    this.announceElement.style.overflow = 'hidden';
    document.body.appendChild(this.announceElement);
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announceElement) return;

    this.announceElement.setAttribute('aria-live', priority);
    this.announceElement.textContent = message;

    // Clear the message after a short delay to allow for re-announcements
    setTimeout(() => {
      if (this.announceElement) {
        this.announceElement.textContent = '';
      }
    }, 1000);
  }

  /**
   * Announce form validation errors
   */
  announceFormErrors(errors: Record<string, string>): void {
    const errorCount = Object.keys(errors).length;
    if (errorCount === 0) {
      this.announce('Form is valid and ready to submit');
      return;
    }

    const errorMessages = Object.values(errors);
    const message = errorCount === 1 
      ? `Form has 1 error: ${errorMessages[0]}`
      : `Form has ${errorCount} errors: ${errorMessages.join(', ')}`;
    
    this.announce(message, 'assertive');
  }

  /**
   * Announce successful form submission
   */
  announceSuccess(message: string = 'Form submitted successfully'): void {
    this.announce(message, 'polite');
  }

  /**
   * Announce loading states
   */
  announceLoading(message: string = 'Loading, please wait'): void {
    this.announce(message, 'polite');
  }
}

/**
 * React hook for accessibility announcements
 */
export function useAccessibilityAnnouncer() {
  const announcer = AccessibilityAnnouncer.getInstance();

  return {
    announce: (message: string, priority?: 'polite' | 'assertive') => 
      announcer.announce(message, priority),
    announceFormErrors: (errors: Record<string, string>) => 
      announcer.announceFormErrors(errors),
    announceSuccess: (message?: string) => 
      announcer.announceSuccess(message),
    announceLoading: (message?: string) => 
      announcer.announceLoading(message),
  };
}

/**
 * High contrast mode detection and utilities
 */
export class HighContrastManager {
  private static instance: HighContrastManager;
  private isHighContrast = false;
  private listeners: ((isHighContrast: boolean) => void)[] = [];

  static getInstance(): HighContrastManager {
    if (!HighContrastManager.instance) {
      HighContrastManager.instance = new HighContrastManager();
    }
    return HighContrastManager.instance;
  }

  constructor() {
    this.detectHighContrast();
    this.setupMediaQueryListener();
  }

  private detectHighContrast(): void {
    // This is web-specific - React Native would handle this differently
    if (typeof window === 'undefined') return;

    // Check for Windows high contrast mode
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      this.isHighContrast = mediaQuery.matches;
    }
  }

  private setupMediaQueryListener(): void {
    if (typeof window === 'undefined') return;

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      mediaQuery.addEventListener('change', (e) => {
        this.isHighContrast = e.matches;
        this.notifyListeners();
      });
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isHighContrast));
  }

  /**
   * Check if high contrast mode is active
   */
  isHighContrastMode(): boolean {
    return this.isHighContrast;
  }

  /**
   * Add listener for high contrast mode changes
   */
  addListener(listener: (isHighContrast: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get high contrast styles for form components
   */
  getHighContrastStyles(): Record<string, any> {
    if (!this.isHighContrast) return {};

    return {
      // High contrast styles for form components
      border: '2px solid',
      backgroundColor: 'transparent',
      color: 'inherit',
      outline: '2px solid transparent',
      outlineOffset: '2px',
    };
  }
}

/**
 * React hook for high contrast mode
 */
export function useHighContrast() {
  const manager = HighContrastManager.getInstance();
  const [isHighContrast, setIsHighContrast] = React.useState(manager.isHighContrastMode());

  React.useEffect(() => {
    const cleanup = manager.addListener(setIsHighContrast);
    return cleanup;
  }, [manager]);

  return {
    isHighContrast,
    getHighContrastStyles: () => manager.getHighContrastStyles(),
  };
}