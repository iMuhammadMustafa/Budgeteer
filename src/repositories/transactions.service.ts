import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Account,
  DailyTransactionsSummary,
  Inserts,
  MonthlyTransactions,
  Transaction,
  TransactionsView,
  Updates,
} from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { TableNames, transactionsKeys, ViewNames } from "@/src/consts/TableNames";
import {
  getTransactionById,
  updateTransaction,
  createTransaction,
  deleteTransaction,
  restoreTransaction,
  getAllTransactions,
  getTransactionByTransferId,
  getTransactionsByDescription,
  getMonthlyTransactions,
  getDailyTransactionsSummary,
} from "./transactions.api";
import { updateAccount, updateAccountBalance } from "./account.api";
import { TransactionFormType } from "../components/pages/TransactionForm";
import { SearchableDropdownItem } from "../components/SearchableDropdown";

interface CategorizedTransactions {
  categories: {
    expenses: MonthlyTransactions[];
    income: MonthlyTransactions[];
  };
  groups: {
    expenses: Record<string, MonthlyTransactions[]>;
    income: Record<string, MonthlyTransactions[]>;
  };
}

export const useGetTransactions = () => {
  return useQuery<TransactionsView[]>({
    queryKey: [ViewNames.TransactionsView],
    queryFn: getAllTransactions,
  });
};

export const useSearchTransactionsByDescription = (text: string) => {
  const { data, error } = useQuery<SearchableDropdownItem[]>({
    queryKey: [ViewNames.TransactionDistinct + text],
    queryFn: async () => getTransactionsByDescription(text),
    enabled: !!text,
  });

  if (error) throw error;
  return data ?? [];
};

export const useMonthlyTransactions = () => {
  return useQuery<MonthlyTransactions[]>({
    queryKey: [ViewNames.MonthlyTransactions],
    queryFn: async () => getMonthlyTransactions(),
  });
};

export const useDailyTransactionsSummary = () => {
  return useQuery<DailyTransactionsSummary[]>({
    queryKey: [ViewNames.DailyTransactionsSummary],
    queryFn: async () => getDailyTransactionsSummary(),
  });
};

export const useGetTransactionById = (transactionid?: string | null) => {
  return useQuery<TransactionsView>({
    queryKey: [ViewNames.TransactionsView, transactionid],
    queryFn: async () => getTransactionById(transactionid!),
    enabled: !!transactionid,
  });
};

export const useUpsertTransaction = () => {
  const queryClient = useQueryClient();
  const { session, isSessionLoading } = useAuth();

  if (!isSessionLoading && (!session || !session.user)) {
    throw new Error("User is not logged in");
  }

  return useMutation({
    mutationFn: async ({
      fullFormTransaction,
      originalData,
      sourceAccount,
      destinationAccount,
    }: {
      fullFormTransaction: TransactionFormType;
      originalData?: TransactionFormType;
      sourceAccount: Account | null;
      destinationAccount: Account | null;
    }) => {
      const currentTimestamp = new Date().toISOString();
      const userId = session!.user.id;

      if (!fullFormTransaction.id) {
        return await handleNewTransaction(
          fullFormTransaction,
          sourceAccount!,
          destinationAccount,
          currentTimestamp,
          userId,
        );
      }

      return await handleUpdateTransaction(
        fullFormTransaction,
        originalData!,
        sourceAccount!,
        destinationAccount,
        currentTimestamp,
        userId,
      );
    },
    onSuccess: async something => {
      console.log("Success", something);
      await queryClient.invalidateQueries({ queryKey: transactionsKeys.all() });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  const { session, isSessionLoading } = useAuth();
  if (!isSessionLoading && (!session || !session.user)) {
    throw new Error("No Session or user");
  }
  return useMutation({
    mutationFn: async (formTransaction: Transaction) => {
      const currentTimestamp = new Date().toISOString();
      await updateAccountBalance(formTransaction.accountid, -formTransaction.amount, currentTimestamp, session.user.id);

      if (formTransaction.type === "Transfer") {
        const relatedTransaction = formTransaction.transferid
          ? await getTransactionById(formTransaction.transferid)
          : await getTransactionByTransferId(formTransaction.id);

        await updateAccountBalance(
          relatedTransaction.accountid,
          -relatedTransaction.amount,
          currentTimestamp,
          session.user.id,
        );
        await deleteTransaction(relatedTransaction.id, session);
      }

      return await deleteTransaction(formTransaction.id, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    },
  });
};
export const useRestoreTransaction = (id: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async () => {
      return await restoreTransaction(id, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    },
  });
};

const handleNewTransaction = async (
  fullFormTransaction: TransactionFormType,
  sourceAccount: Account,
  destinationAccount: Account | null,
  currentTimestamp: string,
  userId: string,
) => {
  let amount = fullFormTransaction.amount;

  if (fullFormTransaction.type === "Expense" || fullFormTransaction.type === "Transfer") amount = -amount;

  const updatedSrcAcc = await updateAccount({
    id: sourceAccount.id,
    balance: sourceAccount.balance + amount,
    updatedat: currentTimestamp,
    updatedby: userId,
  });
  if (!updatedSrcAcc) {
    throw new Error("Source Account wasn't updated");
  }

  // fullFormTransaction as unknown as Inserts<TableNames.Transactions>,
  const createdTransaction = await createTransaction({
    id: undefined,
    accountid: fullFormTransaction.accountid,
    amount: fullFormTransaction.amount,
    categoryid: fullFormTransaction.categoryid,
    date: fullFormTransaction.date,
    description: fullFormTransaction.description,
    // notes: fullFormTransaction.notes,
    status: fullFormTransaction.status,
    tags: fullFormTransaction.tags,
    // tenantid: fullFormTransaction.tenantid,
    transferaccountid: fullFormTransaction.id,

    // transferid: fullFormTransaction.transferid,
    type: fullFormTransaction.type,
    // updatedat: fullFormTransaction.updatedat,
    // updatedby: fullFormTransaction.updatedby,
    // createdby: userId,
  });

  if (!createdTransaction) {
    await updateAccount({
      id: sourceAccount.id,
      balance: sourceAccount.balance - amount,
      updatedat: currentTimestamp,
      updatedby: userId,
    });
    throw new Error("Transaction wasn't created");
  }

  if (fullFormTransaction.type === "Transfer" && destinationAccount) {
    amount = Math.abs(amount);

    const transferTransaction = {
      ...fullFormTransaction,
      id: undefined,
      amount: amount,
      transferid: createdTransaction.id,
      accountid: destinationAccount.id,
    };

    const updatedDestAcc = await updateAccount({
      id: destinationAccount.id,
      balance: destinationAccount.balance + amount,
      updatedat: currentTimestamp,
      updatedby: userId,
    });

    if (!updatedDestAcc) {
      throw new Error("Source Account wasn't updated");
    }

    const createdDestTransaction = await createTransaction({
      id: undefined,
      accountid: transferTransaction.accountid,
      amount: transferTransaction.amount,
      categoryid: transferTransaction.categoryid,
      date: transferTransaction.date,
      description: transferTransaction.description,
      // notes: transferTransaction.notes,
      status: transferTransaction.status,
      tags: transferTransaction.tags,
      // tenantid: transferTransaction.tenantid,
      transferaccountid: transferTransaction.id,

      // transferid: transferTransaction.transferid,
      type: transferTransaction.type,
      // updatedat: transferTransaction.updatedat,
      // updatedby: transferTransaction.updatedby,
      // createdby: userId,
    });
    if (!createdDestTransaction) {
      await updateAccount({
        id: destinationAccount.id,
        balance: destinationAccount.balance - amount,
        updatedat: currentTimestamp,
        updatedby: userId,
      });
      throw new Error("Transfer Transaction wasn't updated");
    }
  }

  return createdTransaction;
};

const handleUpdateTransaction = async (
  fullFormTransaction: TransactionFormType,
  originalTransaction: TransactionFormType,
  sourceAccount: Account,
  destinationAccount: Account | null,
  currentTimestamp: string,
  userId: string,
) => {
  const isUpdatedAmount = fullFormTransaction.amount !== originalTransaction.amount;
  // If the transaction is an expense or a transfer and it's the main transaction, make the amount negative
  if (
    fullFormTransaction.type === "Expense" ||
    (fullFormTransaction.type === "Transfer" && !originalTransaction.transferid)
  ) {
    fullFormTransaction.amount = -Math.abs(fullFormTransaction.amount);
  }
  // If the transaction is an income or a transfer and it's the sub transaction, make the amount positive
  if (
    fullFormTransaction.type === "Income" ||
    (fullFormTransaction.type === "Transfer" && originalTransaction.transferid)
  ) {
    fullFormTransaction.amount = Math.abs(fullFormTransaction.amount);
  }

  const newAmount = fullFormTransaction.amount - originalTransaction.amount;

  // If the account has changed, update the original account balance
  if (fullFormTransaction.accountid !== originalTransaction.accountid) {
    await updateAccount({
      id: originalTransaction.accountid!,
      balance: originalTransaction.balance! - originalTransaction.amount,
      updatedat: currentTimestamp,
      updatedby: userId,
    });
  }

  // Update the source account balance
  const updatedSrcAcc = await updateAccount({
    id: sourceAccount.id,
    balance: sourceAccount.balance + newAmount,
    updatedat: currentTimestamp,
    updatedby: userId,
  });
  // Update the transaction
  const updatedTransaction = await updateTransaction({
    id: fullFormTransaction.id!,
    accountid: fullFormTransaction.accountid,
    amount: fullFormTransaction.amount,
    categoryid: fullFormTransaction.categoryid,
    date: fullFormTransaction.date,
    description: fullFormTransaction.description,
    notes: fullFormTransaction.notes,
    status: fullFormTransaction.status,
    tags: fullFormTransaction.tags,
    transferaccountid: fullFormTransaction.id,

    tenantid: fullFormTransaction.tenantid,
    transferid: fullFormTransaction.transferid,
    type: fullFormTransaction.type,
    updatedat: fullFormTransaction.updatedat,
    updatedby: fullFormTransaction.updatedby,
    createdby: userId,
  });
  // If Update Failed revert the source account balance
  if (!updatedTransaction) {
    await updateAccount({
      id: sourceAccount.id,
      balance: sourceAccount.balance - newAmount,
      updatedat: currentTimestamp,
      updatedby: userId,
    });
    throw new Error("Transaction wasn't updated");
  }

  if (fullFormTransaction.type === "Transfer") {
    let destinationTransaction = undefined;

    // If the original transaction type is not a transfer create a new transaction
    if (originalTransaction.type !== "Transfer") {
      destinationTransaction = await createTransaction({
        // id: fullFormTransaction.id!,
        // accountid: fullFormTransaction.accountid,
        // amount: fullFormTransaction.amount,
        categoryid: fullFormTransaction.categoryid,
        date: fullFormTransaction.date,
        description: fullFormTransaction.description,
        notes: fullFormTransaction.notes,
        status: fullFormTransaction.status,
        tags: fullFormTransaction.tags,
        // transferaccountid: fullFormTransaction.id,

        tenantid: fullFormTransaction.tenantid,
        // transferid: fullFormTransaction.transferid,
        type: fullFormTransaction.type,
        updatedat: fullFormTransaction.updatedat,
        updatedby: fullFormTransaction.updatedby,
        createdby: userId,

        id: undefined,
        amount: Math.abs(fullFormTransaction.amount),
        transferid: updatedTransaction.id,
        accountid: destinationAccount!.id,
        transferaccountid: sourceAccount.id,
      });

      const updatedDestAcc = await updateAccount({
        id: destinationAccount!.id,
        balance: destinationAccount!.balance + destinationTransaction.amount!,
        updatedat: currentTimestamp,
        updatedby: userId,
      });
      return updatedTransaction;
    }

    let transferTransaction = undefined;
    let transferAmount = 0;
    // If transaction has transferId, it's a sub transaction get the main and update it
    if (originalTransaction.transferid) {
      // Main Transaction
      transferTransaction = await getTransactionById(originalTransaction.transferid);
      transferAmount = -Math.abs(fullFormTransaction.amount);
      // If transaction has no transferId, it's a main transaction get the sub and update it
    } else {
      // Sub Transaction
      transferTransaction = await getTransactionByTransferId(originalTransaction.id!);
      transferAmount = Math.abs(fullFormTransaction.amount);
    }
    // Update the transfer transaction amount
    await updateTransaction({
      id: transferTransaction.id!,
      amount: transferAmount,
      updatedat: currentTimestamp,
      updatedby: userId,
    });
    // Update the destination account balance
    const updatedDestAcc = await updateAccount({
      id: transferTransaction.accountid!,
      balance: transferTransaction.balance! - transferTransaction.amount! + transferAmount,
      updatedat: currentTimestamp,
      updatedby: userId,
    });
  }
};

const ssss = async (
  fullFormTransaction: TransactionFormType,
  originalData: TransactionFormType,
  currentTimestamp: string,
  userId: string,
) => {
  const { transferaccountid: destAccountId, ...formTransaction } = fullFormTransaction;
  const amount = formTransaction.amount ?? 0;

  if (formTransaction.type === "Expense" || (formTransaction.type === "Transfer" && !originalData.transferid)) {
    formTransaction.amount = -Math.abs(amount);
  }
  if (formTransaction.type === "Income" || (formTransaction.type === "Transfer" && originalData.transferid)) {
    formTransaction.amount = Math.abs(amount);
  }

  let newAccountBalance = formTransaction.balance! - originalData.amount!;

  if (fullFormTransaction.accountid !== originalData.accountid) {
    await updateAccount({
      id: originalData.accountid!,
      balance: newAccountBalance,
      updatedat: currentTimestamp,
      updatedby: userId,
    });
  }
  if (fullFormTransaction.accountid === originalData.accountid) {
    newAccountBalance = newAccountBalance + formTransaction.amount!;
  }

  await updateAccount({
    id: formTransaction.accountid!,
    balance: newAccountBalance,
    updatedat: currentTimestamp,
    updatedby: userId,
  });
  const updatedTransaction = await updateTransaction(formTransaction as Updates<TableNames.Transactions>);

  if (originalData.type === "Transfer") {
    if (originalData.transferid) {
      //Editing Master
      const originalTransferDest = await getTransactionById(originalData.transferid);
      await updateAccountBalance(
        originalTransferDest.accountid!,
        -originalTransferDest.amount!,
        currentTimestamp,
        userId,
      );
      const originalDestAcc = await updateAccountBalance(
        originalTransferDest.accountid!,
        -Math.abs(formTransaction.amount!),
        currentTimestamp,
        userId,
      );
      const updatedTransaction = await updateTransaction({
        ...originalTransferDest,
        amount: -Math.abs(formTransaction.amount),
      });
    } else {
      //Editing Sub
      const originalTransferDest = await getTransactionById(originalData.id!);
      await updateAccountBalance(
        originalTransferDest.accountid!,
        -originalTransferDest.amount,
        currentTimestamp,
        userId,
      );
      const originalDestAcc = await updateAccountBalance(
        originalTransferDest.accountid!,
        Math.abs(formTransaction.amount),
        currentTimestamp,
        userId,
      );
      const updatedTransaction = await updateTransaction({
        ...originalTransferDest,
        amount: Math.abs(formTransaction.amount),
      });
    }
  }

  return updatedTransaction;
};

function getDifferences(original: any, changed: any) {
  const result: any = {};

  // Iterate over the keys of the original object
  for (const key of Object.keys(original)) {
    // Check if the key exists in the changed object and has a different value
    if (changed.hasOwnProperty(key) && original[key] !== changed[key]) {
      result[key] = changed[key];
    }
  }

  return result;
}

// const handleUpdateTransaction = async (
//   formTransaction: TransactionFormType,
//   originalData: TransactionFormType | undefined,
//   destAccountId: string | undefined,
//   currentTimestamp: string,
//   userId: string,
// ) => {
//   formTransaction.updatedat = currentTimestamp;
//   formTransaction.updatedby = userId;

//   const srcAccount = await getAccountById(formTransaction.accountid);
//   const updatedTransaction = await updateTransaction(formTransaction as Updates<TableNames.Transactions>);

//   if (updatedTransaction) {
//     const balanceAdjustment = updatedTransaction.amount - (originalData?.amount ?? 0);
//     await updateAccountBalance(srcAccount, balanceAdjustment, currentTimestamp, userId);

//     if (formTransaction.type === "Transfer" && destAccountId) {
//       const destAccount = await getAccountById(destAccountId);
//       await updateOrCreateTransferTransaction(
//         formTransaction,
//         originalData,
//         destAccount,
//         updatedTransaction,
//         currentTimestamp,
//         userId,
//       );
//     } else if (originalData?.type === "Transfer") {
//       await handleTransferRemoval(originalData, currentTimestamp, userId);
//     }
//   }

//   return updatedTransaction;
// };

// // const createTransferTransaction = async (
// //   createdTransaction: Transaction,
// //   formTransaction: TransactionFormType,
// //   destAccount: Account,
// //   currentTimestamp: string,
// //   userId: string,
// // ) => {
// //   const destTransaction = {
// //     ...formTransaction,
// //     id: undefined,
// //     accountid: destAccount.id,
// //     amount: Math.abs(formTransaction.amount),
// //     transferid: createdTransaction.id,
// //     createdat: currentTimestamp,
// //     createdby: userId,
// //   };

// //   const createdDest = await createTransaction(destTransaction as Inserts<TableNames.Transactions>);
// //   if (createdDest) {
// //     await updateAccountBalance(destAccount, createdDest.amount, currentTimestamp, userId);
// //   }
// // };

// // const updateOrCreateTransferTransaction = async (
// //   formTransaction: TransactionFormType,
// //   originalData: TransactionFormType | undefined,
// //   destAccount: Account,
// //   updatedTransaction: Transaction,
// //   currentTimestamp: string,
// //   userId: string,
// // ) => {
// //   let destTransaction = await getTransactionById(formTransaction.transferid!);

// //   if (!destTransaction) {
// //     // No existing destination transaction, create a new one
// //     await createTransferTransaction(updatedTransaction, formTransaction, destAccount, currentTimestamp, userId);
// //   } else {
// //     // Update the existing destination transaction
// //     destTransaction.updatedat = currentTimestamp;
// //     destTransaction.updatedby = userId;
// //     const updatedDest = await updateTransaction(destTransaction as Updates<TableNames.Transactions>);

// //     if (updatedDest) {
// //       const balanceAdjustment = updatedDest.amount - (originalData?.amount ?? 0);
// //       await updateAccountBalance(destAccount, balanceAdjustment, currentTimestamp, userId);
// //     }
// //   }
// // };

// // const handleTransferRemoval = async (originalData: TransactionFormType, currentTimestamp: string, userId: string) => {
// //   const destTransaction = await getTransactionById(originalData.transferid!);
// //   if (destTransaction) {
// //     await deleteTransaction(destTransaction.id);
// //     const destAccount = await getAccountById(destTransaction.accountid);
// //     await updateAccountBalance(destAccount, -destTransaction.amount, currentTimestamp, userId);
// //   }
// // };

/*
      /*
      The below logic is wrong
      I want it to be fixed with this in mind
      TransactionTypes = "Expense" | "Income" | "Transfer" | "Refund"

      1. If new transaction
        a) if Expense, deduct it from srcAccount
        b) if Income or Refund, add it to srcAccount
        c) if Transfer 
          i) Create two transactions one + and -,
          ii) updated accounts balance, one deducted from source and one added to destination

      2. If Updated transaction
        a) adjust accounts and as fit
        b) if type changed to transfer create a new transaction
        c) if type changed from transfer, remove the other transfer transaction 
      */
/*
      const { destAccountId, ...formTransaction } = fullFormTransaction;
      const currentTimestamp = new Date().toISOString();
      formTransaction.date = currentTimestamp;
      const srcAccount = await getAccountById(formTransaction.accountid);
      const destAccount = destAccountId ? await getAccountById(destAccountId) : null;
      const destTransaction = formTransaction.transferid
        ? await getTransactionById(formTransaction.transferid)
        : { ...formTransaction };
      const userId = session.user.id;

      if (formTransaction.type === "Expense" || formTransaction.type === "Transfer") {
        formTransaction.amount = -formTransaction.amount;
      }

      if (!formTransaction.id) {
        formTransaction.createdat = currentTimestamp;
        formTransaction.createdby = userId;

        const createdTransaction = await createTransaction(formTransaction as Inserts<TableNames.Transactions>);

        if (createdTransaction) {
          await updateAccount({
            id: srcAccount.id,
            balance: srcAccount.balance + createdTransaction.amount,
            updatedat: currentTimestamp,
            updatedby: userId,
          });
        }

        if (destTransaction) {
          destTransaction.createdat = currentTimestamp;
          destTransaction.createdby = userId;
          destTransaction.accountid = destAccount?.id;
          destTransaction.transferid = createdTransaction.id;

          const createdDest = await createTransaction(destTransaction as Inserts<TableNames.Transactions>);
          if (destAccount && createdDest) {
            await updateAccount({
              id: destAccount.id,
              balance: destAccount.balance + createdDest.amount,
              updatedat: currentTimestamp,
              updatedby: userId,
            });
          }
        }
        return createdTransaction;
      }
      formTransaction.updatedat = currentTimestamp;
      formTransaction.updatedby = userId;

      const updatedTransaction = await updateTransaction(formTransaction as Updates<TableNames.Transactions>);

      if (updatedTransaction) {
        await updateAccount({
          id: srcAccount.id,
          balance: srcAccount.balance + updatedTransaction.amount - (originalData?.amount ?? 0),
          updatedat: currentTimestamp,
          updatedby: userId,
        });
      }

      if (destTransaction) {
        destTransaction.updatedat = currentTimestamp;
        destTransaction.updatedby = userId;

        const updatedDest = await updateTransaction(destTransaction as Updates<TableNames.Transactions>);

        if (destAccount && updatedDest) {
          await updateAccount({
            id: destAccount.id,
            balance: destAccount.balance + updatedDest.amount - (originalData?.amount ?? 0),
            updatedat: currentTimestamp,
            updatedby: userId,
          });
        }
      }

      return updatedTransaction;



*/

/*
return useMutation({
  mutationFn: async ({ formTransaction }: { formTransaction: TransactionFormType }) => {

    if (!existingTransaction) {
      // This is a new transaction
      formTransaction.createdat = currentTimestamp;
      formTransaction.createdby = userId;
    }

    // Update the updatedat and updatedby fields
    formTransaction.updatedat = currentTimestamp;
    formTransaction.updatedby = userId;

    if (formTransaction.type === "Income") {
      // If it's income, update the source account balance
      await updateAccount({
        id: srcAccount.id,
        balance: srcAccount.balance + formTransaction.amount,
        updatedat: currentTimestamp,
        updatedby: userId,
      });
      
      if (existingTransaction) {
        // Update the existing transaction
        await updateTransaction(formTransaction);
      } else {
        // Create the new transaction
        await updateTransaction(formTransaction);
      }
      
    } else if (formTransaction.type === "Transfer") {
      if (!destAccount) {
        throw new Error("Destination account is required for a transfer.");
      }

      // If it's a transfer, update both source and destination accounts
      await updateAccount({
        id: srcAccount.id,
        balance: srcAccount.balance + formTransaction.amount,
        updatedat: currentTimestamp,
        updatedby: userId,
      });
      
      await updateAccount({
        id: destAccount.id,
        balance: destAccount.balance - formTransaction.amount,
        updatedat: currentTimestamp,
        updatedby: userId,
      });

      if (existingTransaction) {
        // Update the source transaction
        await updateTransaction(formTransaction);
        
        // Update the destination transaction
        const destTransaction = {
          ...formTransaction,
          accountid: destAccount.id,
          amount: -formTransaction.amount,
          id: existingTransaction.destinationId, // Assuming you have stored destination transaction ID somewhere
        };
        await updateTransaction(destTransaction);
        
      } else {
        // Create the source transaction
        await updateTransaction(formTransaction);

        // Create the destination transaction
        const destTransaction = {
          ...formTransaction,
          accountid: destAccount.id,
          amount: -formTransaction.amount,
          id: undefined, // New transaction so remove id if exists
        };
        await updateTransaction(destTransaction);
      }
    } else {
      throw new Error("Unsupported transaction type.");
    }
  },
});
*/
// __mocks__/supabase.ts
// export const mockSupabase = {
//   from: jest.fn().mockReturnThis(),
//   select: jest.fn().mockReturnThis(),
//   eq: jest.fn().mockReturnThis(),
//   single: jest.fn().mockResolvedValue({ data: null, error: null }),
//   insert: jest.fn().mockReturnThis(),
//   update: jest.fn().mockReturnThis(),
//   // You can add more methods if needed
// };

// // transactions.service.test.ts
// import {
//   getAllTransactions,
//   getTransactionById,
//   createTransaction,
//   updateTransaction,
//   deleteTransaction,
//   restoreTransaction,
//   deleteAccountTransactions,
//   restoreAccountTransactions
// } from './transactions.service';
// import { mockSupabase } from './__mocks__/supabase';
// import { supabase } from './supabaseClient'; // Adjust the import according to your setup

// jest.mock('./supabaseClient', () => ({
//   supabase: mockSupabase,
// }));

// describe('Transactions Service', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   test('getAllTransactions should return data', async () => {
//     const mockData = [{ id: '1', amount: 100 }];
//     mockSupabase.select.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await getAllTransactions();
//     expect(result).toEqual(mockData);
//   });

//   test('getTransactionById should return a single transaction', async () => {
//     const mockData = { id: '1', amount: 100 };
//     mockSupabase.single.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await getTransactionById('1');
//     expect(result).toEqual(mockData);
//   });

//   test('createTransaction should create and return a transaction', async () => {
//     const mockData = { id: '1', amount: 100 };
//     mockSupabase.insert.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await createTransaction({ amount: 100 });
//     expect(result).toEqual(mockData);
//   });

//   test('updateTransaction should update and return a transaction', async () => {
//     const mockData = { id: '1', amount: 100 };
//     mockSupabase.update.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await updateTransaction({ id: '1', amount: 100 });
//     expect(result).toEqual(mockData);
//   });

//   test('deleteTransaction should mark transaction as deleted', async () => {
//     const mockData = { id: '1', isdeleted: true };
//     mockSupabase.update.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await deleteTransaction('1');
//     expect(result).toEqual(mockData);
//   });

//   test('restoreTransaction should restore a deleted transaction', async () => {
//     const mockData = { id: '1', isdeleted: false };
//     mockSupabase.update.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await restoreTransaction('1');
//     expect(result).toEqual(mockData);
//   });

//   test('deleteAccountTransactions should mark transactions of an account as deleted', async () => {
//     const mockData = [{ id: '1', isdeleted: true }];
//     mockSupabase.update.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await deleteAccountTransactions('accountId');
//     expect(result).toEqual(mockData);
//   });

//   test('restoreAccountTransactions should restore transactions of an account', async () => {
//     const mockData = [{ id: '1', isdeleted: false }];
//     mockSupabase.update.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await restoreAccountTransactions('accountId');
//     expect(result).toEqual(mockData);
//   });
// });
//--
//
// import { useGetTransactions } from "../transactions.service";
// import QueryProvider from "@/src/providers/QueryProvider";
// import ThemeProvider from "@/src/providers/ThemeProvider";
// import AuthProvider from "@/src/providers/AuthProvider";
// import NotificationsProvider from "@/src/providers/NotificationsProvider";
// import { supabase } from "@/src/lib/supabase";
// import * as transactionsService from "../transactions.service";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// const mockData = [
//   {
//     id: "27d7d854-4ec2-4339-88f4-77b6259503b6",
//     amount: 0,
//     date: "2024-08-26T02:07:11.259+00:00",
//     categoryid: null,
//     tags: null,
//     notes: null,
//     accountid: "e04e02d4-aa4b-4d81-b89c-8ef8fefc5adf",
//     createdby: "d8d5efae-da25-4b50-870f-8774b83d73e9",
//     createdat: "2024-08-26T02:07:11.346321+00:00",
//     updatedby: null,
//     updatedat: null,
//     isdeleted: false,
//     tenantid: null,
//     type: "Initial",
//     description: "Account Opened",
//     account: {
//       id: "e04e02d4-aa4b-4d81-b89c-8ef8fefc5adf",
//       name: "ACC",
//       notes: "",
//       balance: 1000,
//       currency: "USD",
//       tenantid: null,
//       createdat: "2024-08-26T02:07:11.259+00:00",
//       createdby: "d8d5efae-da25-4b50-870f-8774b83d73e9",
//       isdeleted: true,
//       updatedat: "2024-08-26T13:21:47.437+00:00",
//       updatedby: "d8d5efae-da25-4b50-870f-8774b83d73e9",
//       categoryid: "2624d252-8fc9-45a0-a1ca-42e9a7b4e02e",
//     },
//     category: null,
//   },
// ];
// // Mock supabase client
// jest.mock("@/src/lib/supabase", () => ({
//   supabase: {
//     from: jest.fn().mockReturnThis(),
//     select: jest.fn().mockReturnThis(),
//     eq: jest.fn().mockImplementation((column, value) => {
//       return {
//         data: mockData.filter(item => item[column] === value),
//         error: null,
//       };
//     }),
//     auth: {
//       onAuthStateChange: jest.fn(),
//       getSession: jest.fn().mockResolvedValue({
//         data: { session: { user: { id: "00000000-0000-0000-0000-000000000000" } } },
//         error: null,
//       }),
//     },
//   },
// }));
// jest.mock("@react-native-async-storage/async-storage", () => ({
//   getItem: jest.fn().mockResolvedValue(Promise.resolve("light")),
//   setItem: jest.fn().mockResolvedValue(null),
//   removeItem: jest.fn().mockResolvedValue(null),
// }));
// jest.mock("uuid", () => ({ v4: () => "00000000-0000-0000-0000-000000000000" }));

// jest.mock("../transactions.service.ts", () => ({
//   getAllTransactions: jest.fn().mockImplementation(async () => Promise.resolve(mockData)),
// }));

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: false,
//     },
//   },
// });
// const wrapper = ({ children }: { children: any }) => {
//   return (
//     <ThemeProvider>
//       <AuthProvider>
//         <QueryClientProvider client={queryClient}>
//           <NotificationsProvider>{children}</NotificationsProvider>
//         </QueryClientProvider>
//       </AuthProvider>
//     </ThemeProvider>
//   );
// };

//   // it("Should return an error if the query fails", async () => {
//   //   const expectedError = new Error("Failed to fetch transactions");

//   //   jest.spyOn(transactionsService, "getAllTransactions").mockRejectedValue(expectedError);

//   //   const { result } = renderHook(() => useGetTransactions(), { wrapper });

//   //   await waitFor(() => result.current.isError);

//   //   expect(result.current.error).toBe(expectedError);
//   // });
