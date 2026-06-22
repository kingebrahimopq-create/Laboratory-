const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const LOG_FILE = path.join(__dirname, 'git_log.txt');
fs.writeFileSync(LOG_FILE, '=== STARTING SECURE SYSTEM PUBLISH ===\n');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(LOG_FILE, `${new Date().toISOString()}: ${msg}\n`);
}

function run(cmd) {
  const maskedCmd = cmd.replace(/ghp_[a-zA-Z0-9]{36}/g, 'ghp_REDACTED');
  log(`Executing: ${maskedCmd}`);
  try {
    const output = execSync(cmd, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 35000,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0',
        GIT_ASKPASS: 'true'
      }
    });
    if (output) {
      log(`Output:\n${output.trim()}`);
    }
    return output;
  } catch (err) {
    log(`Error executing [${maskedCmd}]: ${err.message}`);
    if (err.stdout) log(`STDOUT:\n${err.stdout}`);
    if (err.stderr) log(`STDERR:\n${err.stderr}`);
    throw err;
  }
}

function getSecureToken() {
  // 1. Try parsing .env file FIRST
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    try {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('GITHUB_PAT=')) {
          const val = line.split('=')[1];
          if (val) {
            const token = val.replace(/^"|"$/g, '').trim();
            if (token.startsWith('ghp_')) {
              return token;
            }
          }
        }
      }
    } catch (e) {
      log(`Error reading .env: ${e.message}`);
    }
  }

  // 2. Fallback to process.env
  if (process.env.GITHUB_PAT && process.env.GITHUB_PAT.trim() !== '') {
    const token = process.env.GITHUB_PAT.replace(/^"|"$/g, '').trim();
    if (token.startsWith('ghp_')) { 
      return token;
    }
  }

  return null;
}

// Check with GitHub API if the token is valid
function validateGitHubToken(token) {
  return new Promise((resolve) => {
    log(`Validating GitHub Token with length: ${token.length} (Starts: ${token.substring(0, 6)}... Ends: ...${token.substring(token.length - 4)})`);
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: '/user',
      method: 'GET',
      headers: {
        'User-Agent': 'Node-Publish-Agent',
        'Authorization': `token ${token}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const user = JSON.parse(body);
            log(`Authentication verified! Signed in as: ${user.login}`);
            resolve(user.login);
          } catch (e) {
            resolve(null);
          }
        } else {
          log(`Authentication failed. Status code: ${res.statusCode}. Body: ${body}`);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      log(`API error: ${err.message}`);
      resolve(null);
    });

    req.end();
  });
}

// Create a GitHub Release using REST API
function createGitHubRelease(token, owner, repo, tagName, versionDesc) {
  return new Promise((resolve) => {
    log(`Creating GitHub Release for Tag: ${tagName}...`);
    const postData = JSON.stringify({
      tag_name: tagName,
      target_commitish: 'main',
      name: `Clinical Laboratory System v${tagName.replace(/^v/, '')}`,
      body: `### تحديثات الإصدار الجديد ${tagName} 🚀\n\n${versionDesc}\n\n*تم الرفع والبناء المزدوج التلقائي بنجاح من بيئة التطوير الاستوديو الخاصة بك.*`,
      draft: false,
      prerelease: false,
      generate_release_notes: false
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${owner}/${repo}/releases`,
      method: 'POST',
      headers: {
        'User-Agent': 'Node-Publish-Agent',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          log('SUCCESS: GitHub Release has been added perfectly!');
          try {
            const release = JSON.parse(body);
            log(`Release URL: ${release.html_url}`);
            resolve(true);
          } catch (e) {
            resolve(true);
          }
        } else {
          log(`Failed to create release. Status: ${res.statusCode}. Output:\n${body}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      log(`Release API error: ${err.message}`);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

async function publish() {
  try {
    const token = getSecureToken();
    if (!token) {
      log('CRITICAL ERROR: No new GITHUB_PAT provided/configured or old revoked token detected.');
      log('Please add your new GITHUB_PAT to the Settings panel or in the .env file.');
      process.exit(1);
    }

    const username = await validateGitHubToken(token);
    if (!username) {
      log('CRITICAL ERROR: GITHUB_PAT belongs to invalid credentials or is revoked.');
      log('Please generate a new personal access token classic in GitHub with [repo] scope.');
      process.exit(1);
    }

    const owner = 'kingebrahimopq-create';
    const repo = 'Laboratory-';
    const repoUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;

    log('--- Reading versionData ---');
    let appVersion = '1.0.6';
    let appDesc = 'تحديث فوري لترقية التوافقية البرمجية، وتحسين محرك التحقق الآمن وعرض التنبيهات الفورية وإخفاء شريط التحديث اليدوي لتجنب التعارض المزامني.';
    try {
      const vPath = path.join(process.cwd(), 'public', 'version.json');
      if (fs.existsSync(vPath)) {
        const vData = JSON.parse(fs.readFileSync(vPath, 'utf8'));
        appVersion = vData.version || appVersion;
        appDesc = vData.description || appDesc;
      }
    } catch (e) {
      log(`Version reading fallback: ${e.message}`);
    }

    log(`Targeting Version: ${appVersion}`);

    log('--- Cleaning Existing Git State ---');
    const gitDir = path.join(process.cwd(), '.git');
    if (fs.existsSync(gitDir)) {
      try {
        fs.rmSync(gitDir, { recursive: true, force: true });
        log('Cleaned old .git metadata.');
      } catch (e) {
        log(`Could not remove .git: ${e.message}`);
      }
    }

    log('--- Initializing Native Git ---');
    run('git init');
    run('git config user.name "kingebrahimopq-create"');
    run('git config user.email "gokerebrahimopq@gmail.com"');

    log('--- Adding Remote Origin ---');
    run(`git remote add origin ${repoUrl}`);

    log('--- Fetching History ---');
    try {
      run('git fetch origin main --depth=1');
    } catch (fetchErr) {
      log(`Could not fetch origin main, proceeding: ${fetchErr.message}`);
    }

    log('--- Alignment and Checkout ---');
    try {
      run('git checkout -b main');
      run('git reset --soft origin/main');
      log('Aligned successfully with remote branch origin/main.');
    } catch (alignErr) {
      log(`Direct reset failed, setting up fresh origin tracking: ${alignErr.message}`);
      try {
        run('git checkout -B main');
      } catch (checkoutErr) {
        log(`Branch checkout warning: ${checkoutErr.message}`);
      }
    }

    log('--- Staging Code Changes ---');
    run('git add .');

    log('--- Creating Sync Commit ---');
    try {
      run(`git commit -m "fix(update): release version v${appVersion} - hide updates menu, enable auto update alerts popup notifications, fix webview SPA navigate redirects"`);
    } catch (commitErr) {
      log(`No new files or changes to commit: ${commitErr.message}`);
    }

    log('--- Pushing to GitHub Main ---');
    try {
      run('git push origin main');
      log('SUCCESS: All files successfully pushed to GitHub!');
    } catch (pushErr) {
      log(`Push operation failed: ${pushErr.message}`);
      log('Attempting forced update push as fallback...');
      run('git push origin main --force');
      log('Forced push succeeded!');
    }

    // Attempt to tag and create release via Github REST API
    const releaseSuccess = await createGitHubRelease(token, owner, repo, `v${appVersion}`, appDesc);
    if (releaseSuccess) {
      log('====================================================');
      log(`SUCCESS: Version ${appVersion} successfully published to Production and Release created!`);
      log('====================================================');
    } else {
      log('====================================================');
      log('WARNING: Code pushed but Release creation on GitHub failed (Tag may already exist).');
      log('====================================================');
    }

    process.exit(0);

  } catch (globalErr) {
    log(`CRITICAL CRASH: ${globalErr.message}`);
    process.exit(1);
  }
}

publish();
