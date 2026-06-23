const fs = require('fs');
const glob = require('glob');

const files = [
  'src/lib/db.ts',
  'src/lib/inventory.ts',
  'src/lib/homevisits.ts',
  'src/lib/notifications.ts',
  'src/lib/auth.ts',
  'src/lib/driveAuth.ts',
  'src/components/patients/AdminPanel.tsx',
  'src/components/auth/LoginForm.tsx',
  'src/components/auth/ProtectedRoute.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  if (file.includes('components/')) {
    content = content.replace(/'firebase\/firestore'/g, "'../../lib/supabase-firestore'");
    content = content.replace(/'firebase\/auth'/g, "'../../lib/supabase-auth'");
  } else {
    content = content.replace(/'firebase\/firestore'/g, "'./supabase-firestore'");
    content = content.replace(/'firebase\/auth'/g, "'./supabase-auth'");
  }
  
  fs.writeFileSync(file, content);
}
console.log('Replaced imports successfully.');
