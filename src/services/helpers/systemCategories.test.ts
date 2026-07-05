import { describe, expect, it } from "vitest";

import { createFakeConfigRepo, createInMemoryRepo } from "@/src/test-utils/fakeRepo";
import { ConfigurationTypes } from "@/src/types/database/Config.Types";
import { TableNames } from "@/src/types/database/TableNames";
import {
  isSystemCategoryId,
  resolveSystemCategoryId,
  setSystemCategoryMapping,
} from "./systemCategories";

const TENANT = "t1";
const USER = "u1";
const CFG = ConfigurationTypes.AccountOpertationsCategory;
const FALLBACK_ID = "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9";

describe("resolveSystemCategoryId", () => {
  it("returns the mapped id when the configuration points to a live category", async () => {
    const configRepo = createFakeConfigRepo({ id: "cfg", value: "live-cat" });
    const categoryRepo = createInMemoryRepo([{ id: "live-cat", tenantid: TENANT }]);

    const id = await resolveSystemCategoryId(CFG, TENANT, USER, { configRepo, categoryRepo } as any);

    expect(id).toBe("live-cat");
    expect(categoryRepo.callsTo("create")).toHaveLength(0);
  });

  it("self-heals when there is no configuration mapping", async () => {
    const configRepo = createFakeConfigRepo(null);
    const categoryRepo = createInMemoryRepo();

    const id = await resolveSystemCategoryId(CFG, TENANT, USER, { configRepo, categoryRepo } as any);

    expect(id).toBe(FALLBACK_ID);
    // fallback category recreated with its deterministic id...
    expect(categoryRepo.callsTo("create")[0].args[0].id).toBe(FALLBACK_ID);
    // ...and a configuration mapping created to point at it
    expect(configRepo.callsTo("create")).toHaveLength(1);
  });

  it("self-heals when the mapped category was deleted", async () => {
    const configRepo = createFakeConfigRepo({ id: "cfg", value: "gone-cat" });
    // mapped category exists but is soft-deleted -> findById hides it
    const categoryRepo = createInMemoryRepo([{ id: "gone-cat", tenantid: TENANT, isdeleted: true }]);

    const id = await resolveSystemCategoryId(CFG, TENANT, USER, { configRepo, categoryRepo } as any);

    expect(id).toBe(FALLBACK_ID);
    expect(categoryRepo.callsTo("create")[0].args[0].id).toBe(FALLBACK_ID);
  });

  it("restores (does not duplicate) a soft-deleted fallback category", async () => {
    const configRepo = createFakeConfigRepo({ id: "cfg", value: FALLBACK_ID });
    const categoryRepo = createInMemoryRepo([{ id: FALLBACK_ID, tenantid: TENANT, isdeleted: true }]);

    const id = await resolveSystemCategoryId(CFG, TENANT, USER, { configRepo, categoryRepo } as any);

    expect(id).toBe(FALLBACK_ID);
    expect(categoryRepo.callsTo("restore")).toHaveLength(1);
    expect(categoryRepo.callsTo("create")).toHaveLength(0);
  });
});

describe("setSystemCategoryMapping", () => {
  it("creates a configuration row when none exists", async () => {
    const configRepo = createFakeConfigRepo(null);
    await setSystemCategoryMapping(CFG, "cat-x", TENANT, USER, configRepo as any);
    const created = configRepo.callsTo("create")[0].args[0];
    expect(created).toMatchObject({ table: TableNames.TransactionCategories, type: CFG, key: "id", value: "cat-x" });
  });

  it("updates the existing configuration row's value when present", async () => {
    const configRepo = createFakeConfigRepo({ id: "cfg", value: "old" });
    await setSystemCategoryMapping(CFG, "cat-new", TENANT, USER, configRepo as any);
    const updated = configRepo.callsTo("update")[0];
    expect(updated.args[0]).toBe("cfg");
    expect(updated.args[1]).toMatchObject({ value: "cat-new" });
  });
});

describe("isSystemCategoryId", () => {
  it("is true for a category referenced by a configuration, false otherwise", async () => {
    const configRepo = createFakeConfigRepo();
    await configRepo.create(
      { table: TableNames.TransactionCategories, key: "id", value: "sys-cat", type: CFG, tenantid: TENANT },
      TENANT,
    );

    expect(await isSystemCategoryId("sys-cat", TENANT, configRepo as any)).toBe(true);
    expect(await isSystemCategoryId("other-cat", TENANT, configRepo as any)).toBe(false);
  });
});
