import { createClient } from '@/utils/supabase/server'
import AdminDashboard from './AdminDashboard'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  return <AdminDashboard invoices={invoices} />
}
