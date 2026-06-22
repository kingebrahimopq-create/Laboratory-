const https = require('https');

const pat = process.env.GITHUB_PAT;
const jobId = process.argv[2] || '82549627884';

function getLogs(url, isRedirect = false) {
  const parsedUrl = new URL(url);
  const headers = { 'User-Agent': 'NodeJS' };
  if (!isRedirect && parsedUrl.hostname === 'api.github.com') {
    headers['Authorization'] = 'token ' + pat;
  }
  https.get(url, { headers }, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      getLogs(res.headers.location, true);
    } else {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`=== LOGS FOR JOB ${jobId} ===`);
        console.log(data.split('\n').slice(-100).join('\n')); // last 100 lines
      });
    }
  }).on('error', console.error);
}

const initialUrl = `https://api.github.com/repos/kingebrahimopq-create/Laboratory-/actions/jobs/${jobId}/logs`;
getLogs(initialUrl);
