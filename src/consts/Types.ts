export type MultiTransactionGroup = {
  date: string;
  description: string;
  type: string;
  status: "Void" | "None";
  accountid: string;
  groupid: string;
  transactions: {
    [id: string]: MultiTransactionItem;
  };
};

export type MultiTransactionItem = {
  amount: number;
  categoryid: string;
  notes: string | null;
  tags: string[] | null;
  groupid: string;
};
