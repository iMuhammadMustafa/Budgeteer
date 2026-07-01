export enum StorageMode {
  Cloud = "cloud",
  Demo = "demo",
  Local = "local",
}
export const StorageModeConfig = {
  [StorageMode.Cloud]: {
    id: StorageMode.Cloud,
    title: "Cloud Mode",
    description: "Sync across all your devices.",
    sub: "All devices synced",
    icon: "☁️",
    iconName: "Cloud",
    accent: "#5b9fff",
  },
  [StorageMode.Demo]: {
    id: StorageMode.Demo,
    title: "Demo Mode",
    description: "Explore with pre-filled sample data.",
    sub: "Sample data",
    icon: "🎮",
    iconName: "Gamepad2",
    accent: "#c97fff",
  },
  [StorageMode.Local]: {
    id: StorageMode.Local,
    title: "Local Mode",
    description: "Everything stays private on this device — no account needed.",
    sub: "Private on this device",
    icon: "📱",
    iconName: "Smartphone",
    accent: "#5ddc9a",
  },
};
