import git from 'isomorphic-git';
import { promises as fs } from 'fs';
import path from 'path';

async function gitDiffDebug() {
  const dir = process.cwd();
  try {
    const status = await git.status({ fs, dir, filepath: 'server.ts' });
    console.log(`server.ts status: ${status}`);

    const list = await fs.readdir(dir);
    for (const file of list) {
      if (file.endsWith('.ts') && file !== 'github_push.ts') {
        const fileStatus = await git.status({ fs, dir, filepath: file });
        console.log(`- ${file} status: ${fileStatus}`);
      }
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

gitDiffDebug();
