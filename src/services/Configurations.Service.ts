import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { ConfigurationTypes } from "@/src/types/database/Config.Types";
import { TableNames } from "@/src/types/database//TableNames";
import { Configuration } from "@/src/types/database//Tables.Types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "../providers/AuthProvider";
import { queryClient } from "../providers/QueryProvider";
import createServiceHooks from "./BaseService";
import { setSystemCategoryMapping } from "./helpers/systemCategories";
import { IService } from "./IService";
import { queryKeys } from "./queryKeys";

export interface IConfigurationService extends IService<Configuration, TableNames.Configurations> {
  useGetConfiguration: (table: string, type: string, key: string) => ReturnType<typeof useQuery<Configuration | null>>;
  /** Remap a reserved (system) category to a different category id. */
  useSetSystemCategory: () => ReturnType<
    typeof useMutation<void, unknown, { configType: ConfigurationTypes; categoryId: string }>
  >;
  /** Ids of the transaction categories currently reserved by a system mapping. */
  useSystemCategoryIds: () => ReturnType<typeof useQuery<string[]>>;
}

export function useConfigurationService(): IConfigurationService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const configurationRepo = dbContext.ConfigurationRepository();

  const useGetConfiguration = (table: string, type: string, key: string) => {
    return useQuery<Configuration | null>({
      queryKey: queryKeys.configurations.byLookup(table, type, key, tenantId),
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        // A missing configuration is a valid, expected state (e.g. an unmapped
        // system category) — resolve to null instead of throwing/retrying.
        return configurationRepo.getConfiguration(table, type, key, tenantId).catch(() => null);
      },
      enabled: !!tenantId,
    });
  };

  const useSystemCategoryIds = () => {
    return useQuery<string[]>({
      queryKey: [...queryKeys.configurations.all, "systemCategoryIds", tenantId],
      queryFn: async () => {
        const configs = await configurationRepo.findAll(tenantId).catch(() => []);
        return configs
          .filter(c => c.table === TableNames.TransactionCategories && c.key === "id")
          .map(c => c.value);
      },
      enabled: !!tenantId,
    });
  };

  const useSetSystemCategory = () => {
    const userId = session.user.id;
    return useMutation({
      mutationFn: async ({ configType, categoryId }: { configType: ConfigurationTypes; categoryId: string }) => {
        await setSystemCategoryMapping(configType, categoryId, tenantId, userId, configurationRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.configurations.all });
      },
    });
  };

  return {
    ...createServiceHooks<Configuration, TableNames.Configurations>(
      TableNames.Configurations,
      configurationRepo,
      tenantId,
      session,
    ),
    useGetConfiguration,
    useSetSystemCategory,
    useSystemCategoryIds,
  };
}
