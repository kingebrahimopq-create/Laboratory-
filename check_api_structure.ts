import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

function listDirRecursive(dir: string, indent: string = '') {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      console.log(`${indent}${file}/`);
      listDirRecursive(p, indent + '  ');
    } else {
      console.log(`${indent}${file}`);
    }
  }
}

try {
  const apiDir = path.join(repoDir, 'artifacts/api-server/src');
  if (fs.existsSync(apiDir)) {
    console.log("--- artifacts/api-server/src structure ---");
    listDirRecursive(apiDir);
  } else {
    console.log("apiDir does not exist");
  }
} catch (e: any) {
  console.error(e);
}
