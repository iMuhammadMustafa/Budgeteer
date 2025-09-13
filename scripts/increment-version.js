#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to the _layout.tsx file
const layoutPath = path.join(__dirname, '..', 'src', 'app', '(drawer)', '_layout.tsx');

// Read the file content
fs.readFile(layoutPath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err}`);
    process.exit(1);
  }

  // Find version number in the format "Version x.y.z"
  const versionRegex = /(Version\s+)(\d+)\.(\d+)\.(\d+)/;
  const match = data.match(versionRegex);

  if (!match) {
    console.error('Version pattern not found in the file.');
    process.exit(1);
  }

  // Extract version numbers
  const prefix = match[1]; // "Version "
  const major = match[2]; // x
  const minor = match[3]; // y
  const patch = parseInt(match[4]) + 1; // z+1

  // Create new version string
  const newVersionString = `${prefix}${major}.${minor}.${patch}`;

  // Replace the old version with the new one
  const updatedContent = data.replace(versionRegex, newVersionString);

  // Write the updated content back to the file
  fs.writeFile(layoutPath, updatedContent, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error(`Error writing file: ${writeErr}`);
      process.exit(1);
    }
    console.log(`Version bumped to ${major}.${minor}.${patch}`);
  });
}); 