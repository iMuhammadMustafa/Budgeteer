import { Inserts, Updates, supabase } from "@/src/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { TableNames, ViewNames } from "@/src/consts/TableNames";
import { SearchableDropdownItem } from "../../components/SearchableDropdown";
import dayjs from "dayjs";
import { TransactionsSearchParams } from "@/src/types/transactions.types";

export const getAllTransactions = async (searchParams: TransactionsSearchParams) => {
  let query = buildQuery(searchParams);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data;
};

export const getAllTransactionsCount = async (searchParams: TransactionsSearchParams) => {
  let query = buildQuery(searchParams, true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data;
};

const buildQuery = (searchParams: TransactionsSearchParams, isCount = false) => {
  let query = supabase.from(ViewNames.TransactionsView).select();

  if (isCount) {
    query = supabase.from(ViewNames.TransactionsView).select("*", { count: "exact", head: true });
  }

  if (searchParams.description && searchParams.description != "undefined") {
    query = query.ilike("description", searchParams.description);
  }
  if (searchParams.categoryid && searchParams.categoryid != "undefined") {
    query = query.eq("categoryid", searchParams.categoryid);
  }
  if (searchParams.accountid && searchParams.accountid != "undefined") {
    query = query.eq("accountid", searchParams.accountid);
  }
  if (searchParams.amount && searchParams.amount != "undefined") {
    query = query.eq("amount", searchParams.amount);
  }
  if (searchParams.status && searchParams.status != "undefined") {
    query = query.eq("status", searchParams.status);
  }
  if (searchParams.type && searchParams.type != "undefined") {
    query = query.eq("type", searchParams.type);
  }
  if (searchParams.categoryName && searchParams.categoryName != "undefined") {
    query = query.ilike("categoryName", searchParams.categoryName);
  }
  if (searchParams.startDate && searchParams.startDate != "undefined") {
    query = query.gte("date", searchParams.startDate);
  }
  if (searchParams.endDate && searchParams.endDate != "undefined") {
    query = query.lte("date", searchParams.endDate);
  }

  query = query.order("date", { ascending: false });

  if (searchParams.startIndex && searchParams.endIndex) {
    query = query.range(searchParams.startIndex, searchParams.endIndex);
  }

  return query;
};

export const getTransactionById = async (transactionid: string) => {
  const { data, error } = await supabase
    .from(ViewNames.TransactionsView)
    .select()
    .eq("isdeleted", false)
    .eq("transactionid", transactionid)
    .single();
  if (error) throw new Error(error.message);
  return data;
};
export const getTransactionByTransferId = async (id: string) => {
  const { data, error } = await supabase
    .from(ViewNames.TransactionsView)
    .select()
    .eq("isdeleted", false)
    .eq("transferid", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const getTransactionsByDescription = async (text: string): Promise<SearchableDropdownItem[]> => {
  const { data, error } = await supabase
    .from(ViewNames.TransactionDistinct)
    .select()
    // .textSearch("description", text)
    .ilike("description", `%${text}%`)
    // .order("date")
    .limit(7);

  if (error) throw error;

  return (
    data.map(transaction => ({
      label: transaction.description!,
      item: { ...transaction, amount: transaction.amount },
    })) ?? []
  );
};

export const getDailyTransactionsSummary = async () => {
  const { data, error } = await supabase
    .from(ViewNames.DailyTransactionsSummary)
    .select()
    .gte("date", dayjs().subtract(7, "day").toISOString())
    .lte("date", dayjs().toISOString());

  if (error) throw new Error(error.message);
  return data;
};
export const getThisMonthsTransactionsSummary = async () => {
  const { data, error } = await supabase
    .from(ViewNames.DailyTransactionsSummary)
    .select()
    .gte("date", dayjs().startOf("month").toISOString())
    .lte("date", dayjs().endOf("month").toISOString());

  if (error) throw new Error(error.message);
  return data;
};
export const getMonthlyTransactions = async () => {
  const { data, error } = await supabase
    .from(ViewNames.MonthlyTransactions)
    .select()
    .gte("date", dayjs().subtract(3, "month").toISOString())
    .lte("date", dayjs().toISOString());
  if (error) throw new Error(error.message);
  return data;
};

// export const getLastWeekExpenses = async () => {
//   const { data, error } = await supabase
//     .from(ViewNames.TransactionsDaySum)
//     .select("*")
//     .gte("date", dayjs().subtract(7, "day").toISOString())
//     .lte("date", dayjs().toISOString())
//     .order("date");
//   if (error) throw new Error(error.message);
//   return data;
// };
// export const getLastQuraterTransactionsSum = async () => {
//   const start = dayjs().subtract(5, "month").startOf("month");
//   const end = dayjs().endOf("month");

//   const { data, error } = await supabase
//     .from(ViewNames.TransactionsDaySum)
//     .select("*")
//     .gte("date", start.toISOString())
//     .lte("date", end.toISOString())
//     .order("date");

//   if (error) throw new Error(error.message);
//   return data;
// };
// export const getLastMonthCategoriesTransactionsSum = async () => {
//   const startOfMonth = dayjs().startOf("month").toISOString();
//   const endOfMonth = dayjs().endOf("month").toISOString();

//   const { data, error } = await supabase
//     .from(ViewNames.TransactionsCategoryTypeDateSum)
//     .select("*")
//     .gte("date", startOfMonth)
//     .lt("date", endOfMonth)
//     .order("date");

//   if (error) throw new Error(error.message);
//   return data;
// };

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

export const deleteTransaction = async (id: string, session?: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .update({
      isdeleted: true,
      updatedby: session?.user.id,
      updatedat: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
export const restoreTransaction = async (id: string, session?: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .update({
      isdeleted: false,
      updatedby: session?.user.id,
      updatedat: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  return data;
};
export const updateCategoryTransactionsDelete = async (categoryId: string, session?: Session | null) => {
  const { data: otherId, error: otherError } = await supabase
    .from(TableNames.Categories)
    .select("id")
    .eq("name", "Other")
    .single();

  if (otherError) throw otherError;

  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .update({ categoryid: otherId.id, updatedat: new Date().toISOString(), updatedby: session?.user?.id })
    .eq("categoryid", categoryId)
    .select();

  if (error) throw error;
  return data;
};
export const deleteAccountTransactions = async (accountId: string, session?: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .update({ isdeleted: true, updatedat: new Date().toISOString(), updatedby: session?.user?.id })
    .eq("accountid", accountId)
    .select();

  if (error) throw error;
  return data;
};
export const restoreAccountTransactions = async (accountId: string, session?: Session | null) => {
  return supabase
    .from(TableNames.Transactions)
    .update({ isdeleted: false, updatedat: new Date().toISOString(), updatedby: session?.user?.email })
    .eq("accountid", accountId);
};
