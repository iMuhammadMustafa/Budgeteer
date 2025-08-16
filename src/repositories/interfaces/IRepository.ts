export interface IReadRepository<T> {
  findById(id: string, tenantId?: string): Promise<T | null>;
  findAll(filters?: any, tenantId?: string): Promise<T[]>;
}
export interface IWriteRepository<T, InsertType, UpdateType> {
  create(data: InsertType, tenantId?: string): Promise<T>;
  update(id: string, data: UpdateType, tenantId?: string): Promise<T | null>;
  upsert(data: InsertType | UpdateType, tenantId?: string): Promise<T>;
  delete(id: string, tenantId?: string): Promise<void>;
}
export interface ISoftDeleteRepository<T> {
  softDelete(id: string, tenantId?: string): Promise<void>;
  restore(id: string, tenantId?: string): Promise<void>;
}

export interface IRepository<T, InsertType, UpdateType>
  extends IReadRepository<T>,
    IWriteRepository<T, InsertType, UpdateType>,
    ISoftDeleteRepository<T> {}
