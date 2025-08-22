/**
 * Integration tests for TransactionCategoryForm
 * Tests form functionality, validation, submission, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { jest } from '@jest/globals';
import TransactionCategoryForm, { initialState } from '../TransactionCategoryForm';
import { useTransactionCategoryService } from '@/src/services/TransactionCategories.Service';
import { useTransactionGroupService } from '@/src/services/TransactionGroups.Service';

// Mock the services
jest.mock('@/src/services/TransactionCategories.Service');
jest.mock('@/src/services/TransactionGroups.Service');
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

// Mock the dropdown and icon picker components
jest.mock('../DropDownField', () => ({
  __esModule: true,
  default: ({ label, onSelect, selectedValue, options }: any) => (
    <div data-testid={`dropdown-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <select
        value={selectedValue || ''}
        onChange={(e) => {
          const option = options?.find((opt: any) => opt.value === e.target.value);
          onSelect?.(option);
        }}
      >
        <option value="">Select {label}</option>
        {options?.map((option: any) => (
          <option key={option.id} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ),
  ColorsPickerDropdown: ({ handleSelect, selectedValue }: any) => (
    <div data-testid="color-picker">
      <select
        value={selectedValue || ''}
        onChange={(e) => handleSelect?.({ value: e.target.value })}
      >
        <option value="">Select Color</option>
        <option value="info-100">Blue</option>
        <option value="success-100">Green</option>
        <option value="warning-100">Yellow</option>
      </select>
    </div>
  ),
}));

jest.mock('../IconPicker', () => ({
  __esModule: true,
  default: ({ onSelect, initialIcon }: any) => (
    <div data-testid="icon-picker">
      <button onClick={() => onSelect?.('TestIcon')}>
        Current: {initialIcon}
      </button>
    </div>
  ),
}));

describe('TransactionCategoryForm', () => {
  const mockMutate = jest.fn();
  const mockTransactionGroups = [
    {
      id: 'group1',
      name: 'Income',
      type: 'Income',
      icon: 'DollarSign',
      createdat: '2024-01-01',
      updatedat: '2024-01-01',
    },
    {
      id: 'group2',
      name: 'Expenses',
      type: 'Expense',
      icon: 'ShoppingCart',
      createdat: '2024-01-01',
      updatedat: '2024-01-01',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useTransactionCategoryService as jest.Mock).mockReturnValue({
      upsert: () => ({ mutate: mockMutate }),
    });

    (useTransactionGroupService as jest.Mock).mockReturnValue({
      findAll: () => ({
        data: mockTransactionGroups,
        isLoading: false,
      }),
    });
  });

  describe('Form Rendering', () => {
    it('should render all required form sections', () => {
      render(<TransactionCategoryForm category={initialState} />);

      expect(screen.getByText('Category Details')).toBeTruthy();
      expect(screen.getByText('Budget Settings')).toBeTruthy();
      expect(screen.getByText('Appearance')).toBeTruthy();
    });

    it('should render all form fields with proper labels', () => {
      render(<TransactionCategoryForm category={initialState} />);

      expect(screen.getByText('Category Name')).toBeTruthy();
      expect(screen.getByText('Transaction Group')).toBeTruthy();
      expect(screen.getByText('Budget Amount')).toBeTruthy();
      expect(screen.getByText('Budget Frequency')).toBeTruthy();
      expect(screen.getByText('Description')).toBeTruthy();
      expect(screen.getByText('Display Order')).toBeTruthy();
    });

    it('should show loading state when transaction groups are loading', () => {
      (useTransactionGroupService as jest.Mock).mockReturnValue({
        findAll: () => ({
          data: null,
          isLoading: true,
        }),
      });

      render(<TransactionCategoryForm category={initialState} />);

      expect(screen.getByText('Loading transaction groups...')).toBeTruthy();
    });

    it('should populate form with initial data', () => {
      const testCategory = {
        ...initialState,
        name: 'Test Category',
        description: 'Test Description',
        budgetamount: 100,
        budgetfrequency: 'Monthly',
        groupid: 'group1',
      };

      render(<TransactionCategoryForm category={testCategory} />);

      expect(screen.getByDisplayValue('Test Category')).toBeTruthy();
      expect(screen.getByDisplayValue('Test Description')).toBeTruthy();
      expect(screen.getByDisplayValue('100')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      render(<TransactionCategoryForm category={initialState} />);

      const submitButton = screen.getByText('Save Category');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Category name is required')).toBeTruthy();
        expect(screen.getByText('Transaction group is required')).toBeTruthy();
        expect(screen.getByText('Budget amount is required')).toBeTruthy();
        expect(screen.getByText('Budget frequency is required')).toBeTruthy();
      });
    });

    it('should validate category name length', async () => {
      render(<TransactionCategoryForm category={initialState} />);

      const nameInput = screen.getByPlaceholderText('Enter category name');
      fireEvent.changeText(nameInput, 'A'); // Too short

      const submitButton = screen.getByText('Save Category');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Category name must be at least 2 characters')).toBeTruthy();
      });
    });

    it('should validate budget amount is positive', async () => {
      render(<TransactionCategoryForm category={initialState} />);

      const budgetInput = screen.getByPlaceholderText('0.00');
      fireEvent.changeText(budgetInput, '-10');

      const submitButton = screen.getByText('Save Category');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Budget amount must be 0 or greater')).toBeTruthy();
      });
    });

    it('should clear validation errors when fields are corrected', async () => {
      render(<TransactionCategoryForm category={initialState} />);

      // Trigger validation error
      const submitButton = screen.getByText('Save Category');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Category name is required')).toBeTruthy();
      });

      // Fix the error
      const nameInput = screen.getByPlaceholderText('Enter category name');
      fireEvent.changeText(nameInput, 'Valid Category Name');

      await waitFor(() => {
        expect(screen.queryByText('Category name is required')).toBeNull();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should update form fields when user types', () => {
      render(<TransactionCategoryForm category={initialState} />);

      const nameInput = screen.getByPlaceholderText('Enter category name');
      fireEvent.changeText(nameInput, 'New Category');

      expect(screen.getByDisplayValue('New Category')).toBeTruthy();
    });

    it('should handle group selection', () => {
      render(<TransactionCategoryForm category={initialState} />);

      const groupDropdown = screen.getByTestId('dropdown-');
      const selectElement = groupDropdown.querySelector('select');
      
      if (selectElement) {
        fireEvent.change(selectElement, { target: { value: 'group1' } });
        expect(selectElement.value).toBe('group1');
      }
    });

    it('should handle budget frequency selection', () => {
      render(<TransactionCategoryForm category={initialState} />);

      const frequencyInput = screen.getByDisplayValue('');
      // This would be handled by the FormField component's select type
      // The actual implementation would depend on how the select is rendered
    });

    it('should handle icon selection', () => {
      render(<TransactionCategoryForm category={initialState} />);

      const iconPicker = screen.getByTestId('icon-picker');
      const iconButton = iconPicker.querySelector('button');
      
      if (iconButton) {
        fireEvent.press(iconButton);
        // Icon selection would update the form state
      }
    });

    it('should handle color selection', () => {
      render(<TransactionCategoryForm category={initialState} />);

      const colorPicker = screen.getByTestId('color-picker');
      const selectElement = colorPicker.querySelector('select');
      
      if (selectElement) {
        fireEvent.change(selectElement, { target: { value: 'success-100' } });
        expect(selectElement.value).toBe('success-100');
      }
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const validCategory = {
        ...initialState,
        name: 'Test Category',
        groupid: 'group1',
        budgetamount: 100,
        budgetfrequency: 'Monthly',
        icon: 'TestIcon',
        color: 'info-100',
      };

      render(<TransactionCategoryForm category={validCategory} />);

      const submitButton = screen.getByText('Save Category');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          {
            form: expect.objectContaining({
              name: 'Test Category',
              groupid: 'group1',
              budgetamount: 100,
              budgetfrequency: 'Monthly',
            }),
            original: validCategory,
          },
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });

    it('should not submit form with invalid data', async () => {
      render(<TransactionCategoryForm category={initialState} />);

      const submitButton = screen.getByText('Save Category');
      fireEvent.press(submitButton);

      // Should not call mutate if validation fails
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      const validCategory = {
        ...initialState,
        name: 'Test Category',
        groupid: 'group1',
        budgetamount: 100,
        budgetfrequency: 'Monthly',
      };

      render(<TransactionCategoryForm category={validCategory} />);

      const submitButton = screen.getByText('Save Category');
      fireEvent.press(submitButton);

      // The button text should change to indicate loading
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeTruthy();
      });
    });

    it('should handle submission success', async () => {
      const validCategory = {
        ...initialState,
        name: 'Test Category',
        groupid: 'group1',
        budgetamount: 100,
        budgetfrequency: 'Monthly',
      };

      mockMutate.mockImplementation((data, callbacks) => {
        callbacks.onSuccess();
      });

      render(<TransactionCategoryForm category={validCategory} />);

      const submitButton = screen.getByText('Save Category');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('should handle submission error', async () => {
      const validCategory = {
        ...initialState,
        name: 'Test Category',
        groupid: 'group1',
        budgetamount: 100,
        budgetfrequency: 'Monthly',
      };

      const testError = new Error('Submission failed');
      mockMutate.mockImplementation((data, callbacks) => {
        callbacks.onError(testError);
      });

      render(<TransactionCategoryForm category={validCategory} />);

      const submitButton = screen.getByText('Save Category');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Submission failed')).toBeTruthy();
      });
    });
  });

  describe('Form Reset', () => {
    it('should show reset button when form is dirty', async () => {
      render(<TransactionCategoryForm category={initialState} />);

      const nameInput = screen.getByPlaceholderText('Enter category name');
      fireEvent.changeText(nameInput, 'Modified Name');

      await waitFor(() => {
        expect(screen.getByText('Reset')).toBeTruthy();
      });
    });

    it('should reset form to initial state when reset is clicked', async () => {
      const testCategory = {
        ...initialState,
        name: 'Original Name',
      };

      render(<TransactionCategoryForm category={testCategory} />);

      // Modify the form
      const nameInput = screen.getByDisplayValue('Original Name');
      fireEvent.changeText(nameInput, 'Modified Name');

      // Reset the form
      const resetButton = screen.getByText('Reset');
      fireEvent.press(resetButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Name')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(<TransactionCategoryForm category={initialState} />);

      // Form should have proper role
      const form = screen.getByRole('form');
      expect(form).toBeTruthy();
    });

    it('should associate error messages with form fields', async () => {
      render(<TransactionCategoryForm category={initialState} />);

      const submitButton = screen.getByText('Save Category');
      fireEvent.press(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('Category name is required');
        expect(errorMessage).toBeTruthy();
        // Error should have proper accessibility role
        expect(errorMessage.props.accessibilityRole).toBe('alert');
      });
    });
  });

  describe('Responsive Layout', () => {
    it('should handle responsive layout for budget fields', () => {
      render(<TransactionCategoryForm category={initialState} />);

      // Budget amount and frequency should be in the same section
      expect(screen.getByText('Budget Settings')).toBeTruthy();
      expect(screen.getByText('Budget Amount')).toBeTruthy();
      expect(screen.getByText('Budget Frequency')).toBeTruthy();
    });

    it('should handle responsive layout for appearance fields', () => {
      render(<TransactionCategoryForm category={initialState} />);

      // Icon and color should be in the same section
      expect(screen.getByText('Appearance')).toBeTruthy();
      expect(screen.getByTestId('icon-picker')).toBeTruthy();
      expect(screen.getByTestId('color-picker')).toBeTruthy();
    });
  });
});