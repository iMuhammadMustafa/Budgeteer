import { useMutation, useQuery } from "@tanstack/react-query";
import { IRepository } from "../repositories/interfaces/IRepository";
import { QueryFilters } from "../types/apis/QueryFilters";
import { TableNames, ViewNames } from "../types/database/TableNames";
import { Inserts, Updates } from "../types/database/Tables.Types";

export interface IReadService<TModel> {
  useFindAll: (searchFilters?: QueryFilters) => ReturnType<typeof useQuery<TModel[]>>;
  useFindById: (id?: string) => ReturnType<typeof useQuery<TModel | null>>;
}
export interface IWriteService<TModel, TTable extends TableNames> {
  useCreate: () => ReturnType<typeof useMutation<TModel, unknown, Inserts<TTable>>>;
  useUpdate: () => ReturnType<
    typeof useMutation<TModel | null | undefined, unknown, { form: Updates<TTable>; original?: TModel; props?: any }>
  >;
  useUpsert: () => ReturnType<
    typeof useMutation<
      TModel | null | undefined,
      unknown,
      { form: Inserts<TTable> | Updates<TTable>; original?: TModel; props?: any }
    >
  >;
}
export interface IMultipleWriteService<TModel, TTable extends TableNames> {
  useCreateMultiple?(data: Inserts<TTable>[]): Promise<TModel[]>;
  useUpdateMultiple?(data: Updates<TTable>[]): Promise<void>;
  useDeleteMultiple?(ids: string[]): Promise<void>;
}

export interface IDeleteService<TModel> {
  useSoftDelete: () => ReturnType<typeof useMutation<void, unknown, { id: string; item?: TModel | undefined }>>;
  useDelete: () => ReturnType<typeof useMutation<void, unknown, { id: string; item?: TModel | undefined }>>;
  useRestore: () => ReturnType<typeof useMutation<void, unknown, string>>;
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
  useFindAll: (searchFilters?: any) => ReturnType<typeof useQuery<TView[]>>;
  useFindById: (id?: string) => ReturnType<typeof useQuery<TModel | TView | null>>;

  useCreate: () => ReturnType<typeof useMutation<TModel, unknown, Inserts<TTable>>>;

  useUpdate: () => ReturnType<
    typeof useMutation<TModel | null | undefined, unknown, { form: Updates<TTable>; original: TModel; props?: any }>
  >;
  useUpsert: () => ReturnType<
    typeof useMutation<
      TModel | null | undefined,
      unknown,
      { form: Inserts<TTable> | Updates<TTable>; original?: TModel; props?: any }
    >
  >;

  repo: IRepository<TModel | TView, TTable>;
}
