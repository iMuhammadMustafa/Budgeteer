/**
 * Basic tests for AccountForm reset functionality
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
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

describe('AccountForm Basic Tests', () => {
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

  it('should render the form', () => {
    render(
      <TestWrapper>
        <AccountForm account={defaultAccount} />
      </TestWrapper>
    );

    // Check if basic elements are rendered
    expect(screen.getByText('Basic Information')).toBeTruthy();
    expect(screen.getByText('Save Account')).toBeTruthy();
  });

  it('should show reset button when form is dirty and reset correctly', () => {
    render(
      <TestWrapper>
        <AccountForm account={defaultAccount} />
      </TestWrapper>
    );

    // Initially no reset button should be visible
    expect(screen.queryByText('Reset')).toBeNull();

    // Make form dirty by changing a field
    const nameField = screen.getByDisplayValue('Test Account');
    fireEvent.changeText(nameField, 'Modified Name');

    // Reset button should now be visible
    expect(screen.getByText('Reset')).toBeTruthy();

    // Reset form
    const resetButton = screen.getByText('Reset');
    fireEvent.press(resetButton);

    // Form should be reset to original values
    expect(screen.getByDisplayValue('Test Account')).toBeTruthy();
  });
});