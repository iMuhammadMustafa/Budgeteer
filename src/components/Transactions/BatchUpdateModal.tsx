import { Account, TransactionCategory, TransactionsView } from "@/src/types/database/Tables.Types";
import dayjs from "dayjs";
import { useState } from "react";
import { View } from "react-native";
import Button from "../elements/Button";
import { AccountSelecterDropdown, MyCategoriesDropdown } from "../elements/dropdown/DropdownField";
import MyDateTimePicker from "../elements/MyDateTimePicker";
import MyIcon from "../elements/MyIcon";
import MyModal from "../elements/MyModal";
import ThemedSwitch from "../elements/ThemedSwitch";
import ThemedText from "../elements/ThemedText";

export interface BatchUpdatePayload {
    date?: string;
    accountid?: string;
    categoryid?: string;
    isvoid?: boolean;
}

interface BatchUpdateModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    selectedTransactions: TransactionsView[];
    accounts: Account[];
    categories: TransactionCategory[];
    onUpdate: (updates: BatchUpdatePayload, summary: string) => void;
}

interface UpdateOption {
    key: keyof BatchUpdatePayload;
    label: string;
    enabled: boolean;
}

export default function BatchUpdateModal({
    isOpen,
    setIsOpen,
    selectedTransactions,
    accounts,
    categories,
    onUpdate,
}: BatchUpdateModalProps) {
    // Toggle states for each update option
    const [enableDate, setEnableDate] = useState(false);
    const [enableAccount, setEnableAccount] = useState(false);
    const [enableCategory, setEnableCategory] = useState(false);
    const [enableVoid, setEnableVoid] = useState(false);

    // Values for each update option
    const [newDate, setNewDate] = useState<dayjs.Dayjs | null>(dayjs());
    const [newAccountId, setNewAccountId] = useState<string | null>(null);
    const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
    const [newVoidStatus, setNewVoidStatus] = useState(false);

    const resetForm = () => {
        setEnableDate(false);
        setEnableAccount(false);
        setEnableCategory(false);
        setEnableVoid(false);
        setNewDate(dayjs());
        setNewAccountId(null);
        setNewCategoryId(null);
        setNewVoidStatus(false);
    };

    const handleClose = () => {
        resetForm();
        setIsOpen(false);
    };

    const hasAnyEnabled = enableDate || enableAccount || enableCategory || enableVoid;

    const isValid = () => {
        if (!hasAnyEnabled) return false;
        if (enableDate && !newDate) return false;
        if (enableAccount && !newAccountId) return false;
        if (enableCategory && !newCategoryId) return false;
        return true;
    };

    const buildSummary = (): string => {
        const parts: string[] = [];

        if (enableDate && newDate) {
            parts.push(`Date → ${newDate.format("MMM DD, YYYY")}`);
        }

        if (enableAccount && newAccountId) {
            const account = accounts.find(a => a.id === newAccountId);
            parts.push(`Account → ${account?.name ?? "Unknown"}`);
        }

        if (enableCategory && newCategoryId) {
            const category = categories.find(c => c.id === newCategoryId);
            parts.push(`Category → ${category?.name ?? "Unknown"}`);
        }

        if (enableVoid) {
            parts.push(newVoidStatus ? "Void transactions" : "Unvoid transactions");
        }

        return parts.join("\n");
    };

    const handleApply = () => {
        const updates: BatchUpdatePayload = {};

        if (enableDate && newDate) {
            updates.date = newDate.toISOString();
        }

        if (enableAccount && newAccountId) {
            updates.accountid = newAccountId;
        }

        if (enableCategory && newCategoryId) {
            updates.categoryid = newCategoryId;
        }

        if (enableVoid) {
            updates.isvoid = newVoidStatus;
        }

        const summary = buildSummary();
        onUpdate(updates, summary);
        resetForm();
        setIsOpen(false);
    };

    return (
        <MyModal isOpen={isOpen} setIsOpen={setIsOpen} onClose={handleClose} title="Batch Update">
            <View className="p-4">
                {/* Header info */}
                <View className="bg-card rounded-md p-3 mb-4">
                    <ThemedText variant="label">
                        {selectedTransactions.length} transaction{selectedTransactions.length > 1 ? "s" : ""} selected
                    </ThemedText>
                </View>

                {/* Date Update Option */}
                <UpdateOptionRow
                    label="Update Date"
                    enabled={enableDate}
                    onToggle={setEnableDate}
                >
                    <MyDateTimePicker
                        label=""
                        date={newDate}
                        onChange={dateStr => setNewDate(dateStr ? dayjs(dateStr) : null)}
                        isModal={true}
                    />
                </UpdateOptionRow>

                {/* Account Update Option */}
                <UpdateOptionRow
                    label="Update Account"
                    enabled={enableAccount}
                    onToggle={setEnableAccount}
                >
                    <AccountSelecterDropdown
                        label=""
                        selectedValue={newAccountId}
                        onSelect={item => setNewAccountId(item?.id ?? null)}
                        accounts={accounts}
                        isModal={true}
                        groupBy="category"
                    />
                </UpdateOptionRow>

                {/* Category Update Option */}
                <UpdateOptionRow
                    label="Update Category"
                    enabled={enableCategory}
                    onToggle={setEnableCategory}
                >
                    <MyCategoriesDropdown
                        selectedValue={newCategoryId}
                        categories={categories}
                        onSelect={item => setNewCategoryId(item?.id ?? null)}
                        isModal={true}
                        label=""
                    />
                </UpdateOptionRow>

                {/* Void Update Option */}
                <UpdateOptionRow
                    label="Update Void Status"
                    enabled={enableVoid}
                    onToggle={setEnableVoid}
                >
                    <View className="flex-row items-center justify-between py-2">
                        <ThemedText>{newVoidStatus ? "Void" : "Active"}</ThemedText>
                        <ThemedSwitch
                            value={newVoidStatus}
                            onValueChange={setNewVoidStatus}
                            testID="switch-void-status"
                        />
                    </View>
                </UpdateOptionRow>

                {/* Action Buttons */}
                <View className="flex-row justify-end gap-2 mt-4">
                    <Button variant="outline" onPress={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onPress={handleApply}
                        disabled={!isValid()}
                    >
                        Apply Updates
                    </Button>
                </View>
            </View>
        </MyModal>
    );
}

interface UpdateOptionRowProps {
    label: string;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    children: React.ReactNode;
}

function UpdateOptionRow({ label, enabled, onToggle, children }: UpdateOptionRowProps) {
    return (
        <View className="mb-4 border border-border-default rounded-md overflow-hidden">
            {/* Toggle Header */}
            <Button
                variant="ghost"
                size="md"
                hapticFeedback="selection"
                onPress={() => onToggle(!enabled)}
                className={`flex-row p-3 rounded-none items-center justify-start ${enabled ? "bg-surface-elevated" : "bg-card"}`}
                testID={`btn-toggle-${label.toLowerCase().replace(/\s+/g, "-")}`}
            >
                <View
                    className={`w-5 h-5 rounded border mr-3 items-center justify-center ${enabled ? "bg-primary border-primary" : "border-border-default"
                        }`}
                >
                    {enabled && <MyIcon name="Check" size={14} className="text-white" />}
                </View>
                <ThemedText variant="label">{label}</ThemedText>

            </Button>

            {/* Content - only shown when enabled */}
            {enabled && (
                <View className="p-3 bg-surface">
                    {children}
                </View>
            )}
        </View>
    );
}
