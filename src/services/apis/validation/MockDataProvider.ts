/**
 * Mock Data Provider for Referential Integrity Validation
 * 
 * This provider implements the IDataProvider interface for the mock storage mode,
 * allowing the referential integrity validator to work with in-memory mock data.
 */

import { IDataProvider } from './ReferentialIntegrityValidator';
import {
  accounts,
  accountCategories,
  transactions,
  transactionCategories,
  transactionGroups,
  recurrings,
  configurations
} from '../__mock__/mockDataStore';

import { Database } from "@/src/types/db/database.types";

type Tables = Database['public']['Tables'];
type AccountRow = Tables['accounts']['Row'];
type AccountCategoryRow = Tables['accountcategories']['Row'];
type TransactionRow = Tables['transactions']['Row'];
type TransactionCategoryRow = Tables['transactioncategories']['Row'];
type TransactionGroupRow = Tables['transactiongroups']['Row'];
type RecurringRow = Tables['recurrings']['Row'];
type ConfigurationRow = Tables['configurations']['Row'];

export class MockDataProvider implements IDataProvider {
  
  // Core data access methods
  async getAccountCategories(tenantId: string): Promise<AccountCategoryRow[]> {
    return accountCategories.filter(cat => cat.tenantid === tenantId && !cat.isdeleted);
  }

  async getAccounts(tenantId: string): Promise<AccountRow[]> {
    return accounts.filter(acc => acc.tenantid === tenantId && !acc.isdeleted);
  }

  async getTransactions(tenantId: string): Promise<TransactionRow[]> {
    return transactions.filter(tr => tr.tenantid === tenantId && !tr.isdeleted);
  }

  async getTransactionCategories(tenantId: string): Promise<TransactionCategoryRow[]> {
    return transactionCategories.filter(cat => cat.tenantid === tenantId && !cat.isdeleted);
  }

  async getTransactionGroups(tenantId: string): Promise<TransactionGroupRow[]> {
    return transactionGroups.filter(group => group.tenantid === tenantId && !group.isdeleted);
  }

  async getRecurrings(tenantId: string): Promise<RecurringRow[]> {
    return recurrings.filter(rec => rec.tenantid === tenantId && !rec.isdeleted);
  }

  async getConfigurations(tenantId: string): Promise<ConfigurationRow[]> {
    return configurations.filter(conf => conf.tenantid === tenantId && !conf.isdeleted);
  }

  // Single record access methods
  async getAccountCategoryById(id: string): Promise<AccountCategoryRow | null> {
    return accountCategories.find(cat => cat.id === id) || null;
  }

  async getAccountById(id: string): Promise<AccountRow | null> {
    return accounts.find(acc => acc.id === id) || null;
  }

  async getTransactionById(id: string): Promise<TransactionRow | null> {
    return transactions.find(tr => tr.id === id) || null;
  }

  async getTransactionCategoryById(id: string): Promise<TransactionCategoryRow | null> {
    return transactionCategories.find(cat => cat.id === id) || null;
  }

  async getTransactionGroupById(id: string): Promise<TransactionGroupRow | null> {
    return transactionGroups.find(group => group.id === id) || null;
  }

  async getRecurringById(id: string): Promise<RecurringRow | null> {
    return recurrings.find(rec => rec.id === id) || null;
  }

  async getConfigurationById(id: string): Promise<ConfigurationRow | null> {
    return configurations.find(conf => conf.id === id) || null;
  }
}