import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'package.json');
  if (fs.existsSync(p)) {
    const pkg = JSON.parse(fs.readFileSync(p, 'utf-8'));
    
    // Add missing dependencies to root for Vercel Serverless Functions
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["express"] = "^4.19.2";
    pkg.dependencies["cors"] = "^2.8.5";
    pkg.dependencies["pino"] = "^9.1.0";
    pkg.dependencies["pino-http"] = "^10.1.0";
    
    fs.writeFileSync(p, JSON.stringify(pkg, null, 2));
    console.log("Added express and friends to root package.json.");

    execSync(`git -C ${repoDir} add .`, { stdio: 'inherit' });
    execSync(`git -C ${repoDir} commit -m "fix: add api dependencies to root for vercel serverless functions"`, { stdio: 'inherit' });
    execSync(`git -C ${repoDir} push origin main`, { stdio: 'inherit' });
    console.log("Pushed root deps fix.");
  }
} catch (e: any) {
  console.error("Error:", e.message || e);
}
