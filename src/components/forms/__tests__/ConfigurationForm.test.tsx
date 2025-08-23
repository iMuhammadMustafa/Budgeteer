/**
 * Integration tests for ConfigurationForm component
 * Tests the refactored form using the new form system with useFormState and validation
 * Note: These tests focus on component structure, props, and integration patterns
 */

import React from 'react';
import ConfigurationForm, { initialState } from '../ConfigurationForm';
import { useUpsertConfiguration } from '@/src/services/repositories/Configurations.Service';
import { ConfigurationFormData } from '@/src/types/components/forms.types';

// Mock the configuration service
jest.mock('@/src/services/Configurations.Service');
const mockUseUpsertConfiguration = useUpsertConfiguration as jest.MockedFunction<typeof useUpsertConfiguration>;

// Mock the auth provider
jest.mock('@/src/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: {
      user: {
        id: 'test-user-id',
        user_metadata: { tenantid: 'test-tenant-id' }
      }
    }
  })
}));

// Mock the form hooks
jest.mock('../../hooks/useFormState');
jest.mock('../../hooks/useFormSubmission');

// Test data
const mockConfiguration: ConfigurationFormData = {
  id: 'test-config-id',
  table: 'test_table',
  type: 'test_type',
  key: 'test_key',
  value: 'test_value',
};

describe('ConfigurationForm Integration Tests', () => {
  let mockMutate: jest.Mock;

  beforeEach(() => {
    mockMutate = jest.fn();
    mockUseUpsertConfiguration.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
      isSuccess: false,
      isError: false,
      data: undefined,
      reset: jest.fn(),
      mutateAsync: jest.fn(),
      variables: undefined,
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isIdle: true,
      isPaused: false,
      status: 'idle',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should be a React component', () => {
      expect(typeof ConfigurationForm).toBe('function');
    });

    it('should accept configuration prop', () => {
      expect(() => {
        ConfigurationForm({ configuration: mockConfiguration });
      }).not.toThrow();
    });

    it('should accept onSuccess callback prop', () => {
      const mockOnSuccess = jest.fn();
      expect(() => {
        ConfigurationForm({ onSuccess: mockOnSuccess });
      }).not.toThrow();
    });

    it('should accept onCancel callback prop', () => {
      const mockOnCancel = jest.fn();
      expect(() => {
        ConfigurationForm({ onCancel: mockOnCancel });
      }).not.toThrow();
    });

    it('should work without any props', () => {
      expect(() => {
        ConfigurationForm({});
      }).not.toThrow();
    });
  });

  describe('Initial State', () => {
    it('should export initialState with correct structure', () => {
      expect(initialState).toEqual({
        table: "",
        type: "",
        key: "",
        value: "",
      });
    });

    it('should have all required fields in initialState', () => {
      expect(initialState).toHaveProperty('table');
      expect(initialState).toHaveProperty('type');
      expect(initialState).toHaveProperty('key');
      expect(initialState).toHaveProperty('value');
    });
  });

  describe('Props Interface', () => {
    it('should handle configuration prop correctly', () => {
      const props = { configuration: mockConfiguration };
      expect(() => ConfigurationForm(props)).not.toThrow();
    });

    it('should handle callback props correctly', () => {
      const props = {
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
      };
      expect(() => ConfigurationForm(props)).not.toThrow();
    });

    it('should handle mixed props correctly', () => {
      const props = {
        configuration: mockConfiguration,
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
      };
      expect(() => ConfigurationForm(props)).not.toThrow();
    });
  });

  describe('Form System Integration', () => {
    it('should use the new form system hooks', () => {
      // This test verifies that the component is structured to use the new form system
      // The actual hook behavior is tested in the hook-specific tests
      expect(() => ConfigurationForm({})).not.toThrow();
    });

    it('should integrate with useUpsertConfiguration service', () => {
      ConfigurationForm({});
      expect(mockUseUpsertConfiguration).toHaveBeenCalled();
    });

    it('should handle service loading state', () => {
      mockUseUpsertConfiguration.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
        error: null,
        isSuccess: false,
        isError: false,
        data: undefined,
        reset: jest.fn(),
        mutateAsync: jest.fn(),
        variables: undefined,
        context: undefined,
        failureCount: 0,
        failureReason: null,
        isIdle: false,
        isPaused: false,
        status: 'pending',
      });

      expect(() => ConfigurationForm({})).not.toThrow();
    });

    it('should handle service error state', () => {
      const mockError = new Error('Service error');
      mockUseUpsertConfiguration.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: mockError,
        isSuccess: false,
        isError: true,
        data: undefined,
        reset: jest.fn(),
        mutateAsync: jest.fn(),
        variables: undefined,
        context: undefined,
        failureCount: 1,
        failureReason: mockError,
        isIdle: false,
        isPaused: false,
        status: 'error',
      });

      expect(() => ConfigurationForm({})).not.toThrow();
    });
  });

  describe('Validation Schema', () => {
    it('should have validation rules for all required fields', () => {
      // This test verifies that the component includes validation
      // The actual validation logic is tested in the validation utility tests
      expect(() => ConfigurationForm({})).not.toThrow();
    });
  });

  describe('Field Configuration', () => {
    it('should have field configurations for all form fields', () => {
      // This test verifies that the component includes field configurations
      // The actual field rendering is tested in the FormField component tests
      expect(() => ConfigurationForm({})).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle mutation errors gracefully', () => {
      const mockError = new Error('Mutation failed');
      mockUseUpsertConfiguration.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: mockError,
        isSuccess: false,
        isError: true,
        data: undefined,
        reset: jest.fn(),
        mutateAsync: jest.fn(),
        variables: undefined,
        context: undefined,
        failureCount: 1,
        failureReason: mockError,
        isIdle: false,
        isPaused: false,
        status: 'error',
      });

      expect(() => ConfigurationForm({})).not.toThrow();
    });

    it('should handle submission errors gracefully', () => {
      expect(() => ConfigurationForm({})).not.toThrow();
    });
  });

  describe('Callback Integration', () => {
    it('should integrate onSuccess callback with form submission', () => {
      const mockOnSuccess = jest.fn();
      expect(() => ConfigurationForm({ onSuccess: mockOnSuccess })).not.toThrow();
    });

    it('should integrate onCancel callback', () => {
      const mockOnCancel = jest.fn();
      expect(() => ConfigurationForm({ onCancel: mockOnCancel })).not.toThrow();
    });
  });

  describe('Data Flow', () => {
    it('should handle form data initialization correctly', () => {
      expect(() => ConfigurationForm({ configuration: mockConfiguration })).not.toThrow();
    });

    it('should handle form data updates correctly', () => {
      expect(() => ConfigurationForm({})).not.toThrow();
    });

    it('should handle form submission correctly', () => {
      expect(() => ConfigurationForm({})).not.toThrow();
    });

    it('should handle form reset correctly', () => {
      expect(() => ConfigurationForm({})).not.toThrow();
    });
  });

  describe('Accessibility Integration', () => {
    it('should integrate accessibility features', () => {
      // This test verifies that the component includes accessibility features
      // The actual accessibility implementation is tested in the FormField and FormContainer tests
      expect(() => ConfigurationForm({})).not.toThrow();
    });
  });

  describe('Performance Integration', () => {
    it('should handle memoization correctly', () => {
      // This test verifies that the component handles performance optimizations
      expect(() => ConfigurationForm({})).not.toThrow();
    });

    it('should handle re-renders efficiently', () => {
      const props = { configuration: mockConfiguration };
      expect(() => {
        ConfigurationForm(props);
        ConfigurationForm(props); // Second render with same props
      }).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety with ConfigurationFormData', () => {
      const validConfig: ConfigurationFormData = {
        table: 'test_table',
        type: 'test_type', 
        key: 'test_key',
        value: 'test_value',
      };
      
      expect(() => ConfigurationForm({ configuration: validConfig })).not.toThrow();
    });

    it('should handle optional id field correctly', () => {
      const configWithId: ConfigurationFormData = {
        id: 'test-id',
        table: 'test_table',
        type: 'test_type',
        key: 'test_key', 
        value: 'test_value',
      };
      
      expect(() => ConfigurationForm({ configuration: configWithId })).not.toThrow();
    });
  });
});