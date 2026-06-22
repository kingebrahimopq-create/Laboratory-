import { execSync } from 'child_process';

const repoDir = '/tmp/Laboratory-';

try {
  console.log("Listing root files (hidden too):");
  console.log(execSync(`ls -la ${repoDir}`, { encoding: 'utf-8' }));
} catch (e: any) {
  console.error(e);
}
