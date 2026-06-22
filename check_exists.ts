import fs from 'fs';
const repoDir = '/tmp/Laboratory-';
if (fs.existsSync(repoDir)) {
  console.log("Directory exists");
  console.log(fs.readdirSync(repoDir));
} else {
  console.log("Directory does NOT exist");
}
