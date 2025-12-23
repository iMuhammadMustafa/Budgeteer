import AlertDialog from "@/src/components/elements/AlertDialog";
import Button from "@/src/components/elements/Button";
import ConfirmDialog from "@/src/components/elements/ConfirmDialog";
import { useDialog } from "@/src/components/hooks/useDialog";
import { getExportableModels } from "@/src/config/ImportExport.config";
import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { ExportService } from "@/src/services/import-export/ExportService";
import { ImportService } from "@/src/services/import-export/ImportService";
import { TableNames } from "@/src/types/database/TableNames";
import { ExportProgress, ExportResult, ImportFile, ImportProgress, ImportResult } from "@/src/types/ImportExport.types";
import { getDocumentDirectory, readAsStringAsync, writeAsStringAsync } from "@/src/utils/fileSystem.utils";
import { createAndDownloadZip, downloadFile, isZipSupported } from "@/src/utils/zip.utils";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { useCallback, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, Text, View } from "react-native";

/**
 * Import/Export Section Component
 * Provides UI for exporting and importing database data with model selection
 */
export default function ImportExportSection() {
  const { session } = useAuth();
  const { storageMode, dbContext, isLoading } = useStorageMode();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [lastResult, setLastResult] = useState<{ type: "export" | "import"; data: any } | null>(null);

  const { alertState, confirmState, showAlert, showConfirm, closeAlert, closeConfirm } = useDialog();

  const availableModels = getExportableModels();
  const [selectedModels, setSelectedModels] = useState<Set<TableNames>>(new Set(availableModels.map(m => m.tableName)));

  const tenantid = session?.user.user_metadata?.tenantid;
  console.log(session);

  const toggleModel = (tableName: TableNames) => {
    setSelectedModels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableName)) {
        newSet.delete(tableName);
      } else {
        newSet.add(tableName);
      }
      return newSet;
    });
  };

  const saveFile = useCallback(
    async (content: string, fileName: string, mimeType: string) => {
      if (Platform.OS === "web") {
        downloadFile(content, fileName, mimeType);
      } else {
        const docDir = getDocumentDirectory();
        const fileUri = `${docDir}${fileName}`;
        await writeAsStringAsync(fileUri, content);

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType,
            dialogTitle: "Export Database",
            UTI: mimeType === "application/json" ? "public.json" : "public.data",
          });
        } else {
          showAlert("Export Complete", `File saved to: ${fileUri}`);
        }
      }
    },
    [showAlert],
  );

  const handleExport = useCallback(
    async (format: "json" | "csv") => {
      if (!storageMode || !dbContext || isLoading || !tenantid) {
        showAlert("Error", "Database not ready. Please wait and try again.");
        return;
      }

      try {
        setIsExporting(true);
        setExportProgress(null);
        setLastResult(null);

        const exportService = new ExportService(storageMode, dbContext, tenantid);

        const tablesToExport = selectedModels.size === availableModels.length ? undefined : Array.from(selectedModels);

        const result: ExportResult = await exportService.export(
          tenantid!,
          tablesToExport,
          { includeViews: true },
          (progress: ExportProgress) => {
            setExportProgress(progress);
          },
        );

        if (!result.success) {
          showAlert("Export Failed", `Export completed with errors:\n${result.errors.join("\n")}`);
          setLastResult({ type: "export", data: result });
          return;
        }

        if (format === "json") {
          const exportData = {
            timestamp: result.timestamp,
            recordCount: result.recordCount,
            files: result.files,
          };

          const jsonContent = JSON.stringify(exportData, null, 2);
          const fileName = `budgeteer_backup_${new Date().toISOString().split("T")[0]}.json`;

          const recordCount = Object.values(result.recordCount).reduce((acc, val) => acc + (val || 0), 0);

          await saveFile(jsonContent, fileName, "application/json");
          showAlert("Success", `Successfully exported ${recordCount} records`);
        } else {
          // Handle CSV export
          const csvFiles = result.files.map(file => ({
            name: file.fileName,
            content: file.content,
          }));

          if (Platform.OS === "web" && isZipSupported() && csvFiles.length > 1) {
            const zipFileName = `budgeteer_csv_export_${new Date().toISOString().split("T")[0]}.zip`;
            await createAndDownloadZip(csvFiles, zipFileName);
            showAlert("Success", `Successfully exported ${csvFiles.length} CSV files in a ZIP archive`);
          } else if (Platform.OS === "web" && csvFiles.length === 1) {
            downloadFile(csvFiles[0].content, csvFiles[0].name, "text/csv");
            showAlert("Success", "Successfully exported CSV file");
          } else {
            const docDir = getDocumentDirectory();

            for (const csvFile of csvFiles) {
              const fileUri = `${docDir}${csvFile.name}`;
              await writeAsStringAsync(fileUri, csvFile.content);
            }

            const canShare = await Sharing.isAvailableAsync();
            if (canShare && csvFiles.length > 0) {
              const firstFileUri = `${docDir}${csvFiles[0].name}`;
              await Sharing.shareAsync(firstFileUri, {
                mimeType: "text/csv",
                dialogTitle: "Export CSV Files",
              });
            }
            showAlert("Success", `Successfully exported ${csvFiles.length} CSV file(s)`);
          }
        }

        setLastResult({ type: "export", data: result });
      } catch (error) {
        console.error("Export error:", error);
        showAlert("Export Failed", error instanceof Error ? error.message : "Unknown error occurred");
      } finally {
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [storageMode, dbContext, isLoading, tenantid, selectedModels, availableModels, showAlert, saveFile],
  );

  const handleImport = useCallback(async () => {
    if (!storageMode || !dbContext || isLoading || !tenantid) {
      showAlert("Error", "Database not ready. Please wait and try again.");
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: Platform.OS === "web" ? "application/json" : ["application/json", "text/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file.uri) {
        showAlert("Error", "No file selected");
        return;
      }

      setIsImporting(true);
      setImportProgress(null);
      setLastResult(null);

      let fileContent: string;
      if (Platform.OS === "web") {
        const response = await fetch(file.uri);
        fileContent = await response.text();
      } else {
        fileContent = await readAsStringAsync(file.uri);
      }

      const exportData = JSON.parse(fileContent);
      if (!exportData.files || !Array.isArray(exportData.files)) {
        showAlert("Error", "Invalid export file format");
        setIsImporting(false);
        return;
      }

      const importFiles: ImportFile[] = exportData.files.map((file: any) => ({
        name: file.fileName,
        content: file.content,
        size: file.content.length,
      }));

      // Determine if importing all or selected models
      const filterByModels = selectedModels.size === availableModels.length ? undefined : Array.from(selectedModels);

      showConfirm(
        "Confirm Import",
        `This will import ${importFiles.length} file(s) with approximately ${exportData.recordCount?.total || "unknown"} records. Duplicates will be skipped.\n\nContinue?`,
        async () => {
          try {
            const importService = new ImportService(storageMode, dbContext, tenantid);

            const importResult: ImportResult = await importService.import(
              importFiles,
              tenantid!,
              filterByModels,
              {
                skipDuplicates: true,
                continueOnError: true,
              },
              (progress: ImportProgress) => {
                setImportProgress(progress);
              },
            );

            setLastResult({ type: "import", data: importResult });

            if (!importResult.success && importResult.errors.length > 0) {
              showAlert(
                "Import Completed with Errors",
                `Imported: ${importResult.summary.importedRecords}\nSkipped: ${importResult.summary.skippedRecords}\nFailed: ${importResult.summary.failedRecords}\n\nErrors:\n${importResult.errors
                  .slice(0, 5)
                  .map(e => e.message)
                  .join("\n")}${importResult.errors.length > 5 ? "\n..." : ""}`,
              );
            } else {
              showAlert(
                "Import Successful",
                `Imported: ${importResult.summary.importedRecords} records\nSkipped: ${importResult.summary.skippedRecords} duplicates`,
              );
            }
          } catch (error) {
            console.error("Import error:", error);
            showAlert("Import Failed", error instanceof Error ? error.message : "Unknown error occurred");
          } finally {
            setIsImporting(false);
            setImportProgress(null);
          }
        },
        {
          confirmText: "Import",
          confirmVariant: "primary",
        },
      );
    } catch (error) {
      console.error("File selection error:", error);
      showAlert("Error", error instanceof Error ? error.message : "Failed to read file");
      setIsImporting(false);
      setImportProgress(null);
    }
  }, [storageMode, dbContext, tenantid, isLoading, selectedModels, availableModels, showAlert, showConfirm]);

  const renderProgress = (progress: ExportProgress | ImportProgress, type: "export" | "import") => {
    if (!progress) return null;

    const percentage =
      progress.currentModelTotal > 0
        ? Math.round((progress.currentModelProgress / progress.currentModelTotal) * 100)
        : 0;

    return (
      <View className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-medium text-blue-900">{progress.phase}</Text>
          <Text className="text-sm text-blue-700">{percentage}%</Text>
        </View>
        <Text className="text-sm text-blue-800 mb-2">{progress.currentModel}</Text>
        <View className="h-2 bg-blue-200 rounded-full overflow-hidden">
          <View className="h-full bg-blue-600 rounded-full" style={{ width: `${percentage}%` }} />
        </View>
        <Text className="text-xs text-blue-600 mt-2">
          {progress.currentModelProgress} / {progress.currentModelTotal} records
        </Text>
      </View>
    );
  };

  const renderLastResult = () => {
    if (!lastResult) return null;

    const { type, data } = lastResult;

    if (type === "export") {
      const result = data as ExportResult;
      return (
        <View className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <Text className="text-sm font-semibold text-green-900 mb-2">Last Export</Text>
          <Text className="text-xs text-green-800">Total Records: {result.recordCount.total || 0}</Text>
          <Text className="text-xs text-green-700 mt-1">Files: {result.files.length}</Text>
          {result.errors.length > 0 && (
            <Text className="text-xs text-red-600 mt-2">Errors: {result.errors.length}</Text>
          )}
        </View>
      );
    } else {
      const result = data as ImportResult;
      return (
        <View className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <Text className="text-sm font-semibold text-green-900 mb-2">Last Import</Text>
          <Text className="text-xs text-green-800">Imported: {result.summary.importedRecords}</Text>
          <Text className="text-xs text-green-700">Skipped: {result.summary.skippedRecords}</Text>
          <Text className="text-xs text-green-700">Failed: {result.summary.failedRecords}</Text>
          {result.warnings.length > 0 && (
            <Text className="text-xs text-yellow-600 mt-2">Warnings: {result.warnings.length}</Text>
          )}
        </View>
      );
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <ActivityIndicator size="large" />
        <Text className="mt-2 text-muted-foreground">Loading database...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background p-4 px-6">
      <View className="mb-2">
        <Text className="text-2xl font-bold text-foreground mb-2">Import/Export Database</Text>
        <Text className="text-sm text-muted-foreground">
          Export your data to backup or import from a previous export. Choose to export all data or select specific
          models.
        </Text>
      </View>
      {/* Last Result */}
      {renderLastResult()}

      {/* Warning */}
      <View className="my-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <Text className="text-sm font-medium text-yellow-900 mb-1">⚠️ Important Notes</Text>
        <Text className="text-xs text-yellow-800">
          • JSON exports contain all your data for backup/restore{"\n"}• CSV exports are for viewing only (cannot be
          imported){"\n"}• Keep export files secure and private{"\n"}• Import will skip existing records to avoid
          duplicates{"\n"}• Large datasets may take a few moments to process
        </Text>
      </View>

      <View className="flex-1 flex-row gap-4">
        {/* Model Selection Section */}
        <View className="flex-1 mb-6 p-4 border border-border rounded-lg bg-card">
          <Text className="text-lg font-semibold text-foreground">Select Models</Text>
          <View className="flex-row gap-2 mb-4">
            <Button
              label="Select All"
              onPress={() => setSelectedModels(new Set(availableModels.map(m => m.tableName)))}
              variant="outline"
              size="sm"
            />
            <Button label="Deselect All" onPress={() => setSelectedModels(new Set())} variant="outline" size="sm" />
          </View>

          <View className="gap-2 ">
            {availableModels.map(model => (
              <Button
                key={model.tableName}
                label={model.displayName}
                onPress={() => toggleModel(model.tableName)}
                variant={selectedModels.has(model.tableName) ? "primary" : "secondary"}
                size="sm"
              />
            ))}
          </View>
        </View>

        {/* Export Section */}
        <View className="flex-1 mb-6 p-4 border border-border rounded-lg bg-card">
          <Text className="text-lg font-semibold text-foreground mb-2">Export Data</Text>
          <Text className="text-sm text-muted-foreground mb-4">
            Export as JSON (for backup/import) or CSV (for viewing in spreadsheet apps).
          </Text>

          <View className="gap-2">
            <Button
              label={isExporting ? "Exporting..." : "Export as JSON Backup"}
              leftIcon={isExporting ? undefined : "Download"}
              onPress={() => handleExport("json")}
              disabled={isExporting || isImporting}
              loading={isExporting}
              variant="primary"
              size="md"
            />

            <Button
              label={isExporting ? "Exporting..." : "Export as CSV"}
              leftIcon={isExporting ? undefined : "FileText"}
              onPress={() => handleExport("csv")}
              disabled={isExporting || isImporting}
              loading={isExporting}
              variant="outline"
              size="md"
            />
          </View>

          {isExporting && exportProgress && renderProgress(exportProgress, "export")}
        </View>

        {/* Import Section */}
        <View className="flex-1  mb-6 p-4 border border-border rounded-lg bg-card">
          <Text className="text-lg font-semibold text-foreground mb-2">Import Data</Text>
          <Text className="text-sm text-muted-foreground mb-4">
            Import data from a previous JSON export. Duplicate records will be skipped automatically.
          </Text>

          <View className="gap-2">
            <Button
              label={isImporting ? "Importing..." : "Import Data"}
              leftIcon={isImporting ? undefined : "Upload"}
              onPress={handleImport}
              disabled={isExporting || isImporting}
              loading={isImporting}
              variant="primary"
              size="md"
            />
          </View>

          {isImporting && importProgress && renderProgress(importProgress, "import")}
        </View>
      </View>

      {/* Dialogs */}
      <AlertDialog
        isOpen={alertState.isOpen}
        setIsOpen={closeAlert}
        title={alertState.title}
        message={alertState.message}
        onConfirm={alertState.onConfirm}
        confirmText={alertState.confirmText}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        setIsOpen={closeConfirm}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm || (() => {})}
        onCancel={confirmState.onCancel}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        confirmVariant={confirmState.confirmVariant}
      />
    </ScrollView>
  );
}
