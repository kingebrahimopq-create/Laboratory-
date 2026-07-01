import dotenv from 'dotenv';

dotenv.config({ override: true });

async function getPRs() {
  const token = process.env.GITHUB_PAT || '';
  const owner = 'kingebrahimopq-create';
  const repo = 'Laboratory-';

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=all`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'NodeJS-Fetch'
      }
    });

    if (response.ok) {
      const data = await response.json() as any[];
      console.log(`Found ${data.length} Pull Requests:`);
      for (const pr of data) {
        console.log(`- #${pr.number}: ${pr.title} (${pr.state})`);
        console.log(`  Head: ${pr.head.label}, Base: ${pr.base.label}`);
        console.log(`  URL: ${pr.html_url}`);
      }
    } else {
      console.error(`Failed to fetch PRs. Status: ${response.status} ${response.statusText}`);
      const err = await response.text();
      console.error(err);
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

getPRs();
