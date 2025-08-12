import Dexie, { Table } from 'dexie';
import { Database } from '@/src/types/db/database.types';

// Type definitions for our local database tables
export type LocalAccount = Database['public']['Tables']['accounts']['Row'];
export type LocalAccountCategory = Database['public']['Tables']['accountcategories']['Row'];
export type LocalTransaction = Database['public']['Tables']['transactions']['Row'];
export type LocalTransactionCategory = Database['public']['Tables']['transactioncategories']['Row'];
export type LocalTransactionGroup = Database['public']['Tables']['transactiongroups']['Row'];
export type LocalConfiguration = Database['public']['Tables']['configurations']['Row'];
export type LocalRecurring = Database['public']['Tables']['recurrings']['Row'];

export class BudgeteerDatabase extends Dexie {
  // Table declarations
  accounts!: Table<LocalAccount>;
  accountcategories!: Table<LocalAccountCategory>;
  transactions!: Table<LocalTransaction>;
  transactioncategories!: Table<LocalTransactionCategory>;
  transactiongroups!: Table<LocalTransactionGroup>;
  configurations!: Table<LocalConfiguration>;
  recurrings!: Table<LocalRecurring>;

  constructor() {
    super('BudgeteerDB');
    
    // Define schemas for each table with comprehensive indexing
    this.version(1).stores({
      // Accounts table - index on commonly queried fields
      accounts: 'id, tenantid, categoryid, name, isdeleted, balance, displayorder, createdat, updatedat, owner, currency, [tenantid+isdeleted], [categoryid+isdeleted]',
      
      // Account categories table
      accountcategories: 'id, tenantid, name, type, isdeleted, displayorder, createdat, updatedat, color, icon, [tenantid+isdeleted], [tenantid+type]',
      
      // Transactions table - most complex queries
      transactions: 'id, tenantid, accountid, categoryid, date, isdeleted, amount, type, createdat, updatedat, payee, transferaccountid, transferid, isvoid, [tenantid+isdeleted], [accountid+isdeleted], [categoryid+isdeleted], [tenantid+date], [accountid+date], [categoryid+date]',
      
      // Transaction categories table
      transactioncategories: 'id, tenantid, groupid, name, type, isdeleted, displayorder, createdat, updatedat, budgetamount, budgetfrequency, [tenantid+isdeleted], [groupid+isdeleted], [tenantid+type]',
      
      // Transaction groups table
      transactiongroups: 'id, tenantid, name, type, isdeleted, displayorder, createdat, updatedat, budgetamount, budgetfrequency, [tenantid+isdeleted], [tenantid+type]',
      
      // Configurations table
      configurations: 'id, tenantid, key, table, isdeleted, createdat, updatedat, type, value, [tenantid+key], [table+key], [tenantid+table]',
      
      // Recurrings table
      recurrings: 'id, tenantid, sourceaccountid, categoryid, isdeleted, nextoccurrencedate, createdat, updatedat, isactive, lastexecutedat, type, [tenantid+isdeleted], [sourceaccountid+isdeleted], [tenantid+nextoccurrencedate], [tenantid+isactive]'
    });

    // Add hooks for automatic timestamp management
    this.accounts.hook('creating', (_, obj) => {
      (obj as any).createdat = (obj as any).createdat || new Date().toISOString();
      (obj as any).updatedat = (obj as any).updatedat || new Date().toISOString();
    });

    this.accounts.hook('updating', (modifications) => {
      (modifications as any).updatedat = new Date().toISOString();
    });

    this.accountcategories.hook('creating', (_, obj) => {
      (obj as any).createdat = (obj as any).createdat || new Date().toISOString();
      (obj as any).updatedat = (obj as any).updatedat || new Date().toISOString();
    });

    this.accountcategories.hook('updating', (modifications) => {
      (modifications as any).updatedat = new Date().toISOString();
    });

    this.transactions.hook('creating', (_, obj) => {
      (obj as any).createdat = (obj as any).createdat || new Date().toISOString();
      (obj as any).updatedat = (obj as any).updatedat || new Date().toISOString();
    });

    this.transactions.hook('updating', (modifications) => {
      (modifications as any).updatedat = new Date().toISOString();
    });

    this.transactioncategories.hook('creating', (_, obj) => {
      (obj as any).createdat = (obj as any).createdat || new Date().toISOString();
      (obj as any).updatedat = (obj as any).updatedat || new Date().toISOString();
    });

    this.transactioncategories.hook('updating', (modifications) => {
      (modifications as any).updatedat = new Date().toISOString();
    });

    this.transactiongroups.hook('creating', (_, obj) => {
      (obj as any).createdat = (obj as any).createdat || new Date().toISOString();
      (obj as any).updatedat = (obj as any).updatedat || new Date().toISOString();
    });

    this.transactiongroups.hook('updating', (modifications) => {
      (modifications as any).updatedat = new Date().toISOString();
    });

    this.configurations.hook('creating', (_, obj) => {
      (obj as any).createdat = (obj as any).createdat || new Date().toISOString();
      (obj as any).updatedat = (obj as any).updatedat || new Date().toISOString();
    });

    this.configurations.hook('updating', (modifications) => {
      (modifications as any).updatedat = new Date().toISOString();
    });

    this.recurrings.hook('creating', (_, obj) => {
      (obj as any).createdat = (obj as any).createdat || new Date().toISOString();
      (obj as any).updatedat = (obj as any).updatedat || new Date().toISOString();
    });

    this.recurrings.hook('updating', (modifications) => {
      (modifications as any).updatedat = new Date().toISOString();
    });
  }

  // Migration support for future database updates
  async migrate() {
    // Future migrations will be added here
    console.log('Database migration completed');
  }
}

// Create and export a singleton instance
export const db = new BudgeteerDatabase();