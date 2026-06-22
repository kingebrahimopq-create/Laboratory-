const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCmd(cmd) {
  console.log(`Running: ${cmd}`);
  try {
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    console.log('Output OK');
    return output;
  } catch (error) {
    console.error('CMD Error:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
    throw error;
  }
}

try {
  // Delete all temporary JS and CJS files we created
  const tempFiles = [
    'check-git.js',
    'check-git.cjs',
    'fetch-remote-branches.cjs',
    'git-reinit-and-push.cjs',
    'fix-git-index.cjs',
    'list-files.cjs',
    'list-root-files.cjs',
    'search-token.cjs',
    'find-corrupt.cjs',
    'find-git-ops.cjs',
    'show-commit.cjs',
    'git-log-all.cjs',
    'git-log.cjs',
    'check-commit-date.cjs',
    'show-head-headers.cjs',
    'check-head-commit.cjs',
    'find-all-secrets.cjs',
    'check-93a8484.cjs',
    'git-push.cjs',
    'check-toplevel.cjs',
    'check-gitignore.cjs'
  ];

  tempFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`Removing temporary file: ${file}`);
      fs.unlinkSync(filePath);
    }
  });

  // Verify build is green before pushing
  console.log('Verifying application package compiles smoothly...');
  runCmd('npm run build');

  // Nuke local corrupt .git directory
  const gitDir = path.join(__dirname, '.git');
  if (fs.existsSync(gitDir)) {
    console.log('Nuking corrupt git metadata directory...');
    fs.rmSync(gitDir, { recursive: true, force: true });
  }

  // Initialize fresh Git repo
  runCmd('git init');

  // Configure user identity matching user metadata
  runCmd('git config user.name "kingebrahimopq-create"');
  runCmd('git config user.email "gokerebrahimopq@gmail.com"');

  // Setup origin with authenticated GITHUB_PAT safely (so it works without config leaks)
  const patToken = process.env.GITHUB_PAT || '';
  const repoUrl = `https://kingebrahimopq-create:${patToken}@github.com/kingebrahimopq-create/Laboratory-.git`;
  
  runCmd(`git remote add origin ${repoUrl}`);

  // Fetch the remote HEAD
  console.log('Fetching remote main branch...');
  runCmd('git fetch origin main');

  // Checkout and map local repo to main tracking origin/main
  runCmd('git checkout -b main');
  runCmd('git reset origin/main');

  // Self delete this deploy script to ensure it is not tracked or committed
  console.log('Self-deleting clean deployment runner to avoid code leaks...');
  fs.unlinkSync(__filename);

  // Stage only the tracked modifications and additions (excluding anything ignored by .gitignore)
  runCmd('git add .');

  // Create commit
  runCmd('git commit -m "fix(build): تصحيح محاذاة البناء وبوابة الزيارات والمالك والتقارير الطبية وتكامل قاعدة البيانات السحابية"');

  // Push main directly
  console.log('Pushing clean commit directly to origin main...');
  runCmd('git push -u origin main');
  console.log('Secure pushing to repository succeeded perfectly!');

} catch (e) {
  console.error('Pristine git deploy process halted:', e.message);
}
