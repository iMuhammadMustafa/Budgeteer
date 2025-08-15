import { FunctionNames, TableNames, ViewNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { IAccountProvider } from "@/src/types/storage/providers/IAccountProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import { 
  StorageError, 
  StorageErrorCode, 
  NetworkError,
  RecordNotFoundError,
  withStorageErrorHandling 
} from "@/src/services/storage/errors";

export class SupabaseAccountProvider implements IAccountProvider {
  readonly mode: StorageMode = 'cloud';
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
        const { data, error } = await supabase
          .from(TableNames.Accounts)
          .select(`*, category:${TableNames.AccountCategories}!accounts_categoryid_fkey(*)`)
          .eq("tenantid", tenantId)
          .eq("isdeleted", false)
          .order("category(displayorder)", { ascending: false })
          .order("displayorder", { ascending: false })
          .order("name")
          .order("owner");
        
        if (error) {
          throw new NetworkError(error.message, { 
            operation: 'getAllAccounts',
            table: 'accounts',
            tenantId 
          });
        }
        
        return data as unknown as Account[];
      },
      {
        storageMode: 'cloud',
        operation: 'getAllAccounts',
        table: 'accounts',
        tenantId
      }
    );
  }

  async getAccountById(id: string, tenantId: string): Promise<Account | null> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(ViewNames.ViewAccountsWithRunningBalance)
          .select(`*`)
          .eq("tenantid", tenantId)
          .eq("isdeleted", false)
          .eq("id", id)
          .single();

        if (!data) return null;

        // Now fetch category manually
        const { data: category, error: categoryError } = await supabase
          .from(TableNames.AccountCategories)
          .select("*")
          .eq("id", data.categoryid!)
          .single();
        
        if (categoryError) {
          throw new NetworkError(categoryError.message, { 
            operation: 'getAccountById',
            table: 'accountcategories',
            recordId: data.categoryid,
            tenantId 
          });
        }

        if (error) {
          throw new NetworkError(error.message, { 
            operation: 'getAccountById',
            table: 'accounts',
            recordId: id,
            tenantId 
          });
        }
        
        return {
          ...data,
          category,
        } as unknown as Account | null;
      },
      {
        storageMode: 'cloud',
        operation: 'getAccountById',
        table: 'accounts',
        recordId: id,
        tenantId
      }
    );
  }

  async createAccount(account: Inserts<TableNames.Accounts>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Accounts)
          .insert(account)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, { 
            operation: 'createAccount',
            table: 'accounts',
            tenantId: account.tenantid 
          });
        }
        
        return data;
      },
      {
        storageMode: 'cloud',
        operation: 'createAccount',
        table: 'accounts',
        tenantId: account.tenantid
      }
    );
  }

  async updateAccount(account: Updates<TableNames.Accounts>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Accounts)
          .update({ ...account })
          .eq("id", account.id!)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, { 
            operation: 'updateAccount',
            table: 'accounts',
            recordId: account.id,
            tenantId: account.tenantid 
          });
        }
        
        return data;
      },
      {
        storageMode: 'cloud',
        operation: 'updateAccount',
        table: 'accounts',
        recordId: account.id,
        tenantId: account.tenantid
      }
    );
  }

  async deleteAccount(id: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Accounts)
          .update({
            isdeleted: true,
            updatedby: userId ?? undefined,
            updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
          })
          .eq("id", id)
          .select()
          .single();
        
        if (error) {
          throw new NetworkError(error.message, { 
            operation: 'deleteAccount',
            table: 'accounts',
            recordId: id 
          });
        }
        
        return data;
      },
      {
        storageMode: 'cloud',
        operation: 'deleteAccount',
        table: 'accounts',
        recordId: id
      }
    );
  }

  async restoreAccount(id: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Accounts)
          .update({ 
            isdeleted: false, 
            updatedby: userId ?? undefined, 
            updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ") 
          })
          .eq("id", id)
          .select()
          .single();
        
        if (error) {
          throw new NetworkError(error.message, { 
            operation: 'restoreAccount',
            table: 'accounts',
            recordId: id 
          });
        }
        
        return data;
      },
      {
        storageMode: 'cloud',
        operation: 'restoreAccount',
        table: 'accounts',
        recordId: id
      }
    );
  }

  async updateAccountBalance(accountid: string, amount: number): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const result = await supabase.rpc(FunctionNames.UpdateAccountBalance, {
          accountid,
          amount,
        });
        
        if (result.error) {
          throw new NetworkError(result.error.message, { 
            operation: 'updateAccountBalance',
            table: 'accounts',
            recordId: accountid 
          });
        }
        
        return result.data;
      },
      {
        storageMode: 'cloud',
        operation: 'updateAccountBalance',
        table: 'accounts',
        recordId: accountid
      }
    );
  }

  async getAccountOpenedTransaction(accountid: string, tenantId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Transactions)
          .select("id, amount")
          .eq("tenantid", tenantId)
          .eq("accountid", accountid)
          .eq("type", "Initial")
          .eq("isdeleted", false)
          .single();

        if (error) {
          throw new NetworkError(error.message, { 
            operation: 'getAccountOpenedTransaction',
            table: 'transactions',
            recordId: accountid,
            tenantId 
          });
        }
        
        return data;
      },
      {
        storageMode: 'cloud',
        operation: 'getAccountOpenedTransaction',
        table: 'transactions',
        recordId: accountid,
        tenantId
      }
    );
  }

  async getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(ViewNames.StatsTotalAccountBalance)
          .select("totalbalance")
          .eq("tenantid", tenantId)
          .single();

        if (error) {
          // If the error is because no rows were found, it's not a critical error, return null
          if (error.code === "PGRST116") {
            return { totalbalance: 0 }; // Or return null if you prefer to indicate no data vs zero balance
          }
          throw new NetworkError(error.message, { 
            operation: 'getTotalAccountBalance',
            table: 'accounts',
            tenantId 
          });
        }
        
        return data as { totalbalance: number } | null;
      },
      {
        storageMode: 'cloud',
        operation: 'getTotalAccountBalance',
        table: 'accounts',
        tenantId
      }
    );
  }
}

// Export provider instance
export const supabaseAccountProvider = new SupabaseAccountProvider();
