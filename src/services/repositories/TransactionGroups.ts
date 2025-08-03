import { useTransactionGroupsApi } from "@/src/services/apis/TransactionGroups.api";

// Repository hooks always use the API layer

export const useGetTransactionGroups = (
  ...args: Parameters<ReturnType<typeof useTransactionGroupsApi>["getAllTransactionGroups"]>
) => {
  const api = useTransactionGroupsApi();
  return api.getAllTransactionGroups(...args);
};

export const useGetTransactionGroupById = (
  ...args: Parameters<ReturnType<typeof useTransactionGroupsApi>["getTransactionGroupById"]>
) => {
  const api = useTransactionGroupsApi();
  return api.getTransactionGroupById(...args);
};

export const useCreateTransactionGroup = (
  ...args: Parameters<ReturnType<typeof useTransactionGroupsApi>["createTransactionGroup"]>
) => {
  const api = useTransactionGroupsApi();
  return api.createTransactionGroup(...args);
};

export const useUpdateTransactionGroup = (
  ...args: Parameters<ReturnType<typeof useTransactionGroupsApi>["updateTransactionGroup"]>
) => {
  const api = useTransactionGroupsApi();
  return api.updateTransactionGroup(...args);
};

export const useDeleteTransactionGroup = (
  ...args: Parameters<ReturnType<typeof useTransactionGroupsApi>["deleteTransactionGroup"]>
) => {
  const api = useTransactionGroupsApi();
  return api.deleteTransactionGroup(...args);
};

export const useRestoreTransactionGroup = (
  ...args: Parameters<ReturnType<typeof useTransactionGroupsApi>["restoreTransactionGroup"]>
) => {
  const api = useTransactionGroupsApi();
  return api.restoreTransactionGroup(...args);
};
