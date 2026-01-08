import Button from "@/src/components/elements/Button";
import MyIcon from "@/src/components/elements/MyIcon";
import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import ImportService from "@/src/services/Import.Service";
import { ExportData, ImportResult, ImportValidationResult } from "@/src/types/ImportExport.Types";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";

type ImportStep = "select" | "validating" | "preview" | "importing" | "complete";

export default function ImportModal({ visible, onClose, onImportComplete }: {
    visible: boolean;
    onClose: () => void;
    onImportComplete?: () => void;
}) {
    const { session } = useAuth();
    const { dbContext } = useStorageMode();
    const tenantId = session?.user?.user_metadata?.tenantid || "";

    const [step, setStep] = useState<ImportStep>("select");
    const [importData, setImportData] = useState<ExportData | null>(null);
    const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const resetState = () => {
        setStep("select");
        setImportData(null);
        setValidationResult(null);
        setImportResult(null);
        setError(null);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleSelectFile = async () => {
        setError(null);

        const pickResult = await ImportService.pickImportFile();
        if (!pickResult.success || !pickResult.content) {
            if (pickResult.error && pickResult.error !== "No file selected") {
                setError(pickResult.error);
            }
            return;
        }

        const parseResult = ImportService.parseImportFile(pickResult.content);
        if (!parseResult.success || !parseResult.data) {
            setError(parseResult.error || "Failed to parse import file");
            return;
        }

        setImportData(parseResult.data);
        setStep("validating");

        // Validate the import data
        if (!dbContext) {
            setError("Database context not available");
            setStep("select");
            return;
        }

        try {
            const validation = await ImportService.validateImportData(
                parseResult.data,
                dbContext,
                tenantId,
            );
            setValidationResult(validation);
            setStep("preview");
        } catch (err) {
            console.error("Validation error:", err);
            setError(err instanceof Error ? err.message : "Validation failed");
            setStep("select");
        }
    };

    const handleImport = async () => {
        if (!importData || !dbContext || !validationResult) return;

        setStep("importing");
        setError(null);

        try {
            const result = await ImportService.executeImport(importData, dbContext, tenantId);
            setImportResult(result);
            setStep("complete");

            if (result.success && onImportComplete) {
                onImportComplete();
            }
        } catch (err) {
            console.error("Import error:", err);
            setError(err instanceof Error ? err.message : "Import failed");
            setStep("preview");
        }
    };

    const renderContent = () => {
        switch (step) {
            case "select":
                return renderSelectStep();
            case "validating":
                return renderValidatingStep();
            case "preview":
                return renderPreviewStep();
            case "importing":
                return renderImportingStep();
            case "complete":
                return renderCompleteStep();
        }
    };

    const renderSelectStep = () => (
        <View className="p-6 items-center">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
                <MyIcon name="Upload" size={40} className="text-primary" />
            </View>
            <Text className="text-lg font-semibold text-center mb-2">Import Data</Text>
            <Text className="text-sm text-gray-500 text-center mb-6">
                Select a Budgeteer export file (.json) to import your data, settings, and configurations.
            </Text>

            {error && (
                <View className="bg-red-50 p-3 rounded-lg mb-4 w-full">
                    <View className="flex-row items-center">
                        <MyIcon name="AlertCircle" size={18} className="text-red-600" />
                        <Text className="ml-2 text-sm text-red-700 flex-1">{error}</Text>
                    </View>
                </View>
            )}

            <Button
                label="Select File"
                onPress={handleSelectFile}
                variant="primary"
                leftIcon="FolderOpen"
                className="w-full"
            />

            <View className="mt-6 p-3 bg-amber-50 rounded-lg w-full">
                <View className="flex-row items-start">
                    <MyIcon name="Info" size={18} className="text-amber-600 mt-0.5" />
                    <View className="ml-2 flex-1">
                        <Text className="text-sm font-medium text-amber-700">Important</Text>
                        <Text className="text-xs text-amber-600 mt-1">
                            • Only JSON export files are supported{"\n"}
                            • Duplicate records will be skipped{"\n"}
                            • The system will validate all data before importing
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderValidatingStep = () => (
        <View className="p-6 items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-4 text-gray-600">Validating import data...</Text>
        </View>
    );

    const renderPreviewStep = () => {
        if (!validationResult || !importData) return null;

        const hasErrors = validationResult.errors.length > 0;
        const hasWarnings = validationResult.warnings.length > 0;

        return (
            <View className="flex-1">
                <ScrollView className="flex-1 p-4">
                    {/* Summary */}
                    <View className="bg-gray-50 p-4 rounded-lg mb-4">
                        <Text className="font-medium text-gray-700 mb-2">Import Summary</Text>
                        <View className="flex-row flex-wrap gap-2">
                            <View className="bg-white p-2 rounded border border-gray-200 flex-1 min-w-[100px]">
                                <Text className="text-xs text-gray-500">Source</Text>
                                <Text className="text-sm font-medium">{importData.sourceStorageMode}</Text>
                            </View>
                            <View className="bg-white p-2 rounded border border-gray-200 flex-1 min-w-[100px]">
                                <Text className="text-xs text-gray-500">Exported</Text>
                                <Text className="text-sm font-medium">
                                    {new Date(importData.exportDate).toLocaleDateString()}
                                </Text>
                            </View>
                            <View className="bg-white p-2 rounded border border-gray-200 flex-1 min-w-[100px]">
                                <Text className="text-xs text-gray-500">Version</Text>
                                <Text className="text-sm font-medium">{importData.version}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Tables to Import */}
                    <View className="mb-4">
                        <Text className="font-medium text-gray-700 mb-2">Tables to Import</Text>
                        <View className="bg-gray-50 rounded-lg overflow-hidden">
                            {validationResult.summary.tablesFound.map(table => {
                                const total = validationResult.summary.recordCounts[table] || 0;
                                const toImport = validationResult.summary.recordsToImport[table] || 0;
                                const skipped = validationResult.summary.duplicatesSkipped[table] || 0;

                                return (
                                    <View
                                        key={table}
                                        className="flex-row items-center justify-between p-3 border-b border-gray-100"
                                    >
                                        <View className="flex-row items-center">
                                            <MyIcon name="Database" size={16} className="text-gray-500 mr-2" />
                                            <Text className="text-sm text-gray-700">{formatTableName(table)}</Text>
                                        </View>
                                        <View className="flex-row items-center gap-2">
                                            {skipped > 0 && (
                                                <View className="bg-amber-100 px-2 py-0.5 rounded">
                                                    <Text className="text-xs text-amber-700">{skipped} skipped</Text>
                                                </View>
                                            )}
                                            <View className="bg-green-100 px-2 py-0.5 rounded">
                                                <Text className="text-xs text-green-700">{toImport} new</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Errors */}
                    {hasErrors && (
                        <View className="mb-4">
                            <View className="flex-row items-center mb-2">
                                <MyIcon name="XCircle" size={18} className="text-red-600" />
                                <Text className="font-medium text-red-700 ml-1">
                                    Errors ({validationResult.errors.length})
                                </Text>
                            </View>
                            <View className="bg-red-50 rounded-lg p-3">
                                {validationResult.errors.slice(0, 5).map((error, index) => (
                                    <Text key={index} className="text-sm text-red-700 mb-1">
                                        • {error.message}
                                    </Text>
                                ))}
                                {validationResult.errors.length > 5 && (
                                    <Text className="text-sm text-red-600 mt-1">
                                        ... and {validationResult.errors.length - 5} more errors
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Warnings */}
                    {hasWarnings && !hasErrors && (
                        <View className="mb-4">
                            <View className="flex-row items-center mb-2">
                                <MyIcon name="AlertTriangle" size={18} className="text-amber-600" />
                                <Text className="font-medium text-amber-700 ml-1">
                                    Warnings ({validationResult.warnings.length})
                                </Text>
                            </View>
                            <View className="bg-amber-50 rounded-lg p-3">
                                {validationResult.warnings.slice(0, 3).map((warning, index) => (
                                    <Text key={index} className="text-sm text-amber-700 mb-1">
                                        • {warning.message}
                                    </Text>
                                ))}
                                {validationResult.warnings.length > 3 && (
                                    <Text className="text-sm text-amber-600 mt-1">
                                        ... and {validationResult.warnings.length - 3} more warnings
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Valid Status */}
                    {!hasErrors && (
                        <View className="bg-green-50 p-3 rounded-lg">
                            <View className="flex-row items-center">
                                <MyIcon name="CheckCircle" size={20} className="text-green-600" />
                                <Text className="ml-2 text-sm text-green-700 font-medium">
                                    Data validation passed. Ready to import.
                                </Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Actions */}
                <View className="p-4 border-t border-gray-200 bg-gray-50">
                    <View className="flex-row gap-2">
                        <Button
                            label="Cancel"
                            onPress={handleClose}
                            variant="outline"
                            className="flex-1"
                        />
                        <Button
                            label="Import Data"
                            onPress={handleImport}
                            variant="primary"
                            className="flex-1"
                            disabled={hasErrors}
                            leftIcon="Download"
                        />
                    </View>
                </View>
            </View>
        );
    };

    const renderImportingStep = () => (
        <View className="p-6 items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-4 text-gray-600">Importing data...</Text>
            <Text className="mt-2 text-xs text-gray-400">This may take a moment</Text>
        </View>
    );

    const renderCompleteStep = () => {
        if (!importResult) return null;

        const totalImported = Object.values(importResult.importedCounts).reduce(
            (sum, count) => sum + (count || 0),
            0,
        );
        const totalSkipped = Object.values(importResult.skippedCounts).reduce(
            (sum, count) => sum + (count || 0),
            0,
        );

        return (
            <View className="p-6 items-center">
                <View
                    className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${importResult.success ? "bg-green-100" : "bg-red-100"
                        }`}
                >
                    <MyIcon
                        name={importResult.success ? "CheckCircle" : "XCircle"}
                        size={40}
                        className={importResult.success ? "text-green-600" : "text-red-600"}
                    />
                </View>

                <Text className="text-lg font-semibold text-center mb-2">
                    {importResult.success ? "Import Complete!" : "Import Failed"}
                </Text>

                <View className="flex-row gap-4 mb-4">
                    <View className="items-center">
                        <Text className="text-2xl font-bold text-green-600">{totalImported}</Text>
                        <Text className="text-xs text-gray-500">Imported</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-2xl font-bold text-amber-600">{totalSkipped}</Text>
                        <Text className="text-xs text-gray-500">Skipped</Text>
                    </View>
                </View>

                {importResult.errors.length > 0 && (
                    <View className="bg-red-50 p-3 rounded-lg w-full mb-4">
                        <Text className="text-sm text-red-700">
                            {importResult.errors.length} error(s) occurred during import
                        </Text>
                    </View>
                )}

                <Text className="text-xs text-gray-400 mb-4">
                    Completed in {(importResult.durationMs / 1000).toFixed(2)}s
                </Text>

                <Button
                    label="Done"
                    onPress={handleClose}
                    variant="primary"
                    className="w-full"
                />
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View className="flex-1 bg-black/50 justify-center items-center">
                <Pressable className="absolute inset-0" onPress={handleClose} />
                <View className="w-[90%] max-w-[500px] max-h-[80%] bg-white rounded-lg overflow-hidden">
                    {/* Header */}
                    <View className="flex-row items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                        <Text className="font-semibold text-lg text-dark">
                            {step === "select" && "Import Data"}
                            {step === "validating" && "Validating..."}
                            {step === "preview" && "Review Import"}
                            {step === "importing" && "Importing..."}
                            {step === "complete" && "Import Complete"}
                        </Text>
                        <Pressable onPress={handleClose} className="p-1">
                            <MyIcon name="X" size={20} className="text-gray-500" />
                        </Pressable>
                    </View>

                    {renderContent()}
                </View>
            </View>
        </Modal>
    );
}

function formatTableName(table: string): string {
    return table
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, str => str.toUpperCase())
        .trim();
}
