import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const repoDir = '/tmp/Laboratory-';

try {
  // 1. Simplify api/index.ts to minimum possible to see if it builds
  const apiEntryPath = path.join(repoDir, 'api/index.ts');
  const apiEntryContent = `import express from "express";
const app = express();
app.get("/api/ping", (req, res) => res.json({ pong: true }));
export default app;
`;
  fs.writeFileSync(apiEntryPath, apiEntryContent);

  // 2. Commit and push
  execSync(`git -C ${repoDir} add .`, { stdio: 'inherit' });
  execSync(`git -C ${repoDir} commit -m "build: simplify api entry to test deployment"`, { stdio: 'inherit' });
  execSync(`git -C ${repoDir} push origin main`, { stdio: 'inherit' });
  console.log("Pushed simplified API entry.");

} catch (e: any) {
  console.error("Error:", e.message || e);
}
