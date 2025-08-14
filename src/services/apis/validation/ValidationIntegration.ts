/**
 * Validation Integration Helpers
 * 
 * This module provides helper functions and decorators to easily integrate
 * referential integrity validation into existing storage implementations.
 */

import { validationService } from './ValidationService';
import { CascadeDeleteManager } from './CascadeDeleteManager';
import { DataProviderFactory } from './DataProviderFactory';
import { Database } from "@/src/types/db/database.types";

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

/**
 * Validation decorator for create operations
 */
export function validateCreate<T extends TableName>(tableName: T) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Assume first argument is the record data and second is tenant ID
      const [recordData, tenantId] = args;
      
      if (recordData && tenantId) {
        await validationService.validateCreate(tableName, recordData, tenantId);
      }
      
      return method.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Validation decorator for update operations
 */
export function validateUpdate<T extends TableName>(tableName: T) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Assume first argument is the record data, second is record ID, third is tenant ID
      const [recordData, recordId, tenantId] = args;
      
      if (recordData && recordId && tenantId) {
        await validationService.validateUpdate(tableName, recordData, recordId, tenantId);
      }
      
      return method.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Validation decorator for delete operations
 */
export function validateDelete<T extends TableName>(tableName: T) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Assume first argument is the record ID and second is tenant ID
      const [recordId, tenantId] = args;
      
      if (recordId && tenantId) {
        await validationService.validateDelete(tableName, recordId, tenantId);
      }
      
      return method.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Helper functions for manual validation integration
 */
export class ValidationHelpers {
  
  /**
   * Validate before creating a record
   */
  static async validateBeforeCreate<T extends TableName>(
    tableName: T,
    record: Partial<Tables[T]['Row']>,
    tenantId: string
  ): Promise<void> {
    await validationService.validateCreate(tableName, record, tenantId);
  }

  /**
   * Validate before updating a record
   */
  static async validateBeforeUpdate<T extends TableName>(
    tableName: T,
    record: Partial<Tables[T]['Row']>,
    recordId: string,
    tenantId: string
  ): Promise<void> {
    await validationService.validateUpdate(tableName, record, recordId, tenantId);
  }

  /**
   * Validate before deleting a record
   */
  static async validateBeforeDelete<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string
  ): Promise<void> {
    await validationService.validateDelete(tableName, recordId, tenantId);
  }

  /**
   * Get cascade delete preview
   */
  static async getCascadeDeletePreview<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string
  ): Promise<{ table: string; id: string; name?: string }[]> {
    const dataProvider = DataProviderFactory.getProvider();
    const cascadeManager = new CascadeDeleteManager(dataProvider);
    return cascadeManager.getCascadeDeletePreview(tableName, recordId, tenantId);
  }

  /**
   * Perform cascade delete
   */
  static async performCascadeDelete<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string,
    options: {
      softDelete?: boolean;
      cascade?: boolean;
      maxDepth?: number;
      userId?: string;
    } = {}
  ) {
    const dataProvider = DataProviderFactory.getProvider();
    const cascadeManager = new CascadeDeleteManager(dataProvider);
    return cascadeManager.cascadeDelete(tableName, recordId, tenantId, options);
  }

  /**
   * Check if record can be safely deleted
   */
  static async canDeleteSafely<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string
  ): Promise<{ canDelete: boolean; blockers: { table: string; count: number }[] }> {
    const dataProvider = DataProviderFactory.getProvider();
    const cascadeManager = new CascadeDeleteManager(dataProvider);
    return cascadeManager.canDeleteSafely(tableName, recordId, tenantId);
  }

  /**
   * Validate foreign keys only
   */
  static async validateForeignKeys<T extends TableName>(
    tableName: T,
    record: Partial<Tables[T]['Row']>,
    tenantId: string
  ): Promise<void> {
    await validationService.validateForeignKeys(tableName, record, tenantId);
  }

  /**
   * Validate unique constraints only
   */
  static async validateUniqueConstraints<T extends TableName>(
    tableName: T,
    record: Partial<Tables[T]['Row']>,
    tenantId: string,
    excludeId?: string
  ): Promise<void> {
    await validationService.validateUniqueConstraints(tableName, record, tenantId, excludeId);
  }
}

/**
 * Error handling utilities
 */
export class ValidationErrorHandler {
  
  /**
   * Check if error is a referential integrity error
   */
  static isReferentialIntegrityError(error: any): boolean {
    return error?.name === 'ReferentialIntegrityError';
  }

  /**
   * Check if error is a constraint violation error
   */
  static isConstraintViolationError(error: any): boolean {
    return error?.name === 'ConstraintViolationError';
  }

  /**
   * Check if error is a cascade delete error
   */
  static isCascadeDeleteError(error: any): boolean {
    return error?.name === 'CascadeDeleteError';
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: any): string {
    if (ValidationErrorHandler.isReferentialIntegrityError(error)) {
      return `The referenced record does not exist or has been deleted.`;
    }
    
    if (ValidationErrorHandler.isConstraintViolationError(error)) {
      return error.message || 'A constraint violation occurred.';
    }
    
    if (ValidationErrorHandler.isCascadeDeleteError(error)) {
      return `Cannot delete this record because it is being used by other records.`;
    }
    
    return error?.message || 'An unknown validation error occurred.';
  }

  /**
   * Get detailed error information for debugging
   */
  static getDetailedErrorInfo(error: any): {
    type: string;
    message: string;
    details: any;
  } {
    return {
      type: error?.name || 'UnknownError',
      message: error?.message || 'Unknown error',
      details: {
        table: error?.table,
        field: error?.field,
        value: error?.value,
        constraint: error?.constraint,
        referencedTable: error?.referencedTable,
        dependentTable: error?.dependentTable,
        dependentCount: error?.dependentCount
      }
    };
  }
}

/**
 * Batch validation utilities
 */
export class BatchValidation {
  
  /**
   * Validate multiple records for creation
   */
  static async validateBatchCreate<T extends TableName>(
    tableName: T,
    records: Partial<Tables[T]['Row']>[],
    tenantId: string
  ): Promise<{ success: boolean; errors: { index: number; error: any }[] }> {
    const errors: { index: number; error: any }[] = [];
    
    for (let i = 0; i < records.length; i++) {
      try {
        await validationService.validateCreate(tableName, records[i], tenantId);
      } catch (error) {
        errors.push({ index: i, error });
      }
    }
    
    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Validate multiple records for update
   */
  static async validateBatchUpdate<T extends TableName>(
    tableName: T,
    updates: { record: Partial<Tables[T]['Row']>; id: string }[],
    tenantId: string
  ): Promise<{ success: boolean; errors: { index: number; error: any }[] }> {
    const errors: { index: number; error: any }[] = [];
    
    for (let i = 0; i < updates.length; i++) {
      try {
        await validationService.validateUpdate(tableName, updates[i].record, updates[i].id, tenantId);
      } catch (error) {
        errors.push({ index: i, error });
      }
    }
    
    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Validate multiple records for deletion
   */
  static async validateBatchDelete<T extends TableName>(
    tableName: T,
    recordIds: string[],
    tenantId: string
  ): Promise<{ success: boolean; errors: { index: number; error: any }[] }> {
    const errors: { index: number; error: any }[] = [];
    
    for (let i = 0; i < recordIds.length; i++) {
      try {
        await validationService.validateDelete(tableName, recordIds[i], tenantId);
      } catch (error) {
        errors.push({ index: i, error });
      }
    }
    
    return {
      success: errors.length === 0,
      errors
    };
  }
}