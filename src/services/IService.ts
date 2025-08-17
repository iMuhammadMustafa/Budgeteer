import { useMutation, useQuery } from "@tanstack/react-query";
import { IRepository } from "../repositories";

export interface IReadableService<T> {
  findAll: (searchFilters?: any) => ReturnType<typeof useQuery<T[]>>;
  findById: (id?: string) => ReturnType<typeof useQuery<T | null>>;
}
export interface IWritableService<T, TInsert, TUpdate> {
  create: () => ReturnType<typeof useMutation<T, unknown, TInsert>>;
  update: () => ReturnType<
    typeof useMutation<T | null | undefined, unknown, { form: TUpdate; original: T; props?: any }>
  >;
  upsert: () => ReturnType<
    typeof useMutation<T | null | undefined, unknown, { form: TInsert | TUpdate; original?: T; props?: any }>
  >;
}
export interface IDeleteService<T> {
  softDelete: () => ReturnType<typeof useMutation<void, unknown, string>>;
  delete: () => ReturnType<typeof useMutation<void, unknown, string>>;
  restore: () => ReturnType<typeof useMutation<void, unknown, string>>;
}

export interface IService<T, TInsert, TUpdate>
  extends IReadableService<T>,
    IWritableService<T, TInsert, TUpdate>,
    IDeleteService<T> {
  repo: IRepository<T, TInsert, TUpdate>;
}
export interface IServiceWithView<T, TInsert, TUpdate, TView> extends IDeleteService<TView> {
  findAll: (searchFilters?: any) => ReturnType<typeof useQuery<TView[]>>;
  findById: (id?: string) => ReturnType<typeof useQuery<T | TView | null>>;

  create: () => ReturnType<typeof useMutation<T, unknown, TInsert>>;

  update: () => ReturnType<
    typeof useMutation<T | null | undefined, unknown, { form: TUpdate; original: T; props?: any }>
  >;
  upsert?: () => ReturnType<
    typeof useMutation<T | null | undefined, unknown, { form: TInsert | TUpdate; original?: T; props?: any }>
  >;

  repo: IRepository<T | TView, TInsert, TUpdate>;
}
