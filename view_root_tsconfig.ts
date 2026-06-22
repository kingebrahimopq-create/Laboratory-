import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'tsconfig.json');
  if (fs.existsSync(p)) {
    console.log("--- root tsconfig.json content ---");
    console.log(fs.readFileSync(p, 'utf-8'));
  }
} catch (e: any) {
  console.error(e);
}
