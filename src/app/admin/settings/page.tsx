import { createClient } from '@/utils/supabase/server'
import ProductSettingsClient from './ProductSettingsClient'

export const revalidate = 0

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('name')

  return <ProductSettingsClient initialProducts={products || []} />
}
