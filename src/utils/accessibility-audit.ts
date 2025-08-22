/**
 * Accessibility audit utilities for form components
 * Provides tools to audit and improve WCAG compliance
 */

export interface AccessibilityIssue {
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  element?: string;
  suggestion?: string;
}

export interface AccessibilityAuditResult {
  passed: boolean;
  issues: AccessibilityIssue[];
  score: number; // 0-100
  wcagLevel: 'AA' | 'AAA' | 'fail';
}

/**
 * WCAG 2.1 compliance rules for form components
 */
export const WCAG_RULES = {
  // Level A rules
  KEYBOARD_ACCESSIBLE: 'keyboard-accessible',
  FOCUS_VISIBLE: 'focus-visible',
  MEANINGFUL_LABELS: 'meaningful-labels',
  ERROR_IDENTIFICATION: 'error-identification',
  
  // Level AA rules
  CONTRAST_RATIO: 'contrast-ratio',
  RESIZE_TEXT: 'resize-text',
  FOCUS_ORDER: 'focus-order',
  ERROR_SUGGESTION: 'error-suggestion',
  
  // Level AAA rules
  CONTEXT_HELP: 'context-help',
  ERROR_PREVENTION: 'error-prevention',
  FOCUS_MANAGEMENT: 'focus-management',
} as const;

/**
 * Accessibility audit for form components
 */
export class FormAccessibilityAuditor {
  private issues: AccessibilityIssue[] = [];

  /**
   * Audit a form component for accessibility issues
   */
  auditFormComponent(componentProps: any, componentType: string): AccessibilityAuditResult {
    this.issues = [];

    // Audit based on component type
    switch (componentType) {
      case 'FormField':
        this.auditFormField(componentProps);
        break;
      case 'FormContainer':
        this.auditFormContainer(componentProps);
        break;
      case 'FormSection':
        this.auditFormSection(componentProps);
        break;
      default:
        this.addIssue('warning', 'unknown-component', `Unknown component type: ${componentType}`);
    }

    return this.generateResult();
  }

  /**
   * Audit FormField component
   */
  private auditFormField(props: any): void {
    const { config, value, error, touched, onChange, onBlur } = props;

    // Check for meaningful labels
    if (!config?.label || config.label.trim().length === 0) {
      this.addIssue('error', WCAG_RULES.MEANINGFUL_LABELS, 
        'Form field must have a meaningful label',
        'FormField',
        'Add a descriptive label to the field configuration'
      );
    }

    // Check for required field indication
    if (config?.required && config.label && !config.label.includes('*') && !config.label.toLowerCase().includes('required')) {
      this.addIssue('warning', WCAG_RULES.MEANINGFUL_LABELS,
        'Required fields should be clearly indicated',
        'FormField',
        'Add visual indication (e.g., asterisk) or "required" text to the label'
      );
    }

    // Check for error identification
    if (error && touched) {
      if (!error || error.trim().length === 0) {
        this.addIssue('error', WCAG_RULES.ERROR_IDENTIFICATION,
          'Error messages must be descriptive and helpful',
          'FormField',
          'Provide clear, specific error messages that help users understand and fix the issue'
        );
      }
    }

    // Check for keyboard accessibility
    if (!onChange) {
      this.addIssue('error', WCAG_RULES.KEYBOARD_ACCESSIBLE,
        'Form field must be keyboard accessible',
        'FormField',
        'Ensure onChange handler is provided for keyboard interaction'
      );
    }

    // Check for focus management
    if (config?.type === 'text' || config?.type === 'textarea') {
      if (!onBlur) {
        this.addIssue('info', WCAG_RULES.FOCUS_MANAGEMENT,
          'Consider adding onBlur handler for better focus management',
          'FormField',
          'Add onBlur handler to validate field when user leaves it'
        );
      }
    }

    // Check for placeholder accessibility
    if (config?.placeholder && (!config?.label || config.label === config.placeholder)) {
      this.addIssue('warning', WCAG_RULES.MEANINGFUL_LABELS,
        'Placeholder text should not replace proper labels',
        'FormField',
        'Use placeholder as additional help text, not as the primary label'
      );
    }
  }

  /**
   * Audit FormContainer component
   */
  private auditFormContainer(props: any): void {
    const { children, onSubmit, isValid, submitLabel, showReset, onReset } = props;

    // Check for form submission
    if (!onSubmit) {
      this.addIssue('error', WCAG_RULES.KEYBOARD_ACCESSIBLE,
        'Form must have a submission handler',
        'FormContainer',
        'Provide onSubmit handler for form submission'
      );
    }

    // Check for submit button label
    if (!submitLabel || submitLabel.trim().length === 0) {
      this.addIssue('warning', WCAG_RULES.MEANINGFUL_LABELS,
        'Submit button should have a descriptive label',
        'FormContainer',
        'Provide a clear, action-oriented submit button label'
      );
    }

    // Check for reset functionality
    if (showReset && !onReset) {
      this.addIssue('error', WCAG_RULES.KEYBOARD_ACCESSIBLE,
        'Reset button must have a handler',
        'FormContainer',
        'Provide onReset handler when showReset is true'
      );
    }

    // Check for form validation feedback
    if (typeof isValid !== 'boolean') {
      this.addIssue('warning', WCAG_RULES.ERROR_IDENTIFICATION,
        'Form validation state should be clearly indicated',
        'FormContainer',
        'Provide boolean isValid prop to indicate form validation state'
      );
    }
  }

  /**
   * Audit FormSection component
   */
  private auditFormSection(props: any): void {
    const { title, children, collapsible, defaultExpanded } = props;

    // Check for section title
    if (collapsible && (!title || title.trim().length === 0)) {
      this.addIssue('error', WCAG_RULES.MEANINGFUL_LABELS,
        'Collapsible sections must have descriptive titles',
        'FormSection',
        'Provide a clear title for collapsible form sections'
      );
    }

    // Check for default state of collapsible sections
    if (collapsible && typeof defaultExpanded !== 'boolean') {
      this.addIssue('info', WCAG_RULES.FOCUS_MANAGEMENT,
        'Collapsible sections should have explicit default state',
        'FormSection',
        'Set defaultExpanded prop to control initial visibility'
      );
    }

    // Check for content
    if (!children) {
      this.addIssue('warning', 'content-structure',
        'Form section should contain form fields or content',
        'FormSection',
        'Ensure section contains relevant form fields or content'
      );
    }
  }

  /**
   * Add an accessibility issue
   */
  private addIssue(
    severity: AccessibilityIssue['severity'],
    rule: string,
    message: string,
    element?: string,
    suggestion?: string
  ): void {
    this.issues.push({
      severity,
      rule,
      message,
      element,
      suggestion,
    });
  }

  /**
   * Generate audit result
   */
  private generateResult(): AccessibilityAuditResult {
    const errorCount = this.issues.filter(issue => issue.severity === 'error').length;
    const warningCount = this.issues.filter(issue => issue.severity === 'warning').length;
    const infoCount = this.issues.filter(issue => issue.severity === 'info').length;

    // Calculate score (errors are weighted more heavily)
    const totalIssues = errorCount * 3 + warningCount * 2 + infoCount * 1;
    const maxPossibleIssues = 20; // Arbitrary max for scoring
    const score = Math.max(0, Math.round(100 - (totalIssues / maxPossibleIssues) * 100));

    // Determine WCAG level
    let wcagLevel: AccessibilityAuditResult['wcagLevel'];
    if (errorCount === 0 && warningCount === 0) {
      wcagLevel = 'AAA';
    } else if (errorCount === 0) {
      wcagLevel = 'AA';
    } else {
      wcagLevel = 'fail';
    }

    return {
      passed: errorCount === 0,
      issues: this.issues,
      score,
      wcagLevel,
    };
  }
}

/**
 * Quick accessibility check for form props
 */
export function quickAccessibilityCheck(componentProps: any, componentType: string): boolean {
  const auditor = new FormAccessibilityAuditor();
  const result = auditor.auditFormComponent(componentProps, componentType);
  return result.passed;
}

/**
 * Generate accessibility report
 */
export function generateAccessibilityReport(auditResults: AccessibilityAuditResult[]): string {
  const totalComponents = auditResults.length;
  const passedComponents = auditResults.filter(result => result.passed).length;
  const averageScore = auditResults.reduce((sum, result) => sum + result.score, 0) / totalComponents;

  const allIssues = auditResults.flatMap(result => result.issues);
  const errorCount = allIssues.filter(issue => issue.severity === 'error').length;
  const warningCount = allIssues.filter(issue => issue.severity === 'warning').length;
  const infoCount = allIssues.filter(issue => issue.severity === 'info').length;

  let report = `# Accessibility Audit Report\n\n`;
  report += `## Summary\n`;
  report += `- **Components Audited**: ${totalComponents}\n`;
  report += `- **Components Passed**: ${passedComponents} (${Math.round((passedComponents / totalComponents) * 100)}%)\n`;
  report += `- **Average Score**: ${Math.round(averageScore)}/100\n\n`;

  report += `## Issues Found\n`;
  report += `- **Errors**: ${errorCount} (must fix)\n`;
  report += `- **Warnings**: ${warningCount} (should fix)\n`;
  report += `- **Info**: ${infoCount} (consider fixing)\n\n`;

  if (allIssues.length > 0) {
    report += `## Detailed Issues\n\n`;
    
    // Group issues by severity
    const issuesBySeverity = {
      error: allIssues.filter(issue => issue.severity === 'error'),
      warning: allIssues.filter(issue => issue.severity === 'warning'),
      info: allIssues.filter(issue => issue.severity === 'info'),
    };

    Object.entries(issuesBySeverity).forEach(([severity, issues]) => {
      if (issues.length > 0) {
        report += `### ${severity.toUpperCase()} Issues\n\n`;
        issues.forEach((issue, index) => {
          report += `${index + 1}. **${issue.rule}** (${issue.element || 'Unknown'})\n`;
          report += `   - ${issue.message}\n`;
          if (issue.suggestion) {
            report += `   - *Suggestion*: ${issue.suggestion}\n`;
          }
          report += `\n`;
        });
      }
    });
  }

  report += `## Recommendations\n\n`;
  if (errorCount > 0) {
    report += `- **Priority 1**: Fix all error-level issues to meet basic accessibility standards\n`;
  }
  if (warningCount > 0) {
    report += `- **Priority 2**: Address warning-level issues to improve user experience\n`;
  }
  if (infoCount > 0) {
    report += `- **Priority 3**: Consider info-level suggestions for enhanced accessibility\n`;
  }

  return report;
}

/**
 * Accessibility testing utilities for Jest
 */
export const accessibilityMatchers = {
  toBeAccessible: (received: any, componentType: string) => {
    const auditor = new FormAccessibilityAuditor();
    const result = auditor.auditFormComponent(received, componentType);
    
    return {
      pass: result.passed,
      message: () => {
        if (result.passed) {
          return `Expected component to fail accessibility audit, but it passed with score ${result.score}/100`;
        } else {
          const errorMessages = result.issues
            .filter(issue => issue.severity === 'error')
            .map(issue => `- ${issue.message}`)
            .join('\n');
          return `Expected component to pass accessibility audit, but it failed:\n${errorMessages}`;
        }
      },
    };
  },

  toHaveAccessibilityScore: (received: any, componentType: string, expectedScore: number) => {
    const auditor = new FormAccessibilityAuditor();
    const result = auditor.auditFormComponent(received, componentType);
    
    return {
      pass: result.score >= expectedScore,
      message: () => {
        return `Expected accessibility score to be at least ${expectedScore}, but got ${result.score}`;
      },
    };
  },
};

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(componentType: string): R;
      toHaveAccessibilityScore(componentType: string, expectedScore: number): R;
    }
  }
}