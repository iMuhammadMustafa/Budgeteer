import { appSchema, tableSchema } from "@nozbe/watermelondb";
import { TableNames } from "../types/db/TableNames";

export const schema = appSchema({
  version: 2, // Updated for enhanced recurring transactions
  tables: [
    tableSchema({
      name: TableNames.AccountCategories,
      columns: [
        { name: "name", type: "string" },
        { name: "type", type: "string" }, // Asset, Liability
        { name: "color", type: "string" },
        { name: "icon", type: "string" },
        { name: "displayorder", type: "number" },
        { name: "tenantid", type: "string" },
        { name: "isdeleted", type: "boolean" },
        { name: "createdat", type: "number" },
        { name: "createdby", type: "string", isOptional: true },
        { name: "updatedat", type: "number" },
        { name: "updatedby", type: "string", isOptional: true },
      ],
    }),
    tableSchema({
      name: TableNames.Accounts,
      columns: [
        { name: "name", type: "string" },
        { name: "categoryid", type: "string", isIndexed: true },
        { name: "balance", type: "number" },
        { name: "currency", type: "string" },
        { name: "color", type: "string" },
        { name: "icon", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "owner", type: "string", isOptional: true },
        { name: "displayorder", type: "number" },
        { name: "tenantid", type: "string" },
        { name: "isdeleted", type: "boolean" },
        { name: "createdat", type: "number" },
        { name: "createdby", type: "string", isOptional: true },
        { name: "updatedat", type: "number" },
        { name: "updatedby", type: "string", isOptional: true },
      ],
    }),
    tableSchema({
      name: TableNames.TransactionGroups,
      columns: [
        { name: "name", type: "string" },
        { name: "type", type: "string" }, // Expense, Income, Transfer, Adjustment, Initial, Refund
        { name: "color", type: "string" },
        { name: "icon", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "displayorder", type: "number" },
        { name: "budgetamount", type: "number" },
        { name: "budgetfrequency", type: "string" },
        { name: "tenantid", type: "string" },
        { name: "isdeleted", type: "boolean" },
        { name: "createdat", type: "number" },
        { name: "createdby", type: "string", isOptional: true },
        { name: "updatedat", type: "number" },
        { name: "updatedby", type: "string", isOptional: true },
      ],
    }),
    tableSchema({
      name: TableNames.TransactionCategories,
      columns: [
        { name: "name", type: "string", isOptional: true },
        { name: "groupid", type: "string", isIndexed: true },
        { name: "type", type: "string" }, // Expense, Income, Transfer, Adjustment, Initial, Refund
        { name: "color", type: "string" },
        { name: "icon", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "displayorder", type: "number" },
        { name: "budgetamount", type: "number" },
        { name: "budgetfrequency", type: "string" },
        { name: "tenantid", type: "string" },
        { name: "isdeleted", type: "boolean" },
        { name: "createdat", type: "number" },
        { name: "createdby", type: "string", isOptional: true },
        { name: "updatedat", type: "number" },
        { name: "updatedby", type: "string", isOptional: true },
      ],
    }),
    tableSchema({
      name: TableNames.Transactions,
      columns: [
        { name: "name", type: "string", isOptional: true },
        { name: "accountid", type: "string", isIndexed: true },
        { name: "categoryid", type: "string", isIndexed: true },
        { name: "amount", type: "number" },
        { name: "date", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "payee", type: "string", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "tags", type: "string", isOptional: true }, // JSON string array
        { name: "type", type: "string" }, // Expense, Income, Transfer, Adjustment, Initial, Refund
        { name: "transferaccountid", type: "string", isOptional: true, isIndexed: true },
        { name: "transferid", type: "string", isOptional: true, isIndexed: true },
        { name: "isvoid", type: "boolean" },
        { name: "tenantid", type: "string" },
        { name: "isdeleted", type: "boolean" },
        { name: "createdat", type: "number" },
        { name: "createdby", type: "string", isOptional: true },
        { name: "updatedat", type: "number" },
        { name: "updatedby", type: "string", isOptional: true },
      ],
    }),
    tableSchema({
      name: TableNames.Configurations,
      columns: [
        { name: "key", type: "string" },
        { name: "value", type: "string" },
        { name: "type", type: "string" },
        { name: "table", type: "string" },
        { name: "tenantid", type: "string", isOptional: true },
        { name: "isdeleted", type: "boolean" },
        { name: "createdat", type: "number" },
        { name: "createdby", type: "string", isOptional: true },
        { name: "updatedat", type: "number" },
        { name: "updatedby", type: "string", isOptional: true },
      ],
    }),
    tableSchema({
      name: TableNames.Recurrings,
      columns: [
        { name: "name", type: "string" },
        { name: "sourceaccountid", type: "string", isIndexed: true },
        { name: "categoryid", type: "string", isOptional: true, isIndexed: true },
        // Amount is nullable when amount flexible
        { name: "amount", type: "number", isOptional: true },
        { name: "type", type: "string" }, // Expense, Income, Transfer, Adjustment, Initial, Refund
        { name: "description", type: "string", isOptional: true },
        { name: "payeename", type: "string", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "currencycode", type: "string" },
        { name: "recurrencerule", type: "string" },
        // Next occurrence date is nullable when date flexible
        { name: "nextoccurrencedate", type: "string", isOptional: true },
        { name: "enddate", type: "string", isOptional: true },
        { name: "lastexecutedat", type: "string", isOptional: true },
        { name: "isactive", type: "boolean" },
        
        // Recurring transaction fields (using lowercase to match Supabase conventions)
        { name: "intervalmonths", type: "number" },
        { name: "autoapplyenabled", type: "boolean" },
        { name: "transferaccountid", type: "string", isOptional: true, isIndexed: true },
        { name: "isamountflexible", type: "boolean" },
        { name: "isdateflexible", type: "boolean" },
        { name: "recurringtype", type: "string" }, // Standard, Transfer, CreditCardPayment
        { name: "lastautoappliedat", type: "string", isOptional: true },
        { name: "failedattempts", type: "number" },
        { name: "maxfailedattempts", type: "number" },
        
        { name: "tenantid", type: "string" },
        { name: "isdeleted", type: "boolean" },
        { name: "createdat", type: "number" },
        { name: "createdby", type: "string", isOptional: true },
        { name: "updatedat", type: "number" },
        { name: "updatedby", type: "string", isOptional: true },
      ],
    }),
    tableSchema({
      name: "profiles",
      columns: [
        { name: "email", type: "string", isOptional: true },
        { name: "full_name", type: "string", isOptional: true },
        { name: "avatar_url", type: "string", isOptional: true },
        { name: "timezone", type: "string", isOptional: true },
        { name: "tenant_id", type: "string", isOptional: true },
        { name: "updated_at", type: "number" },
      ],
    }),
  ],
});
