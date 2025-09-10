import { View } from "react-native";

const Divider = ({ className }: { className?: string | null }) => {
  return <View className={`"bg-gray-300 h-[1px] my-2" ${className ? className : ""}`} />;
};

export default Divider;
