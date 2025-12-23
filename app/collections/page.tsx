import { redirect } from 'next/navigation';

/**
 * Collections page - redirects to products with collection filter
 * Collections are displayed as filtered products
 */
export default function CollectionsPage() {
  redirect('/products');
}

