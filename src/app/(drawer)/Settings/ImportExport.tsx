import Button from "@/src/components/elements/Button";
import MyIcon from "@/src/components/elements/MyIcon";
import { ExportModal, ImportModal } from "@/src/components/ImportExport";
import { queryClient } from "@/src/providers/QueryProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function ImportExportScreen() {
    const { storageMode } = useStorageMode();
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    const handleImportComplete = () => {
        queryClient.invalidateQueries();
    };

    return (
        <ScrollView className="flex-1 bg-background">
            <View className="p-4">
                {/* Header */}
                <View className="mb-6">
                    <Text className="text-2xl font-bold text-foreground mb-2">Import / Export</Text>
                    <Text className="text-sm text-muted-foreground">
                        Transfer your data between devices or storage modes, or export for backup and analysis.
                    </Text>
                </View>

                {/* Current Storage Mode */}
                <View className="bg-card rounded-xl p-4 mb-6 border border-muted">
                    <View className="flex-row items-center mb-2">
                        <MyIcon name="Database" size={20} className="text-primary" />
                        <Text className="ml-2 font-medium text-foreground">Current Storage</Text>
                    </View>
                    <View className="flex-row items-center">
                        <View className="bg-primary/10 px-3 py-1 rounded-full">
                            <Text className="text-primary font-medium capitalize">{storageMode || "Not set"}</Text>
                        </View>
                    </View>
                </View>
                <View className="flex-row  items-center justify-center gap-4">
                    {/* Export Section */}
                    <View className="bg-card rounded-xl p-4 mb-4 border border-muted flex-1 h-full">
                        <View className="flex-row items-center mb-3">
                            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
                                <MyIcon name="Upload" size={20} className="text-green-600" />
                            </View>
                            <View className="ml-3 flex-1">
                                <Text className="font-semibold text-foreground">Export Data</Text>
                                <Text className="text-sm text-muted-foreground">
                                    Download your data as JSON or CSV
                                </Text>
                            </View>
                        </View>

                        <View className="bg-muted/30 rounded-lg p-3 mb-4">
                            <View className="flex-row mb-2">
                                <MyIcon name="FileJson2" size={16} className="text-muted-foreground" />
                                <Text className="ml-2 text-sm text-foreground font-medium">JSON Format</Text>
                            </View>
                            <Text className="text-xs text-muted-foreground ml-6">
                                Complete backup including all tables and configuration. Use for migrations between storage modes or device transfers.
                            </Text>
                        </View>

                        <View className="bg-muted/30 rounded-lg p-3 mb-4">
                            <View className="flex-row mb-2">
                                <MyIcon name="FileSpreadsheet" size={16} className="text-muted-foreground" />
                                <Text className="ml-2 text-sm text-foreground font-medium">CSV Format</Text>
                            </View>
                            <Text className="text-xs text-muted-foreground ml-6">
                                Export individual tables or views for analysis in spreadsheet applications.
                            </Text>
                        </View>

                        <Button
                            label="Export Data"
                            onPress={() => setShowExportModal(true)}
                            variant="outline"
                            leftIcon="Download"
                            className="w-full"
                        />
                    </View>

                    {/* Import Section */}
                    <View className="bg-card rounded-xl p-4 mb-4 border border-muted flex-1 h-full">
                        <View className="flex-row items-center mb-3">
                            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                                <MyIcon name="Download" size={20} className="text-blue-600" />
                            </View>
                            <View className="ml-3 flex-1">
                                <Text className="font-semibold text-foreground">Import Data</Text>
                                <Text className="text-sm text-muted-foreground">
                                    Restore data from a JSON export file
                                </Text>
                            </View>
                        </View>

                        <View className="bg-muted/30 rounded-lg p-3 mb-4">
                            <View className="flex-row items-start mb-2">
                                <MyIcon name="Shield" size={16} className="text-muted-foreground mt-0.5" />
                                <View className="ml-2 flex-1">
                                    <Text className="text-sm text-foreground font-medium">Smart Import</Text>
                                    <Text className="text-xs text-muted-foreground mt-1">
                                        The system automatically detects tables, validates dependencies, and skips existing records. No manual configuration required.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View className="bg-amber-50 rounded-lg p-3 mb-4">
                            <View className="flex-row items-start">
                                <MyIcon name="AlertTriangle" size={16} className="text-amber-600 mt-0.5" />
                                <View className="ml-2 flex-1">
                                    <Text className="text-xs text-amber-700">
                                        Only Budgeteer JSON export files are supported. Imports will not overwrite existing data.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <Button
                            label="Import Data"
                            onPress={() => setShowImportModal(true)}
                            variant="primary"
                            leftIcon="Upload"
                            className="w-full"
                        />
                    </View>
                </View>

                {/* Help Section */}
                <View className="bg-card rounded-xl p-4 border border-muted">
                    <View className="flex-row items-center mb-3">
                        <MyIcon name="HelpCircle" size={20} className="text-muted-foreground" />
                        <Text className="ml-2 font-medium text-foreground">Tips</Text>
                    </View>

                    <View className="space-y-2">
                        <View className="flex-row items-start">
                            <Text className="text-primary mr-2">•</Text>
                            <Text className="text-sm text-muted-foreground flex-1">
                                Use JSON export for full backups and migrations
                            </Text>
                        </View>
                        <View className="flex-row items-start">
                            <Text className="text-primary mr-2">•</Text>
                            <Text className="text-sm text-muted-foreground flex-1">
                                Use CSV export to analyze your data in Excel or Google Sheets
                            </Text>
                        </View>
                        <View className="flex-row items-start">
                            <Text className="text-primary mr-2">•</Text>
                            <Text className="text-sm text-muted-foreground flex-1">
                                Exports from local storage can be imported to cloud and vice versa
                            </Text>
                        </View>
                        <View className="flex-row items-start">
                            <Text className="text-primary mr-2">•</Text>
                            <Text className="text-sm text-muted-foreground flex-1">
                                Tables are imported in dependency order automatically
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Modals */}
            <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} />
            <ImportModal
                visible={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportComplete={handleImportComplete}
            />
        </ScrollView>
    );
}
