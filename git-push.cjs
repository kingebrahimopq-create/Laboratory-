const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCmd(cmd) {
  console.log(`Running: ${cmd}`);
  try {
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    console.log('Output:', output);
    return output;
  } catch (error) {
    console.error('CMD Error:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
    throw error;
  }
}

try {
  // Delete all other temporary files first
  const fileNames = [
    'check-git.js',
    'check-git.cjs',
    'fetch-remote-branches.cjs',
    'git-reinit-and-push.cjs',
    'fix-git-index.cjs'
  ];

  fileNames.forEach(name => {
    const filePath = path.join(__dirname, name);
    if (fs.existsSync(filePath)) {
      console.log(`Removing ${name}...`);
      fs.unlinkSync(filePath);
    }
  });

  const gitDir = path.join(__dirname, '.git');
  if (fs.existsSync(gitDir)) {
    console.log('Re-cleaning .git directory...');
    fs.rmSync(gitDir, { recursive: true, force: true });
  }

  // Initialize new repository
  runCmd('git init');

  // Configure user details
  runCmd('git config user.name "kingebrahimopq-create"');
  runCmd('git config user.email "gokerebrahimopq@gmail.com"');

  // Add remote with secret token
  const patToken = process.env.GITHUB_PAT || '';
  const remoteUrl = `https://${patToken}@github.com/kingebrahimopq-create/Laboratory-.git`;
  runCmd(`git remote add origin ${remoteUrl}`);

  // Fetch the remote main branch
  runCmd('git fetch origin main');

  // Checkout and map index
  runCmd('git checkout -b main');
  runCmd('git reset origin/main');

  // SELF DELETION: Delete this file before adding to git so that no secrets are contained in any added files!
  console.log('Self-deleting script to ensure no credentials exist in the git stage...');
  fs.unlinkSync(__filename);

  // Run add, commit, and push
  runCmd('git add .');
  runCmd('git commit -m "fix(build): تصحيح أخطاء البناء وتكامل الزيارات المنزلية وتفويض رخص المالك"');
  
  console.log('Pushing clean changes to GitHub...');
  runCmd('git push origin main');
  console.log('Successfully completed git push cleanly!');

} catch (e) {
  console.error('Failed to complete clean git push:', e.message);
}
