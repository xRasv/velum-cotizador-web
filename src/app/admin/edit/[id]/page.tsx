import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import InvoiceForm from '@/app/admin/new/InvoiceForm'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  // Fetch products for the dropdown
  const { data: products } = await supabase
    .from('products')
    .select('*, product_fabrics(*)')
    .order('name')

  const transformedProducts = (products || []).map(p => ({
    id: p.id,
    name: p.name,
    visible_name: p.visible_name || null,
    image_url: p.image_url || null,
    fabrics: p.product_fabrics || []
  }))

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-4 pb-32">
      <div className="mb-4">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Editar Cotización</h2>
        <p className="text-slate-500 font-medium tracking-wide text-sm">Modifica los detalles de la cotización existente.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8">
        <InvoiceForm products={transformedProducts} initialData={fullInvoice} invoiceId={invoice.id} />
      </div>
    </div>
  )
}
