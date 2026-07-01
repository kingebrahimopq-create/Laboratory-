import git from 'isomorphic-git';
import { promises as fs } from 'fs';

async function logLocalGit() {
  const dir = process.cwd();
  try {
    const head = await git.resolveRef({ fs, dir, ref: 'HEAD' });
    console.log(`Local HEAD points to: ${head}`);

    const commits = await git.log({ fs, dir, depth: 5 });
    console.log('Local commit log:');
    for (const commit of commits) {
      console.log(`- SHA: ${commit.oid}`);
      console.log(`  Message: ${commit.commit.message.trim()}`);
      console.log(`  Parents: ${commit.commit.parent.join(', ')}`);
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

logLocalGit();
