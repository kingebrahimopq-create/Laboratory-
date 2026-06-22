import { execSync } from 'child_process';

const repoDir = '/tmp/Laboratory-';

try {
  console.log("Searching for all app.ts files in the repo...");
  const findCmd = `find ${repoDir} -name "app.ts"`;
  console.log(execSync(findCmd, { encoding: 'utf-8' }));
} catch (e: any) {
  console.error("Error finding files:", e.message || e);
}
