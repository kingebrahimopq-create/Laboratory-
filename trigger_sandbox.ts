import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const repoDir = '/tmp/Laboratory-';

try {
  const filePath = path.join(repoDir, 'artifacts/mockup-sandbox/src/App.tsx');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    content += `\n// Build Trigger: ${new Date().toISOString()}`;
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Updated mockup-sandbox App.tsx to trigger Vercel build.");

    execSync(`git -C ${repoDir} add .`, { stdio: 'inherit' });
    execSync(`git -C ${repoDir} commit -m "build: trigger fresh vercel deployment by modifying sandbox App.tsx"`, { stdio: 'inherit' });
    execSync(`git -C ${repoDir} push origin main`, { stdio: 'inherit' });
    console.log("Pushed sandbox change.");
  }
} catch (e: any) {
  console.error("Error:", e.message || e);
}
