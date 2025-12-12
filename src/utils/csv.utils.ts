import { CSVRecord, ParsedCSVData } from "../types/ImportExport.types";

/**
 * CSV Utility Service
 * Handles parsing and generating CSV files with proper escaping and data type handling
 */

/**
 * Escape a value for CSV format
 * - Wraps in quotes if contains comma, newline, or quote
 * - Doubles any quotes within the value
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // Check if value needs escaping (contains comma, newline, or quote)
  if (
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes('"') ||
    stringValue.includes("\r")
  ) {
    // Double any quotes and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Unescape a CSV value
 * - Removes surrounding quotes if present
 * - Converts doubled quotes back to single quotes
 */
function unescapeCSVValue(value: string): string {
  if (!value) {
    return "";
  }

  // Remove surrounding quotes if present
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
    // Convert doubled quotes back to single quotes
    value = value.replace(/""/g, '"');
  }

  return value;
}

/**
 * Generate CSV content from records
 */
export function generateCSV(records: Record<string, any>[], headers?: string[]): string {
  if (records.length === 0) {
    return "";
  }

  // Determine headers from first record if not provided
  const csvHeaders = headers || Object.keys(records[0]);

  // Generate header row
  const headerRow = csvHeaders.map(escapeCSVValue).join(",");

  // Generate data rows
  const dataRows = records.map(record => {
    return csvHeaders
      .map(header => {
        const value = record[header];
        return escapeCSVValue(value);
      })
      .join(",");
  });

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Parse CSV content into records
 */
export function parseCSV(csvContent: string): ParsedCSVData {
  if (!csvContent || csvContent.trim() === "") {
    return { headers: [], records: [] };
  }

  const lines = splitCSVLines(csvContent);

  if (lines.length === 0) {
    return { headers: [], records: [] };
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const records: CSVRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    // Skip empty lines
    if (values.length === 0 || (values.length === 1 && values[0] === "")) {
      continue;
    }

    const record: CSVRecord = {};
    headers.forEach((header, index) => {
      const value = values[index] || null;
      record[header] = value === "" ? null : value;
    });

    records.push(record);
  }

  return { headers, records };
}

/**
 * Split CSV content into lines, handling quoted newlines
 */
function splitCSVLines(csvContent: string): string[] {
  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      // Check for escaped quote
      if (nextChar === '"') {
        currentLine += '""';
        i++; // Skip next quote
      } else {
        insideQuotes = !insideQuotes;
        currentLine += char;
      }
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      // End of line (not inside quotes)
      if (currentLine.trim() !== "") {
        lines.push(currentLine);
      }
      currentLine = "";

      // Handle \r\n line endings
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
    } else {
      currentLine += char;
    }
  }

  // Add last line if not empty
  if (currentLine.trim() !== "") {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Parse a single CSV line into values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentValue += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      // End of value
      values.push(unescapeCSVValue(currentValue));
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  // Add last value
  values.push(unescapeCSVValue(currentValue));

  return values;
}

/**
 * Convert a value to CSV-safe format based on data type
 */
export function formatValueForCSV(value: any, isDateField: boolean = false): string {
  if (value === null || value === undefined) {
    return "";
  }

  // Handle dates
  if (isDateField || value instanceof Date) {
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString();
  }

  // Handle booleans
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  // Handle objects/arrays (stringify as JSON)
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Parse a CSV value based on expected data type
 */
export function parseValueFromCSV(
  value: string | null,
  isDateField: boolean = false,
): string | number | boolean | null | Date {
  if (value === null || value === "") {
    return null;
  }

  // Handle dates
  if (isDateField) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  // Try to parse as number
  if (!isNaN(Number(value)) && value.trim() !== "") {
    return Number(value);
  }

  // Handle booleans
  if (value.toLowerCase() === "true") {
    return true;
  }
  if (value.toLowerCase() === "false") {
    return false;
  }

  // Try to parse as JSON (for objects/arrays)
  if ((value.startsWith("{") && value.endsWith("}")) || (value.startsWith("[") && value.endsWith("]"))) {
    try {
      return JSON.parse(value);
    } catch {
      // If JSON parse fails, return as string
      return value;
    }
  }

  return value;
}

/**
 * Validate CSV structure
 */
export function validateCSVStructure(csvContent: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!csvContent || csvContent.trim() === "") {
    errors.push("CSV content is empty");
    return { isValid: false, errors };
  }

  try {
    const { headers, records } = parseCSV(csvContent);

    if (headers.length === 0) {
      errors.push("CSV has no headers");
    }

    if (records.length === 0) {
      errors.push("CSV has no data rows");
    }

    // Check for consistent column count
    const expectedColumnCount = headers.length;
    records.forEach((record, index) => {
      const columnCount = Object.keys(record).length;
      if (columnCount !== expectedColumnCount) {
        errors.push(`Row ${index + 2} has ${columnCount} columns, expected ${expectedColumnCount}`);
      }
    });
  } catch (error) {
    errors.push(`CSV parsing error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
