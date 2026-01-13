export interface QueryFilters {
  startDate?: string;
  endDate?: string;

  offset?: number;
  limit?: number;

  /**
   * Filter by deleted status:
   * - undefined/false (default): Show non-deleted records only (isdeleted = false)
   * - true: Show only deleted records (isdeleted = true)
   * - null: Show all records (no isdeleted filter applied)
   */
  isDeleted?: boolean | null;
  raw?: boolean;
}
