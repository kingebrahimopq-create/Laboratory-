import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'artifacts/mockup-sandbox/vite.config.ts');
  if (fs.existsSync(p)) {
    console.log("--- sandbox vite.config.ts ---");
    console.log(fs.readFileSync(p, 'utf-8'));
  }
} catch (e: any) {
  console.error(e);
}
