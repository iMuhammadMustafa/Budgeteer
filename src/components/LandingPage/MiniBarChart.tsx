import Svg, { Rect } from "react-native-svg";

const BARS_DATA: [number, number][] = [
    [3, 34], [21, 50], [39, 43], [57, 59],
    [75, 47], [93, 55], [111, 67], [129, 56],
];

export default function MiniBarChart({ primary, accent }: { primary: string; accent: string }) {
    return (
        <Svg width={156} height={78} viewBox="0 0 156 78" fill="none">
            {BARS_DATA.map(([x, h], i) => (
                <Rect
                    key={x}
                    x={x}
                    y={78 - h}
                    width={13}
                    height={h}
                    rx={3.5}
                    fill={i === 3 || i === 6 ? accent : primary}
                    opacity={0.92}
                />
            ))}
        </Svg>
    );
}