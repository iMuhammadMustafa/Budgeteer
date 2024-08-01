type BaseEntity = {
    Id: string; 
    IsDeleted: boolean;
    TenantId: string;
    CreatedBy: string;
    CreatedOn: Date;
    ModifiedBy?: string;
    ModifiedOn?: Date;
  }


export { BaseEntity };