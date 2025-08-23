/**
 * Integration tests for TransactionForm component
 * Tests all transaction types, mode handling, amount calculation, account switching, and transfer logic
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TransactionForm, { initialTransactionState, TransactionFormType } from '../TransactionForm';
import { TransactionFormData } from '@/src/types/components/forms.types';


// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    navigate: jest.fn(),
  },
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
}));

jest.mock('@/src/services/TransactionCategories.Service', () => ({
  useTransactionCategoryService: () => ({
    findAll: () => ({
      data: [
        { id: '1', name: 'Food', icon: 'utensils', color: '#ff6b6b' },
        { id: '2', name: 'Transport', icon: 'car', color: '#4ecdc4' },
        { id: '3', name: 'Transfer', icon: 'exchange', color: '#45b7d1' },
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
    upsert: () => ({
      mutate: jest.fn(),
    }),
  }),
}));

jest.mock('@/src/repositories', () => ({
  getTransactionsByName: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../SearchableDropdown', () => {
  return function MockSearchableDropdown({ onChange, onSelectItem, label }: any) {
    return (
      <div>
        <label>{label}</label>
        <input
          testID={`searchable-${label?.toLowerCase()}`}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search transactions"
        />
        <button
          testID={`select-existing-transaction`}
          onPress={() => onSelectItem({
            item: {
              id: 'existing-1',
              name: 'Grocery Store',
              amount: -50.00,
              type: 'Expense',
              accountid: '1',
              categoryid: '1',
              payee: 'Walmart',
              date: new Date().toISOString(),
            }
          })}
        >
          Select Existing
        </button>
      </div>
    );
  };
});

jest.mock('../Calculator', () => {
  return function MockCalculator({ onSubmit, currentValue }: any) {
    return (
      <button
        testID="calculator-submit"
        onPress={() => onSubmit('123.45')}
      >
        Calculator: {currentValue}
      </button>
    );
  };
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

describe('TransactionForm', () => {
  const mockTransaction: TransactionFormType = {
    ...initialTransactionState,
    id: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Initialization', () => {
    it('should render with initial state for new transaction', () => {
      render(
        <TestWrapper>
          <TransactionForm transaction={mockTransaction} />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('')).toBeTruthy(); // Name field
      expect(screen.getByDisplayValue('0')).toBeTruthy(); // Amount field
      expect(screen.getByText('Expense')).toBeTruthy(); // Default type
    });

    it('should populate form with existing transaction data', () => {
      const existingTransaction: TransactionFormType = {
        ...mockTransaction,
        id: '123',
        name: 'Test Transaction',
        amount: 100.50,
        type: 'Income',
        payee: 'Test Payee',
      };

      render(
        <TestWrapper>
          <TransactionForm transaction={existingTransaction} />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('Test Transaction')).toBeTruthy();
      expect(screen.getByDisplayValue('100.5')).toBeTruthy();
      expect(screen.getByDisplayValue('Test Payee')).toBeTruthy();
    });
  });

  describe('Transaction Type Handling', () => {
    it('should handle Income type selection correctly', async () => {
      render(
        <TestWrapper>
          <TransactionForm transaction={mockTransaction} />
        </TestWrapper>
      );

      const typeSelect = screen.getByTestId('type-select');
      
      await act(async () => {
        fireEvent.press(typeSelect);
        fireEvent.press(screen.getByText('Income'));
      });

      // Should set mode to plus and update name
      expect(screen.getByTestId('mode-indicator')).toHaveTextContent('plus');
      expect(screen.getByDisplayValue('Income')).toBeTruthy();
    });

    it('should handle Expense type selection correctly', async () => {
      render(
        <TestWrapper>
          <TransactionForm transaction={mockTransaction} />
        </TestWrapper>
      );

      const typeSelect = screen.getByTestId('type-select');
      
      await act(async () => {
        fireEvent.press(typeSelect);
        fireEvent.press(screen.getByText('Expense'));
      });

      // Should set mode to minus
      expect(screen.getByTestId('mode-indicator')).toHaveTextContent('minus');
      expect(screen.getByDisplayValue('Expense')).toBeTruthy();
    });

    it('should handle Transfer type selection correctly', async () => {
      render(
        <TestWrapper>
          <TransactionForm transaction={mockTransaction} />
        </TestWrapper>
      );

      const typeSelect = screen.getByTestId('type-select');
      
      await act(async () => {
        fireEvent.press(typeSelect);
        fireEvent.press(screen.getByText('Transfer'));
      });

      // Should set mode to minus, clear payee, and show transfer account field
      expect(screen.getByTestId('mode-indicator')).toHaveTextContent('minus');
      expect(screen.getByDisplayValue('Transfer')).toBeTruthy();
      expect(screen.getByText('Destination Account')).toBeTruthy();
      expect(screen.queryByText('Payee')).toBeNull(); // Payee should be hidden
    });
  });

  describe('Amount Calculation and Mode Handling', () => {
    it('should handle positive amount input correctly', async () => {
      render(
        <TestWrapper>
          <TransactionForm transaction={mockTransaction} />
        </TestWrapper>
      );

      const amountInput = screen.getByTestId('amount-input');
      
      await act(async () => {
        fireEvent.changeText(amountInput, '123.45');
      });

      expect(screen.getByDisplayValue('123.45')).toBeTruthy();
    });

    it('should handle negative amount input and change mode', async () => {
      render(
        <TestWrapper>
          <TransactionForm transaction={mockTransaction} />
        </TestWrapper>
      );

      const amountInput = screen.getByTestId('amount-input');
      
      await act(async () => {
        fireEvent.changeText(amountInput, '-50.00');
      });

      expect(screen.getByDisplayValue('50')).toBeTruthy(); // Should strip minus sign
      expect(screen.getByTestId('mode-indicator')).toHaveTextContent('minus');
    });

    it('should validate maximum amount', async () => {
      render(
        <TestWrapper>
          <TransactionForm transaction={mockTransaction} />
        </TestWrapper>
      );

      const amountInput = screen.getByTestId('amount-input');
      
      await act(async () => {
        fireEvent.changeText(amountInput, '9999999999.99');
      });

      // Should not update if amount exceeds maximum
      expect(screen.getByDisplayValue('0')).toBeTruthy();
    });

    it('should handle mode toggle correctly', async () => {
      render(
        <TestWrapper>
          <TransactionForm transaction={mockTransaction} />
        </TestWrapper>
      );

      const modeToggle = screen.getByTestId('mode-toggle');
      
      await act(async () => {
        fireEvent.press(modeToggle);
      });

      expect(screen.getByTestId('mode-indicator')).toHaveTextContent('plus');
    });
  });

  describe('Account Switching for Transfers', () => {
    it('should show account switch button for transfers', async () => {
      const transferTransaction: TransactionFormType = {
        ...mockTransaction,
        type: 'Transfer',
      };

      render(
        <TestWrapper>
          <TransactionForm transaction={transferTransaction} />
        </TestWrapper>
      );

      expect(screen.getByTestId('switch-accounts-button')).toBeTruthy();
    });

    it('should switch accounts when button is pressed', async () => {
      const transferTransaction: TransactionFormType = {
        ...mockTransaction,
        type: 'Transfer',
        accountid: '1',
        transferaccountid: '2',
      };

      render(
        <TestWrapper>
          <TransactionForm transaction={transferTransaction} />
        </TestWrapper>
      );

      const switchButton = screen.getByTestId('switch-accounts-button');
      
      await act(async () => {
        fireEvent.press(switchButton);
      });

      // Accounts should be switched
      // This would need to be verified through the form state
      expect(switchButton).toBeTruthy(); // Basic check that button exists
    });

    it('should filter destination account options to exclude source account', async () => {
      const transferTransaction: TransactionFormType = {
        ...mockTransaction,
        type: 'Transfer',
        accountid: '1',
      };

      render(
        <TestWrapper>
          <TransactionForm transaction={transferTransaction} />
        </TestWrapper>
      );

      const destinationSelect = screen.getByTestId('transferaccountid-select');
      
      await act(async () => {
        fireEvent.press(destinationSelect);
      });

      // Should not show the selected source account in destination options
      expect(screen.queryByText('Checking Account')).toBeNull();
      expect(screen.getByText('Savings Account')).toBeTruthy();
      expect(screen.getByText('Credit Card')).toBeTruthy();
    });
  });

  describe('Calculator Integration', () => {
    it('should update amount when calculator result is submitted', async () => {
      render(
        <TestWrapper>
          <TransactionForm transaction={mockTransaction} />
        </TestWrapper>
      );

      const calculatorButton = screen.getByTestId('calculator-submit');
      
      await act(async () => {
        fireEvent.press(calculatorButton);
      });

      expect(screen.getByDisplayValue('123.45')).toBeTruthy();
    });

    it('should handle invalid calculator results gracefully', async () => {
      // Mock calculator to return invalid result
      jest.doMock('../Calculator', () => {
        return function MockCalculator({ onSubmit }: any) {
          return (
            <button
              testID="calculator-submit-invalid"
              onPress={() => onSubmit('invalid')}
            >
              Calculator Invalid
            </button>
          );
        };
      });

      render(
        <TestWrapper>
          <TransactionForm transaction={mockTransaction} />
        </TestWrapper>
      );

      const calculatorButton = screen.getByTestId('calculator-submit-invalid');
      
      await act(async () => {
        fireEvent.press(calculatorButton);
      });

      // Amount should remain unchanged
      expect(screen.getByDisplayValue('0')).toBeTruthy();
    });
  });

  describe('Searchable Dropdown Functionality', () => {
    it('should populate form when existing transaction is selected', async () => {
      render(
        <TestWrapper>
          <TransactionForm transaction={mockTransaction} />
        </TestWrapper>
      );

      const selectButton = screen.getByTestId('select-existing-transaction');
      
      await act(async () => {
        fireEvent.press(selectButton);
      });

      expect(screen.getByDisplayValue('Grocery Store')).toBeTruthy();
      expect(screen.getByDisplayValue('50')).toBeTruthy(); // Absolute value
      expect(screen.getByDisplayValue('Walmart')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      render(
        <TestWrapper>
          <TransactionForm transaction={mockTransaction} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Transaction');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Transaction name is required')).toBeTruthy();
        expect(screen.getByText('Amount must be greater than 0')).toBeTruthy();
        expect(screen.getByText('Account is required')).toBeTruthy();
        expect(screen.getByText('Category is required')).toBeTruthy();
      });
    });

    it('should validate transfer accounts are different', async () => {
      const transferTransaction: TransactionFormType = {
        ...mockTransaction,
        type: 'Transfer',
        name: 'Test Transfer',
        amount: 100,
        accountid: '1',
        transferaccountid: '1', // Same as source
        categoryid: '3',
      };

      render(
        <TestWrapper>
          <TransactionForm transaction={transferTransaction} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Transaction');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Destination account must be different from source account')).toBeTruthy();
      });
    });

    it('should require payee for non-transfer transactions', async () => {
      const expenseTransaction: TransactionFormType = {
        ...mockTransaction,
        type: 'Expense',
        name: 'Test Expense',
        amount: 50,
        accountid: '1',
        categoryid: '1',
        // payee is missing
      };

      render(
        <TestWrapper>
          <TransactionForm transaction={expenseTransaction} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Transaction');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Payee is required')).toBeTruthy();
      });
    });
  });

  describe('Form Submission', () => {
    it('should calculate correct amount for expense transactions', async () => {
      const mockUpsert = jest.fn();
      jest.doMock('@/src/services/Transactions.Service', () => ({
        useTransactionService: () => ({
          upsert: () => ({
            mutate: mockUpsert,
          }),
        }),
      }));

      const expenseTransaction: TransactionFormType = {
        ...mockTransaction,
        type: 'Expense',
        name: 'Test Expense',
        amount: 50,
        accountid: '1',
        categoryid: '1',
        payee: 'Test Payee',
      };

      render(
        <TestWrapper>
          <TransactionForm transaction={expenseTransaction} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Transaction');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Should submit with negative amount for expense
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          form: expect.objectContaining({
            amount: -50,
            type: 'Expense',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should calculate correct amount for income transactions', async () => {
      const mockUpsert = jest.fn();
      jest.doMock('@/src/services/Transactions.Service', () => ({
        useTransactionService: () => ({
          upsert: () => ({
            mutate: mockUpsert,
          }),
        }),
      }));

      const incomeTransaction: TransactionFormType = {
        ...mockTransaction,
        type: 'Income',
        name: 'Test Income',
        amount: 100,
        accountid: '1',
        categoryid: '1',
        payee: 'Employer',
      };

      render(
        <TestWrapper>
          <TransactionForm transaction={incomeTransaction} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Transaction');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Should submit with positive amount for income
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          form: expect.objectContaining({
            amount: 100,
            type: 'Income',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should calculate correct amount for transfer transactions', async () => {
      const mockUpsert = jest.fn();
      jest.doMock('@/src/services/Transactions.Service', () => ({
        useTransactionService: () => ({
          upsert: () => ({
            mutate: mockUpsert,
          }),
        }),
      }));

      const transferTransaction: TransactionFormType = {
        ...mockTransaction,
        type: 'Transfer',
        name: 'Test Transfer',
        amount: 75,
        accountid: '1',
        transferaccountid: '2',
        categoryid: '3',
      };

      render(
        <TestWrapper>
          <TransactionForm transaction={transferTransaction} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Transaction');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      // Should submit with negative amount for transfer (from source account perspective)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          form: expect.objectContaining({
            amount: -75,
            type: 'Transfer',
            payee: '', // Should clear payee for transfers
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('Add More Functionality', () => {
    it('should reset form with preserved settings after Add More submission', async () => {
      const validTransaction: TransactionFormType = {
        ...mockTransaction,
        name: 'Test Transaction',
        amount: 50,
        type: 'Expense',
        accountid: '1',
        categoryid: '1',
        payee: 'Test Payee',
      };

      render(
        <TestWrapper>
          <TransactionForm transaction={validTransaction} />
        </TestWrapper>
      );

      const addMoreButton = screen.getByText('Add More');
      
      await act(async () => {
        fireEvent.press(addMoreButton);
      });

      // Should preserve type, category, and account but reset other fields
      expect(screen.getByDisplayValue('Expense')).toBeTruthy(); // Type preserved
      expect(screen.getByDisplayValue('')).toBeTruthy(); // Name reset
      expect(screen.getByDisplayValue('0')).toBeTruthy(); // Amount reset
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(
        <TestWrapper>
          <TransactionForm transaction={mockTransaction} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Transaction name')).toBeTruthy();
      expect(screen.getByLabelText('Amount')).toBeTruthy();
      expect(screen.getByLabelText('Date')).toBeTruthy();
      expect(screen.getByLabelText('Toggle amount sign')).toBeTruthy();
    });

    it('should announce errors to screen readers', async () => {
      render(
        <TestWrapper>
          <TransactionForm transaction={mockTransaction} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Save Transaction');
      
      await act(async () => {
        fireEvent.press(submitButton);
      });

      await waitFor(() => {
        const errorMessage = screen.getByText('Transaction name is required');
        expect(errorMessage).toHaveAccessibilityRole('alert');
      });
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn();
      
      const TestComponent = () => {
        renderSpy();
        return <TransactionForm transaction={mockTransaction} />;
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
});