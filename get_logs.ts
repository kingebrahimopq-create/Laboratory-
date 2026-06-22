import 'dotenv/config';

async function run() {
  const pat = process.env.GITHUB_PAT;
  const owner = 'kingebrahimopq-create';
  const repo = 'Laboratory-';
  const runId = '27903249912';
  
  const jobsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/jobs`;
  const jobsResp = await fetch(jobsUrl, {
    headers: {
      'Authorization': `token ${pat}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Node'
    }
  });
  const jobsData: any = await jobsResp.json();
  console.log('JOBS LIST:', jobsData.jobs?.map((j: any) => ({ name: j.name, status: j.status, conclusion: j.conclusion })));
  const failedJob = jobsData.jobs?.find((j: any) => j.name === 'Build Android App (APK)' || j.conclusion === 'failure');
  if (!failedJob) return console.log('No failed job.');
  
  const logsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/jobs/${failedJob.id}/logs`;
  const logsResp = await fetch(logsUrl, {
    headers: {
      'Authorization': `token ${pat}`,
      'User-Agent': 'Node'
    }
  });
  const logs = await logsResp.text();
  const lines = logs.split('\n');
  let errIdx = lines.findIndex(l => l.includes('FAILURE: Build failed') || l.includes('FAILED') || l.includes('Could not determine') || l.includes('compileSdkVersion') || l.includes('unsupported class file version') || l.includes('exception'));
  if (errIdx === -1) errIdx = lines.length - 150;
  console.log(lines.slice(Math.max(0, errIdx - 40), Math.min(lines.length, errIdx + 120)).join('\n'));
}
run().catch(console.error);
