import { TableNames } from "@/src/types/database/TableNames";
import {
    ExistingDataMap,
    ExportData,
    ExportDataTables,
    FieldType,
    TABLE_SCHEMAS,
    ValidationError,
    ValidationWarning
} from "@/src/types/ImportExport.Types";

// ============================================================================
// Validation Result Types
// ============================================================================

export interface SchemaValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

export interface DependencyValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    missingDependencies: Map<TableNames, Set<string>>;
}

export interface DuplicateCheckResult {
    duplicateIds: string[];
    newIds: string[];
}

export interface EnumValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

// ============================================================================
// DataValidationService
// ============================================================================

/**
 * Service for validating import data against database schemas and constraints
 */
export class DataValidationService {
    /**
     * Validate that records match the expected schema for a table
     */
    static validateTableSchema(table: TableNames, records: any[]): SchemaValidationResult {
        const schema = TABLE_SCHEMAS[table];
        if (!schema) {
            return {
                isValid: false,
                errors: [
                    {
                        type: "INVALID_SCHEMA",
                        table,
                        message: `Unknown table: ${table}`,
                    },
                ],
            };
        }

        const errors: ValidationError[] = [];

        for (const record of records) {
            const recordId = record[schema.primaryKey] || "unknown";

            // Check required fields
            for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
                if (fieldSchema.required && (record[fieldName] === undefined || record[fieldName] === null)) {
                    errors.push({
                        type: "MISSING_REQUIRED_FIELD",
                        table,
                        recordId,
                        field: fieldName,
                        message: `Missing required field '${fieldName}' in ${table} record ${recordId}`,
                    });
                }

                // Check field type if value is present
                if (record[fieldName] !== undefined && record[fieldName] !== null) {
                    const typeError = this.validateFieldType(table, recordId, fieldName, record[fieldName], fieldSchema.type);
                    if (typeError) {
                        errors.push(typeError);
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate a field's type
     */
    private static validateFieldType(
        table: TableNames,
        recordId: string,
        fieldName: string,
        value: any,
        expectedType: FieldType,
    ): ValidationError | null {
        let isValid = false;

        switch (expectedType) {
            case "string":
                isValid = typeof value === "string";
                break;
            case "number":
                isValid = typeof value === "number" && !isNaN(value);
                break;
            case "boolean":
                isValid = typeof value === "boolean";
                break;
            case "array":
                isValid = Array.isArray(value);
                break;
            case "date":
                isValid = typeof value === "string" && !isNaN(Date.parse(value));
                break;
        }

        if (!isValid) {
            return {
                type: "INVALID_FIELD_TYPE",
                table,
                recordId,
                field: fieldName,
                message: `Field '${fieldName}' in ${table} record ${recordId} expected type '${expectedType}', got '${typeof value}'`,
                details: { expectedType, actualType: typeof value, value },
            };
        }

        return null;
    }

    /**
     * Validate that all foreign key dependencies exist
     */
    static validateDependencies(data: ExportData, existingData: ExistingDataMap): DependencyValidationResult {
        const errors: ValidationError[] = [];
        const missingDependencies = new Map<TableNames, Set<string>>();

        // Build a map of all IDs that will be available after import
        // This combines existing data with import data
        const availableIds: ExistingDataMap = { ...existingData };

        for (const tableName of Object.values(TableNames)) {
            const tableData = data.data[tableName as keyof ExportDataTables];
            if (tableData && Array.isArray(tableData)) {
                if (!availableIds[tableName]) {
                    availableIds[tableName] = new Set();
                }
                for (const record of tableData) {
                    if (record.id) {
                        availableIds[tableName]!.add(record.id);
                    }
                }
            }
        }

        // Validate foreign key constraints
        for (const tableName of Object.values(TableNames)) {
            const tableData = data.data[tableName as keyof ExportDataTables];
            if (!tableData || !Array.isArray(tableData)) continue;

            const schema = TABLE_SCHEMAS[tableName];
            if (!schema) continue;

            for (const record of tableData) {
                const recordId = record.id || "unknown";

                for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
                    if (fieldSchema.isForeignKey && fieldSchema.foreignTable) {
                        const foreignValue = record[fieldName];

                        // Skip null/undefined optional foreign keys
                        if (!foreignValue && !fieldSchema.required) continue;

                        // Check if the referenced record exists
                        const foreignTableIds = availableIds[fieldSchema.foreignTable];
                        if (!foreignTableIds || !foreignTableIds.has(foreignValue)) {
                            errors.push({
                                type: "FOREIGN_KEY_VIOLATION",
                                table: tableName,
                                recordId,
                                field: fieldName,
                                message: `Foreign key violation: ${tableName}.${fieldName}='${foreignValue}' references non-existent ${fieldSchema.foreignTable} record`,
                                details: {
                                    foreignTable: fieldSchema.foreignTable,
                                    foreignField: fieldSchema.foreignField,
                                    foreignValue,
                                },
                            });

                            if (!missingDependencies.has(fieldSchema.foreignTable)) {
                                missingDependencies.set(fieldSchema.foreignTable, new Set());
                            }
                            missingDependencies.get(fieldSchema.foreignTable)!.add(foreignValue);
                        }
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            missingDependencies,
        };
    }

    /**
     * Check for duplicate records that already exist in the database
     */
    static checkDuplicates(table: TableNames, records: any[], existingIds: Set<string>): DuplicateCheckResult {
        const duplicateIds: string[] = [];
        const newIds: string[] = [];

        for (const record of records) {
            if (record.id) {
                if (existingIds.has(record.id)) {
                    duplicateIds.push(record.id);
                } else {
                    newIds.push(record.id);
                }
            }
        }

        return { duplicateIds, newIds };
    }

    /**
     * Validate enum field values
     */
    static validateEnumValues(table: TableNames, records: any[]): EnumValidationResult {
        const schema = TABLE_SCHEMAS[table];
        if (!schema) {
            return {
                isValid: false,
                errors: [
                    {
                        type: "INVALID_SCHEMA",
                        table,
                        message: `Unknown table: ${table}`,
                    },
                ],
            };
        }

        const errors: ValidationError[] = [];

        for (const record of records) {
            const recordId = record.id || "unknown";

            for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
                if (fieldSchema.isEnum && fieldSchema.enumValues && record[fieldName] !== undefined) {
                    const value = record[fieldName];
                    if (!fieldSchema.enumValues.includes(value)) {
                        errors.push({
                            type: "INVALID_ENUM",
                            table,
                            recordId,
                            field: fieldName,
                            message: `Invalid enum value '${value}' for ${table}.${fieldName}. Valid values: ${fieldSchema.enumValues.join(", ")}`,
                            details: {
                                value,
                                validValues: fieldSchema.enumValues,
                            },
                        });
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Generate warnings for duplicate records that will be skipped
     */
    static generateDuplicateWarnings(table: TableNames, duplicateIds: string[]): ValidationWarning[] {
        return duplicateIds.map(id => ({
            type: "DUPLICATE_SKIPPED" as const,
            table,
            recordId: id,
            message: `Record ${table}.${id} already exists and will be skipped`,
        }));
    }

    /**
     * Validate the export data version compatibility
     */
    static validateVersion(importVersion: string, currentVersion: string): ValidationWarning | null {
        if (importVersion !== currentVersion) {
            const [importMajor] = importVersion.split(".");
            const [currentMajor] = currentVersion.split(".");

            if (importMajor !== currentMajor) {
                return {
                    type: "VERSION_DIFFERENT",
                    message: `Import file version (${importVersion}) differs from current version (${currentVersion}). Some features may not be compatible.`,
                };
            }
        }
        return null;
    }

    /**
     * Get list of tables that must be imported before the given table
     */
    static getRequiredDependencies(table: TableNames): TableNames[] {
        const schema = TABLE_SCHEMAS[table];
        return schema ? schema.dependencies : [];
    }

    /**
     * Check if all required dependencies for a table are included in the import
     */
    static checkDependencyInclusion(table: TableNames, includedTables: TableNames[]): ValidationError[] {
        const errors: ValidationError[] = [];
        const dependencies = this.getRequiredDependencies(table);

        for (const dep of dependencies) {
            if (!includedTables.includes(dep)) {
                errors.push({
                    type: "MISSING_DEPENDENCY",
                    table,
                    message: `Table '${table}' requires '${dep}' to be imported first, but it's not included in the import data`,
                    details: { requiredTable: dep },
                });
            }
        }

        return errors;
    }
}

export default DataValidationService;
