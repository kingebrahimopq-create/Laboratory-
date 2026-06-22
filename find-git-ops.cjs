const fs = require('fs');
const { execSync } = require('child_process');
try {
  const result = execSync('find / -name "*git-ops.cjs*" 2>/dev/null', { encoding: 'utf8' });
  console.log('Found git-ops.cjs paths:\n', result);
} catch (error) {
  console.error('Error finding files:', error.message);
}
