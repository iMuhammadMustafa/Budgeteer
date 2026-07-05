/**
 * Pure account mutation helpers extracted from Accounts.Service so they can be
 * unit-tested without the React Query / provider graph. Behavior is identical
 * to the originals; repositories are injected as parameters.
 */
import { Session } from "@supabase/supabase-js";
import dayjs from "dayjs";
import { TableNames } from "@/src/types/database/TableNames";
import { Account, Inserts, Updates } from "@/src/types/database/Tables.Types";
import { IAccountRepository } from "@/src/repositories/interfaces/IAccountRepository";
import { IConfigurationRepository } from "@/src/repositories/interfaces/IConfigurationRepository";
import { ITransactionCategoryRepository } from "@/src/repositories/interfaces/ITransactionCategoryRepository";
import { ITransactionRepository } from "@/src/repositories/interfaces/ITransactionRepository";
import { ConfigurationTypes, TransactionNames } from "@/src/types/database/Config.Types";
import { resolveSystemCategoryId } from "./systemCategories";

export const createAccountRepoHelper = async (
  formAccount: Inserts<TableNames.Accounts>,
  session: Session,
  accountRepo: IAccountRepository,
  transactionRepo: ITransactionRepository,
  configRepo: IConfigurationRepository,
  categoryRepo: ITransactionCategoryRepository,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formAccount.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
  formAccount.createdby = userId;
  formAccount.tenantid = tenantid;

  const newAcc = await accountRepo.create(formAccount, tenantid);

  if (newAcc) {
    // Resolves the mapped "Account Operations" category, self-healing the
    // configuration/category if the user deleted either one.
    const categoryid = await resolveSystemCategoryId(
      ConfigurationTypes.AccountOpertationsCategory,
      tenantid,
      userId,
      { configRepo, categoryRepo },
    );
    const transaction = await transactionRepo.create(
      {
        name: TransactionNames.AccountOpened,
        amount: formAccount.balance || 0,
        accountid: newAcc.id,
        categoryid,
        type: "Initial",
        createdby: userId,
        createdat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
        tenantid: tenantid,
        date: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
      },
      tenantid,
    );
  }

  return newAcc;
};

export const updateAccountRepoHelper = async (
  formData: Updates<TableNames.Accounts>,
  session: Session,
  originalData: Account,
  accountRepo: IAccountRepository,
  transactionRepo: ITransactionRepository,
  configRepo: IConfigurationRepository,
  categoryRepo: ITransactionCategoryRepository,
  addAdjustmentTransaction = false,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formData.updatedby = userId;
  formData.updatedat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

  const isUnchanged = Object.keys(formData).every(key => {
    if (key in formData && key in originalData) {
      return formData[key as keyof typeof formData] === originalData[key as keyof typeof originalData];
    }
    return false;
  });
  if (isUnchanged) return; // Exit early if no changes

  if (!formData.id) throw new Error("ID is required for update");
  const updatedAccount = await accountRepo.update(formData.id, formData, tenantid);

  if (formData.balance && formData.balance !== originalData.balance && addAdjustmentTransaction) {
    const categoryid = await resolveSystemCategoryId(
      ConfigurationTypes.AccountOpertationsCategory,
      tenantid,
      userId,
      { configRepo, categoryRepo },
    );

    await transactionRepo.create(
      {
        name: TransactionNames.BalanceAdjustment,
        amount: formData.balance - originalData.balance,
        accountid: originalData.id,
        categoryid,
        type: "Adjustment",
        createdby: userId,
        tenantid: tenantid,
        date: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      },
      tenantid,
    );
  }

  return updatedAccount;
};
