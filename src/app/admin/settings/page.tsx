import { createClient } from '@/utils/supabase/server'
import ProductSettingsClient from './ProductSettingsClient'

export const revalidate = 0

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*, product_fabrics(*)')
    .order('name')

  // Transform the data to match the expected shape
  const transformedProducts = (products || []).map(p => ({
    id: p.id,
    name: p.name,
    visible_name: p.visible_name || null,
    image_url: p.image_url || null,
    fabrics: p.product_fabrics || []
  }))

  return <ProductSettingsClient initialProducts={transformedProducts} />
}
