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
} from "@/src/repositories/Configurations.repository";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";

export const useGetConfigurations = () => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<Configuration[]>({
    queryKey: [TableNames.Configurations, tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return getAllConfigurations(tenantId);
    },
    enabled: !!tenantId,
  });
};

export const useGetConfigurationById = (id?: string) => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<Configuration>({
    queryKey: [TableNames.Configurations, id, tenantId],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return getConfigurationById(id, tenantId);
    },
    enabled: !!id && !!tenantId,
  });
};

export const useCreateConfiguration = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  return useMutation({
    mutationFn: async (accountGroup: Inserts<TableNames.Configurations>) => {
      return await createConfigurationHelper(accountGroup, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] });
    },
  });
};
export const useUpdateConfiguration = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  return useMutation({
    mutationFn: async ({
      accountGroup,
      originalData,
    }: {
      accountGroup: Updates<TableNames.Configurations>;
      originalData: Configuration;
    }) => {
      return await updateConfigurationHelper(accountGroup, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] });
    },
  });
};

export const useUpsertConfiguration = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  return useMutation({
    mutationFn: async ({
      formConfiguration,
      originalData,
    }: {
      formConfiguration: Inserts<TableNames.Configurations> | Updates<TableNames.Configurations>;
      originalData?: Configuration;
    }) => {
      if (formConfiguration.id && originalData) {
        return await updateConfigurationHelper(formConfiguration, session);
      }
      return await createConfigurationHelper(formConfiguration as Inserts<TableNames.Configurations>, session);
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

export const useDeleteConfiguration = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const userId = session.user.id;

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteConfiguration(id, userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] });
    },
  });
};

export const useRestoreConfiguration = (id?: string) => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  const userId = session.user.id;

  return useMutation({
    mutationFn: async (id: string) => {
      return await restoreConfiguration(id, userId);
    },
    onSuccess: async id => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: [TableNames.Configurations] })]);
    },
  });
};

const createConfigurationHelper = async (formConfiguration: Inserts<TableNames.Configurations>, session: Session) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formConfiguration.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
  formConfiguration.createdby = userId;
  formConfiguration.tenantid = tenantid;

  const newConfiguration = await createConfiguration(formConfiguration);

  return newConfiguration;
};

const updateConfigurationHelper = async (formConfiguration: Updates<TableNames.Configurations>, session: Session) => {
  let userId = session.user.id;

  formConfiguration.updatedby = userId;
  formConfiguration.updatedat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

  const updatedConfiguration = await updateConfiguration(formConfiguration);

  return updatedConfiguration;
};
