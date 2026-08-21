import dayjs from "dayjs";

import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, SavingsBucket, Updates } from "@/src/types/database/Tables.Types";
import { ISavingsBucketRepository } from "@/src/repositories/interfaces/ISavingsBucketRepository";

export async function allocateSavingsBucketHelper(
  bucketId: string,
  amount: number,
  accountBalance: number,
  tenantId: string,
  userId: string,
  bucketRepo: ISavingsBucketRepository,
): Promise<SavingsBucket | null> {
  const bucket = await bucketRepo.findById(bucketId, tenantId);
  if (!bucket) throw new Error("Bucket not found");
  if (amount < 0) throw new Error("Allocation amount cannot be negative");

  const totalAllocated = await bucketRepo.getTotalAllocated(bucket.accountid, tenantId);
  const otherBucketsTotal = totalAllocated - bucket.currentamount;
  if (otherBucketsTotal + amount > accountBalance) {
    throw new Error(
      `Allocation exceeds account balance. Available: ${(accountBalance - otherBucketsTotal).toFixed(2)}`,
    );
  }

  return bucketRepo.update(
    bucketId,
    {
      currentamount: amount,
      updatedby: userId,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
    },
    tenantId,
  );
}

export async function upsertSavingsBucketHelper(
  form: Inserts<TableNames.SavingsBuckets> | Updates<TableNames.SavingsBuckets>,
  original: SavingsBucket | undefined,
  tenantId: string,
  userId: string,
  bucketRepo: ISavingsBucketRepository,
): Promise<SavingsBucket | null | undefined> {
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
}
