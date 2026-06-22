import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'artifacts/api-server/src/app.ts');
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p);
    console.log("File size:", content.length);
    console.log("Hex head:", content.slice(0, 50).toString('hex'));
    console.log("Content:\n" + content.toString('utf-8'));
  }
} catch (e: any) {
  console.error(e);
}
