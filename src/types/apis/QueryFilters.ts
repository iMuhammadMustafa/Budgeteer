export interface QueryFilters {
  startDate?: string;
  endDate?: string;

  offset?: number;
  limit?: number;

  /**
   * Filter by deleted status:
   * - undefined (default): Show non-deleted records only
   * - true: Show only deleted records
   * - false: Show all records (including deleted)
   */
  isDeleted?: boolean;

  /**
   * When true, skip relationship mapping (for export)
   */
  raw?: boolean;
}
