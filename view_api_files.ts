import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const filePath = path.join(repoDir, 'artifacts/api-server/src/app.ts');
  const pkgPath = path.join(repoDir, 'artifacts/api-server/package.json');
  const tsConfigPath = path.join(repoDir, 'artifacts/api-server/tsconfig.json');

  if (fs.existsSync(filePath)) {
    console.log("--- app.ts content ---");
    console.log(fs.readFileSync(filePath, 'utf-8'));
  }

  if (fs.existsSync(pkgPath)) {
    console.log("\n--- package.json content ---");
    console.log(fs.readFileSync(pkgPath, 'utf-8'));
  }

  if (fs.existsSync(tsConfigPath)) {
    console.log("\n--- tsconfig.json content ---");
    console.log(fs.readFileSync(tsConfigPath, 'utf-8'));
  }
} catch (e: any) {
  console.error(e);
}
