'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Voucher {
  code: string;
  discount: string;
  minOrder?: string; // e.g., "500K", "1tr", "2tr"
  description?: string;
}

interface VoucherSectionProps {
  vouchers?: Voucher[];
  className?: string;
}

// Default vouchers (hardcoded - có thể fetch từ API sau)
const defaultVouchers: Voucher[] = [
  {
    code: 'GIAM10K',
    discount: '10.000₫',
    minOrder: 'Đơn > 500K',
  },
  {
    code: 'GIAM20K',
    discount: '20.000₫',
    minOrder: 'Đơn > 1tr',
  },
  {
    code: 'GIAM40K',
    discount: '40.000₫',
    minOrder: 'Đơn > 2tr',
  },
];

export function VoucherSection({ vouchers = defaultVouchers, className }: VoucherSectionProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      
      // Reset after 2 seconds
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="font-bold text-sm text-text-main mb-3">
          VOUCHER KHUYẾN MÃI:
        </h3>
        
        {/* Vouchers List */}
        <div className="flex flex-wrap gap-3">
          {vouchers.map((voucher, index) => (
            <button
              key={index}
              onClick={() => handleCopyCode(voucher.code)}
              className={cn(
                'relative bg-pink-500 text-white px-4 py-2 rounded-lg',
                'hover:bg-pink-600 transition-colors',
                'flex flex-col items-center gap-1',
                'min-w-[120px]',
                'border-2 border-white shadow-sm'
              )}
            >
              <span className="font-bold text-sm">{voucher.code}</span>
              {voucher.minOrder && (
                <span className="text-xs opacity-90">{voucher.minOrder}</span>
              )}
              
              {/* Copy Icon */}
              <div className="absolute top-1 right-1">
                {copiedCode === voucher.code ? (
                  <Check className="w-3 h-3 text-white" />
                ) : (
                  <Copy className="w-3 h-3 text-white opacity-70" />
                )}
              </div>
            </button>
          ))}
        </div>
        
        {copiedCode && (
          <p className="text-xs text-green-600 mt-2">
            ✓ Đã copy mã: {copiedCode}
          </p>
        )}
      </div>
    </div>
  );
}

