import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const repoDir = '/tmp/Laboratory-';

try {
  const p = path.join(repoDir, 'pnpm-workspace.yaml');
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf-8');
    content = content.replace(/'@prisma\/client': set this to true or false/g, "'@prisma/client': true");
    content = content.replace(/'@prisma\/engines': set this to true or false/g, "'@prisma/engines': true");
    content = content.replace(/esbuild: set this to true or false/g, "esbuild: true");
    content = content.replace(/prisma: set this to true or false/g, "prisma: true");
    
    fs.writeFileSync(p, content);
    console.log("Fixed pnpm-workspace.yaml placeholders.");

    execSync(`git -C ${repoDir} add .`, { stdio: 'inherit' });
    execSync(`git -C ${repoDir} commit -m "fix: valid pnpm-workspace.yaml allowBuilds config"`, { stdio: 'inherit' });
    execSync(`git -C ${repoDir} push origin main`, { stdio: 'inherit' });
    console.log("Pushed workspace fix.");
  }
} catch (e: any) {
  console.error("Error:", e.message || e);
}
