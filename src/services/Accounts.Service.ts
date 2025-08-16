import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";
import { ConfigurationTypes, TransactionNames } from "@/src/types/db/Config.Types";
import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import { useStorageMode } from "../providers/StorageModeProvider";

export function useAccountService() {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  const userId = session?.user?.id;
  const { dbContext } = useStorageMode();
  const accountRepo = dbContext.AccountRepository();

  // Repository-based Account hooks
  const findAllAccounts = () => {
    return useQuery<Account[]>({
      queryKey: [TableNames.Accounts, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return accountRepo.findAll({}, tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const findAccountById = (id?: string) => {
    return useQuery<Account | null>({
      queryKey: [TableNames.Accounts, id, tenantId, "repo"],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return accountRepo.findById(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const getTotalAccountBalanceRepo = () => {
    return useQuery<{ totalbalance: number } | null>({
      queryKey: ["Stats_TotalAccountBalance", tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return accountRepo.getTotalAccountBalance(tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const getAccountOpenedTransactionRepo = (id?: string) => {
    return useQuery<any>({
      queryKey: [TableNames.Transactions, id, tenantId, "repo"],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return accountRepo.getAccountOpenedTransaction(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const createAccountRepo = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (account: Inserts<TableNames.Accounts>) => {
        return await createAccountRepoHelper(account, session, accountRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
    });
  };

  const updateAccountRepo = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async ({
        account,
        originalData,
      }: {
        account: Updates<TableNames.Accounts>;
        originalData: Account;
      }) => {
        return await updateAccountRepoHelper(account, session, originalData, accountRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
    });
  };

  const upsertAccountRepo = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async ({
        formAccount,
        originalData,
        addAdjustmentTransaction = false,
      }: {
        formAccount: Inserts<TableNames.Accounts> | Updates<TableNames.Accounts>;
        originalData?: Account;
        addAdjustmentTransaction?: boolean;
      }) => {
        // Clean up properties that shouldn't be sent to database
        (formAccount as any).category = undefined;
        (formAccount as any).running_balance = undefined;

        if (formAccount.id && originalData) {
          return await updateAccountRepoHelper(
            formAccount,
            session,
            originalData,
            accountRepo,
            addAdjustmentTransaction,
          );
        }
        return await createAccountRepoHelper(formAccount as Inserts<TableNames.Accounts>, session, accountRepo);
      },
      onSuccess: async (_, data) => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
      },
      onError: (error, variables, context) => {
        throw new Error(JSON.stringify(error));
      },
    });
  };

  const deleteAccountRepo = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await accountRepo.softDelete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
    });
  };

  const restoreAccountRepo = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await accountRepo.restore(id, tenantId);
      },
      onSuccess: async id => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] }),
          queryClient.invalidateQueries({ queryKey: [TableNames.Accounts, id] }),
          queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] }),
        ]);
      },
    });
  };

  const updateAccountBalanceRepo = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async ({ accountId, amount }: { accountId: string; amount: number }) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await accountRepo.updateAccountBalance(accountId, amount, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
      },
    });
  };

  // Legacy hooks for backward compatibility
  const getAccounts = useGetAccounts();
  const getTotalAccountBalance = useGetTotalAccountBalance();
  const getAccountById = (id?: string) => useGetAccountById(id);
  const getAccountOpenedTransaction = (id?: string) => useGetAccountOpenedTransaction(id);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const upsertAccount = useUpsertAccount();
  const deleteAccount = useDeleteAccount();
  const restoreAccount = useRestoreAccount();
  const updateAccountOpenedTransaction = useUpdateAccountOpenedTransaction();

  return {
    // Repository-based methods (new)
    findAllAccounts,
    findAccountById,
    getTotalAccountBalanceRepo,
    getAccountOpenedTransactionRepo,
    createAccountRepo,
    updateAccountRepo,
    upsertAccountRepo,
    deleteAccountRepo,
    restoreAccountRepo,
    updateAccountBalanceRepo,

    // Legacy methods (backward compatibility)
    getAccounts,
    getTotalAccountBalance,
    getAccountById,
    getAccountOpenedTransaction,
    createAccount,
    updateAccount,
    upsertAccount,
    deleteAccount,
    restoreAccount,
    updateAccountOpenedTransaction,

    // Direct repository access
    accountRepo,
  };
}

export const useGetAccounts = () => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  const { dbContext } = useStorageMode();
  const accountRepo = dbContext.AccountRepository();

  return useQuery<Account[]>({
    queryKey: [TableNames.Accounts, tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return accountRepo.findAll({}, tenantId);
    },
    enabled: !!tenantId,
  });
};

export const useGetTotalAccountBalance = () => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  const { dbContext } = useStorageMode();
  const accountRepo = dbContext.AccountRepository();

  return useQuery<{ totalbalance: number } | null>({
    queryKey: ["Stats_TotalAccountBalance", tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return accountRepo.getTotalAccountBalance(tenantId);
    },
    enabled: !!tenantId,
  });
};

export const useGetAccountById = (id?: string) => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  const { dbContext } = useStorageMode();
  const accountRepo = dbContext.AccountRepository();

  return useQuery<Account | null>({
    queryKey: [TableNames.Accounts, id, tenantId],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return accountRepo.findById(id, tenantId);
    },
    enabled: !!id && !!tenantId,
  });
};

export const useGetAccountOpenedTransaction = (id?: string) => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  const { dbContext } = useStorageMode();
  const accountRepo = dbContext.AccountRepository();

  return useQuery<any>({
    queryKey: [TableNames.Transactions, id, tenantId],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return accountRepo.getAccountOpenedTransaction(id, tenantId);
    },
    enabled: !!id && !!tenantId,
  });
};

export const useCreateAccount = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  return useMutation({
    mutationFn: async (account: Inserts<TableNames.Accounts>) => {
      return await createAccountHelper(account, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
    },
  });
};
export const useUpdateAccount = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  return useMutation({
    mutationFn: async ({ account, originalData }: { account: Updates<TableNames.Accounts>; originalData: Account }) => {
      return await updateAccountHelper(account, session, originalData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
    },
  });
};

export const useUpsertAccount = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  return useMutation({
    mutationFn: async ({
      formAccount,
      originalData,
      addAdjustmentTransaction = false,
    }: {
      formAccount: Inserts<TableNames.Accounts> | Updates<TableNames.Accounts>;
      originalData?: Account;
      addAdjustmentTransaction?: boolean;
    }) => {
      // Explicitly cast to any to allow deletion of properties that might not be in the base type
      // This is to ensure these potentially existing properties are not sent to the database
      (formAccount as any).category = undefined;
      (formAccount as any).running_balance = undefined;

      if (formAccount.id && originalData) {
        return await updateAccountHelper(formAccount, session, originalData, addAdjustmentTransaction);
      }
      return await createAccountHelper(formAccount as Inserts<TableNames.Accounts>, session);
    },
    onSuccess: async (_, data) => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    },
    onError: (error, variables, context) => {
      throw new Error(JSON.stringify(error));
    },
  });
};

export const useDeleteAccount = () => {
  const { session } = useAuth();
  const { dbContext } = useStorageMode();
  const accountRepo = dbContext.AccountRepository();
  const tenantId = session?.user?.user_metadata?.tenantid;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return await accountRepo.softDelete(id, tenantId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
    },
  });
};

export const useRestoreAccount = (id?: string) => {
  const { session } = useAuth();
  const { dbContext } = useStorageMode();
  const accountRepo = dbContext.AccountRepository();
  const tenantId = session?.user?.user_metadata?.tenantid;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return await accountRepo.restore(id, tenantId);
    },
    onSuccess: async id => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] }),
        queryClient.invalidateQueries({ queryKey: [TableNames.Accounts, id] }),
        queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] }),
      ]);
    },
  });
};
export const useUpdateAccountOpenedTransaction = () => {
  const { session } = useAuth();
  const { dbContext } = useStorageMode();
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
    },
  });
};

const createAccountHelper = async (formAccount: Inserts<TableNames.Accounts>, session: Session) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formAccount.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
  formAccount.createdby = userId;
  formAccount.tenantid = tenantid;

  const { dbContext } = useStorageMode();
  const accountRepo = dbContext.AccountRepository();
  const newAcc = await accountRepo.create(formAccount, tenantid);

  if (newAcc) {
    const configRepo = dbContext.ConfigurationRepository();
    let config = await configRepo.getConfiguration(
      TableNames.TransactionCategories,
      ConfigurationTypes.AccountOpertationsCategory,
      "Id",
      tenantid,
    );
    if (!config) {
      throw new Error("Account Operations Category not found");
    }

    const transactionRepo = dbContext.TransactionRepository();
    await transactionRepo.create(
      {
        name: TransactionNames.AccountOpened,
        amount: formAccount.balance,
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

const updateAccountHelper = async (
  formData: Updates<TableNames.Accounts>,
  session: Session,
  originalData: Account,
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

  const { dbContext } = useStorageMode();
  const accountRepo = dbContext.AccountRepository();
  if (!formData.id) throw new Error("ID is required for update");
  const updatedAccount = await accountRepo.update(formData.id, formData, tenantid);

  if (formData.balance && formData.balance !== originalData.balance && addAdjustmentTransaction) {
    const configRepo = dbContext.ConfigurationRepository();
    const config = await configRepo.getConfiguration(
      TableNames.TransactionCategories,
      ConfigurationTypes.AccountOpertationsCategory,
      "Id",
      tenantid,
    );

    if (!config) {
      throw new Error("Account Operations Category not found");
    }

    const transactionRepo = dbContext.TransactionRepository();
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

// Repository-based helper functions
const createAccountRepoHelper = async (
  formAccount: Inserts<TableNames.Accounts>,
  session: Session,
  repository: any,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formAccount.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
  formAccount.createdby = userId;
  formAccount.tenantid = tenantid;

  const newAcc = await repository.create(formAccount, tenantid);

  if (newAcc) {
    const { dbContext } = useStorageMode();
    const configRepo = dbContext.ConfigurationRepository();

    let config = await configRepo.getConfiguration(
      TableNames.TransactionCategories,
      ConfigurationTypes.AccountOpertationsCategory,
      "Id",
      tenantid,
    );
    if (!config) {
      throw new Error("Account Operations Category not found");
    }

    const transactionRepo = dbContext.TransactionRepository();
    await transactionRepo.create(
      {
        name: TransactionNames.AccountOpened,
        amount: formAccount.balance,
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
  repository: any,
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
  const updatedAccount = await repository.update(formData.id, formData, tenantid);

  if (formData.balance && formData.balance !== originalData.balance && addAdjustmentTransaction) {
    const { dbContext } = useStorageMode();
    const configRepo = dbContext.ConfigurationRepository();

    const config = await configRepo.getConfiguration(
      TableNames.TransactionCategories,
      ConfigurationTypes.AccountOpertationsCategory,
      "Id",
      tenantid,
    );

    if (!config) {
      throw new Error("Account Operations Category not found");
    }

    const transactionRepo = dbContext.TransactionRepository();
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
