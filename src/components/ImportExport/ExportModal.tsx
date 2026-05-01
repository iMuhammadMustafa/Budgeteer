import Button from "@/src/components/elements/Button";
import MyIcon from "@/src/components/elements/MyIcon";
import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import ExportService from "@/src/services/Export.Service";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";
import { EXPORTABLE_TABLES, EXPORTABLE_VIEWS, ExportFormat } from "@/src/types/ImportExport.Types";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";


export default function ExportModal({ visible, onClose }: {
    visible: boolean;
    onClose: () => void;
}) {
    const { session } = useAuth();
    const { dbContext, storageMode } = useStorageMode();
    const tenantId = session?.user?.user_metadata?.tenantid || "";

    const [selectedTables, setSelectedTables] = useState<Set<TableNames>>(new Set(EXPORTABLE_TABLES));
    const [selectedView, setSelectedView] = useState<ViewNames | null>(null);
    const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
    const [isExporting, setIsExporting] = useState(false);
    const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null);

    const toggleTable = (table: TableNames) => {
        const newSelection = new Set(selectedTables);
        if (newSelection.has(table)) {
            newSelection.delete(table);
        } else {
            newSelection.add(table);
        }
        setSelectedTables(newSelection);
    };

    const selectAllTables = () => {
        setSelectedTables(new Set(EXPORTABLE_TABLES));
        setSelectedView(null);
        setExportFormat("json");
    };

    const deselectAllTables = () => {
        setSelectedTables(new Set());
    };

    const selectView = (view: ViewNames) => {
        setSelectedView(view);
        setSelectedTables(new Set());
        setExportFormat("csv");
    };

    const handleExport = async () => {
        if (!dbContext || !storageMode) return;

        setIsExporting(true);
        setExportResult(null);

        try {
            let content: string;
            let filename: string;

            if (selectedView) {
                content = await ExportService.exportToCSV(
                    { table: selectedView },
                    dbContext,
                    tenantId,
                );
                filename = ExportService.generateFilename("csv", selectedView);
            } else if (exportFormat === "json") {
                const exportData = await ExportService.exportToJSON(
                    Array.from(selectedTables),
                    dbContext,
                    tenantId,
                    storageMode,
                );
                content = JSON.stringify(exportData, null, 2);
                filename = ExportService.generateFilename("json");
            } else {
                // CSV export requires exactly one table
                if (selectedTables.size !== 1) {
                    setExportResult({
                        success: false,
                        message: "Please select exactly one table for CSV export",
                    });
                    setIsExporting(false);
                    return;
                }
                const table = Array.from(selectedTables)[0];
                content = await ExportService.exportToCSV({ table }, dbContext, tenantId);
                filename = ExportService.generateFilename("csv", table);
            }

            const result = await ExportService.downloadFile(
                content,
                filename,
                selectedView ? "csv" : exportFormat,
            );

            if (result.success) {
                setExportResult({
                    success: true,
                    message: "Export completed successfully!",
                });
            } else {
                setExportResult({
                    success: false,
                    message: result.error || "Export failed",
                });
            }
        } catch (error) {
            console.error("Export error:", error);
            setExportResult({
                success: false,
                message: error instanceof Error ? error.message : "Export failed",
            });
        } finally {
            setIsExporting(false);
        }
    };

    const canExport = selectedTables.size > 0 || selectedView !== null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/50 justify-center items-center">
                <Pressable className="absolute inset-0" onPress={onClose} />
                <View className="w-[90%] max-w-[500px] max-h-[80%] bg-surface rounded-lg overflow-hidden">
                    {/* Header */}
                    <View className="flex-row items-center justify-between p-4 border-b border-border-default bg-surface-elevated">
                        <Text className="font-semibold text-lg text-dark">Export Data</Text>
                        <Button
                            variant="ghost"
                            size="icon"
                            onPress={onClose}
                            testID="btn-export-close"
                        >
                            <MyIcon name="X" size={20} className="text-text-secondary" />
                        </Button>
                    </View>

                    <ScrollView className="flex-1 p-4">
                        {/* Export Format Selection (for tables) */}
                        {!selectedView && (
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-foreground mb-2">Export Format</Text>
                                <View className="flex-row gap-2">
                                    <Button
                                        variant={exportFormat === "json" ? "primary" : "ghost"}
                                        size="md"
                                        hapticFeedback="selection"
                                        onPress={() => setExportFormat("json")}
                                        className={`flex-1 p-3 rounded-lg border ${exportFormat === "json" ? "border-primary bg-primary/10" : "border-border-default"}`}
                                        testID="btn-export-json"
                                    >
                                        <View className="flex-row items-center">
                                            <MyIcon name="FileJson2" size={20} className={exportFormat === "json" ? "text-primary" : "text-text-secondary"} />
                                            <View className="ml-2">
                                                <Text className={`font-medium ${exportFormat === "json" ? "text-primary" : "text-foreground"}`}>
                                                    JSON
                                                </Text>
                                                <Text className="text-xs text-text-tertiary">Full backup</Text>
                                            </View>
                                        </View>
                                    </Button>
                                    <Button
                                        variant={exportFormat === "csv" ? "primary" : "ghost"}
                                        size="md"
                                        hapticFeedback="selection"
                                        onPress={() => setExportFormat("csv")}
                                        className={`flex-1 p-3 rounded-lg border ${exportFormat === "csv" ? "border-primary bg-primary/10" : "border-border-default"}`}
                                        testID="btn-export-csv"
                                    >
                                        <View className="flex-row items-center">
                                            <MyIcon name="FileSpreadsheet" size={20} className={exportFormat === "csv" ? "text-primary" : "text-text-secondary"} />
                                            <View className="ml-2">
                                                <Text className={`font-medium ${exportFormat === "csv" ? "text-primary" : "text-foreground"}`}>
                                                    CSV
                                                </Text>
                                                <Text className="text-xs text-text-tertiary">Single table</Text>
                                            </View>
                                        </View>
                                    </Button>
                                </View>
                            </View>
                        )}

                        {/* Tables Selection */}
                        <View className="mb-4">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-sm font-medium text-foreground">Tables</Text>
                                <View className="flex-row gap-2">
                                    <Button variant="ghost" size="sm" onPress={selectAllTables} testID="btn-export-select-all">
                                        <Text className="text-xs text-primary">Select All</Text>
                                    </Button>
                                    <Text className="text-border-default">|</Text>
                                    <Button variant="ghost" size="sm" onPress={deselectAllTables} testID="btn-export-clear">
                                        <Text className="text-xs text-text-secondary">Clear</Text>
                                    </Button>
                                </View>
                            </View>

                            <View className="bg-surface-elevated rounded-lg p-2">
                                {EXPORTABLE_TABLES.map(table => (
                                    <Button
                                        key={table}
                                        variant="ghost"
                                        size="md"
                                        hapticFeedback="selection"
                                        onPress={() => {
                                            setSelectedView(null);
                                            toggleTable(table as TableNames);
                                        }}
                                        className="flex-row items-center justify-between py-2 px-2 rounded-none"
                                        testID={`btn-export-table-${table}`}
                                    >
                                        <View className="flex-row items-center">
                                            <MyIcon
                                                name={getTableIcon(table as TableNames)}
                                                size={16}
                                                className="text-text-secondary mr-2"
                                            />
                                            <Text className="text-sm text-foreground">{formatTableName(table)}</Text>
                                        </View>
                                        <Switch
                                            value={selectedTables.has(table as TableNames) && !selectedView}
                                            onValueChange={() => {
                                                setSelectedView(null);
                                                toggleTable(table as TableNames);
                                            }}
                                            trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                                            thumbColor={selectedTables.has(table as TableNames) ? "#3b82f6" : "#f3f4f6"}
                                        />
                                    </Button>
                                ))}
                            </View>
                        </View>

                        {/* Views Selection (CSV only) */}
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-foreground mb-2">Views (CSV only)</Text>
                            <View className="bg-surface-elevated rounded-lg p-2">
                                {EXPORTABLE_VIEWS.map(view => (
                                    <Button
                                        key={view}
                                        variant="ghost"
                                        size="md"
                                        hapticFeedback="selection"
                                        onPress={() => selectView(view as ViewNames)}
                                        className={`flex-row items-center py-2 px-2 rounded-none justify-start ${selectedView === view ? "bg-primary/10" : ""}`}
                                        testID={`btn-export-view-${view}`}
                                    >
                                        <View
                                            className={`w-4 h-4 rounded-full border mr-2 items-center justify-center ${selectedView === view ? "border-primary bg-primary" : "border-border-default"
                                                }`}
                                        >
                                            {selectedView === view && (
                                                <MyIcon name="Check" size={10} className="text-white" />
                                            )}
                                        </View>
                                        <MyIcon name="Eye" size={16} className="text-text-secondary mr-2" />
                                        <Text className="text-sm text-foreground">{formatViewName(view)}</Text>
                                    </Button>
                                ))}
                            </View>
                        </View>

                        {/* Export Result */}
                        {exportResult && (
                            <View
                                className={`p-3 rounded-lg mb-4 ${exportResult.success ? "bg-green-50" : "bg-red-50"
                                    }`}
                            >
                                <View className="flex-row items-center">
                                    <MyIcon
                                        name={exportResult.success ? "CheckCircle" : "XCircle"}
                                        size={20}
                                        className={exportResult.success ? "text-status-success" : "text-status-danger"}
                                    />
                                    <Text
                                        className={`ml-2 text-sm ${exportResult.success ? "text-status-success" : "text-status-danger"
                                            }`}
                                    >
                                        {exportResult.message}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View className="p-4 border-t border-border-default bg-surface-elevated">
                        <View className="flex-row gap-2">
                            <Button
                                label="Cancel"
                                onPress={onClose}
                                variant="outline"
                                className="flex-1"
                            />
                            <Button
                                label={isExporting ? "Exporting..." : "Export"}
                                onPress={handleExport}
                                variant="primary"
                                className="flex-1"
                                disabled={!canExport || isExporting}
                                leftIcon={isExporting ? undefined : "Download"}
                            >
                                {isExporting && <ActivityIndicator size="small" color="white" />}
                            </Button>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function getTableIcon(table: TableNames): string {
    const icons: Record<TableNames, string> = {
        [TableNames.AccountCategories]: "FolderOpen",
        [TableNames.Accounts]: "Landmark",
        [TableNames.TransactionGroups]: "Layers",
        [TableNames.TransactionCategories]: "Tag",
        [TableNames.Configurations]: "Settings",
        [TableNames.Recurrings]: "Repeat",
        [TableNames.Transactions]: "Receipt",
    };
    return icons[table] || "Database";
}

function formatTableName(table: string): string {
    return table
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

function formatViewName(view: string): string {
    return view
        .replace(/_/g, " ")
        .replace(/^./, str => str.toUpperCase())
        .replace(/stats /i, "Stats: ")
        .replace(/view /i, "");
}
