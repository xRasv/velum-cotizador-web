import { createClient } from '@/utils/supabase/server'
import FabricPricesClient from './FabricPricesClient'

export const revalidate = 0

export default async function FabricPricesPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, visible_name, image_url')
    .order('name')

  return <FabricPricesClient products={products || []} />
}
