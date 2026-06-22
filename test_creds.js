const https = require('https');
const fs = require('fs');
const path = require('path');

let token = '';
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('GITHUB_PAT=')) {
      const val = line.split('=')[1];
      if (val) {
        token = val.replace(/^"|"$/g, '').trim();
      }
    }
  }
}

console.log('Testing GITHUB_PAT with length:', token.length);
if (!token) {
  console.error('Error: Token not found in .env');
  process.exit(1);
}

const options = {
  hostname: 'api.github.com',
  port: 443,
  path: '/user',
  method: 'GET',
  headers: {
    'User-Agent': 'Node-Agent',
    'Authorization': `token ${token}`
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('GitHub API Response Status:', res.statusCode);
    if (res.statusCode === 200) {
      const user = JSON.parse(body);
      console.log('SUCCESS! Authenticated as:', user.login);
    } else {
      console.log('FAILED! Response was:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
