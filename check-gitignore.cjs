const fs = require('fs');
try {
  const content = fs.readFileSync('.gitignore', 'utf8');
  console.log('.gitignore contents:\n', content);
} catch (error) {
  console.error('Error reading .gitignore:', error.message);
}
