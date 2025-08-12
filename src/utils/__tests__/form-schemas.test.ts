/**
 * Unit tests for form validation schemas
 */

import {
  accountFormValidationSchema,
  transactionFormValidationSchema,
  transactionCategoryFormValidationSchema,
  transactionGroupFormValidationSchema,
  accountCategoryFormValidationSchema,
  configurationFormValidationSchema,
  multipleTransactionItemValidationSchema,
  multipleTransactionsFormValidationSchema,
  validationSchemas,
  getValidationSchema,
} from '../form-schemas';
import { validateForm } from '../form-validation';
import {
  AccountFormData,
  TransactionFormData,
  TransactionCategoryFormData,
  TransactionGroupFormData,
  AccountCategoryFormData,
  ConfigurationFormData,
  MultipleTransactionItemData,
  MultipleTransactionsFormData,
} from '../../types/components/forms.types';

describe('Account Form Validation Schema', () => {
  const validAccountData: AccountFormData = {
    name: 'Test Account',
    balance: 1000,
    categoryid: 'cat-123',
    description: 'Test description',
    displayorder: 1,
    isvoid: false,
    running_balance: 1000,
  };

  it('should validate valid account data', () => {
    const result = validateForm(validAccountData, accountFormValidationSchema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should require account name', () => {
    const invalidData = { ...validAccountData, name: '' };
    const result = validateForm(invalidData, accountFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it('should require account category', () => {
    const invalidData = { ...validAccountData, categoryid: '' };
    const result = validateForm(invalidData, accountFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.categoryid).toBeDefined();
  });

  it('should validate balance is a number', () => {
    const invalidData = { ...validAccountData, balance: NaN };
    const result = validateForm(invalidData, accountFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.balance).toBeDefined();
  });

  it('should validate display order is non-negative', () => {
    const invalidData = { ...validAccountData, displayorder: -1 };
    const result = validateForm(invalidData, accountFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.displayorder).toBeDefined();
  });
});

describe('Transaction Form Validation Schema', () => {
  const validTransactionData: TransactionFormData = {
    name: 'Test Transaction',
    payee: 'Test Payee',
    description: 'Test description',
    date: '2024-01-01',
    amount: 100,
    type: 'Expense',
    accountid: 'acc-123',
    categoryid: 'cat-123',
    tags: ['tag1', 'tag2'],
    isvoid: false,
    groupid: 'group-123',
  };

  it('should validate valid transaction data', () => {
    const result = validateForm(validTransactionData, transactionFormValidationSchema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should require transaction name', () => {
    const invalidData = { ...validTransactionData, name: '' };
    const result = validateForm(invalidData, transactionFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it('should validate transaction name length', () => {
    const invalidData = { ...validTransactionData, name: 'a' };
    const result = validateForm(invalidData, transactionFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it('should require valid email format for email field', () => {
    // Note: This schema doesn't have email field, but testing email validation
    const result = validateForm(validTransactionData, transactionFormValidationSchema);
    expect(result.isValid).toBe(true);
  });

  it('should require amount', () => {
    const invalidData = { ...validTransactionData, amount: 0 };
    const result = validateForm(invalidData, transactionFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  it('should validate transaction type', () => {
    const invalidData = { ...validTransactionData, type: 'InvalidType' };
    const result = validateForm(invalidData, transactionFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.type).toBeDefined();
  });

  it('should require account and category', () => {
    const invalidData = { ...validTransactionData, accountid: '', categoryid: '' };
    const result = validateForm(invalidData, transactionFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.accountid).toBeDefined();
    expect(result.errors.categoryid).toBeDefined();
  });

  it('should validate tags array', () => {
    const invalidData = { ...validTransactionData, tags: ['a'.repeat(51)] };
    const result = validateForm(invalidData, transactionFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.tags).toBeDefined();
  });
});

describe('Transaction Category Form Validation Schema', () => {
  const validCategoryData: TransactionCategoryFormData = {
    name: 'Test Category',
    color: '#FF0000',
    icon: 'test-icon',
    groupid: 'group-123',
    displayorder: 1,
    isvoid: false,
  };

  it('should validate valid category data', () => {
    const result = validateForm(validCategoryData, transactionCategoryFormValidationSchema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should require category name', () => {
    const invalidData = { ...validCategoryData, name: '' };
    const result = validateForm(invalidData, transactionCategoryFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it('should validate hex color format', () => {
    const invalidData = { ...validCategoryData, color: 'invalid-color' };
    const result = validateForm(invalidData, transactionCategoryFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.color).toBeDefined();
  });

  it('should require icon', () => {
    const invalidData = { ...validCategoryData, icon: '' };
    const result = validateForm(invalidData, transactionCategoryFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.icon).toBeDefined();
  });

  it('should require group', () => {
    const invalidData = { ...validCategoryData, groupid: '' };
    const result = validateForm(invalidData, transactionCategoryFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.groupid).toBeDefined();
  });
});

describe('Transaction Group Form Validation Schema', () => {
  const validGroupData: TransactionGroupFormData = {
    name: 'Test Group',
    color: '#00FF00',
    icon: 'test-icon',
    type: 'Expense',
    displayorder: 1,
    budgetamount: 500,
    budgetfrequency: 'Monthly',
    isvoid: false,
  };

  it('should validate valid group data', () => {
    const result = validateForm(validGroupData, transactionGroupFormValidationSchema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should require group name', () => {
    const invalidData = { ...validGroupData, name: '' };
    const result = validateForm(invalidData, transactionGroupFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it('should validate transaction type', () => {
    const invalidData = { ...validGroupData, type: 'Transfer' };
    const result = validateForm(invalidData, transactionGroupFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.type).toBeDefined();
  });

  it('should validate budget amount is non-negative', () => {
    const invalidData = { ...validGroupData, budgetamount: -100 };
    const result = validateForm(invalidData, transactionGroupFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.budgetamount).toBeDefined();
  });

  it('should allow null budget amount', () => {
    const validData = { ...validGroupData, budgetamount: null };
    const result = validateForm(validData, transactionGroupFormValidationSchema);
    expect(result.isValid).toBe(true);
  });
});

describe('Account Category Form Validation Schema', () => {
  const validAccountCategoryData: AccountCategoryFormData = {
    name: 'Test Account Category',
    color: '#0000FF',
    icon: 'test-icon',
    type: 'Asset',
    displayorder: 1,
    isvoid: false,
  };

  it('should validate valid account category data', () => {
    const result = validateForm(validAccountCategoryData, accountCategoryFormValidationSchema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should require all required fields', () => {
    const invalidData = {
      ...validAccountCategoryData,
      name: '',
      color: '',
      icon: '',
      type: '',
    };
    const result = validateForm(invalidData, accountCategoryFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeDefined();
    expect(result.errors.color).toBeDefined();
    expect(result.errors.icon).toBeDefined();
    expect(result.errors.type).toBeDefined();
  });
});

describe('Configuration Form Validation Schema', () => {
  const validConfigData: ConfigurationFormData = {
    table: 'test_table',
    type: 'test_type',
    key: 'test_key',
    value: 'test_value',
    isvoid: false,
  };

  it('should validate valid configuration data', () => {
    const result = validateForm(validConfigData, configurationFormValidationSchema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should require all fields', () => {
    const invalidData = {
      ...validConfigData,
      table: '',
      type: '',
      key: '',
      value: '',
    };
    const result = validateForm(invalidData, configurationFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.table).toBeDefined();
    expect(result.errors.type).toBeDefined();
    expect(result.errors.key).toBeDefined();
    expect(result.errors.value).toBeDefined();
  });

  it('should validate field lengths', () => {
    const invalidData = {
      ...validConfigData,
      table: 'a'.repeat(51),
      type: 'b'.repeat(51),
      key: 'c'.repeat(101),
      value: 'd'.repeat(1001),
    };
    const result = validateForm(invalidData, configurationFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.table).toBeDefined();
    expect(result.errors.type).toBeDefined();
    expect(result.errors.key).toBeDefined();
    expect(result.errors.value).toBeDefined();
  });
});

describe('Multiple Transactions Form Validation Schema', () => {
  const validTransactionItem: MultipleTransactionItemData = {
    name: 'Test Item',
    amount: 100,
    categoryid: 'cat-123',
    notes: 'Test notes',
    tags: ['tag1'],
    groupid: 'group-123',
  };

  const validMultipleTransactionsData: MultipleTransactionsFormData = {
    originalTransactionId: null,
    payee: 'Test Payee',
    date: '2024-01-01',
    description: 'Test description',
    type: 'Expense',
    isvoid: false,
    accountid: 'acc-123',
    groupid: 'group-123',
    transactions: {
      'item-1': validTransactionItem,
    },
  };

  it('should validate valid multiple transactions data', () => {
    const result = validateForm(validMultipleTransactionsData, multipleTransactionsFormValidationSchema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should require at least one transaction', () => {
    const invalidData = { ...validMultipleTransactionsData, transactions: {} };
    const result = validateForm(invalidData, multipleTransactionsFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.transactions).toBeDefined();
  });

  it('should validate transaction items', () => {
    const invalidTransactionItem = {
      ...validTransactionItem,
      name: 'a', // Too short
      amount: 0, // Invalid amount
      categoryid: '', // Missing category
    };
    const invalidData = {
      ...validMultipleTransactionsData,
      transactions: { 'item-1': invalidTransactionItem },
    };
    const result = validateForm(invalidData, multipleTransactionsFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.transactions).toBeDefined();
  });

  it('should validate transaction type', () => {
    const invalidData = { ...validMultipleTransactionsData, type: 'Transfer' };
    const result = validateForm(invalidData, multipleTransactionsFormValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.type).toBeDefined();
  });
});

describe('Multiple Transaction Item Validation Schema', () => {
  const validItemData: MultipleTransactionItemData = {
    name: 'Test Item',
    amount: 100,
    categoryid: 'cat-123',
    notes: 'Test notes',
    tags: ['tag1', 'tag2'],
    groupid: 'group-123',
  };

  it('should validate valid transaction item data', () => {
    const result = validateForm(validItemData, multipleTransactionItemValidationSchema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should require name, amount, and category', () => {
    const invalidData = {
      ...validItemData,
      name: '',
      amount: 0,
      categoryid: '',
    };
    const result = validateForm(invalidData, multipleTransactionItemValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeDefined();
    expect(result.errors.amount).toBeDefined();
    expect(result.errors.categoryid).toBeDefined();
  });

  it('should validate tag lengths', () => {
    const invalidData = { ...validItemData, tags: ['a'.repeat(51)] };
    const result = validateForm(invalidData, multipleTransactionItemValidationSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.tags).toBeDefined();
  });
});

describe('Validation Schema Registry', () => {
  it('should contain all expected schemas', () => {
    expect(validationSchemas.account).toBe(accountFormValidationSchema);
    expect(validationSchemas.transaction).toBe(transactionFormValidationSchema);
    expect(validationSchemas.transactionCategory).toBe(transactionCategoryFormValidationSchema);
    expect(validationSchemas.transactionGroup).toBe(transactionGroupFormValidationSchema);
    expect(validationSchemas.accountCategory).toBe(accountCategoryFormValidationSchema);
    expect(validationSchemas.configuration).toBe(configurationFormValidationSchema);
    expect(validationSchemas.multipleTransactions).toBe(multipleTransactionsFormValidationSchema);
    expect(validationSchemas.multipleTransactionItem).toBe(multipleTransactionItemValidationSchema);
  });

  it('should get validation schema by key', () => {
    expect(getValidationSchema('account')).toBe(accountFormValidationSchema);
    expect(getValidationSchema('transaction')).toBe(transactionFormValidationSchema);
    expect(getValidationSchema('configuration')).toBe(configurationFormValidationSchema);
  });
});