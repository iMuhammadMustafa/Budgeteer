import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { TableNames, ViewNames } from "@/src/types/database//TableNames";
import { Account, Inserts, Updates } from "@/src/types/database//Tables.Types";
import { Session } from "@supabase/supabase-js";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useAuth } from "../providers/AuthProvider";
import { queryClient } from "../providers/QueryProvider";
import { IAccountRepository } from "../repositories/interfaces/IAccountRepository";
import { IConfigurationRepository } from "../repositories/interfaces/IConfigurationRepository";
import { ITransactionRepository } from "../repositories/interfaces/ITransactionRepository";
import { ConfigurationTypes, TransactionNames } from "../types/database/Config.Types";
import createServiceHooks from "./BaseService";
import { IService } from "./IService";

export interface IAccountService extends IService<Account, TableNames.Accounts> {
  useGetTotalAccountsBalance: () => ReturnType<typeof useQuery<{ totalbalance: number } | null>>;
  useGetAccountOpenedTransaction: (id?: string) => ReturnType<typeof useQuery<any>>;
  useUpdateAccountBalance: () => ReturnType<typeof useMutation<number, Error, { accountId: string; amount: number }>>;
  useUpdateAccountOpenedTransaction: () => ReturnType<typeof useMutation<any, Error, { id: string; amount: number }>>;
  useGetAccountRunningBalance: (id?: string) => ReturnType<typeof useQuery<number | null>>;
}

export function useAccountService(): IAccountService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const accountRepo = dbContext?.AccountRepository();
  const transactionRepo = dbContext?.TransactionRepository();
  const configRepo = dbContext?.ConfigurationRepository();


  if (!accountRepo || !transactionRepo || !configRepo) throw new Error("Database context not found");

  const useGetTotalAccountsBalance = () => {
    return useQuery<{ totalbalance: number } | null>({
      queryKey: [TableNames.Accounts, "TotalBalance", tenantId],
      queryFn: async () => {
        return accountRepo.getTotalAccountBalance(tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const useGetAccountOpenedTransaction = (id?: string) => {
    return useQuery<any>({
      queryKey: [TableNames.Transactions, id, tenantId],
      queryFn: async () => {
        return accountRepo.getAccountOpenedTransaction(id!, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const useGetAccountRunningBalance = (id?: string) => {
    return useQuery<number | null>({
      queryKey: [TableNames.Accounts, id, "RunningBalance", tenantId],
      queryFn: async () => {
        const result = await accountRepo.getAccountRunningBalance(id!, tenantId);
        return result?.runningbalance ?? null;
      },
      enabled: !!id && !!tenantId,
    });
  };

  const useUpdateAccountBalance = () => {
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
  const useUpdateAccountOpenedTransaction = () => {
    const userId = session?.user.id;

    return useMutation({
      mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
        const transaction: Updates<TableNames.Transactions> = {
          id: id,
          amount: amount,
          updatedby: userId,
          updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
        };
        return await transactionRepo.update(id, transaction, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      },
    });
  };

  const useCreate = () => {
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

  const useUpdate = () => {
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

  const useUpsert = () => {
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
        (form as any).addAdjustmentTransaction = undefined;
        (form as any).openBalance = undefined;

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
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts, _?.id, "RunningBalance", tenantId] });
      },
      onError: (error, variables, context) => {
        throw new Error(JSON.stringify(error));
      },
    });
  };

  return {
    ...createServiceHooks<Account, TableNames.Accounts>(TableNames.Accounts, accountRepo, tenantId, session),
    useCreate,
    useUpdate,
    useUpsert,
    useGetTotalAccountsBalance,
    useGetAccountOpenedTransaction,
    useUpdateAccountBalance,
    useUpdateAccountOpenedTransaction,
    useGetAccountRunningBalance,
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
