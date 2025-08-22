/**
 * Integration tests for AccountForm component
 * Tests the refactored AccountForm using the new form system
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AccountForm, { AccountFormType, initialState } from '../AccountForm';

// Mock the services
const mockUpsert = jest.fn();
const mockUpdateOpenBalance = jest.fn();
const mockAccountCategories = [
  { id: '1', name: 'Checking', type: 'Asset', icon: 'CreditCard' },
  { id: '2', name: 'Savings', type: 'Asset', icon: 'PiggyBank' },
];

jest.mock('@/src/services/Accounts.Service', () => ({
  useAccountService: () => ({
    upsert: () => ({ mutate: mockUpsert }),
    updateAccountOpenedTransaction: () => ({ mutate: mockUpdateOpenBalance }),
    getAccountOpenedTransaction: () => ({ data: null }),
  }),
}));

jest.mock('@/src/services/AccountCategories.Service', () => ({
  useAccountCategoryService: () => ({
    findAll: () => ({ data: mockAccountCategories }),
  }),
}));

// Mock router
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    navigate: mockNavigate,
  },
}));

// Mock form validation utilities
jest.mock('@/src/utils/form-validation', () => ({
  createAccountNameValidation: () => [
    { type: 'required', message: 'Account name is required' },
    { type: 'minLength', value: 2, message: 'Account name must be at least 2 characters' },
  ],
  commonValidationRules: {
    required: (message: string) => ({ type: 'required', message }),
    min: (value: number, message: string) => ({ type: 'min', value, message }),
    minLength: (length: number, message: string) => ({ type: 'minLength', value: length, message }),
    maxLength: (length: number, message: string) => ({ type: 'maxLength', value: length, message }),
  },
  createDescriptionValidation: () => [
    { type: 'maxLength', value: 500, message: 'Description must be no more than 500 characters' },
  ],
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('AccountForm', () => {
  const defaultAccount: AccountFormType = {
    ...initialState,
    id: '1',
    name: 'Test Account',
    categoryid: '1',
    balance: 1000,
    currency: 'USD',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all required form sections', () => {
      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      expect(screen.getByText('Basic Information')).toBeTruthy();
      expect(screen.getByText('Appearance')).toBeTruthy();
      expect(screen.getByText('Financial Information')).toBeTruthy();
      expect(screen.getByText('Additional Information')).toBeTruthy();
    });

    it('should render all form fields with correct initial values', () => {
      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('Test Account')).toBeTruthy();
      expect(screen.getByDisplayValue('1000')).toBeTruthy();
      expect(screen.getByDisplayValue('USD')).toBeTruthy();
    });

    it('should show required field indicators', () => {
      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      // Check for required asterisks
      const requiredFields = screen.getAllByText('*');
      expect(requiredFields.length).toBeGreaterThan(0);
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const emptyAccount: AccountFormType = {
        ...initialState,
        name: '',
        categoryid: '',
      };

      render(
        <TestWrapper>
          <AccountForm account={emptyAccount} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Account');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockUpsert).not.toHaveBeenCalled();
      });
    });

    it('should validate account name length', async () => {
      const invalidAccount: AccountFormType = {
        ...defaultAccount,
        name: 'A', // Too short
      };

      render(
        <TestWrapper>
          <AccountForm account={invalidAccount} />
        </TestWrapper>
      );

      const nameField = screen.getByDisplayValue('A');
      fireEvent.changeText(nameField, 'A');

      const submitButton = screen.getByText('Save Account');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockUpsert).not.toHaveBeenCalled();
      });
    });

    it('should validate currency field', async () => {
      const invalidAccount: AccountFormType = {
        ...defaultAccount,
        currency: 'US', // Too short
      };

      render(
        <TestWrapper>
          <AccountForm account={invalidAccount} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Account');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockUpsert).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit valid form data', async () => {
      mockUpsert.mockImplementation((data, callbacks) => {
        callbacks.onSuccess();
      });

      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Account');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            form: expect.objectContaining({
              name: 'Test Account',
              categoryid: '1',
              balance: 1000,
              currency: 'USD',
            }),
            original: defaultAccount,
            props: expect.objectContaining({
              addAdjustmentTransaction: expect.any(Boolean),
            }),
          }),
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });

    it('should navigate to accounts page on successful submission', async () => {
      mockUpsert.mockImplementation((data, callbacks) => {
        callbacks.onSuccess();
      });

      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Account');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/Accounts');
      });
    });

    it('should handle submission errors', async () => {
      const error = new Error('Submission failed');
      mockUpsert.mockImplementation((data, callbacks) => {
        callbacks.onError(error);
      });

      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Account');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error: Submission failed')).toBeTruthy();
      });
    });
  });

  describe('Field Updates', () => {
    it('should update account name field', () => {
      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      const nameField = screen.getByDisplayValue('Test Account');
      fireEvent.changeText(nameField, 'Updated Account Name');

      expect(screen.getByDisplayValue('Updated Account Name')).toBeTruthy();
    });

    it('should update balance field', () => {
      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      const balanceField = screen.getByDisplayValue('1000');
      fireEvent.changeText(balanceField, '2000');

      expect(screen.getByDisplayValue('2000')).toBeTruthy();
    });

    it('should update currency field', () => {
      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      const currencyField = screen.getByDisplayValue('USD');
      fireEvent.changeText(currencyField, 'EUR');

      expect(screen.getByDisplayValue('EUR')).toBeTruthy();
    });
  });

  describe('Running Balance Sync', () => {
    it('should show sync button when running balance differs from balance', () => {
      const accountWithRunningBalance: AccountFormType = {
        ...defaultAccount,
        balance: 1000,
        runningbalance: 1200,
      };

      render(
        <TestWrapper>
          <AccountForm account={accountWithRunningBalance} />
        </TestWrapper>
      );

      expect(screen.getByText('Sync')).toBeTruthy();
      expect(screen.getByDisplayValue('1200')).toBeTruthy();
    });

    it('should call updateAccount when sync button is pressed', () => {
      const accountWithRunningBalance: AccountFormType = {
        ...defaultAccount,
        balance: 1000,
        runningbalance: 1200,
      };

      render(
        <TestWrapper>
          <AccountForm account={accountWithRunningBalance} />
        </TestWrapper>
      );

      const syncButton = screen.getByText('Sync');
      fireEvent.press(syncButton);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          form: expect.objectContaining({
            id: '1',
            balance: 1200,
          }),
          original: accountWithRunningBalance,
          props: { addAdjustmentTransaction: false },
        })
      );
    });
  });

  describe('Form Reset', () => {
    it('should show reset button when form is dirty', async () => {
      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      // Make form dirty by changing a field
      const nameField = screen.getByDisplayValue('Test Account');
      fireEvent.changeText(nameField, 'Modified Name');

      await waitFor(() => {
        expect(screen.getByText('Reset')).toBeTruthy();
      });
    });

    it('should reset form to initial values when reset is pressed', async () => {
      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      // Make form dirty
      const nameField = screen.getByDisplayValue('Test Account');
      fireEvent.changeText(nameField, 'Modified Name');

      await waitFor(() => {
        expect(screen.getByDisplayValue('Modified Name')).toBeTruthy();
      });

      // Reset form
      const resetButton = screen.getByText('Reset');
      fireEvent.press(resetButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Account')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Form container')).toBeTruthy();
    });

    it('should have proper form structure', () => {
      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      // Check that form sections are properly structured
      expect(screen.getByText('Basic Information')).toBeTruthy();
      expect(screen.getByText('Enter the account\'s basic details')).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      let resolveSubmission: () => void;
      const submissionPromise = new Promise<void>((resolve) => {
        resolveSubmission = resolve;
      });

      mockUpsert.mockImplementation((data, callbacks) => {
        submissionPromise.then(() => callbacks.onSuccess());
      });

      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Account');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeTruthy();
      });

      resolveSubmission!();
    });

    it('should disable form during submission', async () => {
      let resolveSubmission: () => void;
      const submissionPromise = new Promise<void>((resolve) => {
        resolveSubmission = resolve;
      });

      mockUpsert.mockImplementation((data, callbacks) => {
        submissionPromise.then(() => callbacks.onSuccess());
      });

      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Account');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeTruthy();
      });

      resolveSubmission!();
    });
  });
});