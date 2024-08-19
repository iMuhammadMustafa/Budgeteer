import { LucideIcon, PlusIcon, icons } from "lucide-react-native";
import { cssInterop } from "nativewind";

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
  className?: string;
}

const Icon = ({ name, size, color, style, className }: IconProps) => {
  const LucideIcon = icons[name as keyof typeof icons];

  return <LucideIcon color={color} size={size} style={style} />;

  // const IonIcon = <LucideIcon color={color} size={size} />;
  // iconWithClassName(IonIcon);
  // return IonIcon;

};

export function iconWithClassName(icon: LucideIcon) {
  cssInterop(icon, {
    className: {
      target: 'style',
      nativeStyleToProp: {
        color: true,
        opacity: true,
      },
    },
  });
}


iconWithClassName(Icon)
iconWithClassName(PlusIcon)

export default Icon;

export {PlusIcon};