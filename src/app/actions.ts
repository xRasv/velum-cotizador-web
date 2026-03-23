'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function createInvoice(formData: FormData) {
  const cookieStore = await cookies()
  if (cookieStore.get('velum_admin_auth')?.value !== 'authenticated') {
    throw new Error('No autorizado')
  }

  const supabase = await createClient()

  const rawInvoice = {
    client_name: formData.get('client_name') as string,
    reference_code: formData.get('reference_code') as string,
    valid_until: formData.get('valid_until') as string,
    total_amount: Number(formData.get('total_amount')),
  }

  // 1. Insert Invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert([rawInvoice])
    .select()
    .single()

  if (invoiceError || !invoice) {
    console.error('Error creating invoice:', invoiceError)
    throw new Error('Failed to create invoice')
  }

  // Parse items from formData (this assumes items are submitted as a JSON string for simplicity in complex nested forms)
  const itemsJson = formData.get('items') as string
  if (itemsJson) {
    try {
      const items = JSON.parse(itemsJson)

      for (const item of items) {
        // 2. Insert Item
        const { data: insertedItem, error: itemError } = await supabase
          .from('invoice_items')
          .insert([{
            invoice_id: invoice.id,
            room_name: item.room_name,
            product_name: item.product_name,
            width: item.width,
            height: item.height,
            fabric_name: item.fabric_name,
            base_price: item.base_price,
            image_url: item.image_url || null
          }])
          .select()
          .single()

        if (itemError || !insertedItem) {
          console.error('Error creating item:', itemError)
          continue
        }

        // 3. Insert Addons
        if (item.addons && item.addons.length > 0) {
          const addonsToInsert = item.addons.map((a: any) => ({
            item_id: insertedItem.id,
            addon_name: a.addon_name,
            price: a.price,
            is_selected: a.is_selected || false
          }))

          await supabase.from('invoice_item_addons').insert(addonsToInsert)
        }
      }
    } catch (e) {
      console.error('Failed parsing items:', e)
    }
  }

  redirect('/admin')
}

export async function acceptInvoice(invoiceId: string) {
  // Public action, no cookie check needed since anyone with the link can accept their own quote
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .update({ status: 'accepted' })
    .eq('id', invoiceId)

  if (error) {
    console.error('Error accepting invoice:', error)
    return { error: 'No se pudo aceptar la cotización' }
  }

  // Next.js cache revalidation could be added here if needed
  return { success: true }
}
