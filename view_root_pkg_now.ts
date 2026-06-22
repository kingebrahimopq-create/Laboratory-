import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'package.json');
  if (fs.existsSync(p)) {
    console.log("--- root package.json current ---");
    console.log(fs.readFileSync(p, 'utf-8'));
  }
} catch (e: any) {
  console.error(e);
}
