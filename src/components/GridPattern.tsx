import GridBackground from "@/src/components/ui/GridBackground";

/** @deprecated Legacy wrapper — delegates to the design-system GridBackground. */
export default function GridPattern(props: { width?: number; height?: number; isDark?: boolean } = {}) {
  return <GridBackground width={props.width} height={props.height} />;
}
