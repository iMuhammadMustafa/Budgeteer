/**
 * Referential Integrity Validation System
 * 
 * This module provides comprehensive referential integrity validation
 * across all storage implementations (Supabase, Mock, Local).
 * 
 * @example Basic usage:
 * ```typescript
 * import { validationService } from '@/src/services/apis/validation';
 * 
 * // Validate before creating an account
 * await validationService.validateCreate('accounts', accountData, tenantId);
 * 
 * // Validate before updating a transaction
 * await validationService.validateUpdate('transactions', updateData, transactionId, tenantId);
 * 
 * // Validate before deleting with cascade check
 * await validationService.validateDelete('accountcategories', categoryId, tenantId);
 * ```
 * 
 * @example Using validation helpers:
 * ```typescript
 * import { ValidationHelpers } from '@/src/services/apis/validation';
 * 
 * // Get cascade delete preview
 * const preview = await ValidationHelpers.getCascadeDeletePreview('accounts', accountId, tenantId);
 * 
 * // Check if safe to delete
 * const { canDelete, blockers } = await ValidationHelpers.canDeleteSafely('accounts', accountId, tenantId);
 * ```
 * 
 * @example Error handling:
 * ```typescript
 * import { ValidationErrorHandler } from '@/src/services/apis/validation';
 * 
 * try {
 *   await validationService.validateCreate('accounts', accountData, tenantId);
 * } catch (error) {
 *   if (ValidationErrorHandler.isReferentialIntegrityError(error)) {
 *     console.log('Foreign key constraint violation');
 *   }
 *   const friendlyMessage = ValidationErrorHandler.getUserFriendlyMessage(error);
 * }
 * ```
 */

// Core validation system
export {
  ReferentialIntegrityValidator,
  IDataProvider,
  ReferentialIntegrityError,
  ConstraintViolationError,
  CascadeDeleteError,
  FOREIGN_KEY_RELATIONSHIPS,
  UNIQUE_CONSTRAINTS
} from './ReferentialIntegrityValidator';

// Validation service (main entry point)
export {
  ValidationService,
  validationService
} from './ValidationService';

// Data providers
export { MockDataProvider } from './MockDataProvider';
export { SupabaseDataProvider } from './SupabaseDataProvider';
export { LocalDataProvider } from './LocalDataProvider';

// Data provider factory
export {
  DataProviderFactory,
  StorageMode
} from './DataProviderFactory';

// Cascade delete management
export {
  CascadeDeleteManager,
  CascadeDeleteOptions,
  DeleteOperation,
  CascadeDeleteResult
} from './CascadeDeleteManager';

// Integration helpers
export {
  validateCreate,
  validateUpdate,
  validateDelete,
  ValidationHelpers,
  ValidationErrorHandler,
  BatchValidation
} from './ValidationIntegration';

// Re-export commonly used types
export type { Database } from "@/src/types/db/database.types";