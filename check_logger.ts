import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'artifacts/api-server/src/lib/logger.ts');
  if (fs.existsSync(p)) {
    console.log("logger.ts exists.");
  } else {
    console.log("logger.ts DOES NOT EXIST at " + p);
  }
} catch (e: any) {
  console.error(e);
}
