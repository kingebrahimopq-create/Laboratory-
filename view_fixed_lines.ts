import fs from 'fs';
import path from 'path';

const repoDir = '/tmp/Laboratory-';

try {
  const filePath = path.join(repoDir, 'artifacts/api-server/src/app.ts');
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    lines.forEach((line, index) => {
      console.log(`${index + 1}: ${line}`);
    });
  }
} catch (e: any) {
  console.error(e);
}
