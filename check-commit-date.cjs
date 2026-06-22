const { execSync } = require('child_process');
try {
  const show = execSync('git show --stat 3aa050d', { encoding: 'utf8' });
  console.log('Commit 3aa050d:\n', show);
} catch (error) {
  console.error('Error running git show:', error.message);
}
