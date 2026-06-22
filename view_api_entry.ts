import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'api/index.ts');
  if (fs.existsSync(p)) {
    console.log("--- api/index.ts content ---");
    console.log(fs.readFileSync(p, 'utf-8'));
  } else {
    console.log("api/index.ts does not exist.");
  }
} catch (e: any) {
  console.error(e);
}
