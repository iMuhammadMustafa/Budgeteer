/**
 * System (reserved) transaction categories.
 *
 * Some business logic depends on a specific category always existing — e.g. the
 * "Account Operations" category behind Initial / Adjustment / Transfer
 * transactions. These are resolved through a `configurations` row (never by
 * matching on the category name), can be remapped by the user in Settings, and
 * are protected from deletion.
 *
 * `resolveSystemCategoryId` is the single source of truth: it reads the mapping,
 * validates that the mapped category still exists (and is not soft-deleted), and
 * self-heals by recreating a deterministic fallback category + re-pointing the
 * configuration when the mapping is missing or dangling. It therefore never
 * throws for a routine account operation.
 */
import dayjs from "dayjs";
import { IConfigurationRepository } from "@/src/repositories/interfaces/IConfigurationRepository";
import { ITransactionCategoryRepository } from "@/src/repositories/interfaces/ITransactionCategoryRepository";
import { ConfigurationTypes } from "@/src/types/database/Config.Types";
import { TableNames } from "@/src/types/database/TableNames";

/** Describes a reserved category and the deterministic fallback used to heal it. */
export interface SystemCategoryDef {
  configType: ConfigurationTypes;
  /** Human label shown in the Settings mapping screen. */
  label: string;
  description: string;
  /** Recreated (with this exact id) when the mapping is missing or dangling. */
  fallback: {
    id: string;
    name: string;
    /** Must satisfy the TransactionCategories `type` CHECK constraint. */
    type: string;
    groupid: string;
    color: string;
    icon: string;
  };
}

/**
 * The registry of reserved categories. Ids/group ids mirror the seed data so a
 * heal restores the original seeded rows rather than orphaning them.
 */
export const SYSTEM_CATEGORY_DEFS: SystemCategoryDef[] = [
  {
    configType: ConfigurationTypes.AccountOpertationsCategory,
    label: "Account Operations",
    description: "Used for opening balances, balance adjustments, and transfers between accounts.",
    fallback: {
      id: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      name: "Account Operations",
      type: "Adjustment",
      groupid: "2a1caa0e-5767-4b99-8bdd-8a48fc42e72b",
      color: "UserPen",
      icon: "Wallet",
    },
  },
];

export const getSystemCategoryDef = (configType: ConfigurationTypes): SystemCategoryDef | undefined =>
  SYSTEM_CATEGORY_DEFS.find(d => d.configType === configType);

interface SystemCategoryRepos {
  configRepo: IConfigurationRepository;
  categoryRepo: ITransactionCategoryRepository;
}

const now = () => dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

/**
 * Returns the configuration row backing a system category, or `null` if none
 * exists (both backends throw from `getConfiguration` when missing).
 */
export const getSystemCategoryConfig = async (
  configType: ConfigurationTypes,
  tenantId: string,
  configRepo: IConfigurationRepository,
) =>
  configRepo
    .getConfiguration(TableNames.TransactionCategories, configType, "id", tenantId)
    .catch(() => null);

/**
 * Resolve (and self-heal) the category id for a reserved category.
 *
 * Order of operations:
 *  1. Read the configuration mapping.
 *  2. If it points to a live (non-deleted) category, use it.
 *  3. Otherwise ensure the deterministic fallback category exists (restoring a
 *     soft-deleted row or creating a fresh one) and re-point the configuration.
 */
export const resolveSystemCategoryId = async (
  configType: ConfigurationTypes,
  tenantId: string,
  userId: string,
  { configRepo, categoryRepo }: SystemCategoryRepos,
): Promise<string> => {
  const def = getSystemCategoryDef(configType);
  if (!def) throw new Error(`Unknown system category: ${configType}`);

  const config = await getSystemCategoryConfig(configType, tenantId, configRepo);

  // (2) Mapping points to a live category — happy path.
  if (config?.value) {
    const mapped = await categoryRepo.findById(config.value, tenantId).catch(() => null);
    if (mapped && !mapped.isdeleted) return config.value;
  }

  // (3) Heal: guarantee the fallback category exists. `restore` un-deletes it if
  // it was soft-deleted (no-op otherwise); we only create when truly absent —
  // this avoids a PK conflict against a soft-deleted row that findById hides.
  const { fallback } = def;
  await categoryRepo.restore(fallback.id, tenantId).catch(() => {});
  const existing = await categoryRepo.findById(fallback.id, tenantId).catch(() => null);
  if (!existing) {
    await categoryRepo.create(
      {
        id: fallback.id,
        name: fallback.name,
        type: fallback.type,
        groupid: fallback.groupid,
        color: fallback.color,
        icon: fallback.icon,
        tenantid: tenantId,
        createdby: userId,
        createdat: now(),
      } as any,
      tenantId,
    );
  }

  await setSystemCategoryMapping(configType, fallback.id, tenantId, userId, configRepo);
  return fallback.id;
};

/**
 * Point a reserved category at `categoryId`, creating the configuration row when
 * it does not yet exist. Used by the healer and by the Settings mapping screen.
 */
export const setSystemCategoryMapping = async (
  configType: ConfigurationTypes,
  categoryId: string,
  tenantId: string,
  userId: string,
  configRepo: IConfigurationRepository,
): Promise<void> => {
  const config = await getSystemCategoryConfig(configType, tenantId, configRepo);
  if (config) {
    await configRepo.update(
      config.id,
      { value: categoryId, updatedby: userId, updatedat: now() } as any,
      tenantId,
    );
  } else {
    await configRepo.create(
      {
        table: TableNames.TransactionCategories,
        type: configType,
        key: "id",
        value: categoryId,
        tenantid: tenantId,
        createdby: userId,
        createdat: now(),
      } as any,
      tenantId,
    );
  }
};

/**
 * True when `categoryId` is currently mapped to any reserved category for the
 * tenant. Used to block deletion of system categories.
 */
export const isSystemCategoryId = async (
  categoryId: string,
  tenantId: string,
  configRepo: IConfigurationRepository,
): Promise<boolean> => {
  const configs = await configRepo.findAll(tenantId).catch(() => []);
  return configs.some(
    c => c.table === TableNames.TransactionCategories && c.key === "id" && c.value === categoryId,
  );
};
