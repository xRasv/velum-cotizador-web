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

export async function updateProduct(id: string, name: string, image_url: string | null, visible_name?: string) {
  const cookieStore = await cookies()
  if (cookieStore.get('velum_admin_auth')?.value !== 'authenticated') {
    throw new Error('No autorizado')
  }

  const supabase = await createClient()

  const updateData: Record<string, any> = { name, image_url }
  if (visible_name !== undefined) {
    updateData.visible_name = visible_name || null
  }

  const { error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating product:', error)
    return { error: 'No se pudo actualizar el producto' }
  }

  return { success: true }
}

// ---- Product Fabrics CRUD ----

export async function addProductFabric(productId: string, name: string, imageUrl: string | null) {
  const cookieStore = await cookies()
  if (cookieStore.get('velum_admin_auth')?.value !== 'authenticated') {
    throw new Error('No autorizado')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_fabrics')
    .insert([{ product_id: productId, name, image_url: imageUrl }])
    .select()
    .single()

  if (error) {
    console.error('Error adding fabric:', error)
    return { error: 'No se pudo agregar la tela' }
  }

  return { success: true, fabric: data }
}

export async function updateProductFabric(fabricId: string, name: string, imageUrl: string | null) {
  const cookieStore = await cookies()
  if (cookieStore.get('velum_admin_auth')?.value !== 'authenticated') {
    throw new Error('No autorizado')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('product_fabrics')
    .update({ name, image_url: imageUrl })
    .eq('id', fabricId)

  if (error) {
    console.error('Error updating fabric:', error)
    return { error: 'No se pudo actualizar la tela' }
  }

  return { success: true }
}

export async function deleteProductFabric(fabricId: string) {
  const cookieStore = await cookies()
  if (cookieStore.get('velum_admin_auth')?.value !== 'authenticated') {
    throw new Error('No autorizado')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('product_fabrics')
    .delete()
    .eq('id', fabricId)

  if (error) {
    console.error('Error deleting fabric:', error)
    return { error: 'No se pudo eliminar la tela' }
  }

  return { success: true }
}

export async function updateInvoice(formData: FormData) {
  const cookieStore = await cookies()
  if (cookieStore.get('velum_admin_auth')?.value !== 'authenticated') {
    throw new Error('No autorizado')
  }

  const supabase = await createClient()

  const invoiceId = formData.get('invoice_id') as string
  if (!invoiceId) throw new Error('Missing invoice ID')

  const rawInvoice = {
    client_name: formData.get('client_name') as string,
    reference_code: formData.get('reference_code') as string,
    valid_until: formData.get('valid_until') as string,
    total_amount: Number(formData.get('total_amount')),
  }

  // 1. Update Invoice
  const { error: invoiceError } = await supabase
    .from('invoices')
    .update(rawInvoice)
    .eq('id', invoiceId)

  if (invoiceError) {
    console.error('Error updating invoice:', invoiceError)
    throw new Error('Failed to update invoice')
  }

  // Parse items
  const itemsJson = formData.get('items') as string
  if (itemsJson) {
    try {
      const items = JSON.parse(itemsJson)

      // Fetch old item IDs to delete their associated addons first (to prevent foreign key constraint violations)
      const { data: oldItems } = await supabase.from('invoice_items').select('id').eq('invoice_id', invoiceId)
      if (oldItems && oldItems.length > 0) {
        const oldItemIds = oldItems.map(item => item.id)
        await supabase.from('invoice_item_addons').delete().in('item_id', oldItemIds)
      }

      // Delete old items and re-insert 
      await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)

      for (const item of items) {
        // Insert Item
        const { data: insertedItem, error: itemError } = await supabase
          .from('invoice_items')
          .insert([{
            invoice_id: invoiceId,
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

        // Insert Addons
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
