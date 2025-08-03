// Mock implementation for Recurrings API

import { Configuration } from "@/src/types/db/Tables.Types";
import { CreateRecurringDto, UpdateRecurringDto } from "../supabase/Recurrings.api.supa";

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

export const listRecurrings = async (params: { tenantId: string; filters?: any }) => {
  // TODO: Return mock recurrings
  return [
    {
      id: "mock1",
      tenantid: params.tenantId,
      name: "Mock Recurring",
      isdeleted: false,
      nextoccurrencedate: "2025-08-01",
    },
  ];
};

export const getRecurringById = async (id: string, tenantId: string) => {
  // TODO: Return mock recurring by id
  return {
    id,
    tenantid: tenantId,
    name: "Mock Recurring",
    isdeleted: false,
    nextoccurrencedate: "2025-08-01",
  };
};

export const createRecurring = async (recurringData: CreateRecurringDto, tenantId: string) => {
  // TODO: Return created mock recurring
  return { ...recurringData, id: "mockCreated", tenantid: tenantId };
};

export const updateRecurring = async (id: string, recurringData: UpdateRecurringDto, tenantId: string) => {
  // TODO: Return updated mock recurring
  return { ...recurringData, id, tenantid: tenantId };
};

export const deleteRecurring = async (id: string, tenantId: string, userId?: string) => {
  // TODO: Return deleted mock recurring
  return { id, tenantid: tenantId, isdeleted: true, updatedby: userId };
};
