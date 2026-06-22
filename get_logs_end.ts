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
  const failedJob = jobsData.jobs?.find((j: any) => j.name === 'Build Android App (APK)');
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
  console.log('=== Log End (Last 150 Lines) ===');
  console.log(lines.slice(Math.max(0, lines.length - 150)).join('\n'));
}
run().catch(console.error);
