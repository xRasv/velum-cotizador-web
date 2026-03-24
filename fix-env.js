const { execSync } = require('child_process');

const url = 'https://djrjeescjwwqaprmhksf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcmplZXNjand3cWFwcm1oa3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODI2MzMsImV4cCI6MjA4OTg1ODYzM30.24xtZyeJqNFysgujO_G7CXFOvgj0d2sQy9fW-dkbe-8';

const envs = ['production', 'preview', 'development'];

for (const env of envs) {
  try {
    execSync(`npx vercel env rm NEXT_PUBLIC_SUPABASE_URL ${env} -y`, { stdio: 'ignore' });
  } catch (e) {}
  try {
    execSync(`npx vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY ${env} -y`, { stdio: 'ignore' });
  } catch (e) {}
  
  console.log(`Adding URL to ${env}...`);
  execSync(`npx vercel env add NEXT_PUBLIC_SUPABASE_URL ${env}`, { input: url, stdio: ['pipe', 'inherit', 'inherit'] });
  
  console.log(`Adding KEY to ${env}...`);
  execSync(`npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY ${env}`, { input: key, stdio: ['pipe', 'inherit', 'inherit'] });
}

console.log('Done mapping cleanly! Now triggering redeploy...');
execSync('npx vercel --prod --yes', { stdio: 'inherit' });
