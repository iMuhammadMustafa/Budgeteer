import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Configuration, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import {
  createConfiguration,
  deleteConfiguration,
  getConfigurationById,
  getAllConfigurations,
  restoreConfiguration,
  updateConfiguration,
  IConfigurationRepository,
} from "@/src/repositories";
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
    if (!session) throw new Error("Session not found");
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
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async ({ form, original }: { form: Updates<TableNames.Configurations>; original: Configuration }) => {
        return await updateConfigurationRepoHelper(form, session, configurationRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] });
      },
    });
  };

  const upsert = () => {
    if (!session) throw new Error("Session not found");
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
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await configurationRepo.softDelete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] });
      },
    });
  };

  const restore = () => {
    if (!session) throw new Error("Session not found");
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

  // Legacy hooks for backward compatibility
  // const getConfigurations = useGetConfigurations();
  // const getConfigurationById = (id?: string) => useGetConfigurationById(id);
  // const createConfiguration = useCreateConfiguration();
  // const updateConfiguration = useUpdateConfiguration();
  // const upsertConfiguration = useUpsertConfiguration();
  // const deleteConfiguration = useDeleteConfiguration();
  // const restoreConfiguration = useRestoreConfiguration();

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

    // Legacy methods (backward compatibility)
    // getConfigurations,
    // getConfigurationById,
    // createConfiguration,
    // updateConfiguration,
    // upsertConfiguration,
    // deleteConfiguration,
    // restoreConfiguration,

    // Direct repository access
    repo: configurationRepo,
  };
}

// export const useGetConfigurations = () => {
//   const { session } = useAuth();
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   return useQuery<Configuration[]>({
//     queryKey: [TableNames.Configurations, tenantId],
//     queryFn: async () => {
//       if (!tenantId) throw new Error("Tenant ID not found in session");
//       return getAllConfigurations(tenantId);
//     },
//     enabled: !!tenantId,
//   });
// };

// export const useGetConfigurationById = (id?: string) => {
//   const { session } = useAuth();
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   return useQuery<Configuration | null>({
//     queryKey: [TableNames.Configurations, id, tenantId],
//     queryFn: async () => {
//       if (!id) throw new Error("ID is required");
//       if (!tenantId) throw new Error("Tenant ID not found in session");
//       return getConfigurationById(id, tenantId);
//     },
//     enabled: !!id && !!tenantId,
//   });
// };

// export const useCreateConfiguration = () => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");
//   return useMutation({
//     mutationFn: async (accountGroup: Inserts<TableNames.Configurations>) => {
//       return await createConfigurationHelper(accountGroup, session);
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] });
//     },
//   });
// };
// export const useUpdateConfiguration = () => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");

//   return useMutation({
//     mutationFn: async ({
//       accountGroup,
//       originalData,
//     }: {
//       accountGroup: Updates<TableNames.Configurations>;
//       originalData: Configuration;
//     }) => {
//       return await updateConfigurationHelper(accountGroup, session);
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] });
//     },
//   });
// };

// export const useUpsertConfiguration = () => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");

//   return useMutation({
//     mutationFn: async ({
//       formConfiguration,
//       originalData,
//     }: {
//       formConfiguration: Inserts<TableNames.Configurations> | Updates<TableNames.Configurations>;
//       originalData?: Configuration;
//     }) => {
//       if (formConfiguration.id && originalData) {
//         return await updateConfigurationHelper(formConfiguration, session);
//       }
//       return await createConfigurationHelper(formConfiguration as Inserts<TableNames.Configurations>, session);
//     },
//     onSuccess: async (_, data) => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] });
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
//     },
//     onError: (error, variables, context) => {
//       throw new Error(JSON.stringify(error));
//     },
//   });
// };

// export const useDeleteConfiguration = () => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");

//   const userId = session.user.id;

//   return useMutation({
//     mutationFn: async (id: string) => {
//       return await deleteConfiguration(id, userId);
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] });
//     },
//   });
// };

// export const useRestoreConfiguration = (id?: string) => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");
//   const userId = session.user.id;

//   return useMutation({
//     mutationFn: async (id: string) => {
//       return await restoreConfiguration(id, userId);
//     },
//     onSuccess: async id => {
//       await Promise.all([queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] })]);
//     },
//   });
// };

// const createConfigurationHelper = async (formConfiguration: Inserts<TableNames.Configurations>, session: Session) => {
//   let userId = session.user.id;
//   let tenantid = session.user.user_metadata.tenantid;

//   formConfiguration.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
//   formConfiguration.createdby = userId;
//   formConfiguration.tenantid = tenantid;

//   const newConfiguration = await createConfiguration(formConfiguration);

//   return newConfiguration;
// };

// const updateConfigurationHelper = async (formConfiguration: Updates<TableNames.Configurations>, session: Session) => {
//   let userId = session.user.id;

//   formConfiguration.updatedby = userId;
//   formConfiguration.updatedat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

//   const updatedConfiguration = await updateConfiguration(formConfiguration);

//   return updatedConfiguration;
// };

// Repository-based helper functions
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
