import { Pulse, SkeletonBlock } from "@/src/components/ui";
import { ScrollView, View } from "react-native";

function FieldSkeleton({ labelWidth = 60, height = 44 }: { labelWidth?: number; height?: number }) {
  return (
    <View className="mb-4">
      <SkeletonBlock width={labelWidth} height={10} radius={5} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="100%" height={height} radius={8} />
    </View>
  );
}

function RowSkeleton() {
  return (
    <View className="flex-row gap-4 mb-4">
      <View className="flex-1">
        <SkeletonBlock width={60} height={10} radius={5} style={{ marginBottom: 8 }} />
        <SkeletonBlock width="100%" height={44} radius={8} />
      </View>
      <View className="flex-1">
        <SkeletonBlock width={50} height={10} radius={5} style={{ marginBottom: 8 }} />
        <SkeletonBlock width="100%" height={44} radius={8} />
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
          <SkeletonBlock width={48} height={12} radius={5} />
        </View>
        <View className="flex-1 items-center py-3">
          <SkeletonBlock width={60} height={12} radius={5} />
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
            <SkeletonBlock width={36} height={36} radius={18} style={{ marginBottom: 4 }} />
            <View className="flex-1">
              <SkeletonBlock width={52} height={10} radius={5} style={{ marginBottom: 8 }} />
              <SkeletonBlock width="100%" height={44} radius={8} />
            </View>
            <SkeletonBlock width={40} height={40} radius={8} style={{ marginBottom: 2 }} />
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
          <SkeletonBlock width="100%" height={44} radius={8} style={{ marginTop: 8 }} />
        </Pulse>
      </ScrollView>
    </View>
  );
}
