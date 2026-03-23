import InvoiceForm from './InvoiceForm'
import { createClient } from '@/utils/supabase/server'

export default async function NewInvoicePage() {
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('*').order('name')

  return <InvoiceForm products={products || []} />
}
