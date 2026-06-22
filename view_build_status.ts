import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'build-status.txt');
  if (fs.existsSync(p)) {
    console.log("--- build-status.txt content ---");
    console.log(fs.readFileSync(p, 'utf-8'));
  } else {
    console.log("build-status.txt does not exist.");
  }
} catch (e: any) {
  console.error(e);
}
