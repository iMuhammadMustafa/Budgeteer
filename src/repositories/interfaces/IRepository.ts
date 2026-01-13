import { QueryFilters } from "@/src/types/apis/QueryFilters";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, Updates } from "@/src/types/database/Tables.Types";

export interface IReadRepository<TModel> {
  findById(id: string, tenantId: string): Promise<TModel | null>;
  findAll(tenantId: string, filters?: QueryFilters): Promise<TModel[]>;
}
export interface IWriteRepository<TModel, TTable extends TableNames> {
  create(data: Inserts<TTable>, tenantId: string): Promise<TModel>;
  update(id: string, data: Updates<TTable>, tenantId: string): Promise<TModel | null>;
  delete(id: string, tenantId: string): Promise<void>;
  hardDelete(id: string, tenantId: string): Promise<void>;
}

export interface IWriteMultipleRepository<TModel, TTable extends TableNames> {
  createMultiple(data: Inserts<TTable>[], tenantId: string): Promise<TModel[]>;
  updateMultiple(data: Updates<TTable>[], tenantId: string): Promise<void>;
  deleteMultiple(ids: string[], tenantId: string): Promise<void>;
  restoreMultiple(ids: string[], tenantId: string): Promise<void>;
}

export interface ISoftDeleteRepository<TModel> {
  softDelete(id: string, tenantId: string): Promise<void>;
  restore(id: string, tenantId: string): Promise<void>;
}

export interface IRepository<TModel, TTable extends TableNames>
  extends
  IReadRepository<TModel>,
  IWriteRepository<TModel, TTable>,
  IWriteMultipleRepository<TModel, TTable>,
  ISoftDeleteRepository<TModel> { }
