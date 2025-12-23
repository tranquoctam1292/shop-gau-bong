'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToastContext } from '@/components/providers/ToastProvider';

interface SKUCellProps {
  sku: string | null | undefined;
}

export function SKUCell({ sku }: SKUCellProps) {
  const { showToast } = useToastContext();
  const [copied, setCopied] = useState(false);

  if (!sku || sku.trim() === '') {
    return <span className="text-sm text-gray-400">-</span>;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sku);
      setCopied(true);
      showToast('Đã sao chép SKU', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast('Không thể sao chép SKU', 'error');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-mono text-gray-700">{sku}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={handleCopy}
        title="Sao chép SKU"
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-600" />
        ) : (
          <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
        )}
      </Button>
    </div>
  );
}

