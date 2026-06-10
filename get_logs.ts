import { execSync } from 'child_process';

const runId = '27210451064'; // Build Windows & Android Applications
const url = `https://api.github.com/repos/kingebrahimopq-create/Laboratory-/actions/runs/${runId}/jobs`;
try {
  const res = execSync(`curl -s -H "User-Agent: Node" ${url}`);
  const data = JSON.parse(res.toString());
  if (data.jobs) {
    for (const job of data.jobs) {
      console.log(`\nJob: ${job.name} (ID: ${job.id})`);
      // Let's fetch the logs of the job
      const logsUrl = `https://api.github.com/repos/kingebrahimopq-create/Laboratory-/actions/jobs/${job.id}/logs`;
      try {
        const logsStr = execSync(`curl -s -L -H "User-Agent: Node" ${logsUrl}`).toString();
        // Since logs can be long, find lines around failures
        const lines = logsStr.split('\n');
        console.log(`--- Totals lines in log: ${lines.length} ---`);
        let failedIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('##[error]') || lines[i].includes('Error:') || lines[i].includes('failed with exit code')) {
            console.log(`Error line ${i}: ${lines[i]}`);
            failedIndex = i;
          }
        }
        if (failedIndex !== -1) {
          console.log('\n--- Context of failure ---');
          const start = Math.max(0, failedIndex - 15);
          const end = Math.min(lines.length - 1, failedIndex + 10);
          for (let i = start; i <= end; i++) {
            console.log(`${i}: ${lines[i]}`);
          }
        } else {
          // just print last 30 lines
          console.log('\n--- Last 30 lines ---');
          const start = Math.max(0, lines.length - 30);
          for (let i = start; i < lines.length; i++) {
            console.log(`${i}: ${lines[i]}`);
          }
        }
      } catch (logErr: any) {
        console.error(`  Failed to get logs for job ${job.id}:`, logErr.message);
      }
    }
  }
} catch (e: any) {
  console.error('Error fetching jobs:', e.message);
}
