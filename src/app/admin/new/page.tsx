import InvoiceForm from './InvoiceForm'
import { createClient } from '@/utils/supabase/server'

export default async function NewInvoicePage() {
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('*, product_fabrics(*)').order('name')

  const transformedProducts = (products || []).map(p => ({
    id: p.id,
    name: p.name,
    visible_name: p.visible_name || null,
    image_url: p.image_url || null,
    fabrics: p.product_fabrics || []
  }))

  return <InvoiceForm products={transformedProducts} />
}
