import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const repoDir = '/tmp/Laboratory-';

try {
  const vercelPath = path.join(repoDir, 'vercel.json');
  const vercelConfig = {
    version: 2,
    buildCommand: "echo 'forced success' && pnpm run build",
    installCommand: "pnpm install",
    ignoreBuildStep: "false", // Try to explicitly disable any ignore step
    outputDirectory: "artifacts/mockup-sandbox/dist",
    rewrites: [
      { "source": "/api/(.*)", "destination": "/api/index.ts" },
      { "source": "/(.*)", "destination": "/artifacts/mockup-sandbox/dist/index.html" }
    ]
  };
  fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2));
  console.log("Updated vercel.json with ignoreBuildStep: false.");

  execSync(`git -C ${repoDir} add .`, { stdio: 'inherit' });
  execSync(`git -C ${repoDir} commit -m "fix: explicitly disable vercel ignoreBuildStep and force build"`, { stdio: 'inherit' });
  execSync(`git -C ${repoDir} push origin main`, { stdio: 'inherit' });
  console.log("Pushed explicitly unignored config.");

} catch (e: any) {
  console.error("Error:", e.message || e);
}
