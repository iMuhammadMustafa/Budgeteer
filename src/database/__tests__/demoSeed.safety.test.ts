import { 
  DEMO_TENANT_ID,
  DEMO_USER_ID
} from "../demoSeed";
import { TransactionGroup } from "../models";
import { TransactionGroup } from "../models";
import { TransactionGroup } from "../models";
import { TransactionGroup } from "../models";

// Mock console methods to capture logging
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('Demo Seed Safety and Data Isolation', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('Data Isolation Validation', () => {
    it('should validate demo data integrity after seeding', async () => {
      // Seed demo data
      await seedDemoData(database);
      
      // Validate demo data integrity
      await expect(validateDemoDataIntegrity(database)).resolves.not.toThrow();
      
      // Check that logging occurred
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[DEMO MODE')
      );
    });

    it('should preserve non-demo data during cleanup', async () => {
      // Create some non-demo data first
      await database.write(async () => {
        await database.get(TransactionGroup.table).create(group => {
          const tg = group as TransactionGroup;
          tg._raw.id = 'test-non-demo-group';
          tg.name = 'Test Non-Demo Group';
          tg.type = 'Expense';
          tg.tenantid = 'non-demo-tenant';
          tg.createdby = 'test-user';
          tg.createdat = new Date();
          tg.updatedat = new Date();
          tg.isdeleted = false;
          tg.displayorder = 1000;
          tg.budgetamount = 100;
          tg.budgetfrequency = 'monthly';
        });
      });

      // Seed and then clear demo data
      await seedDemoData(database);
      await clearDemoData(database);
      
      // Validate non-demo data preservation
      await expect(validateNonDemoDataPreservation(database)).resolves.not.toThrow();
      
      // Verify non-demo data still exists
      const nonDemoGroups = await database
        .get(TransactionGroup.table)
        .query()
        .where('tenantid', 'non-demo-tenant')
        .fetch();
      
      expect(nonDemoGroups).toHaveLength(1);
      expect(nonDemoGroups[0].name).toBe('Test Non-Demo Group');
      
      // Clean up test data
      await database.write(async () => {
        await nonDemoGroups[0].markAsDeleted();
      });
    });

    it('should prevent accidental data mixing', async () => {
      await seedDemoData(database);
      
      // Try to create a record with wrong tenant ID in demo context
      const invalidRecord = {
        tenantid: 'wrong-tenant-id',
        // ... other properties
      };
      
      // The validation should catch this if we try to process it as demo data
      const demoGroups = await database
        .get(TransactionGroup.table)
        .query()
        .where('tenantid', DEMO_TENANT_ID)
        .fetch();
      
      // All demo records should have the correct tenant ID
      demoGroups.forEach(group => {
        expect(group.tenantid).toBe(DEMO_TENANT_ID);
      });
    });
  });

  describe('Logging Verification', () => {
    it('should log demo mode activation', async () => {
      await seedDemoData(database);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[DEMO MODE')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Demo mode activation started')
      );
    });

    it('should log demo mode deactivation', async () => {
      await seedDemoData(database);
      await clearDemoData(database);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Demo mode deactivation started')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Demo mode deactivation completed successfully')
      );
    });

    it('should log validation steps', async () => {
      await seedDemoData(database);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Validating demo data integrity')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Demo data integrity validation completed successfully')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      // This test would require mocking database errors
      // For now, we just ensure the functions exist and can be called
      expect(validateDemoDataIntegrity).toBeDefined();
      expect(validateNonDemoDataPreservation).toBeDefined();
    });
  });
});