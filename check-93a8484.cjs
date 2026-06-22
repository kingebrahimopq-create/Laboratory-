const { execSync } = require('child_process');
try {
  const show = execSync('git log -n 1 --stat 93a8484735b36e2234c9cd21dbd485ef91ea696f', { encoding: 'utf8' });
  const lines = show.split('\n').slice(0, 10).join('\n');
  console.log('Commit 93a8484 info:\n', lines);
} catch (error) {
  console.error('Error running git show on 93a8484:', error.message);
}
