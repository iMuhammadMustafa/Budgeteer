export enum StorageMode {
  Cloud = "cloud",
  Demo = "demo",
  Local = "local",
}
export const StorageModeConfig = {
  [StorageMode.Cloud]: {
    id: StorageMode.Cloud,
    title: "Cloud Mode",
    description: "Cloud database with sync. Login with Username and Password",
    icon: "☁️",
  },
  [StorageMode.Demo]: {
    id: StorageMode.Demo,
    title: "Demo Mode",
    description: "Try the app with sample data",
    icon: "🎮",
  },
  [StorageMode.Local]: {
    id: StorageMode.Local,
    title: "Local Mode",
    description: "Local device storage",
    icon: "💾",
  },
};
