import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'pnpm-workspace.yaml');
  if (fs.existsSync(p)) {
    console.log("--- pnpm-workspace.yaml ---");
    console.log(fs.readFileSync(p, 'utf-8'));
  }
} catch (e: any) {
  console.error(e);
}
