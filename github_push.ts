import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function pushToGithub() {
  console.log('=== Starting Secure Isomorphic Auto-Deployment to GitHub ===');

  const dir = process.cwd();
  
  // SECURE TOKEN LOADING
  let token = (process.env.GITHUB_PAT || '').replace(/^"|"$/g, '').trim();
  if (!token) {
    console.error('CRITICAL ERROR: No valid GITHUB_PAT environment variable configured.');
    console.error('Please update your .env file or Settings panel with your new active token.');
    process.exit(1);
  }

  // 1. Clean and Initialize repository
  const gitDir = path.join(dir, '.git');
  if (fs.existsSync(gitDir)) {
    console.log('Deleting existing .git directory for clean synchronization...');
    try {
      fs.rmSync(gitDir, { recursive: true, force: true });
    } catch (e: any) {
      console.warn('Could not delete .git directory:', e.message);
    }
  }

  try {
    await git.init({ fs, dir });
    console.log('Git repo initialized successfully.');
  } catch (err: any) {
    console.warn('Git init warning:', err?.message || err);
  }

  // 2. Configure user name and email
  try {
    await git.setConfig({ fs, dir, path: 'user.name', value: 'kingebrahimopq-create' });
    await git.setConfig({ fs, dir, path: 'user.email', value: 'gokerebrahimopq@gmail.com' });
    console.log('Git credentials set successfully.');
  } catch (err: any) {
    console.warn('Config setting warning:', err?.message || err);
  }

  // 3. Set remote origin URL
  const remoteUrl = 'https://github.com/kingebrahimopq-create/Laboratory-.git';
  try {
    await git.addRemote({ fs, dir, remote: 'origin', url: remoteUrl });
    console.log('Added remote origin.');
  } catch (remoteErr) {
    try {
      await git.setConfig({ fs, dir, path: 'remote.origin.url', value: remoteUrl });
      console.log('Updated remote origin URL.');
    } catch (setConfigErr: any) {
      console.error('Could not configure remote URL:', setConfigErr?.message || setConfigErr);
    }
  }

  // 4. Fetch the remote main branch and point local main branch to it (for fast-forward history)
  console.log('Fetching remote main commit to establish history parent...');
  let parentOid: string | null = null;
  try {
    const refs = await git.listServerRefs({
      http,
      url: remoteUrl,
      onAuth: () => ({ username: 'kingebrahimopq-create', password: token })
    });
    
    const mainRef = refs.find(r => r.ref === 'refs/heads/main');
    if (mainRef) {
      parentOid = mainRef.oid;
      await git.writeRef({
        fs,
        dir,
        ref: 'refs/heads/main',
        value: parentOid,
        force: true
      });
      // Set HEAD to point to refs/heads/main
      await git.writeRef({
        fs,
        dir,
        ref: 'HEAD',
        value: 'refs/heads/main',
        force: true
      });
      console.log(`Successfully aligned local branch history to remote head commit: ${parentOid}`);
    }
  } catch (fetchErr: any) {
    console.warn('Fetch server refs warnings; assuming initial repository or offline mode:', fetchErr?.message || fetchErr);
  }

  // 5. Recursively add files to stage
  const ignoreDirs = ['node_modules', '.git', 'dist', '.next', 'dist-electron', 'out', 'build', '.gradle', '.idea', '.cxx', 'target'];
  async function addFilesRecursively(currentDir: string, relativePath: string = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const relName = relativePath ? path.join(relativePath, entry.name) : entry.name;
      const normalizedPath = relName.replace(/\\/g, '/');
      if (ignoreDirs.includes(entry.name)) continue;
      if (
        normalizedPath.includes('/build/') || 
        normalizedPath.startsWith('build/') || 
        normalizedPath.includes('/.gradle/') || 
        normalizedPath.startsWith('.gradle/') ||
        normalizedPath.includes('/.cxx/') ||
        normalizedPath.startsWith('.cxx/')
      ) continue;

      if (entry.isDirectory()) {
        await addFilesRecursively(path.join(currentDir, entry.name), relName);
      } else {
        // Skip .env file so we don't push secrets/tokens accidentally to the repository
        if (entry.name === '.env') continue;
        try {
          await git.add({ fs, dir, filepath: normalizedPath });
        } catch (addErr: any) {
          console.warn(`Could not stage ${relName}:`, addErr?.message || addErr);
        }
      }
    }
  }

  console.log('Staging files...');
  await addFilesRecursively(dir);
  console.log('Staging completed.');

  // 6. Commit files
  let commitSha = '';
  try {
    commitSha = await git.commit({
      fs,
      dir,
      author: {
        name: 'kingebrahimopq-create',
        email: 'gokerebrahimopq@gmail.com'
      },
      message: 'fix(update): hide updates menu, enable auto update alerts popup notifications, fix webview SPA navigate redirects'
    });
    console.log(`Incremental commit created successfully: ${commitSha}`);
  } catch (commitErr: any) {
    console.log('No changes to commit or commit failed:', commitErr?.message || commitErr);
    // If no changes, let's still proceed in case we have staged items from before
  }

  // 7. Push to GitHub (Normal Fast-Forward Push)
  console.log('Pushing in progress to GitHub (Fast-Forward)...');
  try {
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'main',
      force: false, // Standard push to follow branch rules
      onAuth: () => ({
        username: 'kingebrahimopq-create',
        password: token
      })
    });
    console.log('=== Push Successful! App has been deployed securely to GitHub ===', pushResult);
  } catch (pushErr: any) {
    console.error('Failed to push to remote repository:', pushErr?.message || pushErr);
  }
}

pushToGithub();
