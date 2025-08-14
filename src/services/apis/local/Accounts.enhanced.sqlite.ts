/**
 * Enhanced Local SQLite Accounts Implementation with Referential Integrity Validation
 * 
 * This demonstrates how to integrate the validation system with local storage implementations.
 */

import { BudgeteerSQLiteDatabase } from './BudgeteerSQLiteDatabase';
import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

// Import the new validation system
import { ValidationHelpers, ValidationErrorHandler } from "../validation";

export class EnhancedAccountsSQLite {
  private db: BudgeteerSQLiteDatabase;

  constructor() {
    this.db = BudgeteerSQLiteDatabase.getInstance();
  }

  async getAllAccounts(tenantId: string): Promise<Account[]> {
    await this.db.initialize();
    
    const query = `
      SELECT a.*, ac.name as category_name, ac.type as category_type
      FROM accounts a
      LEFT JOIN accountcategories ac ON a.categoryid = ac.id
      WHERE a.tenantid = ? AND a.isdeleted = 0
      ORDER BY ac.displayorder DESC, a.displayorder DESC, a.name ASC
    `;
    
    const result = await this.db.database.getAllAsync(query, [tenantId]);
    return result as Account[];
  }

  async getAccountById(id: string, tenantId: string): Promise<Account | null> {
    await this.db.initialize();
    
    const query = `
      SELECT a.*, ac.name as category_name, ac.type as category_type
      FROM accounts a
      LEFT JOIN accountcategories ac ON a.categoryid = ac.id
      WHERE a.id = ? AND a.tenantid = ? AND a.isdeleted = 0
    `;
    
    const result = await this.db.database.getFirstAsync(query, [id, tenantId]);
    return result as Account | null;
  }

  async createAccount(account: Inserts<TableNames.Accounts>): Promise<Account> {
    const tenantId = account.tenantid || "demo";
    
    try {
      // Validate using the new validation system
      await ValidationHelpers.validateBeforeCreate('accounts', account, tenantId);
      
      await this.db.initialize();
      
      const newAccount: Account = {
        ...account,
        id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        balance: account.balance || 0,
        color: account.color || "#4CAF50",
        currency: account.currency || "USD",
        displayorder: account.displayorder || 0,
        icon: account.icon || "account-balance-wallet",
        isdeleted: false,
        createdat: new Date().toISOString(),
        createdby: account.createdby || "demo",
        updatedat: null,
        updatedby: null,
        tenantid: tenantId,
        description: account.description || null,
        notes: account.notes || null,
        owner: account.owner || null,
      };

      // Insert into SQLite database
      const insertQuery = `
        INSERT INTO accounts (
          id, tenantid, name, balance, categoryid, color, currency, 
          displayorder, icon, isdeleted, createdat, createdby, 
          updatedat, updatedby, description, notes, owner
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db.database.runAsync(insertQuery, [
        newAccount.id,
        newAccount.tenantid,
        newAccount.name,
        newAccount.balance,
        newAccount.categoryid,
        newAccount.color,
        newAccount.currency,
        newAccount.displayorder,
        newAccount.icon,
        newAccount.isdeleted ? 1 : 0,
        newAccount.createdat,
        newAccount.createdby,
        newAccount.updatedat,
        newAccount.updatedby,
        newAccount.description,
        newAccount.notes,
        newAccount.owner
      ]);

      return newAccount;
      
    } catch (error) {
      // Enhanced error handling
      if (ValidationErrorHandler.isReferentialIntegrityError(error)) {
        throw new Error(`Invalid category reference: ${ValidationErrorHandler.getUserFriendlyMessage(error)}`);
      } else if (ValidationErrorHandler.isConstraintViolationError(error)) {
        throw new Error(`Account name already exists: ${ValidationErrorHandler.getUserFriendlyMessage(error)}`);
      }
      throw error;
    }
  }

  async updateAccount(account: Updates<TableNames.Accounts>): Promise<Account> {
    if (!account.id) {
      throw new Error("Account ID is required for update");
    }

    // Get existing account to determine tenant
    const existing = await this.getAccountById(account.id, account.tenantid || "demo");
    if (!existing) {
      throw new Error("Account not found");
    }

    const tenantId = existing.tenantid;

    try {
      // Validate using the new validation system
      await ValidationHelpers.validateBeforeUpdate('accounts', account, account.id, tenantId);

      await this.db.initialize();

      // Build dynamic update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (account.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(account.name);
      }
      if (account.balance !== undefined) {
        updateFields.push('balance = ?');
        updateValues.push(account.balance);
      }
      if (account.categoryid !== undefined) {
        updateFields.push('categoryid = ?');
        updateValues.push(account.categoryid);
      }
      if (account.color !== undefined) {
        updateFields.push('color = ?');
        updateValues.push(account.color);
      }
      if (account.currency !== undefined) {
        updateFields.push('currency = ?');
        updateValues.push(account.currency);
      }
      if (account.displayorder !== undefined) {
        updateFields.push('displayorder = ?');
        updateValues.push(account.displayorder);
      }
      if (account.icon !== undefined) {
        updateFields.push('icon = ?');
        updateValues.push(account.icon);
      }
      if (account.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(account.description);
      }
      if (account.notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(account.notes);
      }
      if (account.owner !== undefined) {
        updateFields.push('owner = ?');
        updateValues.push(account.owner);
      }

      // Always update timestamp and user
      updateFields.push('updatedat = ?', 'updatedby = ?');
      updateValues.push(new Date().toISOString(), account.updatedby || "demo");

      // Add WHERE clause parameters
      updateValues.push(account.id);

      const updateQuery = `
        UPDATE accounts 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await this.db.database.runAsync(updateQuery, updateValues);

      // Return updated account
      const updatedAccount = await this.getAccountById(account.id, tenantId);
      if (!updatedAccount) {
        throw new Error("Failed to retrieve updated account");
      }

      return updatedAccount;
      
    } catch (error) {
      // Enhanced error handling
      if (ValidationErrorHandler.isReferentialIntegrityError(error)) {
        throw new Error(`Invalid reference: ${ValidationErrorHandler.getUserFriendlyMessage(error)}`);
      } else if (ValidationErrorHandler.isConstraintViolationError(error)) {
        throw new Error(`Update failed: ${ValidationErrorHandler.getUserFriendlyMessage(error)}`);
      }
      throw error;
    }
  }

  async deleteAccount(id: string, userId?: string): Promise<Account> {
    // Get existing account to determine tenant
    const existing = await this.getAccountById(id, "demo"); // We need to find the account first
    if (!existing) {
      throw new Error("Account not found");
    }

    const tenantId = existing.tenantid;

    try {
      // Validate using the new validation system
      await ValidationHelpers.validateBeforeDelete('accounts', id, tenantId);

      await this.db.initialize();

      // Perform soft delete
      const updateQuery = `
        UPDATE accounts 
        SET isdeleted = 1, updatedby = ?, updatedat = ?
        WHERE id = ?
      `;

      await this.db.database.runAsync(updateQuery, [
        userId || "demo",
        new Date().toISOString(),
        id
      ]);

      return {
        ...existing,
        isdeleted: true,
        updatedby: userId || "demo",
        updatedat: new Date().toISOString()
      };
      
    } catch (error) {
      // Enhanced error handling with cascade delete information
      if (ValidationErrorHandler.isCascadeDeleteError(error)) {
        throw new Error(`Cannot delete account: ${ValidationErrorHandler.getUserFriendlyMessage(error)}`);
      }
      throw error;
    }
  }

  async deleteAccountWithCascade(id: string, userId?: string): Promise<{
    deletedAccount: Account;
    cascadeOperations: any[];
    preview: any[];
  }> {
    // Get existing account to determine tenant
    const existing = await this.getAccountById(id, "demo");
    if (!existing) {
      throw new Error("Account not found");
    }

    const tenantId = existing.tenantid;

    try {
      // Get cascade delete preview first
      const preview = await ValidationHelpers.getCascadeDeletePreview('accounts', id, tenantId);
      
      // Perform cascade delete
      const result = await ValidationHelpers.performCascadeDelete('accounts', id, tenantId, {
        softDelete: true,
        cascade: true,
        userId: userId
      });

      if (!result.success) {
        throw new Error(`Cascade delete failed: ${result.errors.join(', ')}`);
      }

      await this.db.initialize();

      // Apply the delete operations to the SQLite database
      for (const operation of result.operations) {
        const updateQuery = `
          UPDATE ${operation.table} 
          SET isdeleted = 1, updatedby = ?, updatedat = ?
          WHERE id = ?
        `;

        await this.db.database.runAsync(updateQuery, [
          userId || "demo",
          new Date().toISOString(),
          operation.id
        ]);
      }

      return {
        deletedAccount: {
          ...existing,
          isdeleted: true,
          updatedby: userId || "demo",
          updatedat: new Date().toISOString()
        },
        cascadeOperations: result.operations,
        preview: preview
      };
      
    } catch (error) {
      throw error;
    }
  }

  async restoreAccount(id: string, userId?: string): Promise<Account> {
    await this.db.initialize();

    const updateQuery = `
      UPDATE accounts 
      SET isdeleted = 0, updatedby = ?, updatedat = ?
      WHERE id = ?
    `;

    await this.db.database.runAsync(updateQuery, [
      userId || "demo",
      new Date().toISOString(),
      id
    ]);

    const restoredAccount = await this.getAccountById(id, "demo");
    if (!restoredAccount) {
      throw new Error("Failed to restore account");
    }

    return restoredAccount;
  }

  async updateAccountBalance(accountid: string, amount: number): Promise<number> {
    await this.db.initialize();

    // Get current balance
    const currentAccount = await this.getAccountById(accountid, "demo");
    if (!currentAccount) {
      throw new Error("Account not found");
    }

    const newBalance = currentAccount.balance + amount;

    // Update balance
    const updateQuery = `
      UPDATE accounts 
      SET balance = ?, updatedat = ?
      WHERE id = ?
    `;

    await this.db.database.runAsync(updateQuery, [
      newBalance,
      new Date().toISOString(),
      accountid
    ]);

    return newBalance;
  }

  async getAccountOpenedTransaction(accountid: string, tenantId: string): Promise<any> {
    await this.db.initialize();

    const query = `
      SELECT * FROM transactions 
      WHERE accountid = ? AND tenantid = ? AND type = 'Initial' AND isdeleted = 0
      LIMIT 1
    `;

    const result = await this.db.database.getFirstAsync(query, [accountid, tenantId]);
    return result || null;
  }

  async getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null> {
    await this.db.initialize();

    const query = `
      SELECT SUM(balance) as totalbalance 
      FROM accounts 
      WHERE tenantid = ? AND isdeleted = 0
    `;

    const result = await this.db.database.getFirstAsync(query, [tenantId]) as { totalbalance: number } | null;
    return result;
  }

  // Additional validation utilities specific to accounts
  async validateAccountDeletion(accountId: string, tenantId: string) {
    const { canDelete, blockers } = await ValidationHelpers.canDeleteSafely('accounts', accountId, tenantId);
    
    return {
      canDelete,
      blockers,
      message: canDelete 
        ? 'Account can be safely deleted' 
        : `Cannot delete account: ${blockers.map(b => `${b.count} ${b.table}`).join(', ')}`
    };
  }

  async getAccountDependencies(accountId: string, tenantId: string) {
    const preview = await ValidationHelpers.getCascadeDeletePreview('accounts', accountId, tenantId);
    
    return {
      dependencies: preview.filter(item => item.table !== 'accounts'),
      totalDependencies: preview.length - 1, // Exclude the account itself
      wouldDelete: preview
    };
  }
}