import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import {
  createAccount,
  deleteAccount,
  getAccountById,
  getAccountOpenedTransaction,
  getAllAccounts,
  getTotalAccountBalance,
  restoreAccount,
  updateAccount,
} from "../apis/Accounts.repository";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";
import { createTransaction, updateTransaction } from "../apis/Transactions.repository";
import { getConfiguration } from "../apis/Configurations.repository";
import { ConfigurationTypes, TransactionNames } from "@/src/types/db/Config.Types";
import { getDemoMode } from "@/src/providers/DemoModeGlobal";

export const useGetAccounts = () => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<Account[]>({
    queryKey: [TableNames.Accounts, tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return getAllAccounts(tenantId);
    },
    enabled: !!tenantId,
  });
};

export const useGetTotalAccountBalance = () => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<{ totalbalance: number } | null>({
    queryKey: ["Stats_TotalAccountBalance", tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return getTotalAccountBalance(tenantId);
    },
    enabled: !!tenantId,
  });
};

export const useGetAccountById = (id?: string) => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<Account | null>({
    queryKey: [TableNames.Accounts, id, tenantId],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return getAccountById(id, tenantId);
    },
    enabled: !!id && !!tenantId,
  });
};

export const useGetAccountOpenedTransaction = (id?: string) => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<any>({
    queryKey: [TableNames.Transactions, id, tenantId],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return getAccountOpenedTransaction(id, tenantId);
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
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (id: string) => {
      // const [_, accountRes] = await Promise.all([deleteAccount(id, userId), deleteAccountTransactions(id, userId)]);
      return await deleteAccount(id, userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
    },
  });
};

export const useRestoreAccount = (id?: string) => {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (id: string) => {
      // const [_, accountRes] = await Promise.all([restoreAccountTransactions(id, session), restoreAccount(id, session)]);
      return await restoreAccount(id, userId);
      // return accountRes;
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
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const transaction: Updates<TableNames.Transactions> = {
        id: id,
        amount: amount,
        updatedby: userId,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      };
      return await updateTransaction(transaction);
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

  const newAcc = await createAccount(formAccount);

  if (newAcc) {
    let config = await getConfiguration(
      TableNames.TransactionCategories,
      ConfigurationTypes.AccountOpertationsCategory,
      "Id",
      tenantid,
    );
    if (!config) {
      throw new Error("Account Operations Category not found");
    }
    await createTransaction({
      name: TransactionNames.AccountOpened,
      amount: formAccount.balance,
      accountid: newAcc.id,
      categoryid: config.value,
      type: "Initial",
      createdby: userId,
      createdat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      tenantid: tenantid,
      date: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
    });
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

  const updatedAccount = await updateAccount(formData);

  if (formData.balance && formData.balance !== originalData.balance && addAdjustmentTransaction) {
    const config = await getConfiguration(
      TableNames.TransactionCategories,
      ConfigurationTypes.AccountOpertationsCategory,
      "Id",
      tenantid,
    );

    if (!config) {
      throw new Error("Account Operations Category not found");
    }

    await createTransaction({
      name: TransactionNames.BalanceAdjustment,
      amount: formData.balance - originalData.balance,
      accountid: originalData.id,
      categoryid: config.value,
      type: "Adjustment",
      createdby: userId,
      tenantid: tenantid,
      date: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
    });
  }

  return updatedAccount;
};
