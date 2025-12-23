'use client';

import { formatPrice } from '@/lib/utils/format';
import type { WooCommerceVariation } from '@/types/woocommerce';
import type { MongoVariant } from '@/types/mongodb';

/**
 * Variation type that supports both WooCommerce and MongoDB formats
 */
type Variation = WooCommerceVariation | MongoVariant | {
  size?: string;
  color?: string;
  price: string | number;
  regular_price?: string | number;
  sale_price?: string | number;
  on_sale?: boolean;
  attributes?: Array<{
    name: string;
    option: string;
  }>;
};

interface ProductHighlightsProps {
  description?: string;
  attributes?: Array<{
    name: string;
    options: string[];
  }>;
  material?: string;
  origin?: string;
  variations?: Variation[];
}

export function ProductHighlights({
  description,
  attributes,
  material,
  origin,
  variations,
}: ProductHighlightsProps) {

  // Extract highlights from description or attributes
  const highlights: string[] = [];
  
  if (description && typeof window !== 'undefined') {
    // Simple extraction: Look for list items or bullet points (client-side only)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = description;
    const listItems = tempDiv.querySelectorAll('li, ul li');
    listItems.forEach((li) => {
      const text = li.textContent?.trim();
      if (text && text.length > 0) {
        highlights.push(text);
      }
    });
  } else if (description) {
    // Fallback: Simple text extraction (server-side)
    const lines = description.split(/<[^>]+>/).filter(line => line.trim().length > 0);
    highlights.push(...lines.slice(0, 5)); // Limit to 5 highlights
  }

  // Add material and origin if available
  if (material) highlights.push(`Chất liệu: ${material}`);
  if (origin) highlights.push(`Xuất xứ: ${origin}`);

  // Price Table from variations
  // Support both WooCommerce format (with attributes) and MongoDB format (direct size/color fields)
  const priceTable = variations
    ?.filter((v) => {
      const price = typeof v.price === 'number' ? v.price : parseFloat(String(v.price || '0'));
      const regularPrice = typeof (v as any).regular_price === 'number' 
        ? (v as any).regular_price 
        : parseFloat(String((v as any).regular_price || '0'));
      return price > 0 || regularPrice > 0;
    })
    .map((v) => {
      // Try MongoDB format first (direct size field)
      let size = 'N/A';
      if ('size' in v && v.size) {
        size = String(v.size);
      } else if ('attributes' in v && Array.isArray(v.attributes)) {
        // Fallback to WooCommerce format (attributes array)
        const sizeAttr = v.attributes.find((attr: any) =>
          attr.name?.toLowerCase().includes('size') ||
          attr.name?.toLowerCase().includes('kích thước') ||
          attr.name?.toLowerCase().includes('kich thuoc')
      );
        size = sizeAttr?.option || 'N/A';
      }
      
      // Get price (support both formats)
      // MongoDB variants don't have on_sale, only price
      const hasOnSale = 'on_sale' in v && (v as any).on_sale;
      const salePrice = (v as any).sale_price;
      const price = (hasOnSale && salePrice) 
        ? salePrice 
        : (v.price || (v as any).regular_price || '0');
      
      return {
        size,
        price: typeof price === 'number' ? price.toString() : String(price),
      };
    })
    .sort((a, b) => {
      // Sort by size (try to parse as number)
      const aNum = parseFloat(a.size.replace(/[^\d.]/g, ''));
      const bNum = parseFloat(b.size.replace(/[^\d.]/g, ''));
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.size.localeCompare(b.size);
    });

  return (
    <div className="space-y-6">
      {/* Highlights List */}
      {highlights.length > 0 && (
        <div>
          <h3 className="font-heading text-lg font-semibold mb-4">
            Đặc điểm nổi bật
          </h3>
          <ul className="list-disc list-inside space-y-2 marker:text-primary text-text-main">
            {highlights.map((highlight, index) => (
              <li key={index} className="text-sm">
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price Table */}
      {priceTable && priceTable.length > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
          <h3 className="font-heading text-lg font-semibold mb-3">
            Kích thước & Giá
          </h3>
          <div className="space-y-2">
            {priceTable.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-pink-200 last:border-0"
              >
                <span className="text-sm font-medium text-text-main">
                  Size {index + 1}: {item.size}
                </span>
                <span className="text-sm font-bold text-primary">
                  {formatPrice(item.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

