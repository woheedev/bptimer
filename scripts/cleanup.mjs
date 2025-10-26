import { readdirSync, rmSync } from 'fs';
import { join } from 'path';

function deleteNodeModules(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const fullPath = join(dir, entry.name);

    if (entry.name === 'node_modules') {
      rmSync(fullPath, { recursive: true, force: true });
      console.log(`Deleted ${fullPath}`);
    } else {
      deleteNodeModules(fullPath);
    }
  }
}

deleteNodeModules(process.cwd());
