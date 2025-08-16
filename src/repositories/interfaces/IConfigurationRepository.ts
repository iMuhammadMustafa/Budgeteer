import { Configuration, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

export interface IConfigurationRepository {
  getAllConfigurations(tenantId: string): Promise<Configuration[]>;
  getConfigurationById(id: string, tenantId: string): Promise<Configuration>;
  getConfiguration(table: string, type: string, key: string, tenantId: string): Promise<Configuration>;
  createConfiguration(configuration: Inserts<TableNames.Configurations>): Promise<any>;
  updateConfiguration(configuration: Updates<TableNames.Configurations>): Promise<any>;
  deleteConfiguration(id: string, userId: string): Promise<any>;
  restoreConfiguration(id: string, userId: string): Promise<any>;
}
