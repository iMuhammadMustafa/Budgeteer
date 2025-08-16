import { useMutation, useQuery } from "@tanstack/react-query";
import { IRepository } from "../repositories";

export interface IService<T, TInsert, TUpdate> {
  repo: IRepository<T, TInsert, TUpdate>;
  findAll: () => ReturnType<typeof useQuery<T[]>>;
  findById: (id?: string) => ReturnType<typeof useQuery<T | null>>;
  create: () => ReturnType<typeof useMutation<T, unknown, TInsert>>;
  update: () => ReturnType<typeof useMutation<T, unknown, { form: TUpdate; original: T }>>;
  upsert?: () => ReturnType<typeof useMutation<T, unknown, { form: TInsert | TUpdate; original?: T }>>;
  softDelete: () => ReturnType<typeof useMutation<void, unknown, string>>;
  delete: () => ReturnType<typeof useMutation<void, unknown, string>>;
  restore: () => ReturnType<typeof useMutation<void, unknown, string>>;
}
