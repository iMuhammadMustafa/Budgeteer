import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames, ViewNames } from "@/src/types/db/TableNames";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";
import { ConfigurationTypes, TransactionNames } from "@/src/types/db/Config.Types";
import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import { useStorageMode } from "../providers/StorageModeProvider";
import { IAccountRepository, IConfigurationRepository, ITransactionRepository } from "../repositories";
import { IService } from "./IService";

export interface IAccountService extends IService<Account, Inserts<TableNames.Accounts>, Updates<TableNames.Accounts>> {
  getTotalAccountsBalance: () => ReturnType<typeof useQuery<{ totalbalance: number } | null>>;
  getAccountOpenedTransaction: (id?: string) => ReturnType<typeof useQuery<any>>;
  updateAccountBalance: () => ReturnType<typeof useMutation<number, Error, { accountId: string; amount: number }>>;
  updateAccountOpenedTransaction: () => ReturnType<typeof useMutation<any, Error, { id: string; amount: number }>>;
}

export function useAccountService(): IAccountService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  const userId = session?.user?.id;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const accountRepo = dbContext.AccountRepository();
  const transactionRepo = dbContext.TransactionRepository();
  const configRepo = dbContext.ConfigurationRepository();

  const findAll = () => {
    return useQuery<Account[]>({
      queryKey: [TableNames.Accounts, tenantId, "repo"],
      queryFn: async () => {
        return accountRepo.findAll({}, tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const findById = (id?: string) => {
    return useQuery<Account | null>({
      queryKey: [TableNames.Accounts, id, tenantId, "repo"],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");

        return accountRepo.findById(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const getTotalAccountsBalance = () => {
    return useQuery<{ totalbalance: number } | null>({
      queryKey: [ViewNames.StatsTotalAccountBalance, tenantId, "repo"],
      queryFn: async () => {
        return accountRepo.getTotalAccountBalance(tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const getAccountOpenedTransaction = (id?: string) => {
    return useQuery<any>({
      queryKey: [TableNames.Transactions, id, tenantId, "repo"],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");

        return accountRepo.getAccountOpenedTransaction(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const create = () => {
    return useMutation({
      mutationFn: async (form: Inserts<TableNames.Accounts>) => {
        return await createAccountRepoHelper(form, session, accountRepo, transactionRepo, configRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      },
    });
  };

  const update = () => {
    return useMutation({
      mutationFn: async ({
        form,
        original,
        props: { addAdjustmentTransaction = false } = {},
      }: {
        form: Updates<TableNames.Accounts>;
        original?: Account;
        props?: {
          addAdjustmentTransaction?: boolean;
        };
      }) => {
        return await updateAccountRepoHelper(
          form,
          session,
          original!,
          accountRepo,
          transactionRepo,
          configRepo,
          addAdjustmentTransaction,
        );
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      },
    });
  };

  const upsert = () => {
    return useMutation({
      mutationFn: async ({
        form,
        original,
        props: { addAdjustmentTransaction = false } = {},
      }: {
        form: Inserts<TableNames.Accounts> | Updates<TableNames.Accounts>;
        original?: Account;
        props?: {
          addAdjustmentTransaction?: boolean;
        };
      }) => {
        // Clean up properties that shouldn't be sent to database
        (form as any).category = undefined;
        (form as any).runningbalance = undefined;

        if (form.id && original) {
          return await updateAccountRepoHelper(
            form,
            session,
            original,
            accountRepo,
            transactionRepo,
            configRepo,
            addAdjustmentTransaction,
          );
        }
        return await createAccountRepoHelper(
          form as Inserts<TableNames.Accounts>,
          session,
          accountRepo,
          transactionRepo,
          configRepo,
        );
      },
      onSuccess: async (_, data) => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      },
      onError: (error, variables, context) => {
        throw new Error(JSON.stringify(error));
      },
    });
  };

  const deleteObj = () => {
    return useMutation({
      mutationFn: async ({ id }: { id: string }) => {
        return await accountRepo.softDelete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      },
    });
  };

  const restore = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        return await accountRepo.restore(id, tenantId);
      },
      onSuccess: async id => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] }),
          queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] }),
        ]);
      },
    });
  };

  const updateAccountBalance = () => {
    return useMutation({
      mutationFn: async ({ accountId, amount }: { accountId: string; amount: number }) => {
        return await accountRepo.updateAccountBalance(accountId, amount, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      },
    });
  };
  const updateAccountOpenedTransaction = () => {
    const transactionRepo = dbContext.TransactionRepository();
    const userId = session?.user.id;

    return useMutation({
      mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
        const transaction: Updates<TableNames.Transactions> = {
          id: id,
          amount: amount,
          updatedby: userId,
          updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
        };
        return await transactionRepo.update(id, transaction);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      },
    });
  };

  return {
    findAll,
    findById,
    getTotalAccountsBalance,
    getAccountOpenedTransaction,
    create,
    update,
    upsert,
    delete: deleteObj,
    softDelete: deleteObj,
    restore,
    updateAccountBalance,
    updateAccountOpenedTransaction,

    repo: accountRepo,
  };
}

const createAccountRepoHelper = async (
  formAccount: Inserts<TableNames.Accounts>,
  session: Session,
  accountRepo: IAccountRepository,
  transactionRepo: ITransactionRepository,
  configRepo: IConfigurationRepository,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formAccount.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
  formAccount.createdby = userId;
  formAccount.tenantid = tenantid;

  const newAcc = await accountRepo.create(formAccount, tenantid);

  if (newAcc) {
    let config = await configRepo.getConfiguration(
      TableNames.TransactionCategories,
      ConfigurationTypes.AccountOpertationsCategory,
      "id",
      tenantid,
    );
    if (!config) {
      throw new Error("Account Operations Category not found");
    }
    const transaction = await transactionRepo.create(
      {
        name: TransactionNames.AccountOpened,
        amount: formAccount.balance || 0,
        accountid: newAcc.id,
        categoryid: config.value,
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

const updateAccountRepoHelper = async (
  formData: Updates<TableNames.Accounts>,
  session: Session,
  originalData: Account,
  accountRepo: IAccountRepository,
  transactionRepo: ITransactionRepository,
  configRepo: IConfigurationRepository,
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
    const config = await configRepo.getConfiguration(
      TableNames.TransactionCategories,
      ConfigurationTypes.AccountOpertationsCategory,
      "id",
      tenantid,
    );

    if (!config) {
      throw new Error("Account Operations Category not found");
    }

    await transactionRepo.create(
      {
        name: TransactionNames.BalanceAdjustment,
        amount: formData.balance - originalData.balance,
        accountid: originalData.id,
        categoryid: config.value,
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
