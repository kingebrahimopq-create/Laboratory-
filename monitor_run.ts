import 'dotenv/config';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const pat = process.env.GITHUB_PAT;
  const owner = 'kingebrahimopq-create';
  const repo = 'Laboratory-';
  const runId = '27903606241';
  
  console.log('=== Checking GHA Build in Real-Time ===');
  
  for (let i = 0; i < 10; i++) {
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
      await delay(15000);
      continue;
    }
    
    console.log(`\n--- [Attempt ${i+1}/10] Run ${runId} Status ---`);
    let allFinished = true;
    for (const job of jobsData.jobs) {
      console.log(`Job: ${job.name} | Status: ${job.status} | Conclusion: ${job.conclusion || 'In Progress'}`);
      if (job.status !== 'completed') {
        allFinished = false;
      }
    }
    
    if (allFinished) {
      console.log('\nAll jobs have finished!');
      return;
    }
    
    await delay(15000);
  }
  console.log('\nPolling timed out. Checking again next run.');
}
run().catch(console.error);
