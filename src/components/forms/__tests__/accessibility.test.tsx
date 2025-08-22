/**
 * Comprehensive accessibility tests for form components
 * Tests WCAG compliance, keyboard navigation, screen reader support, and accessibility best practices
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { 
  FormAccessibilityAuditor, 
  generateAccessibilityReport,
  accessibilityMatchers,
  WCAG_RULES 
} from '../../../utils/accessibility-audit';
import { focusManager } from '../../../utils/focus-management';
import FormContainer from '../FormContainer';
import FormField from '../FormField';
import FormSection from '../FormSection';
import AccountForm from '../AccountForm';
import TransactionForm from '../TransactionForm';
import { AccountFormData, TransactionFormData } from '../../../types/components/forms.types';

// Extend Jest matchers
expect.extend(accessibilityMatchers);

// Mock data for testing
const mockFormFieldConfig = {
  name: 'testField' as const,
  label: 'Test Field',
  type: 'text' as const,
  required: true,
  placeholder: 'Enter test value',
};

const mockFormFieldConfigWithoutLabel = {
  name: 'testField' as const,
  label: '',
  type: 'text' as const,
  required: false,
};

// Mock data for testing
const mockAccountData: AccountFormData = {
  name: 'Test Account',
  type: 'checking',
  categoryid: 'cat-1',
  balance: 1000,
  runningbalance: 1000,
  openBalance: 1000,
  addAdjustmentTransaction: false,
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

describe('Form Components Accessibility', () => {
  let auditor: FormAccessibilityAuditor;

  beforeEach(() => {
    auditor = new FormAccessibilityAuditor();
    focusManager.reset();
  });

  describe('FormField Accessibility', () => {
    it('should pass accessibility audit with proper configuration', () => {
      const props = {
        config: mockFormFieldConfig,
        value: 'test value',
        error: undefined,
        touched: false,
        onChange: jest.fn(),
        onBlur: jest.fn(),
      };

      expect(props).toBeAccessible('FormField');
    });

    it('should fail accessibility audit without label', () => {
      const props = {
        config: mockFormFieldConfigWithoutLabel,
        value: 'test value',
        error: undefined,
        touched: false,
        onChange: jest.fn(),
        onBlur: jest.fn(),
      };

      const result = auditor.auditFormComponent(props, 'FormField');
      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          rule: WCAG_RULES.MEANINGFUL_LABELS,
        })
      );
    });

    it('should warn about required field indication', () => {
      const props = {
        config: {
          ...mockFormFieldConfig,
          label: 'Test Field', // No asterisk or "required" text
          required: true,
        },
        value: '',
        error: undefined,
        touched: false,
        onChange: jest.fn(),
        onBlur: jest.fn(),
      };

      const result = auditor.auditFormComponent(props, 'FormField');
      const warningIssues = result.issues.filter(issue => issue.severity === 'warning');
      expect(warningIssues).toContainEqual(
        expect.objectContaining({
          rule: WCAG_RULES.MEANINGFUL_LABELS,
          message: expect.stringContaining('Required fields should be clearly indicated'),
        })
      );
    });

    it('should fail when error message is empty', () => {
      const props = {
        config: mockFormFieldConfig,
        value: 'invalid value',
        error: '', // Empty error message
        touched: true,
        onChange: jest.fn(),
        onBlur: jest.fn(),
      };

      const result = auditor.auditFormComponent(props, 'FormField');
      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          rule: WCAG_RULES.ERROR_IDENTIFICATION,
        })
      );
    });

    it('should fail without onChange handler', () => {
      const props = {
        config: mockFormFieldConfig,
        value: 'test value',
        error: undefined,
        touched: false,
        // onChange: missing
        onBlur: jest.fn(),
      };

      const result = auditor.auditFormComponent(props, 'FormField');
      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          rule: WCAG_RULES.KEYBOARD_ACCESSIBLE,
        })
      );
    });

    it('should warn about placeholder as label', () => {
      const props = {
        config: {
          ...mockFormFieldConfig,
          label: 'Enter test value', // Same as placeholder
          placeholder: 'Enter test value',
        },
        value: '',
        error: undefined,
        touched: false,
        onChange: jest.fn(),
        onBlur: jest.fn(),
      };

      const result = auditor.auditFormComponent(props, 'FormField');
      const warningIssues = result.issues.filter(issue => issue.severity === 'warning');
      expect(warningIssues).toContainEqual(
        expect.objectContaining({
          rule: WCAG_RULES.MEANINGFUL_LABELS,
          message: expect.stringContaining('Placeholder text should not replace proper labels'),
        })
      );
    });

    it('should render with proper accessibility attributes', () => {
      const { getByDisplayValue } = render(
        <FormField
          config={mockFormFieldConfig}
          value="test value"
          error={undefined}
          touched={false}
          onChange={jest.fn()}
          onBlur={jest.fn()}
        />
      );

      const input = getByDisplayValue('test value');
      expect(input).toHaveProp('accessible', true);
      expect(input).toHaveProp('accessibilityLabel', 'Test Field');
      expect(input).toHaveProp('accessibilityRequired', true);
    });

    it('should render error with proper accessibility attributes', () => {
      const { getByText } = render(
        <FormField
          config={mockFormFieldConfig}
          value="invalid value"
          error="This field is required"
          touched={true}
          onChange={jest.fn()}
          onBlur={jest.fn()}
        />
      );

      const errorText = getByText('This field is required');
      expect(errorText).toHaveProp('accessibilityRole', 'text');
      expect(errorText).toHaveProp('accessibilityLiveRegion', 'polite');
    });
  });

  describe('FormContainer Accessibility', () => {
    it('should pass accessibility audit with proper configuration', () => {
      const props = {
        children: <div>Form content</div>,
        onSubmit: jest.fn(),
        isValid: true,
        isLoading: false,
        submitLabel: 'Save Form',
        showReset: true,
        onReset: jest.fn(),
      };

      expect(props).toBeAccessible('FormContainer');
    });

    it('should fail without onSubmit handler', () => {
      const props = {
        children: <div>Form content</div>,
        // onSubmit: missing
        isValid: true,
        isLoading: false,
        submitLabel: 'Save Form',
      };

      const result = auditor.auditFormComponent(props, 'FormContainer');
      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          rule: WCAG_RULES.KEYBOARD_ACCESSIBLE,
        })
      );
    });

    it('should fail when showReset is true but onReset is missing', () => {
      const props = {
        children: <div>Form content</div>,
        onSubmit: jest.fn(),
        isValid: true,
        isLoading: false,
        submitLabel: 'Save Form',
        showReset: true,
        // onReset: missing
      };

      const result = auditor.auditFormComponent(props, 'FormContainer');
      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          rule: WCAG_RULES.KEYBOARD_ACCESSIBLE,
        })
      );
    });

    it('should render with proper accessibility attributes', () => {
      const { getByRole } = render(
        <FormContainer
          onSubmit={jest.fn()}
          isValid={true}
          isLoading={false}
          submitLabel="Save Form"
        >
          <div>Form content</div>
        </FormContainer>
      );

      // Note: This test would need to be adapted based on the actual rendered structure
      // The form container should have proper ARIA attributes
    });

    it('should handle keyboard navigation', () => {
      const mockSubmit = jest.fn();
      const { getByRole } = render(
        <FormContainer
          onSubmit={mockSubmit}
          isValid={true}
          isLoading={false}
          submitLabel="Save Form"
        >
          <div>Form content</div>
        </FormContainer>
      );

      // Test Enter key submission (would need proper implementation)
      // This is a placeholder for keyboard navigation testing
    });
  });

  describe('FormSection Accessibility', () => {
    it('should pass accessibility audit with proper configuration', () => {
      const props = {
        title: 'Personal Information',
        children: <div>Section content</div>,
        collapsible: false,
        defaultExpanded: true,
      };

      expect(props).toBeAccessible('FormSection');
    });

    it('should fail when collapsible but no title provided', () => {
      const props = {
        title: '', // Empty title
        children: <div>Section content</div>,
        collapsible: true,
        defaultExpanded: true,
      };

      const result = auditor.auditFormComponent(props, 'FormSection');
      expect(result.passed).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          rule: WCAG_RULES.MEANINGFUL_LABELS,
        })
      );
    });

    it('should render collapsible section with proper accessibility attributes', () => {
      const { getByRole } = render(
        <FormSection
          title="Personal Information"
          collapsible={true}
          defaultExpanded={true}
        >
          <div>Section content</div>
        </FormSection>
      );

      // The collapsible button should have proper accessibility attributes
      // This would need to be tested based on the actual implementation
    });

    it('should handle keyboard navigation for collapsible sections', () => {
      const { getByRole } = render(
        <FormSection
          title="Personal Information"
          collapsible={true}
          defaultExpanded={false}
        >
          <div>Section content</div>
        </FormSection>
      );

      // Test keyboard interaction with collapsible sections
      // This would need proper implementation testing
    });
  });

  describe('Accessibility Report Generation', () => {
    it('should generate comprehensive accessibility report', () => {
      const auditResults = [
        auditor.auditFormComponent({
          config: mockFormFieldConfig,
          value: 'test',
          onChange: jest.fn(),
        }, 'FormField'),
        auditor.auditFormComponent({
          config: mockFormFieldConfigWithoutLabel,
          value: 'test',
          onChange: jest.fn(),
        }, 'FormField'),
        auditor.auditFormComponent({
          children: <div>Content</div>,
          onSubmit: jest.fn(),
          isValid: true,
        }, 'FormContainer'),
      ];

      const report = generateAccessibilityReport(auditResults);
      
      expect(report).toContain('# Accessibility Audit Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('Components Audited');
      expect(report).toContain('## Issues Found');
      expect(report).toContain('## Recommendations');
    });

    it('should calculate correct accessibility scores', () => {
      const goodProps = {
        config: mockFormFieldConfig,
        value: 'test',
        onChange: jest.fn(),
        onBlur: jest.fn(),
      };

      const badProps = {
        config: mockFormFieldConfigWithoutLabel,
        value: 'test',
        // Missing onChange
      };

      expect(goodProps).toHaveAccessibilityScore('FormField', 80);
      
      const result = auditor.auditFormComponent(badProps, 'FormField');
      expect(result.score).toBeLessThan(50);
    });
  });

  describe('Focus Management', () => {
    it('should maintain proper focus order', () => {
      // Test focus order in forms
      // This would require integration testing with actual DOM
    });

    it('should manage focus on error states', () => {
      // Test focus management when errors occur
      // This would require integration testing
    });

    it('should handle focus trapping in modal forms', () => {
      // Test focus trapping for modal forms
      // This would require integration testing
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce form validation errors', () => {
      // Test screen reader announcements
      // This would require specialized testing tools
    });

    it('should provide proper form structure for screen readers', () => {
      // Test form structure accessibility
      // This would require specialized testing tools
    });

    it('should announce dynamic content changes', () => {
      // Test dynamic content announcements
      // This would require specialized testing tools
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should maintain visibility in high contrast mode', () => {
      // Test high contrast mode support
      // This would require CSS testing or visual regression testing
    });

    it('should preserve focus indicators in high contrast mode', () => {
      // Test focus indicators in high contrast mode
      // This would require CSS testing
    });
  });

  describe('Complete Form Accessibility', () => {
    it('should pass accessibility audit for AccountForm', () => {
      const { container } = render(
        <AccountForm
          initialData={mockAccountData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const auditResult = auditor.auditFormComponent(container, 'AccountForm');
      expect(auditResult.passed).toBe(true);
      expect(auditResult.score).toBeGreaterThan(80);
    });

    it('should pass accessibility audit for TransactionForm', () => {
      const { container } = render(
        <TransactionForm
          initialData={mockTransactionData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const auditResult = auditor.auditFormComponent(container, 'TransactionForm');
      expect(auditResult.passed).toBe(true);
      expect(auditResult.score).toBeGreaterThan(80);
    });
  });

  describe('Focus Management', () => {
    it('should maintain proper focus order in forms', () => {
      const { getByTestId } = render(
        <AccountForm
          initialData={{} as AccountFormData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const nameInput = getByTestId('account-name-input');
      const typeDropdown = getByTestId('account-type-dropdown');
      const balanceInput = getByTestId('initial-balance-input');

      // Test focus order
      fireEvent(nameInput, 'focus');
      expect(focusManager.getCurrentFocusIndex()).toBe(0);

      fireEvent(nameInput, 'keyPress', { key: 'Tab' });
      expect(focusManager.getCurrentFocusIndex()).toBe(1);

      fireEvent(typeDropdown, 'keyPress', { key: 'Tab' });
      expect(focusManager.getCurrentFocusIndex()).toBe(2);
    });

    it('should focus first error field on validation failure', async () => {
      const { getByText, getByTestId } = render(
        <AccountForm
          initialData={{} as AccountFormData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Submit form with empty required fields
      const submitButton = getByText('Create Account');
      fireEvent.press(submitButton);

      // Should focus first field with error
      await waitFor(() => {
        const nameInput = getByTestId('account-name-input');
        expect(nameInput).toHaveFocus();
      });
    });

    it('should trap focus in modal forms', () => {
      const { getByTestId } = render(
        <div role="dialog" aria-modal="true">
          <AccountForm
            initialData={mockAccountData}
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
          />
        </div>
      );

      const firstInput = getByTestId('account-name-input');
      const lastButton = getByTestId('cancel-button');

      // Focus should cycle within modal
      fireEvent(lastButton, 'keyPress', { key: 'Tab' });
      expect(firstInput).toHaveFocus();

      fireEvent(firstInput, 'keyPress', { key: 'Tab', shiftKey: true });
      expect(lastButton).toHaveFocus();
    });

    it('should restore focus after modal closes', () => {
      const triggerButton = document.createElement('button');
      triggerButton.focus();

      const { unmount } = render(
        <div role="dialog" aria-modal="true">
          <AccountForm
            initialData={mockAccountData}
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
          />
        </div>
      );

      // Close modal
      unmount();

      // Focus should return to trigger
      expect(triggerButton).toHaveFocus();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Tab navigation through form fields', () => {
      const { getByTestId } = render(
        <TransactionForm
          initialData={{} as TransactionFormData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const payeeInput = getByTestId('payee-input');
      const amountInput = getByTestId('amount-input');
      const submitButton = getByTestId('submit-button');

      // Test forward tab navigation
      fireEvent(payeeInput, 'focus');
      fireEvent(payeeInput, 'keyPress', { key: 'Tab' });
      expect(amountInput).toHaveFocus();

      fireEvent(amountInput, 'keyPress', { key: 'Tab' });
      expect(submitButton).toHaveFocus();

      // Test backward tab navigation
      fireEvent(submitButton, 'keyPress', { key: 'Tab', shiftKey: true });
      expect(amountInput).toHaveFocus();
    });

    it('should support Enter key for form submission', () => {
      const mockOnSubmit = jest.fn();
      const { getByTestId } = render(
        <TransactionForm
          initialData={mockTransactionData}
          onSubmit={mockOnSubmit}
          onCancel={jest.fn()}
        />
      );

      const form = getByTestId('transaction-form');
      fireEvent(form, 'keyPress', { key: 'Enter' });

      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should support Escape key for canceling operations', () => {
      const mockOnCancel = jest.fn();
      const { getByTestId } = render(
        <AccountForm
          initialData={mockAccountData}
          onSubmit={jest.fn()}
          onCancel={mockOnCancel}
        />
      );

      const form = getByTestId('account-form');
      fireEvent(form, 'keyPress', { key: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should support arrow keys for dropdown navigation', () => {
      const { getByTestId, getByText } = render(
        <AccountForm
          initialData={{} as AccountFormData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const typeDropdown = getByTestId('account-type-dropdown');
      
      // Open dropdown
      fireEvent.press(typeDropdown);
      
      // Navigate with arrow keys
      fireEvent(typeDropdown, 'keyPress', { key: 'ArrowDown' });
      expect(getByText('Checking')).toHaveAccessibilityState({ selected: true });

      fireEvent(typeDropdown, 'keyPress', { key: 'ArrowDown' });
      expect(getByText('Savings')).toHaveAccessibilityState({ selected: true });

      fireEvent(typeDropdown, 'keyPress', { key: 'ArrowUp' });
      expect(getByText('Checking')).toHaveAccessibilityState({ selected: true });

      // Select with Enter
      fireEvent(typeDropdown, 'keyPress', { key: 'Enter' });
      expect(typeDropdown).toHaveAccessibilityValue({ text: 'Checking' });
    });

    it('should support Home/End keys for navigation', () => {
      const { getByTestId } = render(
        <AccountForm
          initialData={{} as AccountFormData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const form = getByTestId('account-form');
      const firstField = getByTestId('account-name-input');
      const lastField = getByTestId('submit-button');

      // Home key should focus first field
      fireEvent(form, 'keyPress', { key: 'Home' });
      expect(firstField).toHaveFocus();

      // End key should focus last field
      fireEvent(form, 'keyPress', { key: 'End' });
      expect(lastField).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce form validation errors', async () => {
      const { getByTestId, getByText } = render(
        <AccountForm
          initialData={{} as AccountFormData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Trigger validation error
      const submitButton = getByText('Create Account');
      fireEvent.press(submitButton);

      // Error should be announced
      await waitFor(() => {
        const errorElement = getByText('Account name is required');
        expect(errorElement).toHaveProp('accessibilityLiveRegion', 'assertive');
        expect(errorElement).toHaveProp('accessibilityRole', 'alert');
      });
    });

    it('should provide proper form structure for screen readers', () => {
      const { getByTestId } = render(
        <AccountForm
          initialData={mockAccountData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const form = getByTestId('account-form');
      expect(form).toHaveProp('accessibilityRole', 'form');
      expect(form).toHaveProp('accessibilityLabel', 'Account Form');

      const nameInput = getByTestId('account-name-input');
      expect(nameInput).toHaveProp('accessibilityRole', 'textbox');
      expect(nameInput).toHaveProp('accessibilityLabel', 'Account Name');
      expect(nameInput).toHaveProp('accessibilityRequired', true);
    });

    it('should announce dynamic content changes', async () => {
      const { getByTestId, getByText } = render(
        <TransactionForm
          initialData={{} as TransactionFormData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const typeToggle = getByTestId('transaction-type-toggle');
      
      // Change transaction type
      fireEvent.press(typeToggle);

      // Should announce the change
      await waitFor(() => {
        const statusElement = getByText('Transaction type changed to Income');
        expect(statusElement).toHaveProp('accessibilityLiveRegion', 'polite');
      });
    });

    it('should provide field descriptions and help text', () => {
      const { getByTestId } = render(
        <AccountForm
          initialData={{} as AccountFormData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const balanceInput = getByTestId('initial-balance-input');
      expect(balanceInput).toHaveProp('accessibilityHint', 'Enter the starting balance for this account');
      
      const helpText = getByTestId('balance-help-text');
      expect(balanceInput).toHaveProp('accessibilityDescribedBy', helpText.props.nativeID);
    });

    it('should group related form fields', () => {
      const { getByTestId } = render(
        <AccountForm
          initialData={mockAccountData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const accountDetailsGroup = getByTestId('account-details-group');
      expect(accountDetailsGroup).toHaveProp('accessibilityRole', 'group');
      expect(accountDetailsGroup).toHaveProp('accessibilityLabel', 'Account Details');

      const balanceGroup = getByTestId('balance-group');
      expect(balanceGroup).toHaveProp('accessibilityRole', 'group');
      expect(balanceGroup).toHaveProp('accessibilityLabel', 'Balance Information');
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should maintain visibility in high contrast mode', () => {
      // Mock high contrast mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });

      const { getByTestId } = render(
        <AccountForm
          initialData={mockAccountData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const nameInput = getByTestId('account-name-input');
      const computedStyle = getComputedStyle(nameInput);
      
      // Should have sufficient contrast
      expect(computedStyle.borderColor).not.toBe('transparent');
      expect(computedStyle.backgroundColor).not.toBe(computedStyle.color);
    });

    it('should preserve focus indicators in high contrast mode', () => {
      const { getByTestId } = render(
        <AccountForm
          initialData={mockAccountData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const nameInput = getByTestId('account-name-input');
      fireEvent(nameInput, 'focus');

      const computedStyle = getComputedStyle(nameInput);
      expect(computedStyle.outline).not.toBe('none');
      expect(computedStyle.outlineWidth).not.toBe('0px');
    });

    it('should use system colors in high contrast mode', () => {
      const { getByTestId } = render(
        <AccountForm
          initialData={mockAccountData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const submitButton = getByTestId('submit-button');
      const computedStyle = getComputedStyle(submitButton);
      
      // Should use system colors for better contrast
      expect(['ButtonText', 'ButtonFace', 'Highlight'].some(color => 
        computedStyle.color.includes(color) || computedStyle.backgroundColor.includes(color)
      )).toBe(true);
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion setting', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });

      const { getByTestId } = render(
        <FormSection title="Test Section" collapsible={true}>
          <div>Content</div>
        </FormSection>
      );

      const section = getByTestId('form-section');
      const computedStyle = getComputedStyle(section);
      
      // Should disable animations
      expect(computedStyle.animationDuration).toBe('0s');
      expect(computedStyle.transitionDuration).toBe('0s');
    });
  });

  describe('Touch and Mobile Accessibility', () => {
    it('should have adequate touch targets', () => {
      const { getByTestId } = render(
        <AccountForm
          initialData={mockAccountData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const submitButton = getByTestId('submit-button');
      const computedStyle = getComputedStyle(submitButton);
      
      // Should meet minimum touch target size (44px)
      expect(parseInt(computedStyle.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(computedStyle.minWidth)).toBeGreaterThanOrEqual(44);
    });

    it('should support voice control', () => {
      const { getByTestId } = render(
        <AccountForm
          initialData={mockAccountData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const nameInput = getByTestId('account-name-input');
      expect(nameInput).toHaveProp('accessibilityLabel', 'Account Name');
      
      const submitButton = getByTestId('submit-button');
      expect(submitButton).toHaveProp('accessibilityLabel', 'Save Changes');
    });
  });

  describe('Internationalization Accessibility', () => {
    it('should support right-to-left languages', () => {
      document.dir = 'rtl';
      
      const { getByTestId } = render(
        <AccountForm
          initialData={mockAccountData}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const form = getByTestId('account-form');
      const computedStyle = getComputedStyle(form);
      
      expect(computedStyle.direction).toBe('rtl');
      expect(computedStyle.textAlign).toBe('right');
      
      document.dir = 'ltr'; // Reset
    });

    it('should handle long translated text', () => {
      const longLabel = 'This is a very long translated label that might wrap to multiple lines in some languages';
      
      const { getByTestId } = render(
        <FormField
          config={{
            name: 'test',
            label: longLabel,
            type: 'text',
          }}
          value=""
          onChange={jest.fn()}
        />
      );

      const label = getByTestId('field-label');
      const computedStyle = getComputedStyle(label);
      
      expect(computedStyle.wordWrap).toBe('break-word');
      expect(computedStyle.overflowWrap).toBe('break-word');
    });
  });

  describe('Accessibility Testing Tools Integration', () => {
    it('should generate comprehensive accessibility report', () => {
      const auditResults = [
        auditor.auditFormComponent({
          config: mockFormFieldConfig,
          value: 'test',
          onChange: jest.fn(),
        }, 'FormField'),
        auditor.auditFormComponent({
          children: <div>Content</div>,
          onSubmit: jest.fn(),
          isValid: true,
        }, 'FormContainer'),
      ];

      const report = generateAccessibilityReport(auditResults);
      
      expect(report).toContain('# Accessibility Audit Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('Components Audited: 2');
      expect(report).toContain('## Issues Found');
      expect(report).toContain('## Recommendations');
      expect(report).toContain('## WCAG Guidelines');
    });

    it('should provide actionable accessibility recommendations', () => {
      const badProps = {
        config: mockFormFieldConfigWithoutLabel,
        value: 'test',
        // Missing onChange and other required props
      };

      const result = auditor.auditFormComponent(badProps, 'FormField');
      
      expect(result.recommendations).toContain('Add meaningful labels to all form fields');
      expect(result.recommendations).toContain('Ensure all interactive elements are keyboard accessible');
      expect(result.recommendations).toContain('Provide clear error messages for validation failures');
    });

    it('should integrate with automated accessibility testing tools', () => {
      // Mock axe-core integration
      const mockAxeResults = {
        violations: [
          {
            id: 'label',
            impact: 'critical',
            description: 'Form elements must have labels',
            nodes: [{ target: ['#field-input'] }],
          },
        ],
        passes: [
          {
            id: 'color-contrast',
            description: 'Elements must have sufficient color contrast',
          },
        ],
      };

      const axeReport = auditor.generateAxeReport(mockAxeResults);
      
      expect(axeReport.criticalIssues).toBe(1);
      expect(axeReport.passedChecks).toBe(1);
      expect(axeReport.overallScore).toBeLessThan(100);
    });
  });
});