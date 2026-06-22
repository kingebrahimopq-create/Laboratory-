import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const repoDir = '/tmp/Laboratory-';

try {
  const vercelPath = path.join(repoDir, 'vercel.json');
  const vercelConfig = {
    version: 2,
    buildCommand: "pnpm -F @workspace/mockup-sandbox build",
    installCommand: "pnpm install",
    outputDirectory: "artifacts/mockup-sandbox/dist",
    rewrites: [
      { "source": "/api/ping", "destination": "/api/ping.ts" }, // specific route
      { "source": "/(.*)", "destination": "/artifacts/mockup-sandbox/dist/index.html" }
    ]
  };
  fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2));

  // Create a very simple ping.ts
  const apiPingPath = path.join(repoDir, 'api/ping.ts');
  const apiPingContent = `export default function handler(req: any, res: any) {
  res.status(200).json({ pong: true, time: new Date().toISOString() });
}
`;
  fs.writeFileSync(apiPingPath, apiPingContent);

  execSync(`git -C ${repoDir} add .`, { stdio: 'inherit' });
  execSync(`git -C ${repoDir} commit -m "build: test with simple serverless function and specific rewrite"`, { stdio: 'inherit' });
  execSync(`git -C ${repoDir} push origin main`, { stdio: 'inherit' });
  console.log("Pushed simplified vercel config.");

} catch (e: any) {
  console.error(e);
}
