import { Recurring, Inserts, Updates } from '@/src/types/db/Tables.Types';
import { TableNames } from '@/src/types/db/TableNames';

// Define the parameter types used in the actual implementation
type ListRecurringsParams = {
  tenantId: string;
  filters?: any;
};

type Inserts<TableNames.Recurrings> = Inserts<TableNames.Recurrings>;
type Updates<TableNames.Recurrings> = Updates<TableNames.Recurrings>;

/**
 * Repository interface for Recurring entity operations
 * All storage implementations must implement this interface
 */
export interface IRecurringRepository {
  /**
   * List recurring transactions for a tenant with optional filtering
   * @param params - Parameters including tenantId and optional filters
   * @returns Promise resolving to array of recurring transactions with related data
   */
  listRecurrings(params: ListRecurringsParams): Promise<Recurring[]>;

  /**
   * Get a specific recurring transaction by ID
   * @param id - The recurring transaction ID
   * @param tenantId - The tenant ID for security filtering
   * @returns Promise resolving to recurring transaction with related data, or null if not found
   */
  getRecurringById(id: string, tenantId: string): Promise<Recurring | null>;

  /**
   * Create a new recurring transaction
   * @param recurringData - Recurring transaction data to insert
   * @param tenantId - The tenant ID
   * @returns Promise resolving to the created recurring transaction data
   */
  createRecurring(recurringData: Inserts<TableNames.Recurrings>, tenantId: string): Promise<any>;

  /**
   * Update an existing recurring transaction
   * @param id - The recurring transaction ID
   * @param recurringData - Recurring transaction data to update
   * @param tenantId - The tenant ID for security filtering
   * @returns Promise resolving to the updated recurring transaction data
   */
  updateRecurring(id: string, recurringData: Updates<TableNames.Recurrings>, tenantId: string): Promise<any>;

  /**
   * Soft delete a recurring transaction (set isdeleted = true)
   * @param id - The recurring transaction ID to delete
   * @param tenantId - The tenant ID for security filtering
   * @param userId - Optional user ID for audit trail
   * @returns Promise resolving to the updated recurring transaction data
   */
  deleteRecurring(id: string, tenantId: string, userId?: string): Promise<any>;
}