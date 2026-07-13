import { describe, expect, it, vi } from "vitest";
import { ImportService } from "./Import.Service";

// Import.Service imports native modules at module top-level; stub them so the
// pure parseImportFile is loadable in Node.
vi.mock("expo-document-picker", () => ({}));
vi.mock("expo-file-system", () => ({}));
vi.mock("react-native", () => ({ Platform: { OS: "web" } }));

const validFile = JSON.stringify({
    version: "1.0.0",
    exportConfig: { tables: [] },
    data: { accounts: [] },
});

describe("ImportService.parseImportFile", () => {
    it("parses a well-formed export file", () => {
        const r = ImportService.parseImportFile(validFile);
        expect(r.success).toBe(true);
        expect(r.data?.version).toBe("1.0.0");
    });

    it("rejects invalid JSON", () => {
        const r = ImportService.parseImportFile("{not json");
        expect(r.success).toBe(false);
        expect(r.error).toMatch(/Invalid JSON/);
    });

    it.each([
        ["missing version", JSON.stringify({ data: {}, exportConfig: {} })],
        ["missing data", JSON.stringify({ version: "1.0.0", exportConfig: {} })],
        ["missing exportConfig", JSON.stringify({ version: "1.0.0", data: {} })],
        ["empty object", "{}"],
    ])("rejects a structurally invalid file (%s)", (_label, content) => {
        const r = ImportService.parseImportFile(content);
        expect(r.success).toBe(false);
        expect(r.error).toMatch(/Invalid export file format/);
    });

    it("does not pollute Object.prototype when the file contains a __proto__ key", () => {
        const malicious = '{"version":"1.0.0","exportConfig":{},"data":{},"__proto__":{"polluted":true}}';
        ImportService.parseImportFile(malicious);
        expect(({} as any).polluted).toBeUndefined();
    });

    it("treats an empty string as invalid JSON", () => {
        expect(ImportService.parseImportFile("").success).toBe(false);
    });
});
