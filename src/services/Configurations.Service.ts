import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { TableNames } from "@/src/types/database//TableNames";
import { Configuration } from "@/src/types/database//Tables.Types";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../providers/AuthProvider";
import createServiceHooks from "./BaseService";
import { IService } from "./IService";

export interface IConfigurationService extends IService<Configuration, TableNames.Configurations> {
  useGetConfiguration: (table: string, type: string, key: string) => ReturnType<typeof useQuery<Configuration>>;
}

export function useConfigurationService(): IConfigurationService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const configurationRepo = dbContext.ConfigurationRepository();

  const useGetConfiguration = (table: string, type: string, key: string) => {
    return useQuery<Configuration>({
      queryKey: [TableNames.Configurations, table, type, key, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return configurationRepo.getConfiguration(table, type, key, tenantId);
      },
      enabled: !!tenantId,
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
  };
}
