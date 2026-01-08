import { TableNames } from "@/src/types/database//TableNames";
import { Session } from "@supabase/supabase-js";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { queryClient } from "../providers/QueryProvider";
import { IRepository } from "../repositories/interfaces/IRepository";
import { Inserts, Updates } from "../types/database/Tables.Types";

export function useBaseFindAll<TEntity, TTable extends TableNames>(
  tableName: TableNames,
  tenantId: string,
  repo: IRepository<TEntity, TTable>,
  filters?: any,
) {
  return useQuery<TEntity[]>({
    queryKey: [tableName, tenantId, filters],
    queryFn: async () => {
      return repo.findAll(tenantId, filters ?? {});
    },
    enabled: !!tenantId,
  });
}

export function useBaseFindAllDeleted<TEntity, TTable extends TableNames>(
  tableName: TableNames,
  tenantId: string,
  repo: IRepository<TEntity, TTable>,
) {
  return useQuery<TEntity[]>({
    queryKey: [tableName, "deleted", tenantId],
    queryFn: async () => {
      return repo.findAll(tenantId, { isDeleted: true });
    },
    enabled: !!tenantId,
  });
}

export function useBaseFindById<TModel, TTable extends TableNames>(
  tableName: TableNames,
  tenantId: string,
  repo: IRepository<TModel, TTable>,
  id?: string,
) {
  return useQuery<TModel | null>({
    queryKey: [tableName, id, tenantId],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      return repo.findById(id, tenantId);
    },
    enabled: !!id && !!tenantId,
  });
}

export function useBaseCreate<TModel, TTable extends TableNames>(
  tableName: TableNames,
  repo: IRepository<TModel, TTable>,
  tenantId: string,
  session: any,
  options?: {
    customCreate?: (form: Inserts<TTable>, session: Session) => Promise<TModel>;
  },
) {
  return useMutation({
    mutationFn: async (form: Inserts<TTable>) => {
      if (options?.customCreate) {
        return await options.customCreate(form, session);
      }
      return await createBaseRepoHelper(form, session, repo);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [tableName] });
    },
  });
}

export function useBaseUpdate<TModel, TTable extends TableNames>(
  tableName: TableNames,
  repo: IRepository<TModel, TTable>,
  tenantId: string,
  session: any,
  options?: {
    customUpdate?: (form: Updates<TTable>, session: Session, original?: TModel) => Promise<TModel>;
  },
) {
  return useMutation({
    mutationFn: async ({ form, original }: { form: Updates<TTable>; original?: TModel }) => {
      if (options?.customUpdate) {
        return await options.customUpdate(form, session, original);
      }
      return await updateBaseRepoHelper(form, session, repo);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [tableName] });
    },
  });
}

export function useBaseUpsert<TModel, TTable extends TableNames>(
  tableName: TableNames,
  repo: IRepository<TModel, TTable>,
  tenantId: string,
  session: any,
  options?: {
    customCreate?: (form: Inserts<TTable>, session: Session) => Promise<TModel>;
    customUpdate?: (form: Updates<TTable>, session: Session, original?: TModel) => Promise<TModel>;
    customUpsert?: (form: Inserts<TTable> | Updates<TTable>, session: Session, original?: TModel) => Promise<TModel>;
  },
) {
  return useMutation({
    mutationFn: async ({ form, original }: { form: Inserts<TTable> | Updates<TTable>; original?: TModel }) => {
      console.log(form);
      if (options?.customUpsert) {
        return await options.customUpsert(form, session, original);
      }

      if (form.id && original) {
        if (options?.customUpdate) {
          return await options.customUpdate(form as Updates<TTable>, session, original);
        }
        return await updateBaseRepoHelper(form, session, repo);
      }
      if (options?.customCreate) {
        return await options.customCreate(form as Inserts<TTable>, session);
      }
      return await createBaseRepoHelper(form as Inserts<TTable>, session, repo);
    },
    onSuccess: async (_, data) => {
      await queryClient.invalidateQueries({ queryKey: [tableName] });
    },
    onError: (error, variables, context) => {
      throw new Error(JSON.stringify(error));
    },
  });
}

export function useBaseDelete<TModel, TTable extends TableNames>(
  tableName: TableNames,
  repo: IRepository<TModel, TTable>,
  tenantId: string,
  session: any,
  options?: {
    customDelete?: (vars: { id: string; item?: any }, session: Session) => Promise<void>;
  },
) {
  return useMutation({
    mutationFn: async (vars: { id: string; item?: any }) => {
      if (options?.customDelete) {
        return await options.customDelete(vars, session);
      }
      return await repo.softDelete(vars.id, tenantId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [tableName] });
    },
  });
}

export function useBaseHardDelete<TModel, TTable extends TableNames>(
  tableName: TableNames,
  repo: IRepository<TModel, TTable>,
  tenantId: string,
  session: any,
) {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return await repo.hardDelete(id, tenantId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [tableName] });
    },
  });
}

export function useBaseSoftDelete<TModel, TTable extends TableNames>(
  tableName: TableNames,
  repo: IRepository<TModel, TTable>,
  tenantId: string,
  session: any,
  options?: {
    customSoftDelete?: (vars: { id: string; item?: any }, session: Session) => Promise<void>;
  },
) {
  return useMutation({
    mutationFn: async (vars: { id: string; item?: any }) => {
      if (options?.customSoftDelete) {
        return await options.customSoftDelete(vars, session);
      }
      return await repo.softDelete(vars.id, tenantId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [tableName] });
    },
  });
}

export function useBaseRestore<TModel, TTable extends TableNames>(
  tableName: TableNames,
  repo: IRepository<TModel, TTable>,
  tenantId: string,
  session: any,
  options?: {
    customRestore?: (vars: { id: string; item?: any }, session: Session) => Promise<void>;
  },
) {
  return useMutation({
    mutationFn: async (vars: { id: string; item?: any }) => {
      if (options?.customRestore) {
        return await options.customRestore(vars, session);
      }
      return await repo.restore(vars.id, tenantId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [tableName] });
    },
  });
}

export function useBaseUpdateMultiple<TModel, TTable extends TableNames>(
  tableName: TableNames,
  repo: IRepository<TModel, TTable>,
  tenantId: string,
  session: any,
  relatedTablesToInvalidate?: TableNames[],
) {
  return useMutation({
    mutationFn: async (data: Updates<TTable>[]) => {
      const userId = session.user.id;
      const timestamp = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

      const updates = data.map(item => ({
        ...item,
        updatedby: userId,
        updatedat: timestamp,
      }));

      return await repo.updateMultiple!(updates, tenantId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [tableName] });
      if (relatedTablesToInvalidate) {
        for (const relatedTable of relatedTablesToInvalidate) {
          await queryClient.invalidateQueries({ queryKey: [relatedTable] });
        }
      }
    },
  });
}

async function createBaseRepoHelper<TTModel, TTable extends TableNames>(
  form: Inserts<TTable>,
  session: Session,
  repository: any,
) {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  form.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
  form.createdby = userId;
  form.tenantid = tenantid;
  form.updatedby = userId;

  const newEntity = await repository.create(form, tenantid);

  return newEntity;
}

async function updateBaseRepoHelper<TTModel, TTable extends TableNames>(
  form: Updates<TTable>,
  session: Session,
  repository: any,
) {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  form.updatedby = userId;
  form.updatedat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

  if (!form.id) throw new Error("ID is required for update");

  const updatedEntity = await repository.update(form.id, form, tenantid);

  return updatedEntity;
}

export default function createServiceHooks<TEntity, TTable extends TableNames>(
  tableName: TTable,
  repo: any,
  tenantId: string,
  session: any,
  options?: {
    customCreate?: (form: Inserts<TTable>, session: Session) => Promise<TEntity>;
    customUpdate?: (form: Updates<TTable>, session: Session, original?: TEntity) => Promise<TEntity>;
    customUpsert?: (form: Inserts<TTable> | Updates<TTable>, session: Session, original?: TEntity) => Promise<TEntity>;
    customSoftDelete?: (vars: { id: string; item?: any }, session: Session) => Promise<void>;
    customDelete?: (vars: { id: string; item?: any }, session: Session) => Promise<void>;
    customRestore?: (vars: { id: string; item?: any }, session: Session) => Promise<void>;
  },
  relatedTablesToInvalidate?: TableNames[],
) {
  return {
    useFindAll: (searchFilters?: any) => useBaseFindAll<TEntity, TTable>(tableName, tenantId, repo, searchFilters),
    useFindAllDeleted: () => useBaseFindAllDeleted<TEntity, TTable>(tableName, tenantId, repo),
    useFindById: (id?: string) => useBaseFindById<TEntity, TTable>(tableName, tenantId, repo, id),
    useCreate: () => useBaseCreate<TEntity, TTable>(tableName, repo, tenantId, session, options),
    useUpdate: () => useBaseUpdate<TEntity, TTable>(tableName, repo, tenantId, session, options),
    useUpsert: () => useBaseUpsert<TEntity, TTable>(tableName, repo, tenantId, session, options),
    useDelete: () => useBaseDelete<TEntity, TTable>(tableName, repo, tenantId, session, options),
    useHardDelete: () => useBaseHardDelete<TEntity, TTable>(tableName, repo, tenantId, session),
    useSoftDelete: () => useBaseSoftDelete<TEntity, TTable>(tableName, repo, tenantId, session, options),
    useRestore: () => useBaseRestore<TEntity, TTable>(tableName, repo, tenantId, session, options),
    useUpdateMultiple: () =>
      useBaseUpdateMultiple<TEntity, TTable>(tableName, repo, tenantId, session, relatedTablesToInvalidate),
    repo,
  };
}
