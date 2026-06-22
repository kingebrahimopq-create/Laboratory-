import 'dotenv/config';

async function run() {
  const pat = process.env.GITHUB_PAT;
  const owner = 'kingebrahimopq-create';
  const repo = 'Laboratory-';
  const runId = '27905140177';
  
  const jobsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/jobs`;
  const jobsResp = await fetch(jobsUrl, {
    headers: {
      'Authorization': `token ${pat}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Node'
    }
  });
  const jobsData: any = await jobsResp.json();
  if (!jobsData.jobs) {
    console.log('No jobs info found.');
    return;
  }
  
  console.log(`--- Jobs status for Run ${runId} ---`);
  for (const job of jobsData.jobs) {
    console.log(`Job: ${job.name} | Status: ${job.status} | Conclusion: ${job.conclusion || 'Pending/Running'}`);
  }
}
run().catch(console.error);
