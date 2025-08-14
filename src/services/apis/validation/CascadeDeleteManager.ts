/**
 * Cascade Delete Manager
 * 
 * This module handles cascade delete operations and dependent record management
 * across all storage implementations. It provides utilities for soft deletes,
 * cascade operations, and dependency tracking.
 */

import { IDataProvider } from './ReferentialIntegrityValidator';
import { Database } from "@/src/types/db/database.types";

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

export interface CascadeDeleteOptions {
  /** Whether to perform soft delete (set isdeleted = true) or hard delete */
  softDelete: boolean;
  /** Whether to cascade delete to dependent records */
  cascade: boolean;
  /** Maximum depth for cascade operations to prevent infinite loops */
  maxDepth: number;
  /** User ID performing the delete operation */
  userId?: string;
}

export interface DeleteOperation {
  table: string;
  id: string;
  dependentTable?: string;
  dependentIds?: string[];
}

export interface CascadeDeleteResult {
  success: boolean;
  operations: DeleteOperation[];
  errors: string[];
}

/**
 * Manages cascade delete operations across all storage modes
 */
export class CascadeDeleteManager {
  constructor(private dataProvider: IDataProvider) {}

  /**
   * Perform cascade delete operation with dependency tracking
   */
  async cascadeDelete<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string,
    options: Partial<CascadeDeleteOptions> = {}
  ): Promise<CascadeDeleteResult> {
    const opts: CascadeDeleteOptions = {
      softDelete: true,
      cascade: true,
      maxDepth: 5,
      ...options
    };

    const result: CascadeDeleteResult = {
      success: true,
      operations: [],
      errors: []
    };

    try {
      await this.performCascadeDelete(tableName, recordId, tenantId, opts, result, 0);
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Get all dependent records for a given record
   */
  async getDependentRecords<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string
  ): Promise<{ table: string; ids: string[] }[]> {
    const dependents: { table: string; ids: string[] }[] = [];

    switch (tableName) {
      case 'accountcategories':
        const accounts = await this.dataProvider.getAccounts(tenantId);
        const dependentAccountIds = accounts
          .filter(acc => acc.categoryid === recordId && !acc.isdeleted)
          .map(acc => acc.id);
        if (dependentAccountIds.length > 0) {
          dependents.push({ table: 'accounts', ids: dependentAccountIds });
        }
        break;

      case 'accounts':
        const transactions = await this.dataProvider.getTransactions(tenantId);
        const recurrings = await this.dataProvider.getRecurrings(tenantId);
        
        const dependentTransactionIds = transactions
          .filter(tr => (tr.accountid === recordId || tr.transferaccountid === recordId) && !tr.isdeleted)
          .map(tr => tr.id);
        
        const dependentRecurringIds = recurrings
          .filter(rec => rec.sourceaccountid === recordId && !rec.isdeleted)
          .map(rec => rec.id);

        if (dependentTransactionIds.length > 0) {
          dependents.push({ table: 'transactions', ids: dependentTransactionIds });
        }
        if (dependentRecurringIds.length > 0) {
          dependents.push({ table: 'recurrings', ids: dependentRecurringIds });
        }
        break;

      case 'transactiongroups':
        const categories = await this.dataProvider.getTransactionCategories(tenantId);
        const dependentCategoryIds = categories
          .filter(cat => cat.groupid === recordId && !cat.isdeleted)
          .map(cat => cat.id);
        if (dependentCategoryIds.length > 0) {
          dependents.push({ table: 'transactioncategories', ids: dependentCategoryIds });
        }
        break;

      case 'transactioncategories':
        const categoryTransactions = await this.dataProvider.getTransactions(tenantId);
        const categoryRecurrings = await this.dataProvider.getRecurrings(tenantId);
        
        const dependentCategoryTransactionIds = categoryTransactions
          .filter(tr => tr.categoryid === recordId && !tr.isdeleted)
          .map(tr => tr.id);
        
        const dependentCategoryRecurringIds = categoryRecurrings
          .filter(rec => rec.categoryid === recordId && !rec.isdeleted)
          .map(rec => rec.id);

        if (dependentCategoryTransactionIds.length > 0) {
          dependents.push({ table: 'transactions', ids: dependentCategoryTransactionIds });
        }
        if (dependentCategoryRecurringIds.length > 0) {
          dependents.push({ table: 'recurrings', ids: dependentCategoryRecurringIds });
        }
        break;

      case 'transactions':
        const linkedTransactions = await this.dataProvider.getTransactions(tenantId);
        const dependentLinkedTransactionIds = linkedTransactions
          .filter(tr => tr.transferid === recordId && !tr.isdeleted)
          .map(tr => tr.id);
        if (dependentLinkedTransactionIds.length > 0) {
          dependents.push({ table: 'transactions', ids: dependentLinkedTransactionIds });
        }
        break;
    }

    return dependents;
  }

  /**
   * Check if a record can be safely deleted without cascade
   */
  async canDeleteSafely<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string
  ): Promise<{ canDelete: boolean; blockers: { table: string; count: number }[] }> {
    const dependents = await this.getDependentRecords(tableName, recordId, tenantId);
    const blockers = dependents
      .filter(dep => dep.ids.length > 0)
      .map(dep => ({ table: dep.table, count: dep.ids.length }));

    return {
      canDelete: blockers.length === 0,
      blockers
    };
  }

  /**
   * Perform the actual cascade delete operation recursively
   */
  private async performCascadeDelete<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string,
    options: CascadeDeleteOptions,
    result: CascadeDeleteResult,
    depth: number
  ): Promise<void> {
    if (depth >= options.maxDepth) {
      result.errors.push(`Maximum cascade depth (${options.maxDepth}) reached for ${tableName}:${recordId}`);
      return;
    }

    // Get dependent records if cascading is enabled
    if (options.cascade) {
      const dependents = await this.getDependentRecords(tableName, recordId, tenantId);
      
      // Recursively delete dependent records first
      for (const dependent of dependents) {
        for (const dependentId of dependent.ids) {
          await this.performCascadeDelete(
            dependent.table as TableName,
            dependentId,
            tenantId,
            options,
            result,
            depth + 1
          );
        }
      }
    }

    // Record the delete operation
    const operation: DeleteOperation = {
      table: tableName,
      id: recordId
    };

    result.operations.push(operation);
  }

  /**
   * Validate that cascade delete is safe to perform
   */
  async validateCascadeDelete<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string,
    options: Partial<CascadeDeleteOptions> = {}
  ): Promise<{ valid: boolean; issues: string[] }> {
    const opts: CascadeDeleteOptions = {
      softDelete: true,
      cascade: true,
      maxDepth: 5,
      ...options
    };

    const issues: string[] = [];

    // Check if record exists
    let record: any = null;
    switch (tableName) {
      case 'accountcategories':
        record = await this.dataProvider.getAccountCategoryById(recordId);
        break;
      case 'accounts':
        record = await this.dataProvider.getAccountById(recordId);
        break;
      case 'transactioncategories':
        record = await this.dataProvider.getTransactionCategoryById(recordId);
        break;
      case 'transactiongroups':
        record = await this.dataProvider.getTransactionGroupById(recordId);
        break;
      case 'transactions':
        record = await this.dataProvider.getTransactionById(recordId);
        break;
      case 'recurrings':
        record = await this.dataProvider.getRecurringById(recordId);
        break;
    }

    if (!record) {
      issues.push(`Record ${tableName}:${recordId} does not exist`);
      return { valid: false, issues };
    }

    if (record.isdeleted) {
      issues.push(`Record ${tableName}:${recordId} is already deleted`);
      return { valid: false, issues };
    }

    if (record.tenantid !== tenantId) {
      issues.push(`Record ${tableName}:${recordId} does not belong to tenant ${tenantId}`);
      return { valid: false, issues };
    }

    // If not cascading, check for dependent records
    if (!opts.cascade) {
      const dependents = await this.getDependentRecords(tableName, recordId, tenantId);
      const blockers = dependents.filter(dep => dep.ids.length > 0);
      
      if (blockers.length > 0) {
        for (const blocker of blockers) {
          issues.push(`Cannot delete: ${blocker.ids.length} dependent records in ${blocker.table}`);
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get cascade delete preview (what would be deleted)
   */
  async getCascadeDeletePreview<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string,
    options: Partial<CascadeDeleteOptions> = {}
  ): Promise<{ table: string; id: string; name?: string }[]> {
    const opts: CascadeDeleteOptions = {
      softDelete: true,
      cascade: true,
      maxDepth: 5,
      ...options
    };

    const preview: { table: string; id: string; name?: string }[] = [];
    await this.buildCascadePreview(tableName, recordId, tenantId, opts, preview, 0, new Set());

    return preview;
  }

  /**
   * Build cascade delete preview recursively
   */
  private async buildCascadePreview<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string,
    options: CascadeDeleteOptions,
    preview: { table: string; id: string; name?: string }[],
    depth: number,
    visited: Set<string>
  ): Promise<void> {
    const key = `${tableName}:${recordId}`;
    if (visited.has(key) || depth >= options.maxDepth) {
      return;
    }
    visited.add(key);

    // Get record name for preview
    let recordName: string | undefined;
    let record: any = null;
    
    switch (tableName) {
      case 'accountcategories':
        record = await this.dataProvider.getAccountCategoryById(recordId);
        recordName = record?.name;
        break;
      case 'accounts':
        record = await this.dataProvider.getAccountById(recordId);
        recordName = record?.name;
        break;
      case 'transactioncategories':
        record = await this.dataProvider.getTransactionCategoryById(recordId);
        recordName = record?.name;
        break;
      case 'transactiongroups':
        record = await this.dataProvider.getTransactionGroupById(recordId);
        recordName = record?.name;
        break;
      case 'transactions':
        record = await this.dataProvider.getTransactionById(recordId);
        recordName = record?.name || record?.description;
        break;
      case 'recurrings':
        record = await this.dataProvider.getRecurringById(recordId);
        recordName = record?.name;
        break;
    }

    preview.push({
      table: tableName,
      id: recordId,
      name: recordName
    });

    // Get dependent records if cascading
    if (options.cascade) {
      const dependents = await this.getDependentRecords(tableName, recordId, tenantId);
      
      for (const dependent of dependents) {
        for (const dependentId of dependent.ids) {
          await this.buildCascadePreview(
            dependent.table as TableName,
            dependentId,
            tenantId,
            options,
            preview,
            depth + 1,
            visited
          );
        }
      }
    }
  }
}