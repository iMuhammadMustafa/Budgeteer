import { Platform } from "react-native";

export function makeShadow(opacity: number, radius: number, offsetY = 4, color = "#000") {
    return {
        shadowColor: color,
        shadowOffset: { width: 0, height: offsetY },
        shadowOpacity: opacity,
        shadowRadius: radius,
        elevation: Math.round(radius / 3),
        ...Platform.select({
            web: {
                boxShadow: `0 ${offsetY}px ${radius * 2}px rgba(0,0,0,${opacity})`,
            },
        }),
    } as any;
}