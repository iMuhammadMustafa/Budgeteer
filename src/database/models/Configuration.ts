import { Model } from "@nozbe/watermelondb";
import { field, date, readonly } from "@nozbe/watermelondb/decorators";

export default class Configuration extends Model {
  static table = "configurations";

  @field("KEY") key!: string;
  @field("Value") value!: string;
  @field("type") type!: string;
  @field("table") tableName!: string;
  @field("TenantId") tenantId?: string;
  @field("IsDeleted") isDeleted!: boolean;
  @field("CreatedBy") createdBy?: string;
  @field("UpdatedBy") updatedBy?: string;

  @readonly @date("CreatedAt") createdAt!: Date;
  @readonly @date("UpdatedAt") updatedAt!: Date;
}

export type ConfigurationModel = Configuration;
