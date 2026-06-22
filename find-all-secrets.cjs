const { execSync } = require('child_process');
try {
  const result = execSync('find . -name "*git-ops.cjs*" -o -name "*git.corrupt*"', { encoding: 'utf8' });
  console.log('Found physical paths:\n', result);
} catch (error) {
  console.error('Error finding files:', error.message);
}
