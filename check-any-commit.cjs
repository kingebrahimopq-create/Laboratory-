const { execSync } = require('child_process');
try {
  const show = execSync('git show --stat 93a8484735b36e2234c9cd21dbd485ef91ea696f', { encoding: 'utf8' });
  console.log('Commit 93a8484:\n', show);
} catch (error) {
  console.error('Error running git show on 93a8484:', error.message);
}
