const fs = require('fs');

const contents = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = contents.split('\n');

const goodLines = lines.slice(0, 827); // up to 826
goodLines.push('}');
goodLines.push('export default App;');
fs.writeFileSync('src/App.tsx', goodLines.join('\n'));
console.log('Fixed file properly');
