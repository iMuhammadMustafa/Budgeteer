import { TableNames } from "@/src/types/database/TableNames";
import { Configuration } from "@/src/types/database/Tables.Types";
import { IRepository } from "./IRepository";

export interface IConfigurationRepository extends IRepository<Configuration, TableNames.Configurations> {
  getConfiguration(table: string, type: string, key: string, tenantId: string): Promise<Configuration>;
}
