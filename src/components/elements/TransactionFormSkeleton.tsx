import Pulse from "@/src/components/elements/Pulse";
import { ScrollView, View } from "react-native";

const S = "#e6e6e6";

function FieldSkeleton({ labelWidth = 60, height = 44 }: { labelWidth?: number; height?: number }) {
  return (
    <View className="mb-4">
      <View style={{ height: 10, width: labelWidth, backgroundColor: S, borderRadius: 5, marginBottom: 8 }} />
      <View style={{ height, backgroundColor: S, borderRadius: 8 }} />
    </View>
  );
}

function RowSkeleton() {
  return (
    <View className="flex-row gap-4 mb-4">
      <View className="flex-1">
        <View style={{ height: 10, width: 60, backgroundColor: S, borderRadius: 5, marginBottom: 8 }} />
        <View style={{ height: 44, backgroundColor: S, borderRadius: 8 }} />
      </View>
      <View className="flex-1">
        <View style={{ height: 10, width: 50, backgroundColor: S, borderRadius: 5, marginBottom: 8 }} />
        <View style={{ height: 44, backgroundColor: S, borderRadius: 8 }} />
      </View>
    </View>
  );
}

/** Skeleton for the AddTransaction page — mirrors the TransactionForm field layout */
export default function TransactionFormSkeleton() {
  return (
    <View className="flex-1">
      {/* Tab bar */}
      <View className="flex-row border-b border-border-default">
        <View className="flex-1 items-center py-3 border-b-2 border-success">
          <View style={{ height: 12, width: 48, backgroundColor: S, borderRadius: 5 }} />
        </View>
        <View className="flex-1 items-center py-3">
          <View style={{ height: 12, width: 60, backgroundColor: S, borderRadius: 5 }} />
        </View>
      </View>

      <ScrollView className="flex-1 py-2 px-4" showsVerticalScrollIndicator={false}>
        <Pulse>
          {/* Name — searchable dropdown */}
          <FieldSkeleton labelWidth={40} height={44} />

          {/* Payee */}
          <FieldSkeleton labelWidth={44} height={44} />

          {/* Date */}
          <FieldSkeleton labelWidth={32} height={44} />

          {/* Amount row — mode icon + amount input + calculator */}
          <View className="flex-row items-end gap-2 mb-4">
            <View style={{ width: 36, height: 36, backgroundColor: S, borderRadius: 18, marginBottom: 4 }} />
            <View className="flex-1">
              <View style={{ height: 10, width: 52, backgroundColor: S, borderRadius: 5, marginBottom: 8 }} />
              <View style={{ height: 44, backgroundColor: S, borderRadius: 8 }} />
            </View>
            <View style={{ width: 40, height: 40, backgroundColor: S, borderRadius: 8, marginBottom: 2 }} />
          </View>

          {/* Currency + Description */}
          <RowSkeleton />

          {/* Category + Type */}
          <RowSkeleton />

          {/* Account */}
          <FieldSkeleton labelWidth={56} height={44} />

          {/* Notes */}
          <FieldSkeleton labelWidth={40} height={80} />

          {/* Submit button */}
          <View style={{ height: 44, backgroundColor: S, borderRadius: 8, marginTop: 8 }} />
        </Pulse>
      </ScrollView>
    </View>
  );
}
