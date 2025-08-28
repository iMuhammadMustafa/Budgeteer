import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import { RECURRING_CONSTANTS } from "../types/recurring";

// Extend dayjs with required plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);

/**
 * Enhanced interval calculation utilities for recurring transactions
 */

/**
 * Calculate next occurrence date based on custom monthly intervals
 * Handles month-end dates properly by preserving the day of month when possible
 */
export function calculateNextOccurrence(currentDate: Date, intervalMonths: number): Date {
  // Validate interval months
  if (
    intervalMonths < RECURRING_CONSTANTS.INTERVAL_MONTHS.MIN ||
    intervalMonths > RECURRING_CONSTANTS.INTERVAL_MONTHS.MAX
  ) {
    throw new Error(
      `Interval months must be between ${RECURRING_CONSTANTS.INTERVAL_MONTHS.MIN} and ${RECURRING_CONSTANTS.INTERVAL_MONTHS.MAX}`,
    );
  }

  const current = dayjs.utc(currentDate);
  const originalDay = current.date();

  // Add the interval months first
  let nextDate = current.add(intervalMonths, "month");

  // Handle month-end dates: if the original date was at the end of the month,
  // and the target month has fewer days, use the last day of the target month
  const daysInTargetMonth = nextDate.daysInMonth();

  if (originalDay > daysInTargetMonth) {
    // Original date was beyond what the target month can accommodate
    // Set to the last day of the target month
    nextDate = nextDate.date(daysInTargetMonth);
  }
  // Note: dayjs.add() already handles the day adjustment automatically,
  // so we don't need to explicitly set the date if it fits

  // Create a new Date object in UTC to avoid timezone issues
  return new Date(nextDate.year(), nextDate.month(), nextDate.date());
}

/**
 * Calculate multiple future occurrences for preview purposes
 * Preserves the original day of month throughout the calculation chain
 */
export function calculateFutureOccurrences(startDate: Date, intervalMonths: number, count: number = 5): Date[] {
  const occurrences: Date[] = [];
  const originalDay = dayjs.utc(startDate).date();
  let currentDate = dayjs.utc(startDate);

  for (let i = 0; i < count; i++) {
    // Add the interval months
    currentDate = currentDate.add(intervalMonths, "month");

    // Handle month-end dates by preserving the original day when possible
    const daysInTargetMonth = currentDate.daysInMonth();
    const targetDay = originalDay > daysInTargetMonth ? daysInTargetMonth : originalDay;

    currentDate = currentDate.date(targetDay);
    occurrences.push(new Date(currentDate.year(), currentDate.month(), currentDate.date()));
  }

  return occurrences;
}

/**
 * Validate if a given interval is valid
 */
export function validateInterval(intervalMonths: number): { isValid: boolean; message?: string } {
  if (!Number.isInteger(intervalMonths)) {
    return {
      isValid: false,
      message: "Interval months must be a whole number",
    };
  }

  if (intervalMonths < RECURRING_CONSTANTS.INTERVAL_MONTHS.MIN) {
    return {
      isValid: false,
      message: `Interval months must be at least ${RECURRING_CONSTANTS.INTERVAL_MONTHS.MIN}`,
    };
  }

  if (intervalMonths > RECURRING_CONSTANTS.INTERVAL_MONTHS.MAX) {
    return {
      isValid: false,
      message: `Interval months cannot exceed ${RECURRING_CONSTANTS.INTERVAL_MONTHS.MAX}`,
    };
  }

  return { isValid: true };
}

/**
 * Get display text for custom intervals
 */
export function getIntervalDisplayText(intervalMonths: number): string {
  if (intervalMonths === 1) {
    return "Monthly";
  } else if (intervalMonths === 2) {
    return "Every 2 months";
  } else if (intervalMonths === 3) {
    return "Quarterly";
  } else if (intervalMonths === 4) {
    return "Every 4 months";
  } else if (intervalMonths === 6) {
    return "Semi-annually";
  } else if (intervalMonths === 12) {
    return "Annually";
  } else {
    return `Every ${intervalMonths} months`;
  }
}

/**
 * Get short display text for intervals (for compact UI)
 */
export function getIntervalShortText(intervalMonths: number): string {
  if (intervalMonths === 1) {
    return "Monthly";
  } else if (intervalMonths === 3) {
    return "Quarterly";
  } else if (intervalMonths === 6) {
    return "Semi-annual";
  } else if (intervalMonths === 12) {
    return "Annual";
  } else {
    return `${intervalMonths}mo`;
  }
}

/**
 * Check if a recurring transaction is due based on its next occurrence date
 */
export function isRecurringDue(nextOccurrenceDate: string | Date, asOfDate?: Date): boolean {
  const checkDate = asOfDate ? dayjs.utc(asOfDate) : dayjs.utc();
  const dueDate = dayjs.utc(nextOccurrenceDate);

  return dueDate.isSameOrBefore(checkDate, "day");
}

/**
 * Calculate how many days until the next occurrence
 */
export function getDaysUntilNextOccurrence(nextOccurrenceDate: string | Date): number {
  const today = dayjs.utc();
  const nextDate = dayjs.utc(nextOccurrenceDate);

  return nextDate.diff(today, "day");
}

/**
 * Get a human-readable description of when the next occurrence is due
 */
export function getNextOccurrenceDescription(nextOccurrenceDate: string | Date): string {
  const daysUntil = getDaysUntilNextOccurrence(nextOccurrenceDate);

  if (daysUntil < 0) {
    const daysPast = Math.abs(daysUntil);
    if (daysPast === 1) {
      return "Due yesterday";
    } else {
      return `Due ${daysPast} days ago`;
    }
  } else if (daysUntil === 0) {
    return "Due today";
  } else if (daysUntil === 1) {
    return "Due tomorrow";
  } else if (daysUntil === 7) {
    return "Due in 1 week";
  } else if (daysUntil <= 6) {
    return `Due in ${daysUntil} days`;
  } else if (daysUntil <= 30) {
    const weeks = Math.floor(daysUntil / 7);
    if (weeks === 1) {
      return "Due in 1 week";
    } else {
      return `Due in ${weeks} weeks`;
    }
  } else {
    const months = Math.floor(daysUntil / 30);
    if (months === 1) {
      return "Due in 1 month";
    } else {
      return `Due in ${months} months`;
    }
  }
}

/**
 * Suggest common interval options for UI
 */
export const COMMON_INTERVALS = [
  { months: 1, label: "Monthly", description: "Every month" },
  { months: 2, label: "Every 2 months", description: "Bi-monthly" },
  { months: 3, label: "Quarterly", description: "Every 3 months" },
  { months: 4, label: "Every 4 months", description: "Four times per year" },
  { months: 6, label: "Semi-annually", description: "Twice per year" },
  { months: 12, label: "Annually", description: "Once per year" },
  { months: 24, label: "Every 2 years", description: "Bi-annually" },
] as const;

/**
 * Get interval option by months value
 */
export function getIntervalOption(intervalMonths: number) {
  return (
    COMMON_INTERVALS.find(option => option.months === intervalMonths) || {
      months: intervalMonths,
      label: getIntervalDisplayText(intervalMonths),
      description: `Every ${intervalMonths} months`,
    }
  );
}
