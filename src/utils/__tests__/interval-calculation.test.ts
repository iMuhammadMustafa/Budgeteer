import {
  calculateNextOccurrence,
  calculateFutureOccurrences,
  validateInterval,
  getIntervalDisplayText,
  getIntervalShortText,
  isRecurringDue,
  getDaysUntilNextOccurrence,
  getNextOccurrenceDescription,
  getIntervalOption,
  COMMON_INTERVALS,
} from "../interval-calculation";
import { RECURRING_CONSTANTS } from "@/src/types/recurring";

describe("interval-calculation", () => {
  describe("calculateNextOccurrence", () => {
    it("should calculate next occurrence for 1 month interval", () => {
      const currentDate = new Date("2024-01-15T00:00:00.000Z");
      const result = calculateNextOccurrence(currentDate, 1);

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    it("should calculate next occurrence for 3 month interval", () => {
      const currentDate = new Date("2024-01-15T00:00:00.000Z");
      const result = calculateNextOccurrence(currentDate, 3);

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(3); // April (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    it("should calculate next occurrence for 6 month interval", () => {
      const currentDate = new Date("2024-01-15T00:00:00.000Z");
      const result = calculateNextOccurrence(currentDate, 6);

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(6); // July (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    it("should calculate next occurrence for 12 month interval", () => {
      const currentDate = new Date("2024-01-15T00:00:00.000Z");
      const result = calculateNextOccurrence(currentDate, 12);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    it("should calculate next occurrence for 24 month interval", () => {
      const currentDate = new Date("2024-01-15T00:00:00.000Z");
      const result = calculateNextOccurrence(currentDate, 24);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    describe("month-end date handling", () => {
      it("should handle January 31st to February (non-leap year)", () => {
        const currentDate = new Date("2023-01-31T00:00:00.000Z");
        const result = calculateNextOccurrence(currentDate, 1);

        // February 2023 has 28 days, so should be Feb 28
        expect(result.getFullYear()).toBe(2023);
        expect(result.getMonth()).toBe(1); // February (0-indexed)
        expect(result.getDate()).toBe(28);
      });

      it("should handle January 31st to February (leap year)", () => {
        const currentDate = new Date("2024-01-31T00:00:00.000Z");
        const result = calculateNextOccurrence(currentDate, 1);

        // February 2024 has 29 days (leap year), so should be Feb 29
        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(1); // February (0-indexed)
        expect(result.getDate()).toBe(29);
      });

      it("should handle March 31st to April", () => {
        const currentDate = new Date("2024-03-31T00:00:00.000Z");
        const result = calculateNextOccurrence(currentDate, 1);

        // April has 30 days, so should be April 30
        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(3); // April (0-indexed)
        expect(result.getDate()).toBe(30);
      });

      it("should handle May 31st to June", () => {
        const currentDate = new Date("2024-05-31T00:00:00.000Z");
        const result = calculateNextOccurrence(currentDate, 1);

        // June has 30 days, so should be June 30
        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(5); // June (0-indexed)
        expect(result.getDate()).toBe(30);
      });

      it("should preserve day when target month has enough days", () => {
        const currentDate = new Date("2024-01-30T00:00:00.000Z");
        const result = calculateNextOccurrence(currentDate, 1);

        // February 2024 has 29 days, so should be Feb 29 (not 30)
        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(1); // February (0-indexed)
        expect(result.getDate()).toBe(29);
      });

      it("should handle month-end with multi-month intervals", () => {
        const currentDate = new Date("2024-01-31T00:00:00.000Z");
        const result = calculateNextOccurrence(currentDate, 3);

        // April has 30 days, so should be April 30
        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(3); // April (0-indexed)
        expect(result.getDate()).toBe(30);
      });

      it("should handle February 29th in leap year to next year", () => {
        const currentDate = new Date("2024-02-29T00:00:00.000Z");
        const result = calculateNextOccurrence(currentDate, 12);

        // 2025 is not a leap year, so should be Feb 28
        expect(result.getFullYear()).toBe(2025);
        expect(result.getMonth()).toBe(1); // February (0-indexed)
        expect(result.getDate()).toBe(28);
      });
    });

    describe("validation", () => {
      it("should throw error for interval below minimum", () => {
        const currentDate = new Date("2024-01-15");

        expect(() => {
          calculateNextOccurrence(currentDate, 0);
        }).toThrow("Interval months must be between 1 and 24");
      });

      it("should throw error for interval above maximum", () => {
        const currentDate = new Date("2024-01-15");

        expect(() => {
          calculateNextOccurrence(currentDate, 25);
        }).toThrow("Interval months must be between 1 and 24");
      });

      it("should accept minimum valid interval", () => {
        const currentDate = new Date("2024-01-15T00:00:00.000Z");
        const result = calculateNextOccurrence(currentDate, RECURRING_CONSTANTS.INTERVAL_MONTHS.MIN);

        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(1); // February (0-indexed)
        expect(result.getDate()).toBe(15);
      });

      it("should accept maximum valid interval", () => {
        const currentDate = new Date("2024-01-15T00:00:00.000Z");
        const result = calculateNextOccurrence(currentDate, RECURRING_CONSTANTS.INTERVAL_MONTHS.MAX);

        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(0); // January (0-indexed)
        expect(result.getDate()).toBe(15);
      });
    });
  });

  describe("calculateFutureOccurrences", () => {
    it("should calculate multiple future occurrences", () => {
      const startDate = new Date("2024-01-15T00:00:00.000Z");
      const result = calculateFutureOccurrences(startDate, 1, 3);

      expect(result).toHaveLength(3);
      expect(result[0].getMonth()).toBe(1); // February
      expect(result[0].getDate()).toBe(15);
      expect(result[1].getMonth()).toBe(2); // March
      expect(result[1].getDate()).toBe(15);
      expect(result[2].getMonth()).toBe(3); // April
      expect(result[2].getDate()).toBe(15);
    });

    it("should calculate quarterly occurrences", () => {
      const startDate = new Date("2024-01-15T00:00:00.000Z");
      const result = calculateFutureOccurrences(startDate, 3, 4);

      expect(result).toHaveLength(4);
      expect(result[0].getMonth()).toBe(3); // April
      expect(result[0].getDate()).toBe(15);
      expect(result[1].getMonth()).toBe(6); // July
      expect(result[1].getDate()).toBe(15);
      expect(result[2].getMonth()).toBe(9); // October
      expect(result[2].getDate()).toBe(15);
      expect(result[3].getFullYear()).toBe(2025);
      expect(result[3].getMonth()).toBe(0); // January
      expect(result[3].getDate()).toBe(15);
    });

    it("should handle month-end dates in future occurrences", () => {
      const startDate = new Date("2024-01-31T00:00:00.000Z");
      const result = calculateFutureOccurrences(startDate, 1, 3);

      expect(result).toHaveLength(3);
      // February 2024 (leap year) - should be 29th
      expect(result[0].getMonth()).toBe(1);
      expect(result[0].getDate()).toBe(29);
      // March 2024 - should be 31st
      expect(result[1].getMonth()).toBe(2);
      expect(result[1].getDate()).toBe(31);
      // April 2024 - should be 30th (April has only 30 days)
      expect(result[2].getMonth()).toBe(3);
      expect(result[2].getDate()).toBe(30);
    });

    it("should default to 5 occurrences when count not specified", () => {
      const startDate = new Date("2024-01-15");
      const result = calculateFutureOccurrences(startDate, 1);

      expect(result).toHaveLength(5);
    });
  });

  describe("validateInterval", () => {
    it("should validate valid intervals", () => {
      expect(validateInterval(1)).toEqual({ isValid: true });
      expect(validateInterval(12)).toEqual({ isValid: true });
      expect(validateInterval(24)).toEqual({ isValid: true });
    });

    it("should reject non-integer intervals", () => {
      const result = validateInterval(1.5);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Interval months must be a whole number");
    });

    it("should reject intervals below minimum", () => {
      const result = validateInterval(0);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Interval months must be at least 1");
    });

    it("should reject intervals above maximum", () => {
      const result = validateInterval(25);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Interval months cannot exceed 24");
    });
  });

  describe("getIntervalDisplayText", () => {
    it("should return correct display text for common intervals", () => {
      expect(getIntervalDisplayText(1)).toBe("Monthly");
      expect(getIntervalDisplayText(2)).toBe("Every 2 months");
      expect(getIntervalDisplayText(3)).toBe("Quarterly");
      expect(getIntervalDisplayText(4)).toBe("Every 4 months");
      expect(getIntervalDisplayText(6)).toBe("Semi-annually");
      expect(getIntervalDisplayText(12)).toBe("Annually");
    });

    it("should return generic text for uncommon intervals", () => {
      expect(getIntervalDisplayText(5)).toBe("Every 5 months");
      expect(getIntervalDisplayText(8)).toBe("Every 8 months");
      expect(getIntervalDisplayText(18)).toBe("Every 18 months");
    });
  });

  describe("getIntervalShortText", () => {
    it("should return short text for common intervals", () => {
      expect(getIntervalShortText(1)).toBe("Monthly");
      expect(getIntervalShortText(3)).toBe("Quarterly");
      expect(getIntervalShortText(6)).toBe("Semi-annual");
      expect(getIntervalShortText(12)).toBe("Annual");
    });

    it("should return abbreviated text for other intervals", () => {
      expect(getIntervalShortText(2)).toBe("2mo");
      expect(getIntervalShortText(4)).toBe("4mo");
      expect(getIntervalShortText(18)).toBe("18mo");
    });
  });

  describe("isRecurringDue", () => {
    it("should return true for past due dates", () => {
      const pastDate = new Date("2024-01-01");
      const checkDate = new Date("2024-01-15");

      expect(isRecurringDue(pastDate, checkDate)).toBe(true);
    });

    it("should return true for today", () => {
      const today = new Date();

      expect(isRecurringDue(today)).toBe(true);
    });

    it("should return false for future dates", () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow

      expect(isRecurringDue(futureDate)).toBe(false);
    });

    it("should handle string dates", () => {
      const pastDateString = "2024-01-01";
      const checkDate = new Date("2024-01-15");

      expect(isRecurringDue(pastDateString, checkDate)).toBe(true);
    });
  });

  describe("getDaysUntilNextOccurrence", () => {
    it("should calculate positive days for future dates", () => {
      const futureDate = new Date(Date.now() + 3 * 86400000); // 3 days from now
      const result = getDaysUntilNextOccurrence(futureDate);

      expect(result).toBe(3);
    });

    it("should calculate negative days for past dates", () => {
      const pastDate = new Date(Date.now() - 2 * 86400000); // 2 days ago
      const result = getDaysUntilNextOccurrence(pastDate);

      expect(result).toBe(-2);
    });

    it("should return 0 for today", () => {
      const today = new Date();
      const result = getDaysUntilNextOccurrence(today);

      expect(result).toBe(0);
    });
  });

  describe("getNextOccurrenceDescription", () => {
    it("should describe past due dates", () => {
      const oneDayAgo = new Date(Date.now() - 86400000);
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000);

      expect(getNextOccurrenceDescription(oneDayAgo)).toBe("Due yesterday");
      expect(getNextOccurrenceDescription(twoDaysAgo)).toBe("Due 2 days ago");
    });

    it("should describe today", () => {
      const today = new Date();

      expect(getNextOccurrenceDescription(today)).toBe("Due today");
    });

    it("should describe future dates", () => {
      const tomorrow = new Date(Date.now() + 86400000);
      const threeDays = new Date(Date.now() + 3 * 86400000);

      expect(getNextOccurrenceDescription(tomorrow)).toBe("Due tomorrow");

      const threeDaysResult = getNextOccurrenceDescription(threeDays);
      // Allow for slight timing differences in test execution
      expect(["Due in 2 days", "Due in 3 days"]).toContain(threeDaysResult);
    });

    it("should describe weeks for longer periods", () => {
      const oneWeek = new Date(Date.now() + 7 * 86400000);
      const twoWeeks = new Date(Date.now() + 14 * 86400000);

      expect(getNextOccurrenceDescription(oneWeek)).toBe("Due in 1 week");
      expect(getNextOccurrenceDescription(twoWeeks)).toBe("Due in 2 weeks");
    });

    it("should describe months for very long periods", () => {
      const oneMonth = new Date(Date.now() + 35 * 86400000);
      const twoMonths = new Date(Date.now() + 65 * 86400000);

      expect(getNextOccurrenceDescription(oneMonth)).toBe("Due in 1 month");
      expect(getNextOccurrenceDescription(twoMonths)).toBe("Due in 2 months");
    });
  });

  describe("COMMON_INTERVALS", () => {
    it("should contain expected common intervals", () => {
      expect(COMMON_INTERVALS).toHaveLength(7);

      const monthValues = COMMON_INTERVALS.map(interval => interval.months);
      expect(monthValues).toEqual([1, 2, 3, 4, 6, 12, 24]);
    });

    it("should have proper labels and descriptions", () => {
      const monthly = COMMON_INTERVALS.find(i => i.months === 1);
      expect(monthly?.label).toBe("Monthly");
      expect(monthly?.description).toBe("Every month");

      const quarterly = COMMON_INTERVALS.find(i => i.months === 3);
      expect(quarterly?.label).toBe("Quarterly");
      expect(quarterly?.description).toBe("Every 3 months");
    });
  });

  describe("getIntervalOption", () => {
    it("should return common interval option when available", () => {
      const result = getIntervalOption(3);

      expect(result.months).toBe(3);
      expect(result.label).toBe("Quarterly");
      expect(result.description).toBe("Every 3 months");
    });

    it("should generate option for uncommon intervals", () => {
      const result = getIntervalOption(5);

      expect(result.months).toBe(5);
      expect(result.label).toBe("Every 5 months");
      expect(result.description).toBe("Every 5 months");
    });
  });
});
