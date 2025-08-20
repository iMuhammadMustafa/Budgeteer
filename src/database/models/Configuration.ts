import { TableNames } from "@/src/types/db/TableNames";
import { Model } from "@nozbe/watermelondb";
import { field, date, readonly } from "@nozbe/watermelondb/decorators";

export default class Configuration extends Model {
  static table = TableNames.Configurations;

  @field("key") key!: string;
  @field("value") value!: string;
  @field("type") type!: string;
  @field("table") tablename!: string;
  @field("tenantid") tenantid?: string;
  @field("isdeleted") isdeleted!: boolean;
  @field("createdby") createdby?: string;
  @field("updatedby") updatedby?: string;

  @date("createdat") createdat!: Date;
  @date("updatedat") updatedat!: Date;
}

export type ConfigurationModel = Configuration;
