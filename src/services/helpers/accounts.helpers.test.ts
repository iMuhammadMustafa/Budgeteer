import { describe, expect, it } from "vitest";

import { createFakeAccountRepo, createFakeConfigRepo, createInMemoryRepo, fakeSession } from "@/src/test-utils/fakeRepo";
import { createAccountRepoHelper, updateAccountRepoHelper } from "./accounts.helpers";

const session = fakeSession({ tenantid: "t1", userId: "u1" });

describe("createAccountRepoHelper", () => {
    it("creates the account then an opening 'Initial' transaction for its balance", async () => {
        const accRepo = createFakeAccountRepo();
        const txRepo = createInMemoryRepo();
        const cfgRepo = createFakeConfigRepo({ id: "cfg", value: "ops-cat" });
        const form: any = { name: "Checking", balance: 250 };

        const created = await createAccountRepoHelper(form, session, accRepo as any, txRepo as any, cfgRepo as any);

        // account created, stamped with tenant + createdby
        expect(accRepo.callsTo("create")).toHaveLength(1);
        expect(form.tenantid).toBe("t1");
        expect(form.createdby).toBe("u1");
        // opening transaction created against the ops category, amount == starting balance
        const txCreate = txRepo.callsTo("create")[0];
        expect(txCreate).toBeTruthy();
        expect(txCreate.args[0]).toMatchObject({ type: "Initial", amount: 250, accountid: created.id, categoryid: "ops-cat" });
    });

    it("defaults the opening transaction amount to 0 when no balance is given", async () => {
        const accRepo = createFakeAccountRepo();
        const txRepo = createInMemoryRepo();
        const cfgRepo = createFakeConfigRepo();
        await createAccountRepoHelper({ name: "Empty" } as any, session, accRepo as any, txRepo as any, cfgRepo as any);
        expect(txRepo.callsTo("create")[0].args[0].amount).toBe(0);
    });

    it("throws when the account-operations category is missing", async () => {
        const accRepo = createFakeAccountRepo();
        const txRepo = createInMemoryRepo();
        const cfgRepo = createFakeConfigRepo(null); // getConfiguration -> null
        await expect(
            createAccountRepoHelper({ name: "X", balance: 1 } as any, session, accRepo as any, txRepo as any, cfgRepo as any),
        ).rejects.toThrow("Account Operations Category not found");
    });
});

describe("updateAccountRepoHelper", () => {
    it("updates the account and records who/when", async () => {
        const accRepo = createFakeAccountRepo([{ id: "acc-1", tenantid: "t1", name: "Old", balance: 100 }]);
        const txRepo = createInMemoryRepo();
        const cfgRepo = createFakeConfigRepo();
        const original: any = { id: "acc-1", name: "Old", balance: 100 };
        const form: any = { id: "acc-1", name: "New", balance: 100 };

        await updateAccountRepoHelper(form, session, original, accRepo as any, txRepo as any, cfgRepo as any);

        expect(accRepo.callsTo("update")).toHaveLength(1);
        expect(form.updatedby).toBe("u1");
        // no balance change requested -> no adjustment transaction
        expect(txRepo.callsTo("create")).toHaveLength(0);
    });

    it("writes a balance-adjustment transaction for the delta when asked", async () => {
        const accRepo = createFakeAccountRepo([{ id: "acc-1", tenantid: "t1", balance: 100 }]);
        const txRepo = createInMemoryRepo();
        const cfgRepo = createFakeConfigRepo({ id: "cfg", value: "ops-cat" });
        const original: any = { id: "acc-1", balance: 100 };
        const form: any = { id: "acc-1", balance: 175 };

        await updateAccountRepoHelper(form, session, original, accRepo as any, txRepo as any, cfgRepo as any, true);

        const txCreate = txRepo.callsTo("create")[0];
        expect(txCreate.args[0]).toMatchObject({ type: "Adjustment", amount: 75, accountid: "acc-1", categoryid: "ops-cat" });
    });

    it("does NOT write an adjustment when addAdjustmentTransaction is false", async () => {
        const accRepo = createFakeAccountRepo([{ id: "acc-1", tenantid: "t1", balance: 100 }]);
        const txRepo = createInMemoryRepo();
        const cfgRepo = createFakeConfigRepo();
        await updateAccountRepoHelper(
            { id: "acc-1", balance: 175 } as any,
            session,
            { id: "acc-1", balance: 100 } as any,
            accRepo as any,
            txRepo as any,
            cfgRepo as any,
            false,
        );
        expect(txRepo.callsTo("create")).toHaveLength(0);
    });
});
