import 'dotenv/config';

async function run() {
  const pat = process.env.GITHUB_PAT;
  const owner = 'kingebrahimopq-create';
  const repo = 'Laboratory-';
  
  const runsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`;
  const runsResp = await fetch(runsUrl, {
    headers: {
      'Authorization': `token ${pat}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Node'
    }
  });
  const runsData: any = await runsResp.json();
  const latestRun = runsData.workflow_runs?.[0];
  if (!latestRun) {
    console.log('No runs found.');
    return;
  }
  
  console.log('NEW RUN ID:', latestRun.id);
  console.log('Status:', latestRun.status);
  console.log('Conclusion:', latestRun.conclusion);
}
run().catch(console.error);
