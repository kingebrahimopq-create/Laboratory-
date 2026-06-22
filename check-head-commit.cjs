const { execSync } = require('child_process');
try {
  const show = execSync('git show --stat HEAD', { encoding: 'utf8' });
  console.log('Git HEAD Commit:\n', show);
} catch (error) {
  console.error('Error running git show HEAD:', error.message);
}
