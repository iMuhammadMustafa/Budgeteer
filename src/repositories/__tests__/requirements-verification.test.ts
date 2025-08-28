/**
 * Requirements Verification Test for Enhanced Recurring Repository
 *
 * This test verifies that the enhanced repository implementation satisfies
 * the specific requirements outlined in the task:
 * - Requirements: 6.4, 3.1, 3.2, 7.1
 */

// Mock Supabase before importing
jest.mock("@/src/providers/Supabase", () => ({
  default: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: [], error: null }),
      rpc: jest.fn(),
    })),
  },
}));

import { RecurringSupaRepository } from "../supabase/Recurrings.api.supa";
import { RecurringWatermelonRepository } from "../watermelondb/Recurrings.watermelon";
import { RecurringType } from "@/src/types/components/recurring";
import { IRecurringRepository } from "../interfaces/IRecurringRepository";

describe("Enhanced Recurring Repository - Requirements Verification", () => {
  let supaRepository: RecurringSupaRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    supaRepository = new RecurringSupaRepository();
  });

  describe("Requirement 6.4 - Database Compatibility", () => {
    test("Both Supabase and WatermelonDB repositories implement IRecurringRepository", () => {
      // Verify Supabase repository implements the interface
      expect(supaRepository).toBeInstanceOf(RecurringSupaRepository);
      expect(supaRepository.findAll).toBeDefined();
      expect(supaRepository.findById).toBeDefined();
      expect(supaRepository.create).toBeDefined();
      expect(supaRepository.update).toBeDefined();
      expect(supaRepository.delete).toBeDefined();

      // Verify WatermelonDB repository has the same interface methods
      expect(RecurringWatermelonRepository.prototype.findAll).toBeDefined();
      expect(RecurringWatermelonRepository.prototype.findById).toBeDefined();
      expect(RecurringWatermelonRepository.prototype.create).toBeDefined();
      expect(RecurringWatermelonRepository.prototype.update).toBeDefined();
      expect(RecurringWatermelonRepository.prototype.delete).toBeDefined();
    });

    test("Both repositories implement enhanced query methods", () => {
      // Verify enhanced methods exist on both repositories
      const enhancedMethods = [
        "findDueRecurringTransactions",
        "findByAutoApplyEnabled",
        "findByRecurringType",
        "findAllEnhanced",
        "updateNextOccurrenceDates",
        "incrementFailedAttempts",
        "resetFailedAttempts",
        "findRecurringTransfers",
        "findCreditCardPayments",
        "updateAutoApplyStatus",
        "findByIdEnhanced",
        "createEnhanced",
        "updateEnhanced",
      ];

      enhancedMethods.forEach(method => {
        expect(supaRepository[method as keyof IRecurringRepository]).toBeDefined();
        expect(RecurringWatermelonRepository.prototype[method as keyof RecurringWatermelonRepository]).toBeDefined();
      });
    });
  });

  describe("Requirement 3.1 - Efficient Due Transaction Checking", () => {
    test("findDueRecurringTransactions includes proper filtering for efficiency", async () => {
      const mockTenantId = "test-tenant";

      await supaRepository.findDueRecurringTransactions(mockTenantId);

      const mockSupabase = await import("@/src/providers/Supabase");
      const mockQuery = mockSupabase.default.from();

      // Verify efficient filtering is applied
      expect(mockQuery.eq).toHaveBeenCalledWith("tenantid", mockTenantId);
      expect(mockQuery.eq).toHaveBeenCalledWith("isdeleted", false);
      expect(mockQuery.eq).toHaveBeenCalledWith("isactive", true);
      expect(mockQuery.lte).toHaveBeenCalledWith("nextoccurrencedate", expect.any(String));
      expect(mockQuery.order).toHaveBeenCalledWith("nextoccurrencedate");
    });

    test("due transaction query accepts optional asOfDate parameter", async () => {
      const mockTenantId = "test-tenant";
      const testDate = new Date("2024-06-01");

      await supaRepository.findDueRecurringTransactions(mockTenantId, testDate);

      const mockSupabase = await import("@/src/providers/Supabase");
      const mockQuery = mockSupabase.default.from();

      expect(mockQuery.lte).toHaveBeenCalledWith("nextoccurrencedate", testDate.toISOString());
    });
  });

  describe("Requirement 3.2 - Batch Processing Capability", () => {
    test("updateNextOccurrenceDates supports batch operations", async () => {
      const updates = [
        { id: "1", nextDate: new Date("2024-07-01") },
        { id: "2", nextDate: new Date("2024-08-01") },
        { id: "3", nextDate: new Date("2024-09-01") },
      ];

      await supaRepository.updateNextOccurrenceDates(updates);

      const mockSupabase = await import("@/src/providers/Supabase");

      // Verify batch processing - should call from() for each update
      expect(mockSupabase.default.from).toHaveBeenCalledTimes(3);
    });

    test("incrementFailedAttempts supports batch operations", async () => {
      const recurringIds = ["1", "2", "3", "4", "5"];

      await supaRepository.incrementFailedAttempts(recurringIds);

      const mockSupabase = await import("@/src/providers/Supabase");

      // Verify batch processing for multiple IDs
      expect(mockSupabase.default.from).toHaveBeenCalledTimes(5);
    });

    test("resetFailedAttempts supports batch operations", async () => {
      const recurringIds = ["1", "2"];

      await supaRepository.resetFailedAttempts(recurringIds);

      const mockSupabase = await import("@/src/providers/Supabase");

      // Verify batch processing
      expect(mockSupabase.default.from).toHaveBeenCalledTimes(2);
    });

    test("batch operations handle empty arrays gracefully", async () => {
      // Should not throw errors for empty arrays
      await expect(supaRepository.updateNextOccurrenceDates([])).resolves.not.toThrow();
      await expect(supaRepository.incrementFailedAttempts([])).resolves.not.toThrow();
      await expect(supaRepository.resetFailedAttempts([])).resolves.not.toThrow();
    });
  });

  describe("Requirement 7.1 - Auto-Apply Filtering", () => {
    test("findByAutoApplyEnabled filters by auto-apply status", async () => {
      const mockTenantId = "test-tenant";

      await supaRepository.findByAutoApplyEnabled(mockTenantId, true);

      const mockSupabase = await import("@/src/providers/Supabase");
      const mockQuery = mockSupabase.default.from();

      expect(mockQuery.eq).toHaveBeenCalledWith("autoapplyenabled", true);
      expect(mockQuery.eq).toHaveBeenCalledWith("tenantid", mockTenantId);
      expect(mockQuery.eq).toHaveBeenCalledWith("isdeleted", false);
    });

    test("findAllEnhanced supports auto-apply filtering", async () => {
      const mockTenantId = "test-tenant";
      const filters = {
        autoApplyEnabled: true,
        isActive: true,
      };

      await supaRepository.findAllEnhanced(filters, mockTenantId);

      const mockSupabase = await import("@/src/providers/Supabase");
      const mockQuery = mockSupabase.default.from();

      expect(mockQuery.eq).toHaveBeenCalledWith("autoapplyenabled", true);
      expect(mockQuery.eq).toHaveBeenCalledWith("isactive", true);
    });

    test("updateAutoApplyStatus allows individual auto-apply management", async () => {
      const recurringId = "test-recurring-id";
      const mockTenantId = "test-tenant";

      await supaRepository.updateAutoApplyStatus(recurringId, false, mockTenantId);

      const mockSupabase = await import("@/src/providers/Supabase");
      const mockQuery = mockSupabase.default.from();

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          autoapplyenabled: false,
        }),
      );
      expect(mockQuery.eq).toHaveBeenCalledWith("id", recurringId);
      expect(mockQuery.eq).toHaveBeenCalledWith("tenantid", mockTenantId);
    });
  });

  describe("Enhanced Functionality - Transfer and Credit Card Support", () => {
    test("findRecurringTransfers filters by Transfer type", async () => {
      const spy = jest.spyOn(supaRepository, "findByRecurringType").mockResolvedValue([]);
      const mockTenantId = "test-tenant";

      await supaRepository.findRecurringTransfers(mockTenantId);

      expect(spy).toHaveBeenCalledWith(mockTenantId, RecurringType.Transfer);
    });

    test("findCreditCardPayments filters by CreditCardPayment type", async () => {
      const spy = jest.spyOn(supaRepository, "findByRecurringType").mockResolvedValue([]);
      const mockTenantId = "test-tenant";

      await supaRepository.findCreditCardPayments(mockTenantId);

      expect(spy).toHaveBeenCalledWith(mockTenantId, RecurringType.CreditCardPayment);
    });

    test("findByRecurringType supports all recurring types", async () => {
      const mockTenantId = "test-tenant";

      await supaRepository.findByRecurringType(mockTenantId, RecurringType.Standard);

      const mockSupabase = await import("@/src/providers/Supabase");
      const mockQuery = mockSupabase.default.from();

      expect(mockQuery.eq).toHaveBeenCalledWith("recurringtype", RecurringType.Standard);
    });
  });

  describe("Enhanced CRUD Operations", () => {
    test("createEnhanced returns enhanced recurring with relationships", async () => {
      const mockData = {
        name: "Test Enhanced Recurring",
        sourceaccountid: "account-1",
        tenantid: "test-tenant",
      };

      await supaRepository.createEnhanced(mockData, "test-tenant");

      const mockSupabase = await import("@/src/providers/Supabase");
      const mockQuery = mockSupabase.default.from();

      expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining(mockData));
      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining("source_account:"));
    });

    test("updateEnhanced returns enhanced recurring with relationships", async () => {
      const updateData = {
        name: "Updated Enhanced Recurring",
        autoapplyenabled: true,
      };

      await supaRepository.updateEnhanced("test-id", updateData, "test-tenant");

      const mockSupabase = await import("@/src/providers/Supabase");
      const mockQuery = mockSupabase.default.from();

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updatedat: expect.any(String),
        }),
      );
      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining("source_account:"));
    });

    test("findByIdEnhanced includes relationships in query", async () => {
      await supaRepository.findByIdEnhanced("test-id", "test-tenant");

      const mockSupabase = await import("@/src/providers/Supabase");
      const mockQuery = mockSupabase.default.from();

      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining("source_account:"));
      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining("category:"));
    });
  });

  describe("Error Handling and Validation", () => {
    test("methods require tenant ID and throw appropriate errors", async () => {
      await expect(supaRepository.findDueRecurringTransactions("")).rejects.toThrow("Tenant ID is required");
      await expect(supaRepository.findByAutoApplyEnabled("", true)).rejects.toThrow("Tenant ID is required");
      await expect(supaRepository.findByRecurringType("", RecurringType.Standard)).rejects.toThrow(
        "Tenant ID is required",
      );
      await expect(supaRepository.findAllEnhanced({}, "")).rejects.toThrow("Tenant ID is required");
      await expect(supaRepository.updateAutoApplyStatus("id", true, "")).rejects.toThrow("Tenant ID is required");
      await expect(supaRepository.findByIdEnhanced("id", "")).rejects.toThrow("Tenant ID is required");
      await expect(supaRepository.updateEnhanced("id", {}, "")).rejects.toThrow("Tenant ID is required");
    });
  });
});
