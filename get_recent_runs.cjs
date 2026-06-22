const https = require('https');

const pat = process.env.GITHUB_PAT;
const owner = 'kingebrahimopq-create';
const repo = 'Laboratory-';

const options = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/actions/runs?per_page=10`,
  method: 'GET',
  headers: {
    'User-Agent': 'NodeJS',
    'Authorization': 'token ' + pat,
    'Accept': 'application/vnd.github.v3+json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const obj = JSON.parse(data);
      if (obj.workflow_runs) {
        console.log('Recent 10 runs:');
        obj.workflow_runs.forEach(run => {
          console.log(`- #${run.id}: "${run.name}"`);
          console.log(`  Event: ${run.event} | Status: ${run.status} | Conclusion: ${run.conclusion}`);
          console.log(`  Commit: ${run.head_commit?.message?.split('\n')?.[0]}`);
          console.log(`  Created: ${run.created_at}`);
        });
      } else {
        console.log('No runs found in response.');
      }
    } catch (e) {
      console.error(e);
    }
  });
});

req.on('error', console.error);
req.end();
