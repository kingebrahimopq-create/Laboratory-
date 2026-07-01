import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ override: true });

async function runNativePush() {
  const token = process.env.GITHUB_PAT || '';
  if (!token) {
    console.error('Error: GITHUB_PAT is not set in the environment or .env file!');
    process.exit(1);
  }

  const repoUrl = `https://x-access-token:${token}@github.com/kingebrahimopq-create/Laboratory-.git`;
  const targetBranch = 'update-laboratory';

  console.log('--------------------------------------------------');
  console.log('🚀 Native Git Push Engine starting...');
  console.log('--------------------------------------------------');

  try {
    // 1. Wipe old .git directory to start fresh
    const gitDir = path.join(process.cwd(), '.git');
    if (fs.existsSync(gitDir)) {
      console.log('Cleaning old .git state...');
      fs.rmSync(gitDir, { recursive: true, force: true });
    }

    // 2. Run git init and config
    console.log('Initializing fresh Git repository...');
    execSync('git init', { stdio: 'inherit' });
    execSync('git config user.name "kingebrahimopq-create"', { stdio: 'inherit' });
    execSync('git config user.email "262901408+kingebrahimopq-create@users.noreply.github.com"', { stdio: 'inherit' });

    // 3. Add remote
    console.log('Adding secure remote origin...');
    execSync(`git remote add origin "${repoUrl}"`, { stdio: 'ignore' });

    // 4. Fetch main branch to get history
    console.log('Fetching origin/main branch...');
    execSync('git fetch origin main --depth=1', { stdio: 'inherit' });

    // 5. Back up our current files to a temporary directory in memory/disk
    console.log('Backing up current workspace files...');
    const backupDir = path.join(process.cwd(), '../workspace_backup_temp');
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
    fs.mkdirSync(backupDir);

    const filesToBackup = fs.readdirSync(process.cwd()).filter(file => {
      return file !== '.git' && file !== 'node_modules' && file !== '../workspace_backup_temp';
    });

    for (const file of filesToBackup) {
      const src = path.join(process.cwd(), file);
      const dest = path.join(backupDir, file);
      fs.cpSync(src, dest, { recursive: true });
    }

    // Clear working directory before checkout so git won't complain about untracked files
    console.log('Clearing working directory before checkout...');
    for (const file of filesToBackup) {
      const p = path.join(process.cwd(), file);
      if (fs.existsSync(p)) {
        fs.rmSync(p, { recursive: true, force: true });
      }
    }

    // 6. Reset branch to origin/main
    console.log('Checking out and resetting to origin/main...');
    execSync('git checkout -B update-laboratory origin/main', { stdio: 'inherit' });

    // 7. Restore our backed up files over the checkout
    console.log('Restoring backed up workspace files...');
    for (const file of filesToBackup) {
      const src = path.join(backupDir, file);
      const dest = path.join(process.cwd(), file);
      fs.cpSync(src, dest, { recursive: true, force: true });
    }

    // Cleanup backup
    fs.rmSync(backupDir, { recursive: true, force: true });

    // 8. Stage, commit, and push
    console.log('Staging files...');
    execSync('git add -A', { stdio: 'inherit' });

    console.log('Committing changes...');
    execSync('git commit -m "🔬 Laboratory Update v1.0.20 [Native Push]"', { stdio: 'inherit' });

    console.log(`Force pushing to remote "${targetBranch}"...`);
    execSync(`git push -f origin ${targetBranch}`, { stdio: 'inherit' });

    console.log('🎉 Native push to branch completed successfully with shared history!');

  } catch (err: any) {
    console.error('❌ Native Git operations failed:', err.message || err);
    process.exit(1);
  }
}

runNativePush();
