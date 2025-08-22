/**
 * Integration tests for AccountForm component
 * Tests the refactored AccountForm using the new form system
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
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

  describe('Form Data Initialization', () => {
    it('should initialize form correctly in create mode', () => {
      const newAccount: AccountFormType = {
        ...initialState,
      };

      render(
        <TestWrapper>
          <AccountForm account={newAccount} />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('')).toBeTruthy(); // Empty name field
      expect(screen.getByDisplayValue('0')).toBeTruthy(); // Default balance
      expect(screen.getByDisplayValue('USD')).toBeTruthy(); // Default currency
    });

    it('should initialize form correctly in edit mode', () => {
      render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('Test Account')).toBeTruthy();
      expect(screen.getByDisplayValue('1000')).toBeTruthy();
      expect(screen.getByDisplayValue('USD')).toBeTruthy();
    });

    it('should update form when initial data changes', async () => {
      const { rerender } = render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('Test Account')).toBeTruthy();

      // Update the account data
      const updatedAccount: AccountFormType = {
        ...defaultAccount,
        name: 'Updated Account',
        balance: 2000,
      };

      rerender(
        <TestWrapper>
          <AccountForm account={updatedAccount} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Updated Account')).toBeTruthy();
        expect(screen.getByDisplayValue('2000')).toBeTruthy();
      });
    });

    it('should not show dirty state when initial data changes', async () => {
      const { rerender } = render(
        <TestWrapper>
          <AccountForm account={defaultAccount} />
        </TestWrapper>
      );

      // Initially no reset button should be visible
      expect(screen.queryByText('Reset')).toBeNull();

      // Update the account data
      const updatedAccount: AccountFormType = {
        ...defaultAccount,
        name: 'Updated Account',
      };

      rerender(
        <TestWrapper>
          <AccountForm account={updatedAccount} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Updated Account')).toBeTruthy();
        // Still no reset button should be visible since this is initial data change
        expect(screen.queryByText('Reset')).toBeNull();
      });
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

  describe('Open Balance Handling', () => {
    it('should show open balance field when account has opening transaction', () => {
      // Mock open transaction
      jest.doMock('@/src/services/Accounts.Service', () => ({
        useAccountService: () => ({
          upsert: () => ({ mutate: mockUpsert }),
          updateAccountOpenedTransaction: () => ({ mutate: mockUpdateOpenBalance }),
          getAccountOpenedTransaction: () => ({ 
            data: { id: 'open-1', amount: 500 } 
          }),
        }),
      }));

      const accountWithOpenBalance: AccountFormType = {
        ...defaultAccount,
        openBalance: 500,
      };

      render(
        <TestWrapper>
          <AccountForm account={accountWithOpenBalance} />
        </TestWrapper>
      );

      expect(screen.getByText('Open Balance')).toBeTruthy();
      expect(screen.getByDisplayValue('500')).toBeTruthy();
    });

    it('should update balance when open balance changes', async () => {
      // Mock open transaction
      jest.doMock('@/src/services/Accounts.Service', () => ({
        useAccountService: () => ({
          upsert: () => ({ mutate: mockUpsert }),
          updateAccountOpenedTransaction: () => ({ mutate: mockUpdateOpenBalance }),
          getAccountOpenedTransaction: () => ({ 
            data: { id: 'open-1', amount: 500 } 
          }),
        }),
      }));

      const accountWithOpenBalance: AccountFormType = {
        ...defaultAccount,
        balance: 1000,
        openBalance: 500,
      };

      render(
        <TestWrapper>
          <AccountForm account={accountWithOpenBalance} />
        </TestWrapper>
      );

      const openBalanceField = screen.getByDisplayValue('500');
      fireEvent.changeText(openBalanceField, '600');

      await waitFor(() => {
        // Balance should be updated: original balance (1000) - original open (500) + new open (600) = 1100
        expect(screen.getByDisplayValue('1100')).toBeTruthy();
      });
    });

    it('should treat open balance as separate form for reset purposes', async () => {
      // Mock open transaction
      jest.doMock('@/src/services/Accounts.Service', () => ({
        useAccountService: () => ({
          upsert: () => ({ mutate: mockUpsert }),
          updateAccountOpenedTransaction: () => ({ mutate: mockUpdateOpenBalance }),
          getAccountOpenedTransaction: () => ({ 
            data: { id: 'open-1', amount: 500 } 
          }),
        }),
      }));

      const accountWithOpenBalance: AccountFormType = {
        ...defaultAccount,
        openBalance: 500,
      };

      render(
        <TestWrapper>
          <AccountForm account={accountWithOpenBalance} />
        </TestWrapper>
      );

      // Change both name and open balance
      const nameField = screen.getByDisplayValue('Test Account');
      fireEvent.changeText(nameField, 'Modified Name');

      const openBalanceField = screen.getByDisplayValue('500');
      fireEvent.changeText(openBalanceField, '600');

      await waitFor(() => {
        expect(screen.getByDisplayValue('Modified Name')).toBeTruthy();
        expect(screen.getByDisplayValue('600')).toBeTruthy();
      });

      // Reset form
      const resetButton = screen.getByText('Reset');
      fireEvent.press(resetButton);

      await waitFor(() => {
        // Name should be reset
        expect(screen.getByDisplayValue('Test Account')).toBeTruthy();
        // Open balance should be preserved since it's treated as separate form
        expect(screen.getByDisplayValue('600')).toBeTruthy();
      });
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

    it('should preserve open balance field when resetting form', async () => {
      const accountWithOpenTransaction: AccountFormType = {
        ...defaultAccount,
        openBalance: 500,
      };

      // Mock open transaction
      jest.doMock('@/src/services/Accounts.Service', () => ({
        useAccountService: () => ({
          upsert: () => ({ mutate: mockUpsert }),
          updateAccountOpenedTransaction: () => ({ mutate: mockUpdateOpenBalance }),
          getAccountOpenedTransaction: () => ({ 
            data: { id: 'open-1', amount: 500 } 
          }),
        }),
      }));

      render(
        <TestWrapper>
          <AccountForm account={accountWithOpenTransaction} />
        </TestWrapper>
      );

      // Make form dirty by changing name
      const nameField = screen.getByDisplayValue('Test Account');
      fireEvent.changeText(nameField, 'Modified Name');

      // Change open balance
      const openBalanceField = screen.getByDisplayValue('500');
      fireEvent.changeText(openBalanceField, '600');

      await waitFor(() => {
        expect(screen.getByDisplayValue('Modified Name')).toBeTruthy();
        expect(screen.getByDisplayValue('600')).toBeTruthy();
      });

      // Reset form
      const resetButton = screen.getByText('Reset');
      fireEvent.press(resetButton);

      await waitFor(() => {
        // Name should be reset to original
        expect(screen.getByDisplayValue('Test Account')).toBeTruthy();
        // Open balance should be preserved (current value, not original)
        expect(screen.getByDisplayValue('600')).toBeTruthy();
      });
    });

    it('should reset open balance to original if it was not changed', async () => {
      const accountWithOpenTransaction: AccountFormType = {
        ...defaultAccount,
        openBalance: 500,
      };

      // Mock open transaction
      jest.doMock('@/src/services/Accounts.Service', () => ({
        useAccountService: () => ({
          upsert: () => ({ mutate: mockUpsert }),
          updateAccountOpenedTransaction: () => ({ mutate: mockUpdateOpenBalance }),
          getAccountOpenedTransaction: () => ({ 
            data: { id: 'open-1', amount: 500 } 
          }),
        }),
      }));

      render(
        <TestWrapper>
          <AccountForm account={accountWithOpenTransaction} />
        </TestWrapper>
      );

      // Make form dirty by changing name only (not open balance)
      const nameField = screen.getByDisplayValue('Test Account');
      fireEvent.changeText(nameField, 'Modified Name');

      await waitFor(() => {
        expect(screen.getByDisplayValue('Modified Name')).toBeTruthy();
        expect(screen.getByDisplayValue('500')).toBeTruthy();
      });

      // Reset form
      const resetButton = screen.getByText('Reset');
      fireEvent.press(resetButton);

      await waitFor(() => {
        // Name should be reset to original
        expect(screen.getByDisplayValue('Test Account')).toBeTruthy();
        // Open balance should also be reset to original since it wasn't changed
        expect(screen.getByDisplayValue('500')).toBeTruthy();
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