import { describe, expect, it } from "vitest";

import { TableNames } from "@/src/types/database/TableNames";
import { EXPORT_VERSION, TABLE_SCHEMAS } from "@/src/types/ImportExport.Types";
import { DataValidationService } from "./DataValidation.Service";

// Read a valid enum value from the live schema so the test survives enum edits.
const validAccountCategoryType = (TABLE_SCHEMAS[TableNames.AccountCategories].fields as any).type.enumValues[0];

const accountCategory = (over: Record<string, any> = {}) => ({
    id: "cat-1",
    name: "Cash",
    type: validAccountCategoryType,
    tenantid: "t1",
    ...over,
});

const account = (over: Record<string, any> = {}) => ({
    id: "acc-1",
    name: "Checking",
    categoryid: "cat-1",
    tenantid: "t1",
    ...over,
});

describe("validateTableSchema", () => {
    it("accepts a well-formed record", () => {
        const r = DataValidationService.validateTableSchema(TableNames.AccountCategories, [accountCategory()]);
        expect(r.isValid).toBe(true);
        expect(r.errors).toEqual([]);
    });
    it("flags a missing required field", () => {
        const r = DataValidationService.validateTableSchema(TableNames.AccountCategories, [accountCategory({ name: undefined })]);
        expect(r.isValid).toBe(false);
        expect(r.errors[0]).toMatchObject({ type: "MISSING_REQUIRED_FIELD", field: "name" });
    });
    it("flags a wrong field type", () => {
        const r = DataValidationService.validateTableSchema(TableNames.AccountCategories, [accountCategory({ name: 123 })]);
        expect(r.errors.some(e => e.type === "INVALID_FIELD_TYPE" && e.field === "name")).toBe(true);
    });
    it("treats NaN as an invalid number", () => {
        const r = DataValidationService.validateTableSchema(TableNames.Accounts, [account({ balance: NaN })]);
        expect(r.errors.some(e => e.field === "balance")).toBe(true);
    });
    it("rejects an unknown table", () => {
        const r = DataValidationService.validateTableSchema("nope" as TableNames, [{}]);
        expect(r.isValid).toBe(false);
        expect(r.errors[0].type).toBe("INVALID_SCHEMA");
    });
});

describe("validateEnumValues", () => {
    it("passes a valid enum value", () => {
        expect(DataValidationService.validateEnumValues(TableNames.AccountCategories, [accountCategory()]).isValid).toBe(true);
    });
    it("rejects an invalid enum value", () => {
        const r = DataValidationService.validateEnumValues(TableNames.AccountCategories, [accountCategory({ type: "__nonsense__" })]);
        expect(r.isValid).toBe(false);
        expect(r.errors[0]).toMatchObject({ type: "INVALID_ENUM", field: "type" });
    });
});

describe("validateDependencies", () => {
    it("passes when a foreign key resolves within the import data", () => {
        const data: any = { data: { [TableNames.AccountCategories]: [accountCategory()], [TableNames.Accounts]: [account()] } };
        const r = DataValidationService.validateDependencies(data, {});
        expect(r.isValid).toBe(true);
    });
    it("passes when the foreign key resolves against existing data", () => {
        const data: any = { data: { [TableNames.Accounts]: [account()] } };
        const existing: any = { [TableNames.AccountCategories]: new Set(["cat-1"]) };
        expect(DataValidationService.validateDependencies(data, existing).isValid).toBe(true);
    });
    it("reports a foreign-key violation for a dangling reference", () => {
        const data: any = { data: { [TableNames.Accounts]: [account({ categoryid: "ghost" })] } };
        const r = DataValidationService.validateDependencies(data, {});
        expect(r.isValid).toBe(false);
        expect(r.errors[0].type).toBe("FOREIGN_KEY_VIOLATION");
        expect(r.missingDependencies.get(TableNames.AccountCategories)?.has("ghost")).toBe(true);
    });
});

describe("checkDuplicates", () => {
    it("splits records into duplicate and new ids", () => {
        const r = DataValidationService.checkDuplicates(
            TableNames.Accounts,
            [{ id: "a" }, { id: "b" }, { id: "c" }],
            new Set(["b"]),
        );
        expect(r.duplicateIds).toEqual(["b"]);
        expect(r.newIds).toEqual(["a", "c"]);
    });
    it("ignores records without an id", () => {
        const r = DataValidationService.checkDuplicates(TableNames.Accounts, [{}, { id: "a" }], new Set());
        expect(r.newIds).toEqual(["a"]);
    });
});

describe("validateVersion", () => {
    it("returns null for identical versions", () => {
        expect(DataValidationService.validateVersion(EXPORT_VERSION, EXPORT_VERSION)).toBeNull();
    });
    it("returns null for a minor difference within the same major", () => {
        expect(DataValidationService.validateVersion("1.0.0", "1.5.0")).toBeNull();
    });
    it("warns on a major version mismatch", () => {
        const w = DataValidationService.validateVersion("1.0.0", "2.0.0");
        expect(w?.type).toBe("VERSION_DIFFERENT");
    });
});

describe("dependency inclusion", () => {
    it("getRequiredDependencies returns the schema deps", () => {
        expect(DataValidationService.getRequiredDependencies(TableNames.Accounts)).toContain(TableNames.AccountCategories);
    });
    it("checkDependencyInclusion flags a missing prerequisite table", () => {
        const errs = DataValidationService.checkDependencyInclusion(TableNames.Accounts, [TableNames.Accounts]);
        expect(errs[0]).toMatchObject({ type: "MISSING_DEPENDENCY" });
    });
    it("passes when all prerequisites are included", () => {
        const errs = DataValidationService.checkDependencyInclusion(TableNames.Accounts, [
            TableNames.AccountCategories,
            TableNames.Accounts,
        ]);
        expect(errs).toEqual([]);
    });
    it("generateDuplicateWarnings produces one warning per id", () => {
        const warnings = DataValidationService.generateDuplicateWarnings(TableNames.Accounts, ["x", "y"]);
        expect(warnings).toHaveLength(2);
        expect(warnings[0].type).toBe("DUPLICATE_SKIPPED");
    });
});
