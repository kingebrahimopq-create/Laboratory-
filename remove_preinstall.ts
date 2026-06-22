import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'package.json');
  if (fs.existsSync(p)) {
    const pkg = JSON.parse(fs.readFileSync(p, 'utf-8'));
    delete pkg.scripts.preinstall;
    fs.writeFileSync(p, JSON.stringify(pkg, null, 2));
    console.log("Removed preinstall script from root package.json.");

    execSync(`git -C ${repoDir} add .`, { stdio: 'inherit' });
    execSync(`git -C ${repoDir} commit -m "fix: remove preinstall script to avoid vercel environment mismatch"`, { stdio: 'inherit' });
    execSync(`git -C ${repoDir} push origin main`, { stdio: 'inherit' });
    console.log("Pushed preinstall fix.");
  }
} catch (e: any) {
  console.error("Error:", e.message || e);
}
