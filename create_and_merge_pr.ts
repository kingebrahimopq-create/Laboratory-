import dotenv from 'dotenv';

dotenv.config({ override: true });

async function createAndMergePR() {
  const token = process.env.GITHUB_PAT || '';
  const owner = 'kingebrahimopq-create';
  const repo = 'Laboratory-';

  try {
    // 1. Create Pull Request
    const createUrl = `https://api.github.com/repos/${owner}/${repo}/pulls`;
    console.log(`Creating Pull Request from "update-laboratory" to "main"...`);
    
    const prResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'NodeJS-Fetch'
      },
      body: JSON.stringify({
        title: '🔬 Laboratory Update v1.0.20',
        head: 'update-laboratory',
        base: 'main',
        body: 'Automated codebase update to trigger version 1.0.20 release with smart in-app update popups.'
      })
    });

    let prNumber: number | null = null;

    if (prResponse.ok) {
      const prData = await prResponse.json() as any;
      prNumber = prData.number;
      console.log(`✅ Pull Request #${prNumber} created successfully!`);
    } else {
      const errText = await prResponse.text();
      console.log(`PR creation response status: ${prResponse.status}`);
      
      // If PR already exists, try to find it
      if (errText.includes('A pull request already exists')) {
        console.log('A pull request already exists. Fetching open PRs...');
        const listUrl = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open`;
        const listResponse = await fetch(listUrl, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'NodeJS-Fetch'
          }
        });
        
        if (listResponse.ok) {
          const prs = await listResponse.json() as any[];
          const existingPr = prs.find(pr => pr.head.ref === 'update-laboratory');
          if (existingPr) {
            prNumber = existingPr.number;
            console.log(`Found existing open PR #${prNumber}`);
          }
        }
      } else {
        console.error(`❌ Failed to create PR:`, errText);
        return;
      }
    }

    if (!prNumber) {
      console.error('Could not obtain a valid PR number.');
      return;
    }

    // 2. Merge Pull Request
    const mergeUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/merge`;
    console.log(`Merging PR #${prNumber}...`);
    
    const mergeResponse = await fetch(mergeUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'NodeJS-Fetch'
      },
      body: JSON.stringify({
        commit_title: '🔬 Laboratory Update v1.0.20 [Auto-Merged]',
        commit_message: 'Merging branch update-laboratory into main to trigger the build and release workflow.'
      })
    });

    if (mergeResponse.ok) {
      const mergeData = await mergeResponse.json() as any;
      console.log('✅ PR Merged successfully! GitHub Actions is now building and deploying.');
      console.log(mergeData);
    } else {
      console.error(`❌ Failed to merge PR. Status: ${mergeResponse.status}`);
      console.error(await mergeResponse.text());
    }

  } catch (err: any) {
    console.error('Error:', err.message || err);
  }
}

createAndMergePR();
