const fs = require('fs');
fs.readdirSync('.').forEach(file => {
  console.log(file);
});
