const { app, BrowserWindow } = require("electron");
const path = require("path");

// function createWindow() {
//   const win = new BrowserWindow({
//     width: 800,
//     height: 600,
//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false, // Set to true for security
//     },
//   });

//   // Load your Expo build output
//   win.loadFile(path.join(__dirname, "index.html"));
//   // win.loadURL("http://localhost:5500");
//   win.webContents.openDevTools();
// }

// app.whenReady().then(createWindow);

// app.on("window-all-closed", () => {
//   if (process.platform !== "darwin") {
//     app.quit();
//   }
// });

// app.on("activate", () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });

const express = require("express");
let mainWindow;

app.on("ready", () => {
  const server = express();

  // Serve static files from the Expo web build directory
  server.use("/assets", express.static(path.join(__dirname, "./assets")));
  server.use(express.static(path.join(__dirname)));

  server.listen(9020, () => {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      autoHideMenuBar: true,
    });

    mainWindow.loadURL("http://localhost:9020");
    // mainWindow.webContents.openDevTools();
  });
});
