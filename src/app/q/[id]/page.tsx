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
  const { data: items, error: itemsError } = await supabase
    .from('invoice_items')
    .select(`
      *,
      addons:invoice_item_addons(*)
    `)
    .eq('invoice_id', invoice.id)

  const fullInvoice = {
    ...invoice,
    items: items || []
  }

  return <QuoteViewer invoice={fullInvoice} />
}
