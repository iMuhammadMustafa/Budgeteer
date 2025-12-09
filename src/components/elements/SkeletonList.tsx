import Skeleton from "@/src/components/elements/Skeleton";
import { FlatList } from "react-native";

export default function SkeletonList({
  length = 5,

  customSkeleton,
}: {
  length?: number;
  customSkeleton?: React.ReactNode;
}) {
  return (
    <FlatList
      data={Array.from({ length })}
      keyExtractor={(_, idx) => `skeleton-${idx}`}
      renderItem={() => (customSkeleton ? <>{customSkeleton}</> : <Skeleton />)}
    />
  );
}
