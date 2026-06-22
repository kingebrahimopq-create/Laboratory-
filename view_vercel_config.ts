import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'vercel.json');
  if (fs.existsSync(p)) {
    console.log("--- vercel.json content ---");
    console.log(fs.readFileSync(p, 'utf-8'));
  } else {
    console.log("vercel.json does not exist.");
  }
} catch (e: any) {
  console.error(e);
}
