import { TableNames } from "@/src/types/database/TableNames";
import { Tables } from "@/src/types/database/Tables.Types";
import { Model } from "@nozbe/watermelondb";
import { date, field } from "@nozbe/watermelondb/decorators";

export default class Configuration extends Model implements Tables<TableNames.Configurations> {
  static table = TableNames.Configurations;

  @field("key") key!: string;
  @field("value") value!: string;
  @field("type") type!: string;
  @field("table") tablename!: string;
  @field("tenantid") tenantid!: string | null;
  @field("isdeleted") isdeleted!: boolean;
  @field("createdby") createdby!: string | null;
  @field("updatedby") updatedby!: string | null;

  @date("createdat") createdat!: string;
  @date("updatedat") updatedat!: string | null;
}

export type ConfigurationModel = Configuration;
