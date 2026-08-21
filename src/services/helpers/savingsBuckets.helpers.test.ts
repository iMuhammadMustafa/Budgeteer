import { describe, expect, it } from "vitest";

import { createInMemoryRepo } from "@/src/test-utils/fakeRepo";

import { allocateSavingsBucketHelper, upsertSavingsBucketHelper } from "./savingsBuckets.helpers";

function createBucketRepo(seed: any[] = []) {
  const base = createInMemoryRepo(seed);
  return Object.assign(base, {
    async getTotalAllocated(accountId: string, tenantId: string) {
      base.__calls.push({ method: "getTotalAllocated", args: [accountId, tenantId] });
      return [...base.__rows.values()]
        .filter(row => row.accountid === accountId && row.tenantid === tenantId && !row.isdeleted)
        .reduce((sum, row) => sum + row.currentamount, 0);
    },
  });
}

const bucket = {
  id: "bucket-1",
  name: "Emergency",
  accountid: "acc-1",
  currentamount: 100,
  targetamount: 500,
  tenantid: "t1",
};

describe("allocateSavingsBucketHelper", () => {
  it("updates an allocation when the account has enough unallocated balance", async () => {
    const repo = createBucketRepo([bucket, { ...bucket, id: "bucket-2", currentamount: 50 }]);

    const result = await allocateSavingsBucketHelper("bucket-1", 250, 500, "t1", "u1", repo as any);

    expect(result?.currentamount).toBe(250);
    expect(repo.callsTo("update")[0].args[1]).toMatchObject({ currentamount: 250, updatedby: "u1" });
  });

  it("rejects negative and over-balance allocations without writing", async () => {
    const repo = createBucketRepo([bucket, { ...bucket, id: "bucket-2", currentamount: 450 }]);

    await expect(allocateSavingsBucketHelper("bucket-1", -1, 500, "t1", "u1", repo as any)).rejects.toThrow(
      "cannot be negative",
    );
    await expect(allocateSavingsBucketHelper("bucket-1", 100, 500, "t1", "u1", repo as any)).rejects.toThrow(
      "exceeds account balance",
    );
    expect(repo.callsTo("update")).toHaveLength(0);
  });
});

describe("upsertSavingsBucketHelper", () => {
  it("creates a tenant-scoped bucket with audit fields", async () => {
    const repo = createBucketRepo();
    const created = await upsertSavingsBucketHelper(
      { name: "Vacation", accountid: "acc-1", currentamount: 0, targetamount: 1000 } as any,
      undefined,
      "t1",
      "u1",
      repo as any,
    );

    expect(created).toMatchObject({ name: "Vacation", tenantid: "t1", createdby: "u1" });
  });

  it("updates an existing bucket with audit fields", async () => {
    const repo = createBucketRepo([bucket]);
    const updated = await upsertSavingsBucketHelper(
      { id: "bucket-1", name: "Rainy Day" } as any,
      bucket as any,
      "t1",
      "u1",
      repo as any,
    );

    expect(updated).toMatchObject({ id: "bucket-1", name: "Rainy Day", updatedby: "u1" });
  });
});
