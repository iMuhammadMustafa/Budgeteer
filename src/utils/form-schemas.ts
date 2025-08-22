/**
 * Pre-built validation schemas for form components
 * This file contains validation schemas for each form type in the application
 */

import { ValidationSchema } from '../types/components/forms.types';
import {
  AccountFormData,
  TransactionFormData,
  TransactionCategoryFormData,
  TransactionGroupFormData,
  AccountCategoryFormData,
  ConfigurationFormData,
  MultipleTransactionsFormData,
  MultipleTransactionItemData,
} from '../types/components/forms.types';
import {
  commonValidationRules,
  createAccountNameValidation,
  createAmountValidation,
  createDateValidation,
  createCategoryNameValidation,
  createDescriptionValidation,
  positiveAmountValidator,
  safeStringValidator,
} from './form-validation';

// ============================================================================
// Account Form Validation Schema
// ============================================================================

export const accountFormValidationSchema: ValidationSchema<AccountFormData> = {
  name: createAccountNameValidation(),
  
  balance: [
    commonValidationRules.required('Initial balance is required'),
    commonValidationRules.custom(
      (value: number) => !isNaN(value) && isFinite(value),
      'Balance must be a valid number'
    ),
  ],
  
  categoryid: [
    commonValidationRules.required('Account category is required'),
  ],
  
  description: createDescriptionValidation(false),
  
  displayorder: [
    commonValidationRules.min(0, 'Display order must be 0 or greater'),
  ],
};

// ============================================================================
// Transaction Form Validation Schema
// ============================================================================

export const transactionFormValidationSchema: ValidationSchema<TransactionFormData> = {
  name: [
    commonValidationRules.required('Transaction name is required'),
    commonValidationRules.minLength(2, 'Transaction name must be at least 2 characters'),
    commonValidationRules.maxLength(100, 'Transaction name must be no more than 100 characters'),
    commonValidationRules.custom(safeStringValidator, 'Transaction name contains invalid characters'),
  ],
  
  payee: [
    commonValidationRules.maxLength(100, 'Payee must be no more than 100 characters'),
    commonValidationRules.custom(safeStringValidator, 'Payee contains invalid characters'),
  ],
  
  description: createDescriptionValidation(false),
  
  date: createDateValidation(),
  
  amount: createAmountValidation(),
  
  type: [
    commonValidationRules.required('Transaction type is required'),
    commonValidationRules.custom(
      (value: string) => ['Income', 'Expense', 'Transfer'].includes(value),
      'Transaction type must be Income, Expense, or Transfer'
    ),
  ],
  
  accountid: [
    commonValidationRules.required('Account is required'),
  ],
  
  categoryid: [
    commonValidationRules.required('Category is required'),
  ],
  
  tags: [
    commonValidationRules.custom(
      (value: string[] | null) => {
        if (!value) return true;
        return value.every(tag => typeof tag === 'string' && tag.length <= 50);
      },
      'Each tag must be no more than 50 characters'
    ),
  ],
};

// ============================================================================
// Transaction Category Form Validation Schema
// ============================================================================

export const transactionCategoryFormValidationSchema: ValidationSchema<TransactionCategoryFormData> = {
  name: createCategoryNameValidation(),
  
  color: [
    commonValidationRules.required('Color is required'),
    commonValidationRules.pattern(
      /^#[0-9A-Fa-f]{6}$/,
      'Color must be a valid hex color code'
    ),
  ],
  
  icon: [
    commonValidationRules.required('Icon is required'),
    commonValidationRules.minLength(1, 'Icon is required'),
  ],
  
  groupid: [
    commonValidationRules.required('Transaction group is required'),
  ],
  
  displayorder: [
    commonValidationRules.min(0, 'Display order must be 0 or greater'),
  ],
};

// ============================================================================
// Transaction Group Form Validation Schema
// ============================================================================

export const transactionGroupFormValidationSchema: ValidationSchema<TransactionGroupFormData> = {
  name: createCategoryNameValidation(),
  
  color: [
    commonValidationRules.required('Color is required'),
    commonValidationRules.pattern(
      /^#[0-9A-Fa-f]{6}$/,
      'Color must be a valid hex color code'
    ),
  ],
  
  icon: [
    commonValidationRules.required('Icon is required'),
    commonValidationRules.minLength(1, 'Icon is required'),
  ],
  
  type: [
    commonValidationRules.required('Transaction type is required'),
    commonValidationRules.custom(
      (value: string) => ['Income', 'Expense'].includes(value),
      'Transaction type must be Income or Expense'
    ),
  ],
  
  displayorder: [
    commonValidationRules.min(0, 'Display order must be 0 or greater'),
  ],
  
  budgetamount: [
    commonValidationRules.custom(
      (value: number | null) => {
        if (value === null || value === undefined) return true;
        return value >= 0;
      },
      'Budget amount must be 0 or greater'
    ),
  ],
  
  budgetfrequency: [
    commonValidationRules.required('Budget frequency is required'),
  ],
};

// ============================================================================
// Account Category Form Validation Schema
// ============================================================================

export const accountCategoryFormValidationSchema: ValidationSchema<AccountCategoryFormData> = {
  name: createCategoryNameValidation(),
  
  color: [
    commonValidationRules.required('Color is required'),
    commonValidationRules.pattern(
      /^#[0-9A-Fa-f]{6}$/,
      'Color must be a valid hex color code'
    ),
  ],
  
  icon: [
    commonValidationRules.required('Icon is required'),
    commonValidationRules.minLength(1, 'Icon is required'),
  ],
  
  type: [
    commonValidationRules.required('Account type is required'),
  ],
  
  displayorder: [
    commonValidationRules.min(0, 'Display order must be 0 or greater'),
  ],
};

// ============================================================================
// Configuration Form Validation Schema
// ============================================================================

export const configurationFormValidationSchema: ValidationSchema<ConfigurationFormData> = {
  table: [
    commonValidationRules.required('Table is required'),
    commonValidationRules.minLength(1, 'Table name cannot be empty'),
    commonValidationRules.maxLength(50, 'Table name must be no more than 50 characters'),
  ],
  
  type: [
    commonValidationRules.required('Type is required'),
    commonValidationRules.minLength(1, 'Type cannot be empty'),
    commonValidationRules.maxLength(50, 'Type must be no more than 50 characters'),
  ],
  
  key: [
    commonValidationRules.required('Key is required'),
    commonValidationRules.minLength(1, 'Key cannot be empty'),
    commonValidationRules.maxLength(100, 'Key must be no more than 100 characters'),
  ],
  
  value: [
    commonValidationRules.required('Value is required'),
    commonValidationRules.maxLength(1000, 'Value must be no more than 1000 characters'),
  ],
};

// ============================================================================
// Multiple Transactions Form Validation Schema
// ============================================================================

export const multipleTransactionItemValidationSchema: ValidationSchema<MultipleTransactionItemData> = {
  name: [
    commonValidationRules.required('Transaction name is required'),
    commonValidationRules.minLength(2, 'Transaction name must be at least 2 characters'),
    commonValidationRules.maxLength(100, 'Transaction name must be no more than 100 characters'),
    commonValidationRules.custom(safeStringValidator, 'Transaction name contains invalid characters'),
  ],
  
  amount: createAmountValidation(),
  
  categoryid: [
    commonValidationRules.required('Category is required'),
  ],
  
  notes: createDescriptionValidation(false),
  
  tags: [
    commonValidationRules.custom(
      (value: string[] | null) => {
        if (!value) return true;
        return value.every(tag => typeof tag === 'string' && tag.length <= 50);
      },
      'Each tag must be no more than 50 characters'
    ),
  ],
};

export const multipleTransactionsFormValidationSchema: ValidationSchema<MultipleTransactionsFormData> = {
  payee: [
    commonValidationRules.maxLength(100, 'Payee must be no more than 100 characters'),
    commonValidationRules.custom(safeStringValidator, 'Payee contains invalid characters'),
  ],
  
  date: createDateValidation(),
  
  description: createDescriptionValidation(false),
  
  type: [
    commonValidationRules.required('Transaction type is required'),
    commonValidationRules.custom(
      (value: string) => ['Income', 'Expense'].includes(value),
      'Transaction type must be Income or Expense'
    ),
  ],
  
  accountid: [
    commonValidationRules.required('Account is required'),
  ],
  
  transactions: [
    commonValidationRules.required('At least one transaction is required'),
    commonValidationRules.custom(
      (value: Record<string, MultipleTransactionItemData>) => {
        if (!value || typeof value !== 'object') return false;
        const transactionIds = Object.keys(value);
        return transactionIds.length > 0;
      },
      'At least one transaction is required'
    ),
    commonValidationRules.custom(
      (value: Record<string, MultipleTransactionItemData>) => {
        if (!value || typeof value !== 'object') return true;
        
        // Validate each transaction item
        for (const transactionId in value) {
          const transaction = value[transactionId];
          
          // Validate transaction name
          if (!transaction.name || transaction.name.trim().length < 2) {
            return false;
          }
          
          // Validate amount
          if (!transaction.amount || transaction.amount <= 0) {
            return false;
          }
          
          // Validate category
          if (!transaction.categoryid) {
            return false;
          }
        }
        
        return true;
      },
      'All transactions must have valid name, amount, and category'
    ),
  ],
};

// ============================================================================
// Validation Schema Registry
// ============================================================================

/**
 * Registry of all validation schemas for easy access
 */
export const validationSchemas = {
  account: accountFormValidationSchema,
  transaction: transactionFormValidationSchema,
  transactionCategory: transactionCategoryFormValidationSchema,
  transactionGroup: transactionGroupFormValidationSchema,
  accountCategory: accountCategoryFormValidationSchema,
  configuration: configurationFormValidationSchema,
  multipleTransactions: multipleTransactionsFormValidationSchema,
  multipleTransactionItem: multipleTransactionItemValidationSchema,
} as const;

/**
 * Type for validation schema keys
 */
export type ValidationSchemaKey = keyof typeof validationSchemas;

/**
 * Get validation schema by key
 */
export const getValidationSchema = <T extends ValidationSchemaKey>(
  key: T
): typeof validationSchemas[T] => {
  return validationSchemas[key];
};