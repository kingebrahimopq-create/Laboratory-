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
  const gitDir = path.join(__dirname, '.git');
  if (fs.existsSync(gitDir)) {
    console.log('Deleting corrupted .git directory...');
    fs.rmSync(gitDir, { recursive: true, force: true });
  }

  // Initialize new repository
  runCmd('git init');

  // Configure user details
  runCmd('git config user.name "kingebrahimopq-create"');
  runCmd('git config user.email "gokerebrahimopq@gmail.com"');

  // Add remote
  const patToken = process.env.GITHUB_PAT || '';
  const remoteUrl = `https://${patToken}@github.com/kingebrahimopq-create/Laboratory-.git`;
  runCmd(`git remote add origin ${remoteUrl}`);

  // Fetch the remote main branch
  runCmd('git fetch origin main');

  // Create local main branch and track origin/main
  runCmd('git checkout -b main');
  runCmd('git reset origin/main');

  console.log('Verifying status of local changes:');
  const status = runCmd('git status');

  // Check if there are modified files to push
  if (status.includes('Changes not staged for commit') || status.includes('Untracked files')) {
    console.log('Adding files and committing...');
    runCmd('git add .');
    runCmd('git commit -m "fix(build): تصحيح أخطاء البناء وبوابة المستندات والزيارات والمالك ومطابقة تجربة المريض"');
    
    console.log('Pushing changes to remote github...');
    runCmd('git push origin main');
    console.log('Successfully pushed changes to remote!');
  } else {
    console.log('No local changes found to push.');
  }

} catch (e) {
  console.error('Failed to complete git sync process:', e.message);
}
