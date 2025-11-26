import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const version = packageJson.version;

const constantsPath = join(rootDir, 'src', 'constants.ts');
const constantsContent = readFileSync(constantsPath, 'utf-8');

const versionPattern = /export const VERSION = (['"]).*\1;/;
if (!versionPattern.test(constantsContent)) {
  console.error(`[BPTimer-API-Client] VERSION pattern not found.`);
  process.exit(1);
}

const updated = constantsContent.replace(versionPattern, `export const VERSION = '${version}';`);

if (!updated.includes(`export const VERSION = '${version}';`)) {
  console.error(`[BPTimer-API-Client] Failed to update VERSION.`);
  process.exit(1);
}

writeFileSync(constantsPath, updated, 'utf-8');
console.log(`[BPTimer-API-Client] Set VERSION to ${version}`);
