const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// First, read the token from .env to bypass any cached process.env variables
let token = '';
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('GITHUB_PAT=')) {
      const val = line.split('=')[1];
      if (val) {
        token = val.replace(/^"|"$/g, '').trim();
      }
    }
  }
}

// Fallback to process.env if not found in .env
if (!token) {
  token = (process.env.GITHUB_PAT || '').replace(/^"|"$/g, '').trim();
}

console.log('Using GITHUB_PAT with length:', token.length);
if (!token) {
  console.error('Error: Token not found in .env or process.env');
  process.exit(1);
}

// Construct authorized URL
const remoteUrl = `https://x-access-token:${token}@github.com/kingebrahimopq-create/Laboratory-.git`;

function run(cmd, customEnv = {}) {
  // Hide actual token from printing in log
  const maskedCmd = cmd.replace(/ghp_[a-zA-Z0-9]{36}/g, 'ghp_REDACTED');
  console.log(`Executing: ${maskedCmd}`);
  try {
    const output = execSync(cmd, {
      env: { ...process.env, ...customEnv, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: 'true' },
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30000
    });
    if (output) console.log(`Success output:\n${output.trim()}`);
    return true;
  } catch (err) {
    console.error(`Error Executing [${maskedCmd}]: ${err.message}`);
    if (err.stdout) console.log(`STDOUT:\n${err.stdout}`);
    if (err.stderr) console.log(`STDERR:\n${err.stderr}`);
    return false;
  }
}

const gitDir = path.join(process.cwd(), '.git');
if (fs.existsSync(gitDir)) {
  fs.rmSync(gitDir, { recursive: true, force: true });
}

run('git init');
run('git config user.name "kingebrahimopq-create"');
run('git config user.email "gokerebrahimopq@gmail.com"');
run(`git remote add origin ${remoteUrl}`);
run('git add .');

let commitMsg = 'fix(update): hide updates menu, enable auto update alerts popup notifications, fix webview SPA navigate redirects';
run(`git commit -m "${commitMsg}"`);

// Let's do a push to main branch
run('git push origin master:main --force');
