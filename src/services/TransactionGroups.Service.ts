import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { TransactionGroup, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import {
  createTransactionGroup,
  deleteTransactionGroup,
  getTransactionGroupById,
  getAllTransactionGroups,
  restoreTransactionGroup,
  updateTransactionGroup,
} from "@/src/repositories/TransactionGroups.repository";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";

export const useGetTransactionGroups = () => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<TransactionGroup[]>({
    queryKey: [TableNames.TransactionGroups, tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return getAllTransactionGroups(tenantId);
    },
    enabled: !!tenantId,
  });
};

export const useGetTransactionGroupById = (id?: string) => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<TransactionGroup>({
    queryKey: [TableNames.TransactionGroups, id, tenantId],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return getTransactionGroupById(id, tenantId);
    },
    enabled: !!id && !!tenantId,
  });
};

export const useCreateTransactionGroup = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  return useMutation({
    mutationFn: async (accountGroup: Inserts<TableNames.TransactionGroups>) => {
      return await createTransactionGroupHelper(accountGroup, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] });
    },
  });
};
export const useUpdateTransactionGroup = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  return useMutation({
    mutationFn: async ({
      accountGroup,
      originalData,
    }: {
      accountGroup: Updates<TableNames.TransactionGroups>;
      originalData: TransactionGroup;
    }) => {
      return await updateTransactionGroupHelper(accountGroup, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] });
    },
  });
};

export const useUpsertTransactionGroup = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  return useMutation({
    mutationFn: async ({
      formData,
      originalData,
    }: {
      formData: Inserts<TableNames.TransactionGroups> | Updates<TableNames.TransactionGroups>;
      originalData?: TransactionGroup;
    }) => {
      if (formData.id && originalData) {
        return await updateTransactionGroupHelper(formData, session);
      }
      return await createTransactionGroupHelper(formData as Inserts<TableNames.TransactionGroups>, session);
    },
    onSuccess: async (_, data) => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    },
    onError: (error, variables, context) => {
      throw new Error(JSON.stringify(error));
    },
  });
};

export const useDeleteTransactionGroup = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const userId = session.user.id;

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteTransactionGroup(id, userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] });
    },
  });
};

export const useRestoreTransactionGroup = (id?: string) => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  const userId = session.user.id;

  return useMutation({
    mutationFn: async (id: string) => {
      return await restoreTransactionGroup(id, userId);
    },
    onSuccess: async id => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] })]);
    },
  });
};

const createTransactionGroupHelper = async (
  formTransactionGroup: Inserts<TableNames.TransactionGroups>,
  session: Session,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formTransactionGroup.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
  formTransactionGroup.createdby = userId;
  formTransactionGroup.tenantid = tenantid;

  const newTransactionGroup = await createTransactionGroup(formTransactionGroup);

  return newTransactionGroup;
};

const updateTransactionGroupHelper = async (
  formTransactionGroup: Updates<TableNames.TransactionGroups>,
  session: Session,
) => {
  let userId = session.user.id;

  formTransactionGroup.updatedby = userId;
  formTransactionGroup.updatedat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

  const updatedTransactionGroup = await updateTransactionGroup(formTransactionGroup);

  return updatedTransactionGroup;
};
