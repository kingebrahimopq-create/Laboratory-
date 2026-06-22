const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');

async function listRemoteRefs() {
  const token = (process.env.GITHUB_PAT || '').replace(/^"|"$/g, '').trim();
  if (!token) {
    console.error('No valid token provided.');
    return;
  }
  try {
    const refs = await git.listServerRefs({
      http,
      url: 'https://github.com/kingebrahimopq-create/Laboratory-.git',
      onAuth: () => ({ username: token })
    });
    console.log('--- REMOTE REFS ---');
    refs.forEach(ref => {
      console.log(`${ref.ref} -> ${ref.oid}`);
    });
  } catch (error) {
    console.error('Failed to list refs:', error);
  }
}

listRemoteRefs();
