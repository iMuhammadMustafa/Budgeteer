/* eslint-disable import/namespace */
import { LucideIcon, icons } from "lucide-react-native";
import { cssInterop } from "nativewind";

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
  className?: string;
}

const MyIcon = ({ name, size, color, style, className }: IconProps) => {
  const LucideIcon = icons[name as keyof typeof icons];

  if (!LucideIcon) {
    console.warn(`Icon with name "${name}" does not exist in Lucide icons.`);
    return null;
  }

  return <LucideIcon size={size} color={color} style={style} className={className} />;
};

export function iconWithClassName(icon: LucideIcon) {
  cssInterop(icon, {
    className: {
      target: "style",
      nativeStyleToProp: {
        color: true,
        opacity: true,
      },
    },
  });
}

iconWithClassName(MyIcon as any);
export default MyIcon;
