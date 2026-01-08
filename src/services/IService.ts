import { useMutation, useQuery } from "@tanstack/react-query";
import { IRepository } from "../repositories/interfaces/IRepository";
import { QueryFilters } from "../types/apis/QueryFilters";
import { TableNames, ViewNames } from "../types/database/TableNames";
import { Inserts, Updates } from "../types/database/Tables.Types";

export interface IReadService<TModel> {
  useFindAll: (searchFilters?: QueryFilters) => ReturnType<typeof useQuery<TModel[]>>;
  useFindAllDeleted: () => ReturnType<typeof useQuery<TModel[]>>;
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
  useCreateMultiple?: () => ReturnType<typeof useMutation<TModel[], unknown, { data: Inserts<TTable>[] }>>;
  useUpdateMultiple?: () => ReturnType<typeof useMutation<void, unknown, Updates<TTable>[]>>;
  useDeleteMultiple?: () => ReturnType<typeof useMutation<void, unknown, { id: string[] }>>;
}

export interface IDeleteService<TModel> {
  useSoftDelete: () => ReturnType<typeof useMutation<void, unknown, { id: string; item?: TModel | undefined }>>;
  useDelete: () => ReturnType<typeof useMutation<void, unknown, { id: string; item?: TModel | undefined }>>;
  useHardDelete: () => ReturnType<typeof useMutation<void, unknown, { id: string; item?: TModel | undefined }>>;
  useRestore: () => ReturnType<typeof useMutation<void, unknown, { id: string; item?: TModel | undefined }>>;
}

export interface IService<TModel, TTable extends TableNames>
  extends
  IReadService<TModel>,
  IWriteService<TModel, TTable>,
  IMultipleWriteService<TModel, TTable>,
  IDeleteService<TModel> {
  repo: IRepository<TModel, TTable>;
}
export interface IServiceWithView<
  TModel,
  TTable extends TableNames,
  TView extends ViewNames,
> extends IDeleteService<TView> {
  useFindAll: (searchFilters?: any) => ReturnType<typeof useQuery<TView[]>>;
  useFindAllDeleted: () => ReturnType<typeof useQuery<TView[]>>;
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
