// Mock Configurations.Repository for demo mode

import { useQuery, useMutation } from "@tanstack/react-query";
import { Configuration } from "@/src/types/db/Tables.Types";

// Example mock data
const mockConfigurations: Configuration[] = [
  {
    id: "conf-1",
    key: "currency",
    value: "USD",
    table: "settings",
    type: "string",
    isdeleted: false,
    createdat: "2025-01-01T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
  },
  {
    id: "conf-2",
    key: "theme",
    value: "dark",
    table: "settings",
    type: "string",
    isdeleted: false,
    createdat: "2025-01-02T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
  },
  {
    id: "conf-3",
    key: "timezone",
    value: "America/Chicago",
    table: "settings",
    type: "string",
    isdeleted: false,
    createdat: "2025-01-03T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
  },
  {
    id: "conf-4",
    key: "language",
    value: "en-US",
    table: "settings",
    type: "string",
    isdeleted: false,
    createdat: "2025-01-04T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
  },
  {
    id: "conf-5",
    key: "notifications",
    value: "enabled",
    table: "settings",
    type: "boolean",
    isdeleted: false,
    createdat: "2025-01-05T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
  },
];

let inMemoryConfigurations = [...mockConfigurations];

export const useGetConfigurations = () => {
  return useQuery<Configuration[]>({
    queryKey: ["Configurations", "demo"],
    queryFn: async () => inMemoryConfigurations,
    initialData: inMemoryConfigurations,
  });
};

export const useGetConfigurationById = (id?: string) => {
  return useQuery<Configuration | undefined>({
    queryKey: ["Configurations", id, "demo"],
    queryFn: async () => inMemoryConfigurations.find(conf => conf.id === id),
    enabled: !!id,
    initialData: () => inMemoryConfigurations.find(conf => conf.id === id),
  });
};

export const useCreateConfiguration = () => {
  return useMutation({
    mutationFn: async (configuration: Partial<Configuration>) => {
      const newConfiguration = {
        ...configuration,
        id: `conf-${Date.now()}`,
        createdat: new Date().toISOString(),
        createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        isdeleted: false,
        tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
      } as Configuration;
      inMemoryConfigurations = [...inMemoryConfigurations, newConfiguration];
      return newConfiguration;
    },
  });
};

export const useUpdateConfiguration = () => {
  return useMutation({
    mutationFn: async ({
      accountGroup,
      originalData,
    }: {
      accountGroup: Partial<Configuration>;
      originalData: Configuration;
    }) => {
      inMemoryConfigurations = inMemoryConfigurations.map(conf =>
        conf.id === accountGroup.id ? { ...conf, ...accountGroup, updatedat: new Date().toISOString() } : conf,
      );
      return inMemoryConfigurations.find(conf => conf.id === accountGroup.id);
    },
  });
};

export const useUpsertConfiguration = () => {
  return useMutation({
    mutationFn: async ({
      formConfiguration,
      originalData,
    }: {
      formConfiguration: Partial<Configuration>;
      originalData?: Configuration;
    }) => {
      if (formConfiguration.id && originalData) {
        inMemoryConfigurations = inMemoryConfigurations.map(conf =>
          conf.id === formConfiguration.id
            ? { ...conf, ...formConfiguration, updatedat: new Date().toISOString() }
            : conf,
        );
        return inMemoryConfigurations.find(conf => conf.id === formConfiguration.id);
      }
      const newConfiguration = {
        ...formConfiguration,
        id: `conf-${Date.now()}`,
        createdat: new Date().toISOString(),
        createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        isdeleted: false,
        tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
      } as Configuration;
      inMemoryConfigurations = [...inMemoryConfigurations, newConfiguration];
      return newConfiguration;
    },
  });
};

export const useDeleteConfiguration = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      inMemoryConfigurations = inMemoryConfigurations.map(conf =>
        conf.id === id ? { ...conf, isdeleted: true, updatedat: new Date().toISOString() } : conf,
      );
      return inMemoryConfigurations.find(conf => conf.id === id);
    },
  });
};

export const useRestoreConfiguration = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      inMemoryConfigurations = inMemoryConfigurations.map(conf =>
        conf.id === id ? { ...conf, isdeleted: false, updatedat: new Date().toISOString() } : conf,
      );
      return inMemoryConfigurations.find(conf => conf.id === id);
    },
  });
};
