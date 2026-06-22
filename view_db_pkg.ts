import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'lib/db/package.json');
  if (fs.existsSync(p)) {
    console.log("--- lib/db package.json ---");
    console.log(fs.readFileSync(p, 'utf-8'));
  }
} catch (e: any) {
  console.error(e);
}
