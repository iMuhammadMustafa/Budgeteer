import { Configuration, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { IRepository } from "./IRepository";

export interface IConfigurationRepository
  extends IRepository<Configuration, Inserts<TableNames.Configurations>, Updates<TableNames.Configurations>> {
  getConfiguration(table: string, type: string, key: string, tenantId?: string): Promise<Configuration>;
}
