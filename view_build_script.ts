import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'artifacts/api-server/build.mjs');
  if (fs.existsSync(p)) {
    console.log("--- build.mjs content ---");
    console.log(fs.readFileSync(p, 'utf-8'));
  } else {
    console.log("build.mjs does not exist.");
  }
} catch (e: any) {
  console.error(e);
}
