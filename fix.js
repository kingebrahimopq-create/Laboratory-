import fs from 'fs';

const contents = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = contents.split('\n');

const goodLines = lines.slice(0, 828);
goodLines.push('export default App;');
fs.writeFileSync('src/App.tsx', goodLines.join('\n'));
console.log('Fixed file');
