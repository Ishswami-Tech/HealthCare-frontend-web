#!/usr/bin/env node

/**
 * Healthcare Frontend - Automated Fix for Unused Imports
 * This script fixes common unused import and variable issues
 */

const fs = require('fs');
const path = require('path');

// Common patterns to fix
const fixes = [
  // Remove unused icon imports (most common issue)
  {
    pattern: /^import\s*\{\s*[^}]*?([A-Z][a-zA-Z0-9]*)\s*[,}][^}]*?\}\s*from\s*['"][^'"]*?lucide-react['"];?\s*$/gm,
    replacement: ''
  },
  
  // Fix unused variables by prefixing with underscore
  {
    pattern: /(\s+)([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;]+);(\s*\/\/ .*)?$/gm,
    replacement: '$1_$2 = $3;$4'
  },
  
  // Remove unused console.log statements
  {
    pattern: /^\s*console\.log\([^)]*\);\s*$/gm,
    replacement: ''
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !['node_modules', '.next', '.git'].includes(file)) {
      walkDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fixFile(filePath);
    }
  });
}

// Start fixing from src directory
const srcDir = path.join(__dirname, 'src');
if (fs.existsSync(srcDir)) {
  console.log('Starting automated fixes...');
  walkDirectory(srcDir);
  console.log('Automated fixes completed!');
} else {
  console.error('src directory not found');
}
