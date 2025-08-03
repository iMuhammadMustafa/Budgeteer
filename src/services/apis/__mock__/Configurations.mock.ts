// Mock implementation for Configurations API

import { Configuration } from "@/src/types/db/Tables.Types";

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

export const getAllConfigurations = async (tenantId: string) => {
  // TODO: Return mock configurations
  return mockConfigurations.filter(conf => conf.tenantid === tenantId || tenantId === "demo");
};

export const getConfigurationById = async (id: string, tenantId: string) => {
  // TODO: Return mock configuration by id
  return mockConfigurations.find(conf => conf.id === id && (conf.tenantid === tenantId || tenantId === "demo")) ?? null;
};

export const getConfiguration = async (table: string, type: string, key: string, tenantId: string) => {
  // TODO: Return mock configuration by table/type/key
  return (
    mockConfigurations.find(
      conf =>
        conf.table === table &&
        conf.type === type &&
        conf.key === key &&
        (conf.tenantid === tenantId || tenantId === "demo"),
    ) ?? null
  );
};

export const createConfiguration = async (configuration: any) => {
  // TODO: Return created mock configuration
  return {
    ...configuration,
    id: `conf-${mockConfigurations.length + 1}`,
    createdat: new Date().toISOString(),
    isdeleted: false,
  };
};

export const updateConfiguration = async (configuration: any) => {
  // TODO: Return updated mock configuration
  return { ...configuration };
};

export const deleteConfiguration = async (id: string, userId: string) => {
  // TODO: Return deleted mock configuration
  return { id, isdeleted: true, updatedby: userId };
};

export const restoreConfiguration = async (id: string, userId: string) => {
  // TODO: Return restored mock configuration
  return { id, isdeleted: false, updatedby: userId };
};
