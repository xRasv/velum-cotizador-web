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
    notes: (formData.get('notes') as string) || null,
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
    notes: (formData.get('notes') as string) || null,
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

export async function deleteInvoice(invoiceId: string) {
  const cookieStore = await cookies()
  if (cookieStore.get('velum_admin_auth')?.value !== 'authenticated') {
    throw new Error('No autorizado')
  }

  const supabase = await createClient()

  // Delete addons first (FK constraint)
  const { data: items } = await supabase.from('invoice_items').select('id').eq('invoice_id', invoiceId)
  if (items && items.length > 0) {
    await supabase.from('invoice_item_addons').delete().in('item_id', items.map(i => i.id))
  }
  // Delete items
  await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)
  // Delete invoice
  const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)

  if (error) {
    console.error('Error deleting invoice:', error)
    return { error: 'No se pudo eliminar la cotización' }
  }
  return { success: true }
}

export async function duplicateInvoice(invoiceId: string) {
  const cookieStore = await cookies()
  if (cookieStore.get('velum_admin_auth')?.value !== 'authenticated') {
    throw new Error('No autorizado')
  }

  const supabase = await createClient()

  // Fetch original invoice
  const { data: original } = await supabase.from('invoices').select('*').eq('id', invoiceId).single()
  if (!original) return { error: 'Cotización no encontrada' }

  // Generate new reference code
  const year = new Date().getFullYear()
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  const newRef = `VLM-${year}-${randomNum}`

  // Create new invoice
  const { data: newInvoice, error: invoiceError } = await supabase.from('invoices').insert([{
    client_name: original.client_name,
    reference_code: newRef,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: original.total_amount,
    notes: original.notes,
    status: 'pending'
  }]).select().single()

  if (invoiceError || !newInvoice) return { error: 'No se pudo duplicar' }

  // Fetch and clone items + addons
  const { data: items } = await supabase.from('invoice_items').select('*, addons:invoice_item_addons(*)').eq('invoice_id', invoiceId)

  if (items) {
    for (const item of items) {
      const { data: newItem } = await supabase.from('invoice_items').insert([{
        invoice_id: newInvoice.id,
        room_name: item.room_name,
        product_name: item.product_name,
        width: item.width,
        height: item.height,
        fabric_name: item.fabric_name,
        base_price: item.base_price,
        image_url: item.image_url
      }]).select().single()

      if (newItem && item.addons?.length > 0) {
        await supabase.from('invoice_item_addons').insert(
          item.addons.map((a: any) => ({
            item_id: newItem.id,
            addon_name: a.addon_name,
            price: a.price,
            is_selected: a.is_selected
          }))
        )
      }
    }
  }

  return { success: true, newId: newInvoice.id }
}

export async function saveFabricSelection(itemId: string, fabricName: string) {
  // Public action — customers can save their fabric preference
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoice_items')
    .update({ fabric_name: fabricName })
    .eq('id', itemId)

  if (error) {
    console.error('Error saving fabric selection:', error)
    return { error: 'No se pudo guardar la selección' }
  }
  return { success: true }
}
