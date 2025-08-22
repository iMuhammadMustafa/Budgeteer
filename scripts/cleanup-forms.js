#!/usr/bin/env node

/**
 * Form System Cleanup Script
 * 
 * This script performs cleanup tasks for the form system:
 * - Removes unused imports
 * - Checks for deprecated patterns
 * - Validates TypeScript configuration
 * - Reports on code quality metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Starting Form System Cleanup...\n');

// Configuration
const FORM_DIRECTORIES = [
  'src/components/forms',
  'src/components/hooks',
  'src/utils',
  'src/types/components',
];

const DEPRECATED_PATTERNS = [
  /useState.*form/i,
  /manual.*validation/i,
  /setErrors/i,
  /formData\s*=\s*{}/,
];

const REQUIRED_EXPORTS = [
  'FormContainer',
  'FormField', 
  'FormSection',
  'useFormState',
  'useFormSubmission',
  'commonValidationRules',
];

// Utility functions
function findFiles(dir, extension) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && item.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function checkDeprecatedPatterns(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  DEPRECATED_PATTERNS.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        pattern: pattern.toString(),
        match: matches[0],
        line: content.substring(0, content.indexOf(matches[0])).split('\n').length,
      });
    }
  });
  
  return issues;
}

function checkUnusedImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  const usage = [];
  
  // Extract imports
  const importRegex = /import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    if (match[1]) {
      // Named imports
      const namedImports = match[1].split(',').map(imp => imp.trim());
      imports.push(...namedImports);
    } else if (match[2]) {
      // Namespace import
      imports.push(match[2]);
    } else if (match[3]) {
      // Default import
      imports.push(match[3]);
    }
  }
  
  // Check usage
  const unusedImports = imports.filter(imp => {
    const usageRegex = new RegExp(`\\b${imp}\\b`, 'g');
    const matches = content.match(usageRegex);
    return !matches || matches.length <= 1; // Only the import declaration
  });
  
  return unusedImports;
}

function validateExports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const exports = [];
  
  // Check for exports
  const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)/g;
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  // Check for re-exports
  const reExportRegex = /export\s+{\s*([^}]+)\s*}/g;
  while ((match = reExportRegex.exec(content)) !== null) {
    const reExports = match[1].split(',').map(exp => exp.trim());
    exports.push(...reExports);
  }
  
  return exports;
}

// Main cleanup tasks
async function runCleanup() {
  const results = {
    filesProcessed: 0,
    deprecatedPatterns: [],
    unusedImports: [],
    missingExports: [],
    typeErrors: [],
  };
  
  console.log('📁 Scanning form directories...');
  
  for (const dir of FORM_DIRECTORIES) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory not found: ${dir}`);
      continue;
    }
    
    const tsFiles = findFiles(dir, '.ts');
    const tsxFiles = findFiles(dir, '.tsx');
    const allFiles = [...tsFiles, ...tsxFiles];
    
    console.log(`   Found ${allFiles.length} files in ${dir}`);
    
    for (const file of allFiles) {
      results.filesProcessed++;
      
      // Check for deprecated patterns
      const deprecated = checkDeprecatedPatterns(file);
      if (deprecated.length > 0) {
        results.deprecatedPatterns.push({ file, issues: deprecated });
      }
      
      // Check for unused imports
      const unused = checkUnusedImports(file);
      if (unused.length > 0) {
        results.unusedImports.push({ file, imports: unused });
      }
      
      // Validate exports for index files
      if (file.endsWith('index.ts') || file.endsWith('index.tsx')) {
        const exports = validateExports(file);
        const missing = REQUIRED_EXPORTS.filter(req => !exports.includes(req));
        if (missing.length > 0) {
          results.missingExports.push({ file, missing });
        }
      }
    }
  }
  
  console.log('\n🔍 Running TypeScript type checking...');
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
    console.log('✅ No TypeScript errors found');
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const errors = output.split('\n').filter(line => line.includes('error TS'));
    results.typeErrors = errors;
    console.log(`❌ Found ${errors.length} TypeScript errors`);
  }
  
  console.log('\n📊 Cleanup Results:');
  console.log(`   Files processed: ${results.filesProcessed}`);
  console.log(`   Deprecated patterns: ${results.deprecatedPatterns.length}`);
  console.log(`   Unused imports: ${results.unusedImports.length}`);
  console.log(`   Missing exports: ${results.missingExports.length}`);
  console.log(`   Type errors: ${results.typeErrors.length}`);
  
  // Detailed reporting
  if (results.deprecatedPatterns.length > 0) {
    console.log('\n⚠️  Deprecated Patterns Found:');
    results.deprecatedPatterns.forEach(({ file, issues }) => {
      console.log(`   ${file}:`);
      issues.forEach(issue => {
        console.log(`     Line ${issue.line}: ${issue.match}`);
      });
    });
  }
  
  if (results.unusedImports.length > 0) {
    console.log('\n🗑️  Unused Imports Found:');
    results.unusedImports.forEach(({ file, imports }) => {
      console.log(`   ${file}: ${imports.join(', ')}`);
    });
  }
  
  if (results.missingExports.length > 0) {
    console.log('\n❌ Missing Required Exports:');
    results.missingExports.forEach(({ file, missing }) => {
      console.log(`   ${file}: ${missing.join(', ')}`);
    });
  }
  
  if (results.typeErrors.length > 0) {
    console.log('\n🚨 TypeScript Errors:');
    results.typeErrors.slice(0, 10).forEach(error => {
      console.log(`   ${error}`);
    });
    if (results.typeErrors.length > 10) {
      console.log(`   ... and ${results.typeErrors.length - 10} more errors`);
    }
  }
  
  // Generate cleanup report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      filesProcessed: results.filesProcessed,
      deprecatedPatterns: results.deprecatedPatterns.length,
      unusedImports: results.unusedImports.length,
      missingExports: results.missingExports.length,
      typeErrors: results.typeErrors.length,
    },
    details: results,
  };
  
  fs.writeFileSync('cleanup-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to cleanup-report.json');
  
  // Exit with error code if issues found
  const hasIssues = results.deprecatedPatterns.length > 0 || 
                   results.typeErrors.length > 0 || 
                   results.missingExports.length > 0;
  
  if (hasIssues) {
    console.log('\n❌ Cleanup completed with issues. Please review and fix the problems above.');
    process.exit(1);
  } else {
    console.log('\n✅ Cleanup completed successfully! No issues found.');
    process.exit(0);
  }
}

// Run cleanup
runCleanup().catch(error => {
  console.error('💥 Cleanup failed:', error);
  process.exit(1);
});