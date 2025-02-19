import { useMutation, useQuery } from "@tanstack/react-query";
import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import {
  createAccount,
  deleteAccount,
  getAccountById,
  getAccountOpenedTransaction,
  getAllAccounts,
  restoreAccount,
  updateAccount,
} from "../apis/Accounts.api";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";
import { createTransaction } from "../apis/Transactions.api";
import { getConfiguration } from "../apis/Configurations.api";
import { ConfigurationTypes, TransactionNames } from "@/src/types/db/Config.Types";

export const useGetAccounts = () => {
  return useQuery<Account[]>({
    queryKey: [TableNames.Accounts],
    queryFn: getAllAccounts,
  });
};

export const useGetAccountById = (id?: string) => {
  return useQuery<Account>({
    queryKey: [TableNames.Accounts, id],
    queryFn: async () => getAccountById(id!),
    enabled: !!id,
  });
};

export const useGetAccountOpenedTransaction = (id: string) => {
  return useQuery<any>({
    queryKey: [TableNames.Transactions, id],
    queryFn: async () => getAccountOpenedTransaction(id),
    enabled: !!id,
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
    }: {
      formAccount: Inserts<TableNames.Accounts> | Updates<TableNames.Accounts>;
      originalData?: Account;
    }) => {
      if (formAccount.id && originalData) {
        return await updateAccountHelper(formAccount, session, originalData);
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

const createAccountHelper = async (formAccount: Inserts<TableNames.Accounts>, session: Session) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formAccount.createdat = new Date().toISOString();
  formAccount.createdby = userId;
  formAccount.tenantid = tenantid;

  const newAcc = await createAccount(formAccount);

  if (newAcc) {
    let config = await getConfiguration(
      TableNames.TransactionCategories,
      ConfigurationTypes.AccountOpertationsCategory,
      "Id",
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
      createdat: new Date().toISOString(),
      tenantid: tenantid,
      date: new Date().toISOString(),
    });
  }

  return newAcc;
};

const updateAccountHelper = async (
  formAccount: Updates<TableNames.Accounts>,
  session: Session,
  originalData: Account,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formAccount.updatedby = userId;
  formAccount.updatedat = new Date().toISOString();

  const updatedAccount = await updateAccount(formAccount);

  if (formAccount.balance && formAccount.balance !== originalData.balance) {
    const config = await getConfiguration(
      TableNames.TransactionCategories,
      ConfigurationTypes.AccountOpertationsCategory,
      "Id",
    );

    if (!config) {
      throw new Error("Account Operations Category not found");
    }

    await createTransaction({
      name: TransactionNames.BalanceAdjustment,
      amount: formAccount.balance - originalData.balance,
      accountid: originalData.id,
      categoryid: config.value,
      type: "Adjustment",
      createdby: userId,
      tenantid: tenantid,
      date: new Date().toISOString(),
    });
  }

  return updatedAccount;
};
