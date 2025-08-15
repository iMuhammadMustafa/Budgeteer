import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { IAccountProvider } from "@/src/types/storage/providers/IAccountProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import {
  accounts,
  accountCategories,
  transactions,
  validateReferentialIntegrity,
  mockDatabaseFunctions,
} from "./mockDataStore";
import { withStorageErrorHandling } from "../../storage/errors";

export class MockAccountProvider implements IAccountProvider {
  readonly mode: StorageMode = StorageMode.Demo;
  private isInitialized = false;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async getAllAccounts(tenantId: string): Promise<Account[]> {
    return withStorageErrorHandling(
      async () => {
        return accounts
          .filter(acc => (acc.tenantid === tenantId || tenantId === "demo") && !acc.isdeleted)
          .sort((a, b) => {
            // Sort by category display order (descending), then by account display order (descending), then by name
            const catA = accountCategories.find(cat => cat.id === a.categoryid);
            const catB = accountCategories.find(cat => cat.id === b.categoryid);

            if (catA && catB && catA.displayorder !== catB.displayorder) {
              return catB.displayorder - catA.displayorder;
            }
            if (a.displayorder !== b.displayorder) {
              return b.displayorder - a.displayorder;
            }
            if (a.name !== b.name) {
              return a.name.localeCompare(b.name);
            }
            return (a.owner || "").localeCompare(b.owner || "");
          })
          .map(acc => ({
            ...acc,
            category: accountCategories.find(cat => cat.id === acc.categoryid) ?? null,
          }));
      },
      {
        storageMode: "demo",
        operation: "getAllAccounts",
        table: "accounts",
        tenantId,
      },
    );
  }

  getAccountById = async (id: string, tenantId: string): Promise<Account | null> => {
    return withStorageErrorHandling(
      async () => {
        const acc = accounts.find(
          acc => acc.id === id && (acc.tenantid === tenantId || tenantId === "demo") && !acc.isdeleted,
        );
        if (!acc) return null;

        return {
          ...acc,
          category: accountCategories.find(cat => cat.id === acc.categoryid) ?? null,
        };
      },
      {
        storageMode: "demo",
        operation: "getAccountById",
        table: "accounts",
        recordId: id,
        tenantId,
      },
    );
  };

  createAccount = async (account: Inserts<TableNames.Accounts>) => {
    return withStorageErrorHandling(
      async () => {
        // Validate referential integrity
        validateReferentialIntegrity.validateAccountCategory(account.categoryid);
        validateReferentialIntegrity.validateUniqueAccountName(account.name, account.tenantid || "demo");

        const newAccount: Account = {
          ...account,
          id: `acc-${Date.now()}`,
          balance: account.balance || 0,
          color: account.color || "#4CAF50",
          currency: account.currency || "USD",
          displayorder: account.displayorder || 0,
          icon: account.icon || "account-balance-wallet",
          isdeleted: false,
          createdat: new Date().toISOString(),
          createdby: account.createdby || "demo",
          updatedat: null,
          updatedby: null,
          tenantid: account.tenantid || "demo",
          description: account.description || "",
          notes: account.notes || "",
          owner: account.owner || "demo",
        };

        accounts.push(newAccount);
        return newAccount;
      },
      {
        storageMode: "demo",
        operation: "createAccount",
        table: "accounts",
        tenantId: account.tenantid,
      },
    );
  };

  updateAccount = async (account: Updates<TableNames.Accounts>) => {
    const idx = accounts.findIndex(a => a.id === account.id);
    if (idx === -1) throw new Error("Account not found");

    // Validate referential integrity if categoryid is being updated
    if (account.categoryid) {
      validateReferentialIntegrity.validateAccountCategory(account.categoryid);
    }

    // Validate unique name if name is being updated
    if (account.name) {
      validateReferentialIntegrity.validateUniqueAccountName(account.name, accounts[idx].tenantid, account.id);
    }

    accounts[idx] = {
      ...accounts[idx],
      ...account,
      updatedat: new Date().toISOString(),
    };
    return accounts[idx];
  };

  deleteAccount = async (id: string, userId?: string) => {
    const idx = accounts.findIndex(a => a.id === id);
    if (idx === -1) throw new Error("Account not found");

    // Check referential integrity
    validateReferentialIntegrity.canDeleteAccount(id);

    accounts[idx].isdeleted = true;
    accounts[idx].updatedby = userId ?? "demo";
    accounts[idx].updatedat = new Date().toISOString();

    return {
      ...accounts[idx],
      id,
      isdeleted: true,
      updatedby: userId ?? "demo",
    };
  };

  restoreAccount = async (id: string, userId?: string) => {
    const idx = accounts.findIndex(a => a.id === id);
    if (idx === -1) throw new Error("Account not found");

    accounts[idx].isdeleted = false;
    accounts[idx].updatedby = userId ?? "demo";
    accounts[idx].updatedat = new Date().toISOString();

    return {
      ...accounts[idx],
      id,
      isdeleted: false,
      updatedby: userId ?? "demo",
    };
  };

  updateAccountBalance = async (accountid: string, amount: number) => {
    try {
      const newBalance = mockDatabaseFunctions.updateAccountBalance(accountid, amount);
      return { data: newBalance, error: null };
    } catch (error) {
      throw error;
    }
  };

  getAccountOpenedTransaction = async (accountid: string, tenantId: string) => {
    const transaction = transactions.find(
      tr =>
        tr.accountid === accountid &&
        (tr.tenantid === tenantId || tenantId === "demo") &&
        tr.type === "Initial" &&
        !tr.isdeleted,
    );

    if (!transaction) {
      throw new Error("Account opening transaction not found");
    }

    return {
      id: transaction.id,
      amount: transaction.amount,
    };
  };

  getTotalAccountBalance = async (tenantId: string): Promise<{ totalbalance: number } | null> => {
    const total = accounts
      .filter(acc => (acc.tenantid === tenantId || tenantId === "demo") && !acc.isdeleted)
      .reduce((sum, acc) => sum + acc.balance, 0);

    return { totalbalance: total };
  };
}
