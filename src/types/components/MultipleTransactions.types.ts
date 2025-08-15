import dayjs from "dayjs";

export type MultiTransactionGroup = {
  originalTransactionId: string | null;
  payee: string;
  date: dayjs.Dayjs | null;
  description: string;
  type: string;
  isvoid: boolean;
  accountid: string;
  groupid: string;
  transactions: {
    [id: string]: MultiTransactionItem;
  };
};

export type MultiTransactionItem = {
  name: string;
  amount: number;
  categoryid: string;
  notes: string | null;
  tags: string[] | null;
  groupid: string;
};
