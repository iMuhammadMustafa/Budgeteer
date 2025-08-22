/**
 * Integration tests for MultipleTransactions component
 * Tests dynamic transaction list, state management, amount calculations, and performance optimizations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MultipleTransactions, { initialMultipleTransactionsState } from '../MultipleTransactions';
import { TransactionFormType } from '../TransactionForm';
import dayjs from 'dayjs';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('@/src/services/TransactionCategories.Service', () => ({
  useTransactionCategoryService: () => ({
    findAll: () => ({
      data: [
        { id: '1', name: 'Food', icon: 'utensils', color: '#ff6b6b' },
        { id: '2', name: 'Transport', icon: 'car', color: '#4ecdc4' },
        { id: '3', name: 'Entertainment', icon: 'film', color: '#45b7d1' },
      ],
      isLoading: false,
    }),
  }),
}));

jest.mock('@/src/services/Accounts.Service', () => ({
  useAccountService: () => ({
    findAll: () => ({
      data: [
        { id: '1', name: 'Checking Account', categoryname: 'Bank' },
        { id: '2', name: 'Savings Account', categoryname: 'Bank' },
        { id: '3', name: 'Credit Card', categoryname: 'Credit' },
      ],
      isLoading: false,
    }),
  }),
}));

jest.mock('@/src/services/Transactions.Service', () => ({
  useTransactionService: () => ({
    createMultipleTransactionsRepo: () => ({
      mutateAsync: jest.fn().mockResolvedValue({}),
    }),
  }),
}));

jest.mock('@/src/providers/QueryProvider', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
}));

jest.mock('@/src/utils/UUID.Helper', () => {
  let counter = 0;
  return jest.fn(() => `mock-uuid-${++counter}`);
});

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

describe('MultipleTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Initialization', () => {
    it('should render with initial state for new multiple transactions', () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      expect(screen.getByText('Transaction Group Details')).toBeTruthy();
      expect(screen.getByText('Individual Transactions')).toBeTruthy();
      expect(screen.getByText('Summary')).toBeTruthy();
      expect(screen.getByDisplayValue('')).toBeTruthy(); // Payee field
    });

    it('should populate form with existing transaction data', () => {
      const existingTransaction: TransactionFormType = {
        id: '123',
        name: 'Grocery Shopping',
        amount: 150.75,
        type: 'Expense',
        payee: 'Walmart',
        description: 'Weekly groceries',
        date: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
        accountid: '1',
        categoryid: '1',
        notes: 'Test notes',
        tags: ['groceries', 'food'],
        isvoid: false,
        transferid: '',
        transferaccountid: null,
      };

      render(
        <TestWrapper>
          <MultipleTransactions transaction={existingTransaction} />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('Walmart')).toBeTruthy();
      expect(screen.getByDisplayValue('Weekly groceries')).toBeTruthy();
      expect(screen.getByDisplayValue('Grocery Shopping')).toBeTruthy();
    });
  });

  describe('Dynamic Transaction Management', () => {
    it('should add new transaction when Add Transaction button is pressed', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      // Set a total amount first
      const totalAmountInput = screen.getByTestId('totalAmount-input');
      await act(async () => {
        fireEvent.changeText(totalAmountInput, '100');
      });

      const addButton = screen.getByText('Add Transaction');
      
      await act(async () => {
        fireEvent.press(addButton);
      });

      // Should have two transaction cards now
      const transactionCards = screen.getAllByText('Transaction Name');
      expect(transactionCards.length).toBe(2);
    });

    it('should remove transaction when delete button is pressed', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      // Add a second transaction first
      const addButton = screen.getByText('Add Transaction');
      await act(async () => {
        fireEvent.press(addButton);
      });

      // Now delete one transaction
      const deleteButtons = screen.getAllByLabelText('Delete transaction');
      expect(deleteButtons.length).toBe(1); // Only one should be deletable (need at least 1)
      
      await act(async () => {
        fireEvent.press(deleteButtons[0]);
      });

      // Should be back to one transaction
      const transactionCards = screen.getAllByText('Transaction Name');
      expect(transactionCards.length).toBe(1);
    });

    it('should not allow deleting the last transaction', () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      // With only one transaction, delete button should not be present
      const deleteButtons = screen.queryAllByLabelText('Delete transaction');
      expect(deleteButtons.length).toBe(0);
    });
  });

  describe('Amount Calculations', () => {
    it('should calculate current total correctly', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      // Set total amount
      const totalAmountInput = screen.getByTestId('totalAmount-input');
      await act(async () => {
        fireEvent.changeText(totalAmountInput, '100');
      });

      // Set amount for first transaction
      const amountInputs = screen.getAllByTestId('amount-input');
      await act(async () => {
        fireEvent.changeText(amountInputs[0], '60');
      });

      // Add second transaction
      const addButton = screen.getByText('Add Transaction');
      await act(async () => {
        fireEvent.press(addButton);
      });

      // Set amount for second transaction
      const updatedAmountInputs = screen.getAllByTestId('amount-input');
      await act(async () => {
        fireEvent.changeText(updatedAmountInputs[1], '40');
      });

      // Check summary shows correct totals
      expect(screen.getByText('100.00')).toBeTruthy(); // Target total
      expect(screen.getByText('100.00')).toBeTruthy(); // Current total
      expect(screen.getByText('0.00')).toBeTruthy(); // Remaining
    });

    it('should prevent exceeding total amount in individual transactions', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      // Set total amount to 100
      const totalAmountInput = screen.getByTestId('totalAmount-input');
      await act(async () => {
        fireEvent.changeText(totalAmountInput, '100');
      });

      // Try to set first transaction to 150 (exceeds total)
      const amountInputs = screen.getAllByTestId('amount-input');
      await act(async () => {
        fireEvent.changeText(amountInputs[0], '150');
      });

      // Should be limited to available amount (100)
      expect(screen.getByDisplayValue('100')).toBeTruthy();
    });

    it('should handle mode toggle correctly', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      const modeToggle = screen.getByLabelText('Toggle amount sign, currently minus');
      
      await act(async () => {
        fireEvent.press(modeToggle);
      });

      expect(screen.getByLabelText('Toggle amount sign, currently plus')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Multiple Transactions');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Payee is required')).toBeTruthy();
        expect(screen.getByText('Account is required')).toBeTruthy();
      });
    });

    it('should validate that transactions are balanced', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      // Set total amount
      const totalAmountInput = screen.getByTestId('totalAmount-input');
      await act(async () => {
        fireEvent.changeText(totalAmountInput, '100');
      });

      // Set transaction amount to only 50 (unbalanced)
      const amountInputs = screen.getAllByTestId('amount-input');
      await act(async () => {
        fireEvent.changeText(amountInputs[0], '50');
      });

      // Should show unbalanced warning
      expect(screen.getByText('⚠ Transactions need to be balanced')).toBeTruthy();
    });

    it('should show balanced status when amounts match', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      // Set total amount
      const totalAmountInput = screen.getByTestId('totalAmount-input');
      await act(async () => {
        fireEvent.changeText(totalAmountInput, '100');
      });

      // Set transaction amount to match total
      const amountInputs = screen.getAllByTestId('amount-input');
      await act(async () => {
        fireEvent.changeText(amountInputs[0], '100');
      });

      // Should show balanced status
      expect(screen.getByText('✓ Transactions are balanced')).toBeTruthy();
    });
  });

  describe('Transaction Fields', () => {
    it('should update transaction name correctly', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      const nameInput = screen.getByTestId('name-input');
      
      await act(async () => {
        fireEvent.changeText(nameInput, 'Grocery Store');
      });

      expect(screen.getByDisplayValue('Grocery Store')).toBeTruthy();
    });

    it('should update transaction category correctly', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      const categorySelect = screen.getByTestId('categoryid-select');
      
      await act(async () => {
        fireEvent.press(categorySelect);
        fireEvent.press(screen.getByText('Food'));
      });

      expect(screen.getByText('Food')).toBeTruthy();
    });

    it('should handle tags input correctly', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      const tagsInput = screen.getByTestId('tags-input');
      
      await act(async () => {
        fireEvent.changeText(tagsInput, 'groceries,food,weekly');
      });

      expect(screen.getByDisplayValue('groceries,food,weekly')).toBeTruthy();
    });

    it('should handle notes input correctly', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      const notesInput = screen.getByTestId('notes-input');
      
      await act(async () => {
        fireEvent.changeText(notesInput, 'Weekly grocery shopping');
      });

      expect(screen.getByDisplayValue('Weekly grocery shopping')).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with correct data structure', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue({});
      jest.doMock('@/src/services/Transactions.Service', () => ({
        useTransactionService: () => ({
          createMultipleTransactionsRepo: () => ({
            mutateAsync: mockMutateAsync,
          }),
        }),
      }));

      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      // Fill required fields
      await act(async () => {
        fireEvent.changeText(screen.getByTestId('payee-input'), 'Test Payee');
        fireEvent.press(screen.getByTestId('accountid-select'));
        fireEvent.press(screen.getByText('Checking Account'));
        fireEvent.changeText(screen.getByTestId('totalAmount-input'), '100');
        fireEvent.changeText(screen.getByTestId('amount-input'), '100');
        fireEvent.changeText(screen.getByTestId('name-input'), 'Test Transaction');
        fireEvent.press(screen.getByTestId('categoryid-select'));
        fireEvent.press(screen.getByText('Food'));
      });

      const submitButton = screen.getByText('Save Multiple Transactions');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          transactions: expect.objectContaining({
            payee: 'Test Payee',
            accountid: '1',
          }),
          totalAmount: -100, // Negative for expense
        })
      );
    });

    it('should handle submission errors gracefully', async () => {
      const mockMutateAsync = jest.fn().mockRejectedValue(new Error('Submission failed'));
      jest.doMock('@/src/services/Transactions.Service', () => ({
        useTransactionService: () => ({
          createMultipleTransactionsRepo: () => ({
            mutateAsync: mockMutateAsync,
          }),
        }),
      }));

      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      // Fill required fields and submit
      await act(async () => {
        fireEvent.changeText(screen.getByTestId('payee-input'), 'Test Payee');
        fireEvent.press(screen.getByTestId('accountid-select'));
        fireEvent.press(screen.getByText('Checking Account'));
        fireEvent.changeText(screen.getByTestId('totalAmount-input'), '100');
        fireEvent.changeText(screen.getByTestId('amount-input'), '100');
        fireEvent.changeText(screen.getByTestId('name-input'), 'Test Transaction');
        fireEvent.press(screen.getByTestId('categoryid-select'));
        fireEvent.press(screen.getByText('Food'));
      });

      const submitButton = screen.getByText('Save Multiple Transactions');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Error: Submission failed')).toBeTruthy();
      });
    });
  });

  describe('Performance Optimizations', () => {
    it('should handle large transaction lists efficiently', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      // Set a large total amount
      const totalAmountInput = screen.getByTestId('totalAmount-input');
      await act(async () => {
        fireEvent.changeText(totalAmountInput, '1000');
      });

      // Add multiple transactions
      const addButton = screen.getByText('Add Transaction');
      
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          fireEvent.press(addButton);
        });
      }

      // Should handle 11 transactions (1 initial + 10 added) without performance issues
      const transactionCards = screen.getAllByText('Transaction Name');
      expect(transactionCards.length).toBe(11);
    });

    it('should not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn();
      
      const TestComponent = () => {
        renderSpy();
        return <MultipleTransactions transaction={null} />;
      };

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const initialRenderCount = renderSpy.mock.calls.length;

      // Re-render with same props
      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should not cause additional renders with same props
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Payee')).toBeTruthy();
      expect(screen.getByLabelText('Total Amount')).toBeTruthy();
      expect(screen.getByLabelText('Add new transaction')).toBeTruthy();
      expect(screen.getByLabelText('Toggle amount sign')).toBeTruthy();
    });

    it('should announce errors to screen readers', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Multiple Transactions');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        const errorMessage = screen.getByText('Payee is required');
        expect(errorMessage).toHaveAccessibilityRole('alert');
      });
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle splitting a large transaction into multiple smaller ones', async () => {
      render(
        <TestWrapper>
          <MultipleTransactions transaction={null} />
        </TestWrapper>
      );

      // Set total amount to 300
      const totalAmountInput = screen.getByTestId('totalAmount-input');
      await act(async () => {
        fireEvent.changeText(totalAmountInput, '300');
      });

      // Split into 3 transactions of 100 each
      const amountInputs = screen.getAllByTestId('amount-input');
      await act(async () => {
        fireEvent.changeText(amountInputs[0], '100');
      });

      // Add second transaction
      const addButton = screen.getByText('Add Transaction');
      await act(async () => {
        fireEvent.press(addButton);
      });

      const updatedAmountInputs1 = screen.getAllByTestId('amount-input');
      await act(async () => {
        fireEvent.changeText(updatedAmountInputs1[1], '100');
      });

      // Add third transaction
      await act(async () => {
        fireEvent.press(addButton);
      });

      const updatedAmountInputs2 = screen.getAllByTestId('amount-input');
      await act(async () => {
        fireEvent.changeText(updatedAmountInputs2[2], '100');
      });

      // Should show balanced
      expect(screen.getByText('✓ Transactions are balanced')).toBeTruthy();
      expect(screen.getByText('0.00')).toBeTruthy(); // Remaining amount
    });

    it('should handle editing existing multiple transaction', async () => {
      const existingTransaction: TransactionFormType = {
        id: '123',
        name: 'Shopping Trip',
        amount: 200,
        type: 'Expense',
        payee: 'Mall',
        description: 'Various purchases',
        date: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
        accountid: '1',
        categoryid: '1',
        notes: '',
        tags: null,
        isvoid: false,
        transferid: '',
        transferaccountid: null,
      };

      render(
        <TestWrapper>
          <MultipleTransactions transaction={existingTransaction} />
        </TestWrapper>
      );

      // Should populate with existing data
      expect(screen.getByDisplayValue('Mall')).toBeTruthy();
      expect(screen.getByDisplayValue('Various purchases')).toBeTruthy();
      expect(screen.getByDisplayValue('Shopping Trip')).toBeTruthy();

      // Should be able to modify and add more transactions
      const addButton = screen.getByText('Add Transaction');
      await act(async () => {
        fireEvent.press(addButton);
      });

      const transactionCards = screen.getAllByText('Transaction Name');
      expect(transactionCards.length).toBe(2);
    });
  });
});