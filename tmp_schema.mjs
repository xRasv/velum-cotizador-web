import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://djrjeescjwwqaprmhksf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcmplZXNjand3cWFwcm1oa3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODI2MzMsImV4cCI6MjA4OTg1ODYzM30.24xtZyeJqNFysgujO_G7CXFOvgj0d2sQy9fW-dkbe-8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.storage.listBuckets()
  console.log('Buckets:', data?.map(b => b.name), error)
}
run()
