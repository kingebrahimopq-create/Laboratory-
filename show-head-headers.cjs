const { execSync } = require('child_process');
try {
  const show = execSync('git log -n 1 --stat HEAD', { encoding: 'utf8' });
  const lines = show.split('\n').slice(0, 10).join('\n');
  console.log('Class info:\n', lines);
} catch (error) {
  console.error('Error running git log:', error.message);
}
