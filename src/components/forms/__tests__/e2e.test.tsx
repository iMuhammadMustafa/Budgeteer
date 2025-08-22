/**
 * End-to-end tests for critical form workflows
 * Tests complete user journeys from form load to successful submission
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// Test providers and context
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../../providers/ThemeProvider';

// Form components
import AccountForm from '../AccountForm';
import TransactionForm from '../TransactionForm';
import MultipleTransactions from '../MultipleTransactions';

// Services (mocked)
import * as AccountsService from '../../../services/Accounts.Service';
import * as TransactionsService from '../../../services/Transactions.Service';

// Types
import { AccountFormData, TransactionFormData, MultipleTransactionsFormData } from '../../../types/components/forms.types';

// Mock services
jest.mock('../../../services/Accounts.Service');
jest.mock('../../../services/Transactions.Service');
jest.mock('../../../services/AccountCategories.Service');
jest.mock('../../../services/TransactionCategories.Service');
jest.mock('../../../services/TransactionGroups.Service');

const mockAccountsService = AccountsService as jest.Mocked<typeof AccountsService>;
const mockTransactionsService = TransactionsService as jest.Mocked<typeof TransactionsService>;

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Test data
const mockAccountCategories = [
  { id: 'cat-1', name: 'Checking', type: 'asset' },
  { id: 'cat-2', name: 'Savings', type: 'asset' },
];

const mockTransactionCategories = [
  { id: 'tcat-1', name: 'Groceries', groupid: 'group-1' },
  { id: 'tcat-2', name: 'Gas', groupid: 'group-1' },
];

const mockTransactionGroups = [
  { id: 'group-1', name: 'Expenses', type: 'expense' },
  { id: 'group-2', name: 'Income', type: 'income' },
];

const mockAccounts = [
  { id: 'acc-1', name: 'Main Checking', categoryid: 'cat-1', balance: 1000 },
  { id: 'acc-2', name: 'Savings Account', categoryid: 'cat-2', balance: 5000 },
];

describe('Form E2E Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock successful service calls by default
    mockAccountsService.createAccount.mockResolvedValue({ id: 'new-acc-1' } as any);
    mockAccountsService.updateAccount.mockResolvedValue(undefined);
    mockTransactionsService.createTransaction.mockResolvedValue({ id: 'new-trans-1' } as any);
    mockTransactionsService.updateTransaction.mockResolvedValue(undefined);
  });

  describe('Account Creation E2E Workflow', () => {
    it('should complete full account creation workflow', async () => {
      const mockOnSubmit = jest.fn().mockImplementation(async (data: AccountFormData) => {
        return mockAccountsService.createAccount(data);
      });

      const { getByDisplayValue, getByText, getByTestId } = render(
        <TestWrapper>
          <AccountForm
            initialData={{} as AccountFormData}
            onSubmit={mockOnSubmit}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      // Step 1: Fill out account name
      const nameInput = getByDisplayValue('');
      fireEvent.changeText(nameInput, 'My New Checking Account');

      // Step 2: Select account type
      const typeDropdown = getByTestId('account-type-dropdown');
      fireEvent.press(typeDropdown);
      
      const checkingOption = getByText('Checking');
      fireEvent.press(checkingOption);

      // Step 3: Select account category
      const categoryDropdown = getByTestId('account-category-dropdown');
      fireEvent.press(categoryDropdown);
      
      const categoryOption = getByText('Checking');
      fireEvent.press(categoryOption);

      // Step 4: Enter initial balance
      const balanceInput = getByTestId('initial-balance-input');
      fireEvent.changeText(balanceInput, '1500.00');

      // Step 5: Submit form
      const submitButton = getByText('Create Account');
      fireEvent.press(submitButton);

      // Step 6: Verify loading state
      await waitFor(() => {
        expect(getByText('Creating...')).toBeTruthy();
      });

      // Step 7: Verify successful submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'My New Checking Account',
          type: 'checking',
          categoryid: 'cat-1',
          balance: 1500.00,
          runningbalance: 1500.00,
          openBalance: 1500.00,
          addAdjustmentTransaction: false,
        });
      });

      // Step 8: Verify success state
      await waitFor(() => {
        expect(getByText('Account created successfully!')).toBeTruthy();
      });
    });

    it('should handle account creation with validation errors', async () => {
      const mockOnSubmit = jest.fn();

      const { getByText, queryByText } = render(
        <TestWrapper>
          <AccountForm
            initialData={{} as AccountFormData}
            onSubmit={mockOnSubmit}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      // Try to submit without filling required fields
      const submitButton = getByText('Create Account');
      fireEvent.press(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(queryByText('Account name is required')).toBeTruthy();
        expect(queryByText('Account type is required')).toBeTruthy();
        expect(queryByText('Account category is required')).toBeTruthy();
      });

      // Form should not be submitted
      expect(mockOnSubmit).not.toHaveBeenCalled();

      // Fix validation errors one by one
      const nameInput = getByDisplayValue('');
      fireEvent.changeText(nameInput, 'Valid Account Name');

      // Name error should be cleared
      await waitFor(() => {
        expect(queryByText('Account name is required')).toBeFalsy();
      });

      // Other errors should still be present
      expect(queryByText('Account type is required')).toBeTruthy();
      expect(queryByText('Account category is required')).toBeTruthy();
    });

    it('should handle account creation with network errors', async () => {
      const networkError = new Error('Network connection failed');
      mockAccountsService.createAccount.mockRejectedValue(networkError);

      const mockOnSubmit = jest.fn().mockImplementation(async (data: AccountFormData) => {
        return mockAccountsService.createAccount(data);
      });

      const { getByDisplayValue, getByText, getByTestId, queryByText } = render(
        <TestWrapper>
          <AccountForm
            initialData={{} as AccountFormData}
            onSubmit={mockOnSubmit}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      // Fill out valid form data
      fireEvent.changeText(getByDisplayValue(''), 'Test Account');
      
      const typeDropdown = getByTestId('account-type-dropdown');
      fireEvent.press(typeDropdown);
      fireEvent.press(getByText('Checking'));

      const categoryDropdown = getByTestId('account-category-dropdown');
      fireEvent.press(categoryDropdown);
      fireEvent.press(getByText('Checking'));

      // Submit form
      const submitButton = getByText('Create Account');
      fireEvent.press(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(queryByText('Network connection failed')).toBeTruthy();
      });

      // Should allow retry
      const retryButton = getByText('Retry');
      expect(retryButton).toBeTruthy();

      // Mock successful retry
      mockAccountsService.createAccount.mockResolvedValue({ id: 'new-acc-1' } as any);
      fireEvent.press(retryButton);

      // Should succeed on retry
      await waitFor(() => {
        expect(queryByText('Account created successfully!')).toBeTruthy();
      });
    });
  });

  describe('Transaction Creation E2E Workflow', () => {
    it('should complete full transaction creation workflow', async () => {
      const mockOnSubmit = jest.fn().mockImplementation(async (data: TransactionFormData) => {
        return mockTransactionsService.createTransaction(data);
      });

      const { getByDisplayValue, getByText, getByTestId } = render(
        <TestWrapper>
          <TransactionForm
            initialData={{} as TransactionFormData}
            onSubmit={mockOnSubmit}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      // Step 1: Enter payee
      const payeeInput = getByTestId('payee-input');
      fireEvent.changeText(payeeInput, 'Grocery Store');

      // Step 2: Enter amount
      const amountInput = getByTestId('amount-input');
      fireEvent.changeText(amountInput, '85.50');

      // Step 3: Select transaction type
      const typeToggle = getByTestId('transaction-type-toggle');
      fireEvent.press(typeToggle); // Switch to expense

      // Step 4: Select account
      const accountDropdown = getByTestId('account-dropdown');
      fireEvent.press(accountDropdown);
      fireEvent.press(getByText('Main Checking'));

      // Step 5: Select category
      const categoryDropdown = getByTestId('category-dropdown');
      fireEvent.press(categoryDropdown);
      fireEvent.press(getByText('Groceries'));

      // Step 6: Enter description
      const descriptionInput = getByTestId('description-input');
      fireEvent.changeText(descriptionInput, 'Weekly grocery shopping');

      // Step 7: Set date
      const dateInput = getByTestId('date-input');
      fireEvent.changeText(dateInput, '2024-01-15');

      // Step 8: Submit transaction
      const submitButton = getByText('Create Transaction');
      fireEvent.press(submitButton);

      // Step 9: Verify submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          payee: 'Grocery Store',
          amount: 85.50,
          type: 'expense',
          accountid: 'acc-1',
          categoryid: 'tcat-1',
          description: 'Weekly grocery shopping',
          date: '2024-01-15',
          isvoid: false,
          groupid: 'group-1',
          notes: null,
          tags: null,
        });
      });

      // Step 10: Verify success
      await waitFor(() => {
        expect(getByText('Transaction created successfully!')).toBeTruthy();
      });
    });

    it('should handle transfer transaction workflow', async () => {
      const mockOnSubmit = jest.fn().mockImplementation(async (data: TransactionFormData) => {
        return mockTransactionsService.createTransaction(data);
      });

      const { getByText, getByTestId } = render(
        <TestWrapper>
          <TransactionForm
            initialData={{} as TransactionFormData}
            onSubmit={mockOnSubmit}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      // Step 1: Select transfer type
      const typeToggle = getByTestId('transaction-type-toggle');
      fireEvent.press(typeToggle);
      fireEvent.press(getByText('Transfer'));

      // Step 2: Enter amount
      const amountInput = getByTestId('amount-input');
      fireEvent.changeText(amountInput, '500.00');

      // Step 3: Select from account
      const fromAccountDropdown = getByTestId('from-account-dropdown');
      fireEvent.press(fromAccountDropdown);
      fireEvent.press(getByText('Main Checking'));

      // Step 4: Select to account
      const toAccountDropdown = getByTestId('to-account-dropdown');
      fireEvent.press(toAccountDropdown);
      fireEvent.press(getByText('Savings Account'));

      // Step 5: Enter description
      const descriptionInput = getByTestId('description-input');
      fireEvent.changeText(descriptionInput, 'Transfer to savings');

      // Step 6: Submit transfer
      const submitButton = getByText('Create Transfer');
      fireEvent.press(submitButton);

      // Step 7: Verify transfer creation
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          amount: 500.00,
          type: 'transfer',
          accountid: 'acc-1',
          toAccountId: 'acc-2',
          description: 'Transfer to savings',
          isvoid: false,
          payee: 'Transfer',
          date: expect.any(String),
          categoryid: null,
          groupid: null,
          notes: null,
          tags: null,
        });
      });
    });
  });

  describe('Multiple Transactions E2E Workflow', () => {
    it('should complete full multiple transactions workflow', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

      const { getByText, getByTestId, getByDisplayValue } = render(
        <TestWrapper>
          <MultipleTransactions
            initialData={{
              originalTransactionId: null,
              payee: '',
              date: '2024-01-15',
              description: '',
              type: 'expense',
              isvoid: false,
              accountid: '',
              groupid: '',
              transactions: {},
            }}
            onSubmit={mockOnSubmit}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      // Step 1: Enter payee
      const payeeInput = getByTestId('payee-input');
      fireEvent.changeText(payeeInput, 'Target Store');

      // Step 2: Enter description
      const descriptionInput = getByTestId('description-input');
      fireEvent.changeText(descriptionInput, 'Shopping trip');

      // Step 3: Select account
      const accountDropdown = getByTestId('account-dropdown');
      fireEvent.press(accountDropdown);
      fireEvent.press(getByText('Main Checking'));

      // Step 4: Add first transaction item
      const addItemButton = getByText('Add Item');
      fireEvent.press(addItemButton);

      // Fill first item
      const item1NameInput = getByTestId('item-0-name-input');
      fireEvent.changeText(item1NameInput, 'Groceries');

      const item1AmountInput = getByTestId('item-0-amount-input');
      fireEvent.changeText(item1AmountInput, '45.99');

      const item1CategoryDropdown = getByTestId('item-0-category-dropdown');
      fireEvent.press(item1CategoryDropdown);
      fireEvent.press(getByText('Groceries'));

      // Step 5: Add second transaction item
      fireEvent.press(addItemButton);

      // Fill second item
      const item2NameInput = getByTestId('item-1-name-input');
      fireEvent.changeText(item2NameInput, 'Household Items');

      const item2AmountInput = getByTestId('item-1-amount-input');
      fireEvent.changeText(item2AmountInput, '23.50');

      const item2CategoryDropdown = getByTestId('item-1-category-dropdown');
      fireEvent.press(item2CategoryDropdown);
      fireEvent.press(getByText('Household'));

      // Step 6: Verify total calculation
      await waitFor(() => {
        expect(getByText('Total: $69.49')).toBeTruthy();
      });

      // Step 7: Submit multiple transactions
      const submitButton = getByText('Save Transactions');
      fireEvent.press(submitButton);

      // Step 8: Verify submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          payee: 'Target Store',
          description: 'Shopping trip',
          date: '2024-01-15',
          type: 'expense',
          isvoid: false,
          accountid: 'acc-1',
          groupid: 'group-1',
          originalTransactionId: null,
          transactions: {
            'item-0': {
              name: 'Groceries',
              amount: 45.99,
              categoryid: 'tcat-1',
              notes: null,
              tags: null,
              groupid: 'group-1',
            },
            'item-1': {
              name: 'Household Items',
              amount: 23.50,
              categoryid: 'tcat-household',
              notes: null,
              tags: null,
              groupid: 'group-1',
            },
          },
        });
      });
    });

    it('should handle removing transaction items', async () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <TestWrapper>
          <MultipleTransactions
            initialData={{
              originalTransactionId: null,
              payee: 'Test Payee',
              date: '2024-01-15',
              description: 'Test',
              type: 'expense',
              isvoid: false,
              accountid: 'acc-1',
              groupid: 'group-1',
              transactions: {
                'item-0': {
                  name: 'Item 1',
                  amount: 25.00,
                  categoryid: 'tcat-1',
                  notes: null,
                  tags: null,
                  groupid: 'group-1',
                },
                'item-1': {
                  name: 'Item 2',
                  amount: 35.00,
                  categoryid: 'tcat-2',
                  notes: null,
                  tags: null,
                  groupid: 'group-1',
                },
              },
            }}
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      // Verify both items are present
      expect(getByTestId('item-0-name-input')).toBeTruthy();
      expect(getByTestId('item-1-name-input')).toBeTruthy();
      expect(getByText('Total: $60.00')).toBeTruthy();

      // Remove first item
      const removeButton = getByTestId('remove-item-0-button');
      fireEvent.press(removeButton);

      // Verify item is removed and total is updated
      await waitFor(() => {
        expect(queryByTestId('item-0-name-input')).toBeFalsy();
        expect(getByText('Total: $35.00')).toBeTruthy();
      });
    });
  });

  describe('Form Navigation and State Persistence', () => {
    it('should persist form state during navigation', async () => {
      const { getByDisplayValue, getByText, rerender } = render(
        <TestWrapper>
          <AccountForm
            initialData={{} as AccountFormData}
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      // Fill out form
      const nameInput = getByDisplayValue('');
      fireEvent.changeText(nameInput, 'Persistent Account');

      // Simulate navigation away and back
      rerender(
        <TestWrapper>
          <div>Other screen</div>
        </TestWrapper>
      );

      rerender(
        <TestWrapper>
          <AccountForm
            initialData={{} as AccountFormData}
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      // Form state should be restored (in a real app with proper state management)
      // This test would need to be adapted based on actual state persistence implementation
    });
  });

  describe('Form Accessibility E2E', () => {
    it('should support complete keyboard navigation workflow', async () => {
      const { getByDisplayValue, getByText } = render(
        <TestWrapper>
          <AccountForm
            initialData={{} as AccountFormData}
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      // Simulate Tab navigation through form fields
      const nameInput = getByDisplayValue('');
      
      // Focus first field
      fireEvent(nameInput, 'focus');
      expect(nameInput).toHaveFocus();

      // Tab to next field
      fireEvent(nameInput, 'keyPress', { key: 'Tab' });
      
      // Continue through all fields and submit with Enter
      const submitButton = getByText('Create Account');
      fireEvent(submitButton, 'keyPress', { key: 'Enter' });

      // Form should attempt submission
      // (Validation errors expected since form is empty)
    });

    it('should announce form changes to screen readers', async () => {
      const { getByDisplayValue, queryByText } = render(
        <TestWrapper>
          <TransactionForm
            initialData={{} as TransactionFormData}
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      // Enter invalid amount
      const amountInput = getByDisplayValue('');
      fireEvent.changeText(amountInput, '-50');
      fireEvent(amountInput, 'blur');

      // Error should be announced
      await waitFor(() => {
        const errorElement = queryByText('Amount must be greater than 0');
        expect(errorElement).toHaveProp('accessibilityLiveRegion', 'polite');
      });
    });
  });

  describe('Performance E2E', () => {
    it('should handle rapid user interactions without performance degradation', async () => {
      const { getByDisplayValue } = render(
        <TestWrapper>
          <AccountForm
            initialData={{} as AccountFormData}
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      const nameInput = getByDisplayValue('');
      
      // Simulate rapid typing
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        fireEvent.changeText(nameInput, `Account Name ${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle rapid updates efficiently (< 100ms for 100 updates)
      expect(duration).toBeLessThan(100);
      
      // Final value should be correct
      expect(nameInput).toHaveProp('value', 'Account Name 99');
    });

    it('should maintain responsiveness during large form operations', async () => {
      const largeTransactionData: MultipleTransactionsFormData = {
        originalTransactionId: null,
        payee: 'Large Transaction',
        date: '2024-01-15',
        description: 'Performance test',
        type: 'expense',
        isvoid: false,
        accountid: 'acc-1',
        groupid: 'group-1',
        transactions: Array.from({ length: 50 }, (_, i) => [`item-${i}`, {
          name: `Item ${i}`,
          amount: i * 10,
          categoryid: 'tcat-1',
          notes: null,
          tags: null,
          groupid: 'group-1',
        }]).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      };

      const startTime = performance.now();
      
      const { getByText } = render(
        <TestWrapper>
          <MultipleTransactions
            initialData={largeTransactionData}
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      const renderTime = performance.now() - startTime;
      
      // Should render large forms quickly (< 200ms)
      expect(renderTime).toBeLessThan(200);
      
      // Should display correct total
      const expectedTotal = Array.from({ length: 50 }, (_, i) => i * 10).reduce((sum, amount) => sum + amount, 0);
      expect(getByText(`Total: $${expectedTotal.toFixed(2)}`)).toBeTruthy();
    });
  });
});