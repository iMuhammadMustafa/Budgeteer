import { useMutation, useQuery } from "@tanstack/react-query";
import { IRepository } from "../repositories";

export interface IService<T, TInsert, TUpdate> {
  repo: IRepository<T, TInsert, TUpdate>;
  findAll: (searchFilters?: any) => ReturnType<typeof useQuery<T[]>>;
  findById: (id?: string) => ReturnType<typeof useQuery<T | null>>;
  create: () => ReturnType<typeof useMutation<T, unknown, TInsert>>;
  update: () => ReturnType<
    typeof useMutation<T | null | undefined, unknown, { form: TUpdate; original: T; props?: any }>
  >;
  upsert?: () => ReturnType<
    typeof useMutation<T | null | undefined, unknown, { form: TInsert | TUpdate; original?: T; props?: any }>
  >;
  softDelete: () => ReturnType<typeof useMutation<void, unknown, string>>;
  delete: () => ReturnType<typeof useMutation<void, unknown, string>>;
  restore: () => ReturnType<typeof useMutation<void, unknown, string>>;
}
