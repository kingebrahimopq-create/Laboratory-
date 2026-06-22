import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'lib/api-zod/tsconfig.json');
  if (fs.existsSync(p)) {
    console.log("--- api-zod tsconfig.json ---");
    console.log(fs.readFileSync(p, 'utf-8'));
  }
} catch (e: any) {
  console.error(e);
}
