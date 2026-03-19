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
    icon: "☁️",
    accent: "#5b9fff",
  },
  [StorageMode.Demo]: {
    id: StorageMode.Demo,
    title: "Demo Mode",
    description: "Explore with pre-filled sample data.",
    icon: "🎮",
    accent: "#c97fff",
  },
  [StorageMode.Local]: {
    id: StorageMode.Local,
    title: "Local Mode",
    description: "Everything stays private on this device — no account needed.",
    icon: "📱",
    accent: "#5ddc9a",
  },
};