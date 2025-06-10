import { TableNames, ViewNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { Inserts, Updates } from "@/src/types/db/Tables.Types";

export const getAllTransactions = async (tenantId: string) => {
  const { data, error } = await supabase
    .from(ViewNames.TransactionsView)
    .select()
    .eq("tenantid", tenantId)
    .eq("isdeleted", false);

  if (error) throw new Error(error.message);

  return data;
};

export const getTransactions = async (searchFilters: TransactionFilters, tenantId: string) => {
  let query = buildQuery(searchFilters, tenantId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data;
};

const buildQuery = (searchFilters: TransactionFilters, tenantId: string, isCount = false) => {
  let query = supabase.from(ViewNames.TransactionsView).select().eq("tenantid", tenantId);

  if (isCount) {
    query = supabase
      .from(ViewNames.TransactionsView)
      .select("*", { count: "exact", head: true })
      .eq("tenantid", tenantId);
  }

  if (searchFilters.startDate) {
    query = query.gte("date", searchFilters.startDate);
  }
  if (searchFilters.endDate) {
    query = query.lte("date", searchFilters.endDate);
  }
  if (searchFilters.name) {
    query = query.ilike("name", searchFilters.name);
  }
  if (searchFilters.description) {
    query = query.ilike("description", searchFilters.description);
  }
  if (searchFilters.amount) {
    query = query.eq("amount", searchFilters.amount);
  }
  if (searchFilters.categoryid) {
    query = query.eq("categoryid", searchFilters.categoryid);
  }
  if (searchFilters.accountid) {
    query = query.eq("accountid", searchFilters.accountid);
  }
  if (searchFilters.isVoid) {
    query = query.eq("isVoid", searchFilters.isVoid);
  }
  if (searchFilters.type) {
    query = query.eq("type", searchFilters.type);
  }
  if (searchFilters.tags && searchFilters.tags.length > 0) {
    query = query.in("tags", searchFilters.tags);
  }
  //   query = query.order("date", { ascending: false });

  if (
    searchFilters.startIndex !== undefined &&
    searchFilters.startIndex >= 0 &&
    searchFilters.endIndex !== undefined &&
    searchFilters.endIndex >= 0
  ) {
    query = query.range(searchFilters.startIndex, searchFilters.endIndex);
  }

  return query;
};

export const getTransactionFullyById = async (transactionid: string, tenantId: string) => {
  const { data, error } = await supabase
    .from(ViewNames.TransactionsView)
    .select()
    .eq("tenantid", tenantId)
    .eq("isdeleted", false)
    .eq("transactionid", transactionid)
    .single();
  if (error) throw new Error(error.message);
  return data;
};
export const getTransactionById = async (transactionid: string, tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .select()
    .eq("tenantid", tenantId)
    .eq("isdeleted", false)
    .eq("transactionid", transactionid)
    .single();
  if (error) throw new Error(error.message);
  return data;
};
export const getTransactionByTransferId = async (id: string, tenantId: string) => {
  const { data, error } = await supabase
    .from(ViewNames.TransactionsView)
    .select()
    .eq("tenantid", tenantId)
    .eq("isdeleted", false)
    .eq("transferid", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const getTransactionsByName = async (text: string, tenantId: string) => {
  const { data, error } = await supabase
    .from(ViewNames.SearchDistinctTransactions)
    .select()
    .eq("tenantid", tenantId)
    .ilike("name", `%${text}%`)
    .limit(7);

  if (error) throw error;

  return (
    data.map(transaction => ({
      label: transaction.name!,
      item: { ...transaction, amount: transaction.amount },
    })) ?? []
  );
};
export const createTransaction = async (transaction: Inserts<TableNames.Transactions>) => {
  const { data, error } = await supabase.from(TableNames.Transactions).insert(transaction).select().single();

  if (error) throw error;
  return data;
};
export const createTransactions = async (transactions: Inserts<TableNames.Transactions>[]) => {
  const { data, error } = await supabase.from(TableNames.Transactions).insert(transactions).select();

  if (error) throw error;
  return data;
};
export const createMultipleTransactions = async (transactions: Inserts<TableNames.Transactions>[]) => {
  const { data, error } = await supabase.from(TableNames.Transactions).insert(transactions).select();

  if (error) throw error;
  return data;
};
export const updateTransaction = async (transaction: Updates<TableNames.Transactions>) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .update(transaction)
    .eq("id", transaction.id!)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTransferTransaction = async (transaction: Updates<TableNames.Transactions>) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .update(transaction)
    .eq("transferid", transaction.transferid!)
    .select()
    .single();

  if (error) throw error;
  return data;
};
export const deleteTransaction = async (id: string, userId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .update({
      isdeleted: true,
      updatedby: userId,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
export const restoreTransaction = async (id: string, userId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .update({
      isdeleted: false,
      updatedby: userId,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
    })
    .eq("id", id);
  if (error) throw error;
  return data;
};

//TODO : Add Configuration Table
// export const updateTransactionsOnCategoryDelete = async (categoryId: string, userId: string) => {
//     const { data, error } = await supabase
//       .from(TableNames.Transactions)
//       .update({ categoryid: SELECT FROM Configuration Other Transaction,
//         updatedat: new Date().toISOString(),
//         updatedby: userId })
//       .eq("categoryid", categoryId)
//       .select();

//     if (error) throw error;
//     return data;
//   };

// TODO: Handle Account Deletion
// export const deleteAccountTransactions = async (accountId: string, userId: string) => {
//     const { data, error } = await supabase
//       .from(TableNames.Transactions)
//       .update({ isdeleted: true, updatedat: new Date().toISOString(), userId })
//       .eq("accountid", accountId)
//       .select();

//     if (error) throw error;
//     return data;
//   };
// export const restoreAccountTransactions = async (accountId: string, session?: Session | null) => {
//     return supabase
//       .from(TableNames.Transactions)
//       .update({ isdeleted: false, updatedat: new Date().toISOString(), updatedby: session?.user?.email })
//       .eq("accountid", accountId);
//   };
