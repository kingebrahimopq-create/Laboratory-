const { execSync } = require('child_process');
try {
  const result = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' });
  console.log('Git top level directory:\n', result);
} catch (error) {
  console.error('Error finding top level:', error.message);
}
