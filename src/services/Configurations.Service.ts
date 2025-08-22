import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Configuration, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { IConfigurationRepository } from "@/src/repositories";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";
import { useStorageMode } from "../providers/StorageModeProvider";
import { IService } from "./IService";

export interface IConfigurationService
  extends IService<Configuration, Inserts<TableNames.Configurations>, Updates<TableNames.Configurations>> {
  getConfiguration: (table: string, type: string, key: string) => ReturnType<typeof useQuery<Configuration>>;
}

export function useConfigurationService(): IConfigurationService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  const tenantId = session?.user?.user_metadata?.tenantid;
  const userId = session?.user?.id;
  const { dbContext } = useStorageMode();
  const configurationRepo = dbContext.ConfigurationRepository();

  // Repository-based Configuration hooks
  const findAll = () => {
    return useQuery<Configuration[]>({
      queryKey: [TableNames.Configurations, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return configurationRepo.findAll({}, tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const findById = (id?: string) => {
    return useQuery<Configuration | null>({
      queryKey: [TableNames.Configurations, id, tenantId, "repo"],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return configurationRepo.findById(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const getConfiguration = (table: string, type: string, key: string) => {
    return useQuery<Configuration>({
      queryKey: [TableNames.Configurations, table, type, key, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return configurationRepo.getConfiguration(table, type, key, tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const create = () => {
    return useMutation({
      mutationFn: async (configuration: Inserts<TableNames.Configurations>) => {
        return await createConfigurationRepoHelper(configuration, session, configurationRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] });
      },
    });
  };

  const update = () => {
    return useMutation({
      mutationFn: async ({
        form,
        original,
      }: {
        form: Updates<TableNames.Configurations>;
        original?: Configuration;
      }) => {
        return await updateConfigurationRepoHelper(form, session, configurationRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] });
      },
    });
  };

  const upsert = () => {
    return useMutation({
      mutationFn: async ({
        form,
        original,
      }: {
        form: Inserts<TableNames.Configurations> | Updates<TableNames.Configurations>;
        original?: Configuration;
      }) => {
        if (form.id && original) {
          return await updateConfigurationRepoHelper(form, session, configurationRepo);
        }
        return await createConfigurationRepoHelper(
          form as Inserts<TableNames.Configurations>,
          session,
          configurationRepo,
        );
      },
      onSuccess: async (_, data) => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
      },
      onError: (error, variables, context) => {
        throw new Error(JSON.stringify(error));
      },
    });
  };

  const deleteObj = () => {
    return useMutation({
      mutationFn: async ({ id }: { id: string }) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await configurationRepo.softDelete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] });
      },
    });
  };

  const restore = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await configurationRepo.restore(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] });
      },
    });
  };
  return {
    // Repository-based methods (new)
    findAll,
    findById,
    getConfiguration,
    create,
    update,
    upsert,
    delete: deleteObj,
    softDelete: deleteObj,
    restore: restore,

    repo: configurationRepo,
  };
}

const createConfigurationRepoHelper = async (
  formConfiguration: Inserts<TableNames.Configurations>,
  session: Session,
  repository: IConfigurationRepository,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formConfiguration.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
  formConfiguration.createdby = userId;
  formConfiguration.tenantid = tenantid;

  const newConfiguration = await repository.create(formConfiguration, tenantid);

  return newConfiguration;
};

const updateConfigurationRepoHelper = async (
  formConfiguration: Updates<TableNames.Configurations>,
  session: Session,
  repository: IConfigurationRepository,
) => {
  let userId = session.user.id;

  formConfiguration.updatedby = userId;
  formConfiguration.updatedat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

  if (!formConfiguration.id) throw new Error("ID is required for update");

  const updatedConfiguration = await repository.update(formConfiguration.id, formConfiguration);

  return updatedConfiguration;
};
