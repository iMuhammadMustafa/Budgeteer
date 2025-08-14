/**
 * Validation Service
 * 
 * This service provides a high-level interface for referential integrity validation
 * that can be easily integrated into existing storage implementations.
 */

import { ReferentialIntegrityValidator } from './ReferentialIntegrityValidator';
import { DataProviderFactory } from './DataProviderFactory';
import { Database } from "@/src/types/db/database.types";

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

/**
 * Singleton validation service that provides referential integrity validation
 * across all storage modes
 */
export class ValidationService {
  private static instance: ValidationService | null = null;
  private validator: ReferentialIntegrityValidator | null = null;

  private constructor() {}

  /**
   * Get the singleton instance of the validation service
   */
  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Get the validator instance, creating it if necessary
   */
  private getValidator(): ReferentialIntegrityValidator {
    if (!this.validator) {
      const dataProvider = DataProviderFactory.getProvider();
      this.validator = new ReferentialIntegrityValidator(dataProvider);
    }
    return this.validator;
  }

  /**
   * Reset the validator (useful when storage mode changes)
   */
  resetValidator(): void {
    this.validator = null;
    DataProviderFactory.resetProviders();
  }

  /**
   * Validate a record before creation
   */
  async validateCreate<T extends TableName>(
    tableName: T,
    record: Partial<Tables[T]['Row']>,
    tenantId: string
  ): Promise<void> {
    const validator = this.getValidator();
    await validator.validateCreate(tableName, record, tenantId);
  }

  /**
   * Validate a record before update
   */
  async validateUpdate<T extends TableName>(
    tableName: T,
    record: Partial<Tables[T]['Row']>,
    recordId: string,
    tenantId: string
  ): Promise<void> {
    const validator = this.getValidator();
    await validator.validateUpdate(tableName, record, recordId, tenantId);
  }

  /**
   * Validate a record before deletion
   */
  async validateDelete<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string
  ): Promise<void> {
    const validator = this.getValidator();
    await validator.validateDelete(tableName, recordId, tenantId);
  }

  /**
   * Validate foreign key constraints only
   */
  async validateForeignKeys<T extends TableName>(
    tableName: T,
    record: Partial<Tables[T]['Row']>,
    tenantId: string
  ): Promise<void> {
    const validator = this.getValidator();
    await validator.validateForeignKeys(tableName, record, tenantId);
  }

  /**
   * Validate unique constraints only
   */
  async validateUniqueConstraints<T extends TableName>(
    tableName: T,
    record: Partial<Tables[T]['Row']>,
    tenantId: string,
    excludeId?: string
  ): Promise<void> {
    const validator = this.getValidator();
    await validator.validateUniqueConstraints(tableName, record, tenantId, excludeId);
  }

  /**
   * Validate cascade delete constraints only
   */
  async validateCascadeDelete<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string
  ): Promise<void> {
    const validator = this.getValidator();
    await validator.validateCascadeDelete(tableName, recordId, tenantId);
  }
}

// Export a default instance for convenience
export const validationService = ValidationService.getInstance();