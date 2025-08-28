import { RecurringSupaRepository } from '../supabase/Recurrings.api.supa';
import { RecurringWatermelonRepository } from '../watermelondb/Recurrings.watermelon';
import { 
  RecurringFilters, 
  RecurringType 
} from '@/src/types/recurring';
import { TableNames } from '@/src/types/db/TableNames';

// Mock Supabase
const mockSupabaseQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  single: jest.fn(),
  rpc: jest.fn()
};

const mockSupabase = {
  from: jest.fn(() => mockSupabaseQuery)
};

jest.mock('@/src/providers/Supabase', () => ({
  default: mockSupabase
}));

describe('Enhanced Recurring Repository Tests', () => {
  let supaRepository: RecurringSupaRepository;
  const mockTenantId = 'test-tenant-id';

  beforeEach(() => {
    jest.clearAllMocks();
    supaRepository = new RecurringSupaRepository();
  });

  describe('RecurringSupaRepository Enhanced Methods', () => {
    describe('findDueRecurringTransactions', () => {
      it('should find due recurring transactions for a tenant', async () => {
        const mockData = [
          {
            id: '1',
            name: 'Test Recurring',
            nextoccurrencedate: '2024-01-01T00:00:00Z',
            autoapplyenabled: true,
            recurringtype: RecurringType.Standard,
            isactive: true,
            isdeleted: false,
            tenantid: mockTenantId
          }
        ];

        mockSupabaseQuery.single.mockResolvedValue({ data: mockData, error: null });

        const result = await supaRepository.findDueRecurringTransactions(mockTenantId);

        expect(mockSupabase.from).toHaveBeenCalledWith(TableNames.Recurrings);
        expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('tenantid', mockTenantId);
        expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('isdeleted', false);
        expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('isactive', true);
        expect(result).toEqual(mockData);
      });

      it('should throw error when tenant ID is not provided', async () => {
        await expect(supaRepository.findDueRecurringTransactions('')).rejects.toThrow('Tenant ID is required');
      });
    });

    describe('findByAutoApplyEnabled', () => {
      it('should find recurring transactions by auto-apply status', async () => {
        const mockData = [
          {
            id: '1',
            autoapplyenabled: true,
            tenantid: mockTenantId
          }
        ];

        mockSupabaseQuery.single.mockResolvedValue({ data: mockData, error: null });

        const result = await supaRepository.findByAutoApplyEnabled(mockTenantId, true);

        expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('autoapplyenabled', true);
        expect(result).toEqual(mockData);
      });
    });

    describe('updateNextOccurrenceDates', () => {
      it('should update multiple next occurrence dates', async () => {
        const updates = [
          { id: '1', nextDate: new Date('2024-07-01') },
          { id: '2', nextDate: new Date('2024-08-01') }
        ];

        mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null });

        await supaRepository.updateNextOccurrenceDates(updates);

        expect(mockSupabase.from).toHaveBeenCalledTimes(2);
        expect(mockSupabaseQuery.update).toHaveBeenCalledTimes(2);
      });

      it('should handle empty updates array', async () => {
        await expect(supaRepository.updateNextOccurrenceDates([])).resolves.not.toThrow();
      });
    });

    describe('incrementFailedAttempts', () => {
      it('should increment failed attempts for multiple recurring transactions', async () => {
        const recurringIds = ['1', '2', '3'];

        mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null });

        await supaRepository.incrementFailedAttempts(recurringIds);

        expect(mockSupabase.from).toHaveBeenCalledTimes(3);
        expect(mockSupabaseQuery.update).toHaveBeenCalledTimes(3);
      });

      it('should handle empty recurringIds array', async () => {
        await expect(supaRepository.incrementFailedAttempts([])).resolves.not.toThrow();
      });
    });

    describe('findRecurringTransfers', () => {
      it('should find recurring transfers by calling findByRecurringType', async () => {
        const spy = jest.spyOn(supaRepository, 'findByRecurringType').mockResolvedValue([]);

        await supaRepository.findRecurringTransfers(mockTenantId);

        expect(spy).toHaveBeenCalledWith(mockTenantId, RecurringType.Transfer);
      });
    });

    describe('updateAutoApplyStatus', () => {
      it('should update auto-apply status for a recurring transaction', async () => {
        const recurringId = 'test-id';
        const enabled = true;

        mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null });

        await supaRepository.updateAutoApplyStatus(recurringId, enabled, mockTenantId);

        expect(mockSupabaseQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            autoapplyenabled: enabled
          })
        );
        expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', recurringId);
        expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('tenantid', mockTenantId);
      });
    });
  });

  describe('Integration Requirements Verification', () => {
    it('should satisfy requirement 6.4 - database compatibility', async () => {
      // Test that both repositories implement the same interface
      expect(supaRepository.findDueRecurringTransactions).toBeDefined();
      expect(supaRepository.findByAutoApplyEnabled).toBeDefined();
      expect(supaRepository.updateNextOccurrenceDates).toBeDefined();
      
      // WatermelonDB repository would have the same methods when properly instantiated
      expect(RecurringWatermelonRepository.prototype.findDueRecurringTransactions).toBeDefined();
      expect(RecurringWatermelonRepository.prototype.findByAutoApplyEnabled).toBeDefined();
      expect(RecurringWatermelonRepository.prototype.updateNextOccurrenceDates).toBeDefined();
    });

    it('should satisfy requirement 3.1 - efficient due transaction checking', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: [], error: null });

      await supaRepository.findDueRecurringTransactions(mockTenantId);

      // Verify that the query includes proper filtering for efficiency
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('isactive', true);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('isdeleted', false);
      expect(mockSupabaseQuery.lte).toHaveBeenCalledWith('nextoccurrencedate', expect.any(String));
    });

    it('should satisfy requirement 3.2 - batch processing capability', async () => {
      const updates = [
        { id: '1', nextDate: new Date() },
        { id: '2', nextDate: new Date() }
      ];

      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null });

      await supaRepository.updateNextOccurrenceDates(updates);

      // Verify batch processing capability
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });

    it('should satisfy requirement 7.1 - auto-apply filtering', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: [], error: null });

      await supaRepository.findByAutoApplyEnabled(mockTenantId, true);

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('autoapplyenabled', true);
    });
  });
});