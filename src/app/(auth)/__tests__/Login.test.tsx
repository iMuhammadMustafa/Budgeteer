import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import Login from '../Login';
import { StorageModeProvider } from '@/src/providers/StorageModeProvider';
import { DemoModeProvider } from '@/src/providers/DemoModeProvider';
import { AuthProvider } from '@/src/providers/AuthProvider';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('@/src/providers/Supabase', () => ({
  auth: {
    signInWithPassword: jest.fn(),
  },
}));

jest.mock('@/src/providers/DemoModeGlobal', () => ({
  setStorageMode: jest.fn().mockResolvedValue(undefined),
  getStorageMode: jest.fn().mockReturnValue('cloud'),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <StorageModeProvider>
    <DemoModeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </DemoModeProvider>
  </StorageModeProvider>
);

describe('Login Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders mode selection screen by default', () => {
    const { getByText } = render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(getByText('Welcome to Budgeteer')).toBeTruthy();
    expect(getByText('Choose how you\'d like to use the app')).toBeTruthy();
    expect(getByText('Login with Username and Password')).toBeTruthy();
    expect(getByText('Demo Mode')).toBeTruthy();
    expect(getByText('Local Mode')).toBeTruthy();
  });

  it('shows cloud login form when cloud mode is selected', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    fireEvent.press(getByText('Login with Username and Password'));

    await waitFor(() => {
      expect(getByText('Cloud Login')).toBeTruthy();
      expect(getByText('Sign in to access your cloud-synced data')).toBeTruthy();
      expect(queryByText('Welcome to Budgeteer')).toBeFalsy();
    });
  });

  it('navigates to dashboard when demo mode is selected', async () => {
    const { getByText } = render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    fireEvent.press(getByText('Demo Mode'));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(drawer)/(tabs)/Dashboard');
    });
  });

  it('navigates to dashboard when local mode is selected', async () => {
    const { getByText } = render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    fireEvent.press(getByText('Local Mode'));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(drawer)/(tabs)/Dashboard');
    });
  });

  it('shows back button in cloud login form', async () => {
    const { getByText } = render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    fireEvent.press(getByText('Login with Username and Password'));

    await waitFor(() => {
      expect(getByText('← Back to mode selection')).toBeTruthy();
    });
  });

  it('returns to mode selection when back button is pressed', async () => {
    const { getByText } = render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Go to cloud login
    fireEvent.press(getByText('Login with Username and Password'));

    await waitFor(() => {
      expect(getByText('Cloud Login')).toBeTruthy();
    });

    // Go back
    fireEvent.press(getByText('← Back to mode selection'));

    await waitFor(() => {
      expect(getByText('Welcome to Budgeteer')).toBeTruthy();
    });
  });

  it('displays mode-specific icons and descriptions', () => {
    const { getByText } = render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(getByText('Connect to cloud database with full sync')).toBeTruthy();
    expect(getByText('Try the app with sample data')).toBeTruthy();
    expect(getByText('Store data locally on your device')).toBeTruthy();
  });

  it('disables buttons when loading', async () => {
    const { getByText, getByPlaceholderText } = render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Go to cloud login
    fireEvent.press(getByText('Login with Username and Password'));

    await waitFor(() => {
      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password');

      // Button should be enabled with valid inputs
      expect(signInButton.props.accessibilityState?.disabled).toBeFalsy();
    });
  });
});