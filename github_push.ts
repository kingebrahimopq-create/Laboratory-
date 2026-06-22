import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config'; // Loads .env file safely

async function run() {
  console.log('=== Starting Secure Auto-Deployment to GitHub ===');

  const patToken = process.env.GITHUB_PAT;
  if (!patToken) {
    console.error('CRITICAL ERROR: GITHUB_PAT is not found in environment or .env file!');
    process.exit(1);
  }

  const authenticatedUrl = `https://${patToken}@github.com/kingebrahimopq-create/Laboratory-.git`;

  try {
    const gitFolder = path.join(process.cwd(), '.git');
    const hasGit = fs.existsSync(gitFolder);

    if (!hasGit) {
      console.log('Initializing pristine local Git repo...');
      execSync('git init', { stdio: 'inherit' });

      console.log('Configuring local Git credentials...');
      execSync('git config user.name "kingebrahimopq-create"', { stdio: 'inherit' });
      execSync('git config user.email "gokerebrahimopq@gmail.com"', { stdio: 'inherit' });

      console.log('Setting authenticated remote origin...');
      execSync(`git remote add origin "${authenticatedUrl}"`, { stdio: 'inherit' });

      // Checkout main
      try {
        execSync('git checkout -b main', { stdio: 'ignore' });
      } catch (e) {
        // ignore
      }
    } else {
      console.log('Using existing Git configuration. Updating remote origin...');
      try {
        execSync(`git remote set-url origin "${authenticatedUrl}"`, { stdio: 'ignore' });
      } catch (e) {
        try {
          execSync(`git remote add origin "${authenticatedUrl}"`, { stdio: 'ignore' });
        } catch (err) {}
      }
    }

    console.log('Adding files to stage...');
    execSync('git add .', { stdio: 'inherit' });

    console.log('Creating Git commit...');
    try {
      execSync('git commit -m "feat: إضافة ملفات الإعداد firebase-config و google-api-config وتحديث deploy.yml لـ GitHub Pages"', { stdio: 'inherit' });
    } catch (e) {
      console.log('No new changes to commit.');
    }

    // Force rename branch
    try {
      execSync('git branch -M main', { stdio: 'inherit' });
    } catch (e) {
      console.warn('Branch rename warning, using default.');
    }

    console.log('Pushing changes to GitHub...');
    execSync('git push -u origin main --force', { stdio: 'inherit' });

    console.log('=== Push Successful! App has been deployed securely to GitHub ===');
  } catch (error: any) {
    console.error('An error occurred during git push:', error?.message || error);
    process.exit(1);
  }
}

run();
