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
      single: jest.fn(),
      rpc: jest.fn(),
    })),
  },
}));

import { RecurringSupaRepository } from "../supabase/Recurrings.api.supa";
import { RecurringType } from "@/src/types/recurring";

// Simple test to verify the enhanced methods exist
describe("Enhanced Recurring Repository - Simple Tests", () => {
  let repository: RecurringSupaRepository;

  beforeEach(() => {
    repository = new RecurringSupaRepository();
  });

  test("should have enhanced methods defined", () => {
    expect(repository.findDueRecurringTransactions).toBeDefined();
    expect(repository.findByAutoApplyEnabled).toBeDefined();
    expect(repository.findByRecurringType).toBeDefined();
    expect(repository.findAllEnhanced).toBeDefined();
    expect(repository.updateNextOccurrenceDates).toBeDefined();
    expect(repository.incrementFailedAttempts).toBeDefined();
    expect(repository.resetFailedAttempts).toBeDefined();
    expect(repository.findRecurringTransfers).toBeDefined();
    expect(repository.findCreditCardPayments).toBeDefined();
    expect(repository.updateAutoApplyStatus).toBeDefined();
    expect(repository.findByIdEnhanced).toBeDefined();
    expect(repository.createEnhanced).toBeDefined();
    expect(repository.updateEnhanced).toBeDefined();
  });

  test("should validate RecurringType enum exists", () => {
    expect(RecurringType.Standard).toBeDefined();
    expect(RecurringType.Transfer).toBeDefined();
    expect(RecurringType.CreditCardPayment).toBeDefined();
  });
});
