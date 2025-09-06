import React from 'react';
import { render } from '@testing-library/react-native';
import DemoModeIndicator from '../DemoModeIndicator';
import { useAuth } from '@/src/providers/AuthProvider';

// Mock the useAuth hook
jest.mock('@/src/providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// Mock the MyIcon component
jest.mock('@/src/utils/Icons.Helper', () => {
  return function MockMyIcon({ name, size, color }: any) {
    return `MockIcon-${name}-${size}-${color}`;
  };
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('DemoModeIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isDemoLoaded is false', () => {
    mockUseAuth.mockReturnValue({
      isDemoLoaded: false,
      session: null,
      user: undefined,
      isSessionLoading: false,
      setSession: jest.fn(),
      setIsDemoLoaded: jest.fn(),
      logout: jest.fn(),
    });

    const { queryByText } = render(<DemoModeIndicator />);
    expect(queryByText('Demo Mode - Exploring with sample data')).toBeNull();
  });

  it('should render banner variant when isDemoLoaded is true', () => {
    mockUseAuth.mockReturnValue({
      isDemoLoaded: true,
      session: null,
      user: undefined,
      isSessionLoading: false,
      setSession: jest.fn(),
      setIsDemoLoaded: jest.fn(),
      logout: jest.fn(),
    });

    const { getByText } = render(<DemoModeIndicator variant="banner" />);
    expect(getByText('Demo Mode - Exploring with sample data')).toBeTruthy();
  });

  it('should render badge variant when isDemoLoaded is true', () => {
    mockUseAuth.mockReturnValue({
      isDemoLoaded: true,
      session: null,
      user: undefined,
      isSessionLoading: false,
      setSession: jest.fn(),
      setIsDemoLoaded: jest.fn(),
      logout: jest.fn(),
    });

    const { getByText } = render(<DemoModeIndicator variant="badge" />);
    expect(getByText('DEMO')).toBeTruthy();
  });

  it('should render header variant when isDemoLoaded is true', () => {
    mockUseAuth.mockReturnValue({
      isDemoLoaded: true,
      session: null,
      user: undefined,
      isSessionLoading: false,
      setSession: jest.fn(),
      setIsDemoLoaded: jest.fn(),
      logout: jest.fn(),
    });

    const { getByText } = render(<DemoModeIndicator variant="header" />);
    expect(getByText('Demo Mode')).toBeTruthy();
  });
});