const https = require('https');

const pat = process.env.GITHUB_PAT;
const owner = 'kingebrahimopq-create';
const repo = 'Laboratory-';
const jobId = process.argv[2] || '82549627884';

const options = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`,
  method: 'GET',
  headers: {
    'User-Agent': 'NodeJS',
    'Authorization': 'token ' + pat
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`=== LOGS FOR JOB ${jobId} ===`);
    console.log(data);
  });
});

req.on('error', console.error);
req.end();
