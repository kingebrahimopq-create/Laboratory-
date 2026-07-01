import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envConfig = dotenv.config({ override: true });
if (envConfig.parsed) {
  for (const k in envConfig.parsed) {
    process.env[k] = envConfig.parsed[k];
  }
}

async function runPushWithHistory() {
  const token = process.env.GITHUB_PAT || '';
  if (!token) {
    console.error('Error: GITHUB_PAT is not set in the environment or .env file!');
    process.exit(1);
  }

  const repoUrl = 'https://github.com/kingebrahimopq-create/Laboratory-';
  const repoOwner = 'kingebrahimopq-create';
  const repoName = 'Laboratory-';
  const targetBranch = 'update-laboratory';

  console.log('--------------------------------------------------');
  console.log('🚀 Clean GitHub Push with History Engine starting...');
  console.log(`Repository: ${repoUrl}`);
  console.log(`Target Branch: ${targetBranch}`);
  console.log('Using GITHUB_PAT token to fetch remote main and push...');
  console.log('--------------------------------------------------');

  try {
    // 1. Wipe old .git
    console.log('Cleaning old local Git state...');
    const gitDir = path.join(process.cwd(), '.git');
    if (fsSync.existsSync(gitDir)) {
      fsSync.rmSync(gitDir, { recursive: true, force: true });
    }

    console.log('Initializing a fresh local Git repository...');
    await git.init({ fs, dir: process.cwd() });

    console.log('Setting remote origin...');
    await git.addRemote({
      fs,
      dir: process.cwd(),
      remote: 'origin',
      url: repoUrl
    });

    // 2. Fetch the latest main branch commit to share history
    console.log('Fetching remote "main" branch head commit to establish shared history...');
    await git.fetch({
      fs,
      http,
      dir: process.cwd(),
      remote: 'origin',
      ref: 'main',
      singleBranch: true,
      depth: 1,
      onAuth: () => ({
        username: 'git',
        password: token
      })
    });

    // Resolve the fetched main commit hash
    const mainCommitSha = await git.resolveRef({
      fs,
      dir: process.cwd(),
      ref: 'refs/remotes/origin/main'
    });
    console.log(`Fetched remote main head commit SHA: ${mainCommitSha}`);

    // Point update-laboratory to the main head commit
    console.log(`Setting local branch "${targetBranch}" to start at ${mainCommitSha}...`);
    await git.writeRef({
      fs,
      dir: process.cwd(),
      ref: `refs/heads/${targetBranch}`,
      value: mainCommitSha,
      force: true
    });

    // Point HEAD to our branch symbolically
    await git.writeRef({
      fs,
      dir: process.cwd(),
      ref: 'HEAD',
      value: `refs/heads/${targetBranch}`,
      symbolic: true,
      force: true
    });

    // 3. Scan and stage all updated files
    console.log('Scanning files to stage...');
    const allFiles = await getFilesToStage(process.cwd());
    console.log(`Staging ${allFiles.length} files...`);
    for (const file of allFiles) {
      await git.add({ fs, dir: process.cwd(), filepath: file });
    }

    // 4. Commit changes
    console.log('Committing changes...');
    const commitSha = await git.commit({
      fs,
      dir: process.cwd(),
      author: {
        name: 'kingebrahimopq-create',
        email: '262901408+kingebrahimopq-create@users.noreply.github.com'
      },
      message: 'Auto-commit updates [Clean Build with History]'
    });
    console.log(`✅ Committed successfully! SHA: ${commitSha}`);

    // 5. Force push branch
    console.log(`Force-pushing "${targetBranch}" branch to remote...`);
    const pushResult = await git.push({
      fs,
      http,
      dir: process.cwd(),
      remote: 'origin',
      ref: targetBranch,
      force: true,
      onAuth: () => ({
        username: 'git',
        password: token
      })
    });
    console.log('🎉 Clean push to branch completed!');
    console.log(JSON.stringify(pushResult, null, 2));

    // 6. Create Pull Request to main
    console.log('Checking or creating Pull Request to trigger the workflow...');
    const prsUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/pulls`;
    
    // Check if there is already an open pull request for this branch
    const listPrsResponse = await fetch(`${prsUrl}?state=open&head=${repoOwner}:${targetBranch}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'NodeJS-Fetch'
      }
    });

    if (listPrsResponse.ok) {
      const openPrs = await listPrsResponse.json() as any[];
      if (openPrs.length > 0) {
        console.log(`ℹ️ An active Pull Request already exists: ${openPrs[0].html_url}`);
        console.log('The build workflow has been triggered automatically on GitHub Actions!');
        return;
      }
    }

    console.log('Creating a new Pull Request on GitHub...');
    const prPayload = {
      title: '🔬 Laboratory Updates & Modern Gradients UI',
      body: `### 🚀 Automatic Codebase Update\n\nThis pull request was automatically created and pushed by the **Laboratory Auto-Push Engine** from the development container.\n\n#### What was updated:\n- **Clean modern color gradients and UI styles** configured across key pages.\n- **Supabase credentials & configurations** securely initialized via \".env\".\n- **Automatic Git sync mechanism** utilizing the user's secret keys.\n\n*Please review and merge these changes into \`main\` branch.*`,
      head: targetBranch,
      base: 'main'
    };

    const createPrResponse = await fetch(prsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'NodeJS-Fetch'
      },
      body: JSON.stringify(prPayload)
    });

    const prResult = await createPrResponse.json() as any;
    if (createPrResponse.ok) {
      console.log(`🎉 Pull Request created successfully! URL: ${prResult.html_url}`);
      console.log('The build workflow has been triggered automatically on GitHub Actions!');
    } else {
      console.error('⚠️ Could not create PR automatically:', prResult.message || prResult);
    }
  } catch (error: any) {
    console.error('🔴 Error during operations:', error.message || error);
    process.exit(1);
  }
}

// Helper to recursively read all files in directory, ignoring node_modules, dist, etc.
async function getFilesToStage(dir: string, baseDir: string = dir): Promise<string[]> {
  const result: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const ignoredNames = new Set([
    'node_modules',
    '.git',
    'dist',
    'dist-electron',
    '.env',
    '.env.local',
    '.env.development.local',
    '.env.test.local',
    '.env.production.local',
    'tmp',
    'out',
    'build',
    'android/app/build'
  ]);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (ignoredNames.has(entry.name) || entry.name.endsWith('.log')) {
      continue;
    }

    if (entry.isDirectory()) {
      const subFiles = await getFilesToStage(fullPath, baseDir);
      result.push(...subFiles);
    } else {
      result.push(relativePath);
    }
  }

  return result;
}

runPushWithHistory();
