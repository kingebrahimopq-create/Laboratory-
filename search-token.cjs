const fs = require('fs');
const path = require('path');

function searchDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === '.github') continue;
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDirectory(fullPath);
    } else {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('ghp_')) {
        console.log(`Found ghp_ token in file: ${fullPath}`);
        // Let's print the line
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('ghp_')) {
            console.log(`  Line ${index + 1}: ${line.trim().substring(0, 50)}...`);
          }
        });
      }
    }
  }
}

console.log('Searching for ghp_ tokens in the project...');
searchDirectory(__dirname);
