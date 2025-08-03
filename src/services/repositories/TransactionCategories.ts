import { useTransactionCategoriesApi } from "@/src/services/apis/TransactionCategories.repository";

// Repository hooks always use the API layer

export const useGetTransactionCategories = (
  ...args: Parameters<ReturnType<typeof useTransactionCategoriesApi>["getAllTransactionCategories"]>
) => {
  const api = useTransactionCategoriesApi();
  return api.getAllTransactionCategories(...args);
};

export const useGetTransactionCategoryById = (
  ...args: Parameters<ReturnType<typeof useTransactionCategoriesApi>["getTransactionCategoryById"]>
) => {
  const api = useTransactionCategoriesApi();
  return api.getTransactionCategoryById(...args);
};

export const useCreateTransactionCategory = (
  ...args: Parameters<ReturnType<typeof useTransactionCategoriesApi>["createTransactionCategory"]>
) => {
  const api = useTransactionCategoriesApi();
  return api.createTransactionCategory(...args);
};

export const useUpdateTransactionCategory = (
  ...args: Parameters<ReturnType<typeof useTransactionCategoriesApi>["updateTransactionCategory"]>
) => {
  const api = useTransactionCategoriesApi();
  return api.updateTransactionCategory(...args);
};

export const useDeleteTransactionCategory = (
  ...args: Parameters<ReturnType<typeof useTransactionCategoriesApi>["deleteTransactionCategory"]>
) => {
  const api = useTransactionCategoriesApi();
  return api.deleteTransactionCategory(...args);
};

export const useRestoreTransactionCategory = (
  ...args: Parameters<ReturnType<typeof useTransactionCategoriesApi>["restoreTransactionCategory"]>
) => {
  const api = useTransactionCategoriesApi();
  return api.restoreTransactionCategory(...args);
};
