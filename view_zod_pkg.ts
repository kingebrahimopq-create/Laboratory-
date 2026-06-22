import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'lib/api-zod/src/index.ts');
  if (fs.existsSync(p)) {
    console.log("--- api-zod/src/index.ts content ---");
    console.log(fs.readFileSync(p, 'utf-8'));
  } else {
     console.log("api-zod index not found at " + p);
  }
  
  const pkg = path.join(repoDir, 'lib/api-zod/package.json');
  if (fs.existsSync(pkg)) {
    console.log("--- api-zod package.json ---");
    console.log(fs.readFileSync(pkg, 'utf-8'));
  }
} catch (e: any) {
  console.error(e);
}
