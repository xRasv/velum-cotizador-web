import { createClient } from '@/utils/supabase/server'
import QuoteViewer from './QuoteViewer'
import { notFound } from 'next/navigation'

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  // Fetch invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (invoiceError || !invoice) {
    return notFound()
  }

  // Fetch items with their addons nested
  const { data: items } = await supabase
    .from('invoice_items')
    .select(`
      *,
      addons:invoice_item_addons(*)
    `)
    .eq('invoice_id', invoice.id)

  // Fetch all products with their fabrics for image/fabric enrichment
  const { data: products } = await supabase
    .from('products')
    .select('name, visible_name, image_url, product_fabrics(name, image_url)')

  // Enrich items with product images: use the product's uploaded image from settings,
  // not the stale image_url stored in invoice_items
  const enrichedItems = (items || []).map(item => {
    const matchedProduct = (products || []).find(
      p => p.name === item.product_name || p.visible_name === item.product_name
    )
    return {
      ...item,
      // Use the product settings image (always up-to-date), fall back to stored image_url
      image_url: matchedProduct?.image_url || item.image_url || '',
      // Find the matching fabric image if a fabric was selected
      fabric_image_url: item.fabric_name && matchedProduct
        ? (matchedProduct.product_fabrics || []).find((f: any) => f.name === item.fabric_name)?.image_url || null
        : null,
      // Pass ALL available fabrics for this product so the customer can pick
      available_fabrics: matchedProduct?.product_fabrics || []
    }
  })

  const fullInvoice = {
    ...invoice,
    items: enrichedItems
  }

  return <QuoteViewer invoice={fullInvoice} />
}
