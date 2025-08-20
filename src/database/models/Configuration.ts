import { TableNames } from "@/src/types/db/TableNames";
import { Model } from "@nozbe/watermelondb";
import { field, date, readonly } from "@nozbe/watermelondb/decorators";

export default class Configuration extends Model {
  static table = TableNames.Configurations;

  @field("key") key!: string;
  @field("value") value!: string;
  @field("type") type!: string;
  @field("table") tableName!: string;
  @field("tenantid") tenantId?: string;
  @field("isdeleted") isDeleted!: boolean;
  @field("createdby") createdBy?: string;
  @field("updatedby") updatedBy?: string;

  @readonly @date("createdat") createdAt!: Date;
  @readonly @date("updatedat") updatedAt!: Date;
}

export type ConfigurationModel = Configuration;
