import { useMutation, useQuery } from "@tanstack/react-query";

import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, SavingsBucket, Updates } from "@/src/types/database/Tables.Types";
import { resolveTenantId } from "@/src/utils/tenant";

import { useAuth } from "../providers/AuthProvider";
import { queryClient } from "../providers/QueryProvider";
import { ISavingsBucketRepository } from "../repositories/interfaces/ISavingsBucketRepository";
import { allocateSavingsBucketHelper, upsertSavingsBucketHelper } from "./helpers/savingsBuckets.helpers";
import createServiceHooks from "./BaseService";
import { IService } from "./IService";
import { queryKeys } from "./queryKeys";

export interface ISavingsBucketService extends IService<SavingsBucket, TableNames.SavingsBuckets> {
  useFindByAccountId: (accountId?: string) => ReturnType<typeof useQuery<SavingsBucket[]>>;
  useGetTotalAllocated: (accountId?: string) => ReturnType<typeof useQuery<number>>;
  useFindAllGroupedByAccount: () => ReturnType<typeof useQuery<Record<string, SavingsBucket[]>>>;
  useAllocate: () => ReturnType<
    typeof useMutation<SavingsBucket | null, Error, { bucketId: string; amount: number; accountBalance: number }>
  >;
  useUpsertBucket: () => ReturnType<
    typeof useMutation<
      SavingsBucket | null | undefined,
      Error,
      { form: Inserts<TableNames.SavingsBuckets> | Updates<TableNames.SavingsBuckets>; original?: SavingsBucket }
    >
  >;
}

export function useSavingsBucketService(): ISavingsBucketService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = resolveTenantId(session);
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const bucketRepo = dbContext.SavingsBucketRepository();

  const useFindByAccountId = (accountId?: string) => {
    return useQuery<SavingsBucket[]>({
      queryKey: queryKeys.savingsBuckets.byAccount(accountId, tenantId),
      queryFn: async () => {
        return bucketRepo.findByAccountId(accountId!, tenantId);
      },
      enabled: !!accountId && !!tenantId,
    });
  };

  const useGetTotalAllocated = (accountId?: string) => {
    return useQuery<number>({
      queryKey: queryKeys.savingsBuckets.totalAllocated(accountId, tenantId),
      queryFn: async () => {
        return bucketRepo.getTotalAllocated(accountId!, tenantId);
      },
      enabled: !!accountId && !!tenantId,
    });
  };
  const useFindAllGroupedByAccount = () => {
    return useQuery<Record<string, SavingsBucket[]>>({
      queryKey: queryKeys.savingsBuckets.grouped(tenantId),
      queryFn: async () => {
        const allBuckets = await bucketRepo.findAll(tenantId);
        return allBuckets.reduce(
          (acc, bucket) => {
            const key = bucket.accountid;
            (acc[key] = acc[key] || []).push(bucket);
            return acc;
          },
          {} as Record<string, SavingsBucket[]>,
        );
      },
      enabled: !!tenantId,
    });
  };

  const useAllocate = () => {
    return useMutation<SavingsBucket | null, Error, { bucketId: string; amount: number; accountBalance: number }>({
      mutationFn: async ({ bucketId, amount, accountBalance }) => {
        return allocateSavingsBucketHelper(bucketId, amount, accountBalance, tenantId, session.user.id, bucketRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.savingsBuckets.all });
      },
    });
  };

  const useUpsertBucket = () => {
    const userId = session.user.id;

    return useMutation<
      SavingsBucket | null | undefined,
      Error,
      { form: Inserts<TableNames.SavingsBuckets> | Updates<TableNames.SavingsBuckets>; original?: SavingsBucket }
    >({
      mutationFn: async ({ form, original }) => {
        return upsertSavingsBucketHelper(form, original, tenantId, userId, bucketRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.savingsBuckets.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      },
    });
  };

  return {
    ...createServiceHooks<SavingsBucket, TableNames.SavingsBuckets>(
      TableNames.SavingsBuckets,
      bucketRepo as ISavingsBucketRepository,
      tenantId,
      session,
    ),
    useFindByAccountId,
    useGetTotalAllocated,
    useFindAllGroupedByAccount,
    useAllocate,
    useUpsertBucket,
  };
}
