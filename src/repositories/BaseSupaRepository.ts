import supabase from "@/src/providers/Supabase";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, Updates } from "@/src/types/database/Tables.Types";
import dayjs from "dayjs";
import { QueryFilters } from "../types/apis/QueryFilters";
import { IRepository } from "./interfaces/IRepository";

export abstract class SupaRepository<TModel, TTable extends TableNames> implements IRepository<TModel, TTable> {
  protected abstract tableName: string;
  protected abstract orderByFieldsDesc?: string[];

  async findAll(tenantId: string, filters: QueryFilters = {}): Promise<TModel[]> {
    let query = supabase
      .from(this.tableName)
      .select()
      .eq("tenantid", tenantId);

    // isDeleted filter:
    // - null: Show all records (no isdeleted filter)
    // - true: Show only deleted records
    // - undefined/false (default): Show non-deleted records only
    if (filters.isDeleted === null) {
      // No filter - show all records
    } else if (filters.isDeleted === true) {
      query = query.eq("isdeleted", true);
    } else {
      // Default: show non-deleted only (undefined or false)
      query = query.eq("isdeleted", false);
    }

    if (this.orderByFieldsDesc) {
      for (const field of this.orderByFieldsDesc) {
        query = query.order(field, { ascending: false });
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Get all record IDs across ALL tenants (no tenant filtering)
   * Used for duplicate detection during import
   * Note: For Supabase with RLS, this may still be filtered by user access
   */
  async getAllIds(): Promise<string[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("id");

    if (error) throw error;
    return (data ?? []).map((r: any) => r.id);
  }

  async findById(id: string, tenantId: string): Promise<TModel | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select()
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw error;
    }
    return data;
  }

  async create(data: Inserts<TTable>, tenantId: string): Promise<TModel> {
    const { data: result, error } = await supabase.from(this.tableName).insert(data).select().single();

    if (error) throw error;
    return result;
  }

  async update(id: string, data: Updates<TTable>, tenantId: string): Promise<TModel | null> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update({ ...data })
      .eq("id", id)
      .eq("tenantid", tenantId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw error;
    }
    return result;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    // Default delete behavior is soft delete
    return this.softDelete(id, tenantId);
  }

  async hardDelete(id: string, tenantId: string): Promise<void> {
    const { error } = await supabase.from(this.tableName).delete().eq("id", id).eq("tenantid", tenantId);
    if (error) throw error;
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({
        isdeleted: true,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id)
      .eq("tenantid", tenantId);
    if (error) throw error;
  }

  async restore(id: string, tenantId: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({
        isdeleted: false,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })
      .eq("id", id)
      .eq("tenantid", tenantId)
      .eq("isdeleted", true);
    if (error) throw error;
  }

  // Heterogeneous per-row updates: a single PostgREST upsert (ON CONFLICT DO
  // UPDATE) applies all rows in one network round-trip. Rows in `data` are
  // pre-existing (matched by id), so the conflict branch always fires and no
  // insert-path NOT NULL constraints are hit for columns omitted from `item`.
  async updateMultiple(data: Updates<TTable>[], tenantId: string): Promise<void> {
    if (data.length === 0) return;
    const { error } = await supabase.from(this.tableName).upsert(
      data.map(item => ({
        ...item,
        tenantid: tenantId,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
      })),
      { onConflict: "id" },
    );

    if (error) throw error;
  }

  async createMultiple(data: Inserts<TTable>[], tenantId: string): Promise<TModel[]> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data as any[])
      .select();

    if (error) throw error;
    return result as TModel[];
  }

  // Uniform update applied to every row: a single `.in("id", ids)` call
  // instead of one soft-delete per id.
  async deleteMultiple(ids: string[], tenantId: string): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase
      .from(this.tableName)
      .update({ isdeleted: true, updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ") })
      .in("id", ids)
      .eq("tenantid", tenantId);
    if (error) throw error;
  }

  async restoreMultiple(ids: string[], tenantId: string): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await supabase
      .from(this.tableName)
      .update({ isdeleted: false, updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ") })
      .in("id", ids)
      .eq("tenantid", tenantId)
      .eq("isdeleted", true);
    if (error) throw error;
  }
}

