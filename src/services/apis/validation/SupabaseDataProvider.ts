/**
 * Supabase Data Provider for Referential Integrity Validation
 * 
 * This provider implements the IDataProvider interface for the Supabase storage mode,
 * allowing the referential integrity validator to work with cloud database data.
 */

import { IDataProvider } from './ReferentialIntegrityValidator';
import { createClient } from '@supabase/supabase-js';
import { Database } from "@/src/types/db/database.types";

type Tables = Database['public']['Tables'];
type AccountRow = Tables['accounts']['Row'];
type AccountCategoryRow = Tables['accountcategories']['Row'];
type TransactionRow = Tables['transactions']['Row'];
type TransactionCategoryRow = Tables['transactioncategories']['Row'];
type TransactionGroupRow = Tables['transactiongroups']['Row'];
type RecurringRow = Tables['recurrings']['Row'];
type ConfigurationRow = Tables['configurations']['Row'];

export class SupabaseDataProvider implements IDataProvider {
  private supabase;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // Core data access methods
  async getAccountCategories(tenantId: string): Promise<AccountCategoryRow[]> {
    const { data, error } = await this.supabase
      .from('accountcategories')
      .select('*')
      .eq('tenantid', tenantId)
      .eq('isdeleted', false);

    if (error) throw error;
    return data || [];
  }

  async getAccounts(tenantId: string): Promise<AccountRow[]> {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('tenantid', tenantId)
      .eq('isdeleted', false);

    if (error) throw error;
    return data || [];
  }

  async getTransactions(tenantId: string): Promise<TransactionRow[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('tenantid', tenantId)
      .eq('isdeleted', false);

    if (error) throw error;
    return data || [];
  }

  async getTransactionCategories(tenantId: string): Promise<TransactionCategoryRow[]> {
    const { data, error } = await this.supabase
      .from('transactioncategories')
      .select('*')
      .eq('tenantid', tenantId)
      .eq('isdeleted', false);

    if (error) throw error;
    return data || [];
  }

  async getTransactionGroups(tenantId: string): Promise<TransactionGroupRow[]> {
    const { data, error } = await this.supabase
      .from('transactiongroups')
      .select('*')
      .eq('tenantid', tenantId)
      .eq('isdeleted', false);

    if (error) throw error;
    return data || [];
  }

  async getRecurrings(tenantId: string): Promise<RecurringRow[]> {
    const { data, error } = await this.supabase
      .from('recurrings')
      .select('*')
      .eq('tenantid', tenantId)
      .eq('isdeleted', false);

    if (error) throw error;
    return data || [];
  }

  async getConfigurations(tenantId: string): Promise<ConfigurationRow[]> {
    const { data, error } = await this.supabase
      .from('configurations')
      .select('*')
      .eq('tenantid', tenantId)
      .eq('isdeleted', false);

    if (error) throw error;
    return data || [];
  }

  // Single record access methods
  async getAccountCategoryById(id: string): Promise<AccountCategoryRow | null> {
    const { data, error } = await this.supabase
      .from('accountcategories')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data || null;
  }

  async getAccountById(id: string): Promise<AccountRow | null> {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async getTransactionById(id: string): Promise<TransactionRow | null> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async getTransactionCategoryById(id: string): Promise<TransactionCategoryRow | null> {
    const { data, error } = await this.supabase
      .from('transactioncategories')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async getTransactionGroupById(id: string): Promise<TransactionGroupRow | null> {
    const { data, error } = await this.supabase
      .from('transactiongroups')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async getRecurringById(id: string): Promise<RecurringRow | null> {
    const { data, error } = await this.supabase
      .from('recurrings')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async getConfigurationById(id: string): Promise<ConfigurationRow | null> {
    const { data, error } = await this.supabase
      .from('configurations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }
}