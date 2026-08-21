import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeAccountRepo, createInMemoryRepo, fakeSession } from "@/src/test-utils/fakeRepo";

import { executeRecurringHelper, parseRecurrenceRule, RecurringType } from "./helpers/recurrings.helpers";

const { uuidMock, resetUuid } = vi.hoisted(() => {
  let n = 0;
  return {
    uuidMock: () => `recurring-uuid-${++n}`,
    resetUuid: () => {
      n = 0;
    },
  };
});
vi.mock("@/src/utils/uuid.Helper", () => ({ default: uuidMock }));

const session = fakeSession({ tenantid: "t1", userId: "u1" });
const baseRecurring = {
  id: "rec-1",
  name: "Rent",
  amount: -100,
  type: "Expense",
  recurringtype: RecurringType.Standard,
  recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
  nextoccurrencedate: "2026-01-31T00:00:00.000Z",
  sourceaccountid: "acc-src",
  categoryid: "cat-1",
  tenantid: "t1",
  isdateflexible: false,
  failedattempts: 0,
};

beforeEach(resetUuid);

describe("executeRecurringHelper", () => {
  it("creates a standard transaction, updates the account, and advances month-end safely", async () => {
    const recurringRepo = createInMemoryRepo([baseRecurring]);
    const transactionRepo = createInMemoryRepo();
    const accountRepo = createFakeAccountRepo([{ id: "acc-src", tenantid: "t1", balance: 1000 }]);

    const result = await executeRecurringHelper(
      baseRecurring as any,
      undefined,
      session,
      recurringRepo as any,
      transactionRepo as any,
      accountRepo as any,
    );

    expect(result.success).toBe(true);
    const created = transactionRepo.callsTo("createMultiple")[0].args[0];
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ name: "Rent", amount: -100, accountid: "acc-src" });
    expect(accountRepo.balanceDelta("acc-src")).toBe(-100);
    expect(recurringRepo.callsTo("update")[0].args[1].nextoccurrencedate).toContain("2026-02-28");
  });

  it("creates a balanced transfer pair and updates both accounts", async () => {
    const recurring = {
      ...baseRecurring,
      recurringtype: RecurringType.Transfer,
      type: "Transfer",
      transferaccountid: "acc-dst",
      amount: -250,
    };
    const recurringRepo = createInMemoryRepo([recurring]);
    const transactionRepo = createInMemoryRepo();
    const accountRepo = createFakeAccountRepo([
      { id: "acc-src", tenantid: "t1", balance: 1000 },
      { id: "acc-dst", tenantid: "t1", balance: 0 },
    ]);

    const result = await executeRecurringHelper(
      recurring as any,
      undefined,
      session,
      recurringRepo as any,
      transactionRepo as any,
      accountRepo as any,
    );

    expect(result.success).toBe(true);
    const rows = transactionRepo.callsTo("createMultiple")[0].args[0];
    expect(rows).toHaveLength(2);
    expect(rows[0].amount + rows[1].amount).toBe(0);
    expect(accountRepo.balanceDelta("acc-src")).toBe(-250);
    expect(accountRepo.balanceDelta("acc-dst")).toBe(250);
  });

  it("records a failed attempt without changing balances when transaction creation fails", async () => {
    const recurringRepo = createInMemoryRepo([baseRecurring]);
    const transactionRepo = Object.assign(createInMemoryRepo(), {
      async createMultiple() {
        throw new Error("write failed");
      },
    });
    const accountRepo = createFakeAccountRepo([{ id: "acc-src", tenantid: "t1", balance: 1000 }]);

    const result = await executeRecurringHelper(
      baseRecurring as any,
      undefined,
      session,
      recurringRepo as any,
      transactionRepo as any,
      accountRepo as any,
    );

    expect(result).toMatchObject({ success: false, error: "write failed" });
    expect(recurringRepo.callsTo("update").at(-1)?.args[1]).toMatchObject({ failedattempts: 1 });
    expect(accountRepo.callsTo("updateAccountBalance")).toHaveLength(0);
  });
});

describe("parseRecurrenceRule", () => {
  it("parses explicit rules and supplies monthly defaults", () => {
    expect(parseRecurrenceRule("FREQ=WEEKLY;INTERVAL=2")).toEqual({ freq: "WEEKLY", interval: 2 });
    expect(parseRecurrenceRule("")).toEqual({ freq: "MONTHLY", interval: 1 });
  });
});
