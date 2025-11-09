const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findGoFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...findGoFiles(fullPath));
    } else if (item.endsWith('.go')) {
      files.push(fullPath);
    }
  }
  return files;
}

try {
  const pocketbaseDir = path.join(__dirname, '..', 'apps', 'pocketbase');
  const goFiles = findGoFiles(pocketbaseDir);
  if (goFiles.length === 0) {
    console.log('No Go files found.');
    process.exit(0);
  }
  const output = execSync(`gofmt -l ${goFiles.join(' ')}`, { encoding: 'utf8' });
  if (output.trim()) {
    console.error('Go files need formatting:');
    console.error(output);
    process.exit(1);
  }
} catch (error) {
  console.error('Error checking Go formatting:', error.message);
  process.exit(1);
}
