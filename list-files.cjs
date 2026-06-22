const { execSync } = require('child_process');
try {
  const files = execSync('find . -maxdepth 2 -not -path "*/.*"', { encoding: 'utf8' });
  console.log('Project Files:\n', files);
} catch (error) {
  console.error('Error listing files:', error.message);
}
