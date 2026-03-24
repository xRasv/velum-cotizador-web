import { createClient } from '@/utils/supabase/server'
import AdminDashboard from './AdminDashboard'

export const revalidate = 0

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch all invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  // Calculate stats from the fetched data
  const total = invoices?.length || 0
  const pending = invoices?.filter(i => i.status === 'pending' || i.status === 'draft').length || 0
  const approved = invoices?.filter(i => i.status === 'accepted').length || 0

  const stats = { total, pending, approved }

  return <AdminDashboard invoices={invoices} stats={stats} />
}
