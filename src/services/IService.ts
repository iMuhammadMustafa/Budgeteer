import { useMutation, useQuery } from "@tanstack/react-query";
import { IRepository } from "../repositories/interfaces/IRepository";
import { QueryFilters } from "../types/apis/QueryFilters";
import { TableNames, ViewNames } from "../types/database/TableNames";
import { Inserts, Updates } from "../types/database/Tables.Types";

export interface IReadService<TModel> {
  findAll: (searchFilters?: QueryFilters) => ReturnType<typeof useQuery<TModel[]>>;
  findById: (id?: string) => ReturnType<typeof useQuery<TModel | null>>;
}
export interface IWriteService<TModel, TTable extends TableNames> {
  create: () => ReturnType<typeof useMutation<TModel, unknown, Inserts<TTable>>>;
  update: () => ReturnType<
    typeof useMutation<TModel | null | undefined, unknown, { form: Updates<TTable>; original?: TModel; props?: any }>
  >;
  upsert: () => ReturnType<
    typeof useMutation<
      TModel | null | undefined,
      unknown,
      { form: Inserts<TTable> | Updates<TTable>; original?: TModel; props?: any }
    >
  >;
}
export interface IMultipleWriteService<TModel, TTable extends TableNames> {
  createMultiple?(data: Inserts<TTable>[]): Promise<TModel[]>;
  updateMultiple?(data: Updates<TTable>[]): Promise<void>;
  deleteMultiple?(ids: string[]): Promise<void>;
}

export interface IDeleteService<TModel> {
  softDelete: () => ReturnType<typeof useMutation<void, unknown, { id: string; item?: TModel | undefined }>>;
  delete: () => ReturnType<typeof useMutation<void, unknown, { id: string; item?: TModel | undefined }>>;
  restore: () => ReturnType<typeof useMutation<void, unknown, string>>;
}

export interface IService<TModel, TTable extends TableNames>
  extends IReadService<TModel>,
    IWriteService<TModel, TTable>,
    IMultipleWriteService<TModel, TTable>,
    IDeleteService<TModel> {
  repo: IRepository<TModel, TTable>;
}
export interface IServiceWithView<TModel, TTable extends TableNames, TView extends ViewNames>
  extends IDeleteService<TView> {
  findAll: (searchFilters?: any) => ReturnType<typeof useQuery<TView[]>>;
  findById: (id?: string) => ReturnType<typeof useQuery<TModel | TView | null>>;

  create: () => ReturnType<typeof useMutation<TModel, unknown, Inserts<TTable>>>;

  update: () => ReturnType<
    typeof useMutation<TModel | null | undefined, unknown, { form: Updates<TTable>; original: TModel; props?: any }>
  >;
  upsert: () => ReturnType<
    typeof useMutation<
      TModel | null | undefined,
      unknown,
      { form: Inserts<TTable> | Updates<TTable>; original?: TModel; props?: any }
    >
  >;

  repo: IRepository<TModel | TView, TTable>;
}
