// Error handling system exports

export * from './StorageErrors';
export * from './ErrorMapper';
export * from './ErrorRecovery';
export * from './ErrorLogger';
export * from './StorageErrorHandler';

// Re-export commonly used types and functions
export type {
  StorageErrorDetails,
  ErrorMappingContext,
  RetryOptions,
  RecoveryContext,
  ErrorLogEntry,
  ErrorReport,
  StorageErrorHandlerOptions
} from './StorageErrors';

export {
  StorageError,
  StorageErrorCode,
  ReferentialIntegrityError,
  UniqueConstraintError,
  RecordNotFoundError,
  ValidationError,
  NetworkError,
  TimeoutError,
  QuotaExceededError,
  UnauthorizedError
} from './StorageErrors';

export {
  ErrorMapper
} from './ErrorMapper';

export {
  ErrorRecovery
} from './ErrorRecovery';

export {
  ErrorLogger
} from './ErrorLogger';

export {
  StorageErrorHandler,
  globalErrorHandler,
  withStorageErrorHandling,
  mapStorageError
} from './StorageErrorHandler';