import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, SavingsBucket, Updates } from "@/src/types/database/Tables.Types";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useAuth } from "../providers/AuthProvider";
import { queryClient } from "../providers/QueryProvider";
import { ISavingsBucketRepository } from "../repositories/interfaces/ISavingsBucketRepository";
import createServiceHooks from "./BaseService";
import { IService } from "./IService";

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

  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const bucketRepo = dbContext.SavingsBucketRepository();

  const useFindByAccountId = (accountId?: string) => {
    return useQuery<SavingsBucket[]>({
      queryKey: [TableNames.SavingsBuckets, "byAccount", accountId, tenantId],
      queryFn: async () => {
        return bucketRepo.findByAccountId(accountId!, tenantId);
      },
      enabled: !!accountId && !!tenantId,
    });
  };

  const useGetTotalAllocated = (accountId?: string) => {
    return useQuery<number>({
      queryKey: [TableNames.SavingsBuckets, "totalAllocated", accountId, tenantId],
      queryFn: async () => {
        return bucketRepo.getTotalAllocated(accountId!, tenantId);
      },
      enabled: !!accountId && !!tenantId,
    });
  };
  const useFindAllGroupedByAccount = () => {
    return useQuery<Record<string, SavingsBucket[]>>({
      queryKey: [TableNames.SavingsBuckets, "grouped", tenantId],
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
        const bucket = await bucketRepo.findById(bucketId, tenantId);
        if (!bucket) throw new Error("Bucket not found");

        const totalAllocated = await bucketRepo.getTotalAllocated(bucket.accountid, tenantId);
        const otherBucketsTotal = totalAllocated - bucket.currentamount;
        const newTotal = otherBucketsTotal + amount;

        if (newTotal > accountBalance) {
          throw new Error(
            `Allocation exceeds account balance. Available: ${(accountBalance - otherBucketsTotal).toFixed(2)}`,
          );
        }

        if (amount < 0) {
          throw new Error("Allocation amount cannot be negative");
        }

        const userId = session.user.id;
        return bucketRepo.update(
          bucketId,
          {
            currentamount: amount,
            updatedby: userId,
            updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
          },
          tenantId,
        );
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.SavingsBuckets] });
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
        if (form.id && original) {
          return bucketRepo.update(
            form.id,
            {
              ...form,
              updatedby: userId,
              updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
            },
            tenantId,
          );
        }
        return bucketRepo.create(
          {
            ...form,
            tenantid: tenantId,
            createdby: userId,
            createdat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
          } as Inserts<TableNames.SavingsBuckets>,
          tenantId,
        );
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.SavingsBuckets] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
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
