const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs-extra");

async function buildWindows() {
  const electronSourceDir = path.resolve(__dirname, "./");
  const electronTargetDir = path.resolve(__dirname, "../dist");
  const oldDistDir = path.resolve(__dirname, "../old_dist");

  try {
    // Step 0.1: Move existing `dist` to `old_dist`
    if (fs.existsSync(electronTargetDir)) {
      console.log("Moving existing `dist` to `old_dist`...");
      fs.moveSync(electronTargetDir, oldDistDir, { overwrite: true });
    }

    // Step 1: Run Expo Web Export
    console.log("Building web app...");
    execSync("bunx expo export -p web", { stdio: "inherit" });

    // Step 2: Copy Electron files to `dist`
    console.log("Copying Electron files...");
    const filesToCopy = ["electron-builder.json", "electron-webpack.js", "forge.config.js", "index.js", "package.json"];

    filesToCopy.forEach(file => {
      const sourcePath = path.join(electronSourceDir, file);
      const targetPath = path.join(electronTargetDir, file);
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied ${file}`);
    });

    // Step 3: Run `npm install` inside the `dist` folder
    console.log("Installing dependencies inside `dist`...");
    execSync("bun install", { cwd: electronTargetDir, stdio: "inherit" });

    // Step 4: Run Electron Builder/Forge build process
    console.log("Packaging Electron app...");
    execSync("bun run package", {
      cwd: electronTargetDir,
      stdio: "inherit",
    });
    // // Step 4: Run Electron Builder/Forge build process
    // console.log("Making Electron app...");
    // execSync("npm run package", {
    //     cwd: electronTargetDir,
    //     stdio: "inherit",
    // });

    console.log("Electron app built successfully!");

    // Step 5: Delete `old_dist` on success
    if (fs.existsSync(oldDistDir)) {
      console.log("Deleting `old_dist`...");
      fs.rmSync(oldDistDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error("Error during build:", error.message);

    // If an error occurs, restore `old_dist` back to `dist`
    if (fs.existsSync(oldDistDir)) {
      console.log("Restoring `old_dist` to `dist` due to error...");
      fs.moveSync(oldDistDir, electronTargetDir, { overwrite: true });
    }

    process.exit(1);
  }
}

buildWindows();
