const https = require('https');

const pat = process.env.GITHUB_PAT;
const owner = 'kingebrahimopq-create';
const repo = 'Laboratory-';
const runId = process.argv[2] || '27896749349';

const options = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/actions/runs/${runId}/jobs`,
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
      console.log('JOBS:');
      if (obj.jobs) {
        obj.jobs.forEach(job => {
          console.log(`- Job Name: "${job.name}"`);
          console.log(`  ID: ${job.id}`);
          console.log(`  Status: ${job.status}`);
          console.log(`  Conclusion: ${job.conclusion}`);
          console.log(`  HTML URL: ${job.html_url}`);
          if (job.conclusion === 'failure') {
            console.log('  Failed steps:');
            job.steps.forEach(step => {
              if (step.conclusion === 'failure') {
                console.log(`    * Step: "${step.name}" (Status: ${step.status}, Conclusion: ${step.conclusion})`);
              }
            });
          }
        });
      } else {
        console.log('No jobs found in response:', obj);
      }
    } catch (e) {
      console.error(e);
    }
  });
});

req.on('error', console.error);
req.end();
