import dotenv from 'dotenv';

dotenv.config({ override: true });

async function mergeLatestPR() {
  const token = process.env.GITHUB_PAT || '';
  const owner = 'kingebrahimopq-create';
  const repo = 'Laboratory-';

  try {
    const listUrl = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open`;
    console.log(`Fetching open pull requests...`);
    const response = await fetch(listUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'NodeJS-Fetch'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PR list: ${response.statusText}`);
    }

    const prs = await response.json() as any[];
    const targetPR = prs.find(pr => pr.head.ref === 'update-laboratory');

    if (!targetPR) {
      console.log('No open Pull Request found for branch "update-laboratory".');
      return;
    }

    const prNumber = targetPR.number;
    const mergeUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/merge`;
    console.log(`Sending merge request for PR #${prNumber} to ${mergeUrl}...`);
    
    const mergeResponse = await fetch(mergeUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'NodeJS-Fetch'
      },
      body: JSON.stringify({
        commit_title: `🔬 Laboratory Update v1.0.20 [Auto-Merged]`,
        commit_message: 'Auto-merging pull request from dev container to update main branch and trigger release workflow.'
      })
    });

    if (mergeResponse.ok) {
      const data = await mergeResponse.json() as any;
      console.log('✅ PR Merged successfully!');
      console.log(data);
    } else {
      console.error(`❌ Failed to merge PR. Status: ${mergeResponse.status} ${mergeResponse.statusText}`);
      const err = await mergeResponse.text();
      console.error(err);
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

mergeLatestPR();
