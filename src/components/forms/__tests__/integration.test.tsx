/**
 * Integration tests for all refactored form components
 * Tests complete form workflows, validation, submission, and user interactions
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// Form components
import AccountForm from '../AccountForm';
import AccountCategoryForm from '../AccountCategoryForm';
import ConfigurationForm from '../ConfigurationForm';
import TransactionForm from '../TransactionForm';
import TransactionCategoryForm from '../TransactionCategoryForm';
import TransactionGroupForm from '../TransactionGroupForm';
import MultipleTransactions from '../MultipleTransactions';

// Types
import {
  AccountFormData,
  AccountCategoryFormData,
  ConfigurationFormData,
  TransactionFormData,
  TransactionCategoryFormData,
  TransactionGroupFormData,
  MultipleTransactionsFormData,
} from '../../../types/components/forms.types';

// Mock dependencies
jest.mock('../../../providers/QueryProvider', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

jest.mock('../../../services/Accounts.Service', () => ({
  createAccount: jest.fn(),
  updateAccount: jest.fn(),
}));

jest.mock('../../../services/AccountCategories.Service', () => ({
  createAccountCategory: jest.fn(),
  updateAccountCategory: jest.fn(),
}));

jest.mock('../../../services/Configurations.Service', () => ({
  updateConfiguration: jest.fn(),
}));

jest.mock('../../../services/Transactions.Service', () => ({
  createTransaction: jest.fn(),
  updateTransaction: jest.fn(),
}));

jest.mock('../../../services/TransactionCategories.Service', () => ({
  createTransactionCategory: jest.fn(),
  updateTransactionCategory: jest.fn(),
}));

jest.mock('../../../services/TransactionGroups.Service', () => ({
  createTransactionGroup: jest.fn(),
  updateTransactionGroup: jest.fn(),
}));

// Test data
const mockAccountData: AccountFormData = {
  name: 'Test Account',
  type: 'checking',
  categoryid: 'cat-1',
  balance: 1000,
  runningbalance: 1000,
  openBalance: 1000,
  addAdjustmentTransaction: false,
};

const mockAccountCategoryData: AccountCategoryFormData = {
  name: 'Test Category',
  type: 'asset',
};

const mockConfigurationData: ConfigurationFormData = {
  name: 'currency',
  value: 'USD',
};

const mockTransactionData: TransactionFormData = {
  payee: 'Test Payee',
  amount: 100,
  date: '2024-01-15',
  description: 'Test transaction',
  type: 'expense',
  isvoid: false,
  accountid: 'acc-1',
  categoryid: 'cat-1',
  groupid: 'group-1',
  notes: null,
  tags: null,
};

const mockTransactionCategoryData: TransactionCategoryFormData = {
  name: 'Test Transaction Category',
  groupid: 'group-1',
  icon: 'shopping-cart',
  color: '#FF5733',
};

const mockTransactionGroupData: TransactionGroupFormData = {
  name: 'Test Group',
  type: 'expense',
  budget: 500,
};

const mockMultipleTransactionsData: MultipleTransactionsFormData = {
  originalTransactionId: null,
  payee: 'Test Payee',
  date: '2024-01-15',
  description: 'Multiple transactions test',
  type: 'expense',
  isvoid: false,
  accountid: 'acc-1',
  groupid: 'group-1',
  transactions: {
    'trans-1': {
      name: 'Item 1',
      amount: 50,
      categoryid: 'cat-1',
      notes: null,
      tags: null,
      groupid: 'group-1',
    },
    'trans-2': {
      name: 'Item 2',
      amount: 30,
      categoryid: 'cat-2',
      notes: null,
      tags: null,
      groupid: 'group-1',
    },
  },
};

describe('Form Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AccountForm Integration', () => {
    it('should render and handle complete create workflow', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnCancel = jest.fn();

      const { getByDisplayValue, getByText } = render(
        <AccountForm
          initialData={{} as AccountFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill out form
      const nameInput = getByDisplayValue('');
      fireEvent.changeText(nameInput, 'New Account');

      // Submit form
      const submitButton = getByText('Create Account');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Account',
          })
        );
      });
    });

    it('should handle edit workflow with existing data', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

      const { getByDisplayValue } = render(
        <AccountForm
          initialData={mockAccountData}
          onSubmit={mockOnSubmit}
          onCancel={jest.fn()}
        />
      );

      // Verify initial data is loaded
      expect(getByDisplayValue('Test Account')).toBeTruthy();

      // Modify data
      const nameInput = getByDisplayValue('Test Account');
      fireEvent.changeText(nameInput, 'Updated Account');

      // Submit form
      const submitButton = getByDisplayValue('Save Changes');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Account',
          })
        );
      });
    });

    it('should validate required fields', async () => {
      const mockOnSubmit = jest.fn();

      const { getByText, queryByText } = render(
        <AccountForm
          initialData={{} as AccountFormData}
          onSubmit={mockOnSubmit}
          onCancel={jest.fn()}
        />
      );

      // Try to submit without filling required fields
      const submitButton = getByText('Create Account');
      fireEvent.press(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(queryByText('Account name is required')).toBeTruthy();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should handle form reset correctly', async () => {
      const { getByDisplayValue, getByText } = render(
        <AccountForm
          initialData={mockAccountData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Modify data
      const nameInput = getByDisplayValue('Test Account');
      fireEvent.changeText(nameInput, 'Modified Name');

      // Reset form
      const resetButton = getByText('Reset');
      fireEvent.press(resetButton);

      // Should revert to original data
      await waitFor(() => {
        expect(getByDisplayValue('Test Account')).toBeTruthy();
      });
    });
  });

  describe('TransactionForm Integration', () => {
    it('should handle transaction creation workflow', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

      const { getByDisplayValue, getByText } = render(
        <TransactionForm
          initialData={{} as TransactionFormData}
          onSubmit={mockOnSubmit}
          onCancel={jest.fn()}
        />
      );

      // Fill out form
      fireEvent.changeText(getByDisplayValue(''), 'Test Payee');
      fireEvent.changeText(getByDisplayValue(''), '100');

      // Submit form
      const submitButton = getByText('Create Transaction');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should handle different transaction types', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

      const { getByText } = render(
        <TransactionForm
          initialData={{ ...mockTransactionData, type: 'income' }}
          onSubmit={mockOnSubmit}
          onCancel={jest.fn()}
        />
      );

      // Verify income type is selected
      expect(getByText('Income')).toBeTruthy();

      // Submit form
      const submitButton = getByText('Save Changes');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'income',
          })
        );
      });
    });

    it('should validate amount field', async () => {
      const mockOnSubmit = jest.fn();

      const { getByDisplayValue, getByText, queryByText } = render(
        <TransactionForm
          initialData={{} as TransactionFormData}
          onSubmit={mockOnSubmit}
          onCancel={jest.fn()}
        />
      );

      // Enter invalid amount
      const amountInput = getByDisplayValue('');
      fireEvent.changeText(amountInput, '-50');

      // Try to submit
      const submitButton = getByText('Create Transaction');
      fireEvent.press(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(queryByText('Amount must be greater than 0')).toBeTruthy();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('MultipleTransactions Integration', () => {
    it('should handle multiple transaction creation', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

      const { getByText, getByDisplayValue } = render(
        <MultipleTransactions
          initialData={mockMultipleTransactionsData}
          onSubmit={mockOnSubmit}
          onCancel={jest.fn()}
        />
      );

      // Verify multiple transaction items are displayed
      expect(getByDisplayValue('Item 1')).toBeTruthy();
      expect(getByDisplayValue('Item 2')).toBeTruthy();

      // Submit form
      const submitButton = getByText('Save Transactions');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(mockMultipleTransactionsData);
      });
    });

    it('should allow adding new transaction items', async () => {
      const { getByText, queryByText } = render(
        <MultipleTransactions
          initialData={{
            ...mockMultipleTransactionsData,
            transactions: {},
          }}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Add new transaction item
      const addButton = getByText('Add Item');
      fireEvent.press(addButton);

      // Should show new transaction item form
      await waitFor(() => {
        expect(queryByText('Item Name')).toBeTruthy();
      });
    });

    it('should calculate total amount correctly', async () => {
      const { getByText } = render(
        <MultipleTransactions
          initialData={mockMultipleTransactionsData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Should display correct total (50 + 30 = 80)
      expect(getByText('Total: $80.00')).toBeTruthy();
    });
  });

  describe('Form Validation Integration', () => {
    it('should show field-level validation errors', async () => {
      const { getByDisplayValue, getByText, queryByText } = render(
        <AccountCategoryForm
          initialData={{} as AccountCategoryFormData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Enter invalid data
      const nameInput = getByDisplayValue('');
      fireEvent.changeText(nameInput, 'A'); // Too short

      // Blur field to trigger validation
      fireEvent(nameInput, 'blur');

      // Should show validation error
      await waitFor(() => {
        expect(queryByText('Category name must be at least 2 characters')).toBeTruthy();
      });
    });

    it('should clear validation errors when field becomes valid', async () => {
      const { getByDisplayValue, queryByText } = render(
        <TransactionGroupForm
          initialData={{} as TransactionGroupFormData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Enter invalid data
      const nameInput = getByDisplayValue('');
      fireEvent.changeText(nameInput, ''); // Required field empty

      // Should show error
      await waitFor(() => {
        expect(queryByText('Group name is required')).toBeTruthy();
      });

      // Fix the error
      fireEvent.changeText(nameInput, 'Valid Group Name');

      // Error should be cleared
      await waitFor(() => {
        expect(queryByText('Group name is required')).toBeFalsy();
      });
    });
  });

  describe('Form Loading States', () => {
    it('should show loading state during submission', async () => {
      let resolveSubmit: () => void;
      const mockOnSubmit = jest.fn(() => new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      }));

      const { getByText, queryByText } = render(
        <ConfigurationForm
          initialData={mockConfigurationData}
          onSubmit={mockOnSubmit}
          onCancel={jest.fn()}
        />
      );

      // Submit form
      const submitButton = getByText('Save Configuration');
      fireEvent.press(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(queryByText('Saving...')).toBeTruthy();
      });

      // Complete submission
      await act(async () => {
        resolveSubmit!();
      });

      // Loading state should be cleared
      await waitFor(() => {
        expect(queryByText('Saving...')).toBeFalsy();
      });
    });

    it('should disable form during loading', async () => {
      let resolveSubmit: () => void;
      const mockOnSubmit = jest.fn(() => new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      }));

      const { getByText, getByDisplayValue } = render(
        <TransactionCategoryForm
          initialData={mockTransactionCategoryData}
          onSubmit={mockOnSubmit}
          onCancel={jest.fn()}
        />
      );

      // Submit form
      const submitButton = getByText('Save Category');
      fireEvent.press(submitButton);

      // Form fields should be disabled
      const nameInput = getByDisplayValue('Test Transaction Category');
      expect(nameInput).toHaveProp('editable', false);

      // Complete submission
      await act(async () => {
        resolveSubmit!();
      });
    });
  });

  describe('Form Error Handling', () => {
    it('should display submission errors', async () => {
      const error = new Error('Submission failed');
      const mockOnSubmit = jest.fn().mockRejectedValue(error);

      const { getByText, queryByText } = render(
        <AccountForm
          initialData={mockAccountData}
          onSubmit={mockOnSubmit}
          onCancel={jest.fn()}
        />
      );

      // Submit form
      const submitButton = getByText('Save Changes');
      fireEvent.press(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(queryByText('Submission failed')).toBeTruthy();
      });
    });

    it('should allow error recovery', async () => {
      const error = new Error('Network error');
      const mockOnSubmit = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);

      const { getByText, queryByText } = render(
        <TransactionForm
          initialData={mockTransactionData}
          onSubmit={mockOnSubmit}
          onCancel={jest.fn()}
        />
      );

      // First submission fails
      const submitButton = getByText('Save Changes');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(queryByText('Network error')).toBeTruthy();
      });

      // Retry submission
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(queryByText('Network error')).toBeFalsy();
      });

      expect(mockOnSubmit).toHaveBeenCalledTimes(2);
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = render(
        <AccountForm
          initialData={mockAccountData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(getByLabelText('Account Name')).toBeTruthy();
      expect(getByLabelText('Account Type')).toBeTruthy();
      expect(getByLabelText('Initial Balance')).toBeTruthy();
    });

    it('should announce validation errors to screen readers', async () => {
      const { getByDisplayValue, queryByText } = render(
        <TransactionGroupForm
          initialData={{} as TransactionGroupFormData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Trigger validation error
      const nameInput = getByDisplayValue('');
      fireEvent.changeText(nameInput, '');
      fireEvent(nameInput, 'blur');

      // Error should have accessibility attributes
      await waitFor(() => {
        const errorElement = queryByText('Group name is required');
        expect(errorElement).toHaveProp('accessibilityLiveRegion', 'polite');
      });
    });
  });

  describe('Form Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      let renderCount = 0;
      const TestWrapper = () => {
        renderCount++;
        return (
          <AccountCategoryForm
            initialData={mockAccountCategoryData}
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
          />
        );
      };

      const { rerender } = render(<TestWrapper />);
      const initialRenderCount = renderCount;

      // Re-render with same props
      rerender(<TestWrapper />);

      // Should not cause additional renders due to memoization
      expect(renderCount).toBe(initialRenderCount);
    });

    it('should handle large forms efficiently', () => {
      const largeTransactionData = {
        ...mockMultipleTransactionsData,
        transactions: Array.from({ length: 100 }, (_, i) => [`trans-${i}`, {
          name: `Item ${i}`,
          amount: i * 10,
          categoryid: `cat-${i}`,
          notes: null,
          tags: null,
          groupid: 'group-1',
        }]).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      };

      const startTime = performance.now();
      
      render(
        <MultipleTransactions
          initialData={largeTransactionData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const renderTime = performance.now() - startTime;
      
      // Should render large forms in reasonable time (< 100ms)
      expect(renderTime).toBeLessThan(100);
    });
  });
});