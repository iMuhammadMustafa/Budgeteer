import { LucideIcon, icons } from "lucide-react-native";
import { cssInterop } from "nativewind";

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

const Icon = ({ name, size, color }: IconProps) => {
  const LucideIcon = icons[name as keyof typeof icons];

  return <LucideIcon color={color} size={size} />;
  // const IonIcon = <LucideIcon color={color} size={size} />;

  // return iconWithClassName(IonIcon);
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

export default Icon;