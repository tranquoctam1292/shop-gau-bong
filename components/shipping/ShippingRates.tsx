'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useShippingRates } from '@/lib/hooks/useShippingRates';
import type { ShippingAddress } from '@/lib/services/shipping';
import { formatShippingCost } from '@/lib/services/shipping';

interface ShippingRatesProps {
  address: ShippingAddress | null;
  selectedRateId?: string;
  onSelectRate?: (rate: any) => void;
}

export function ShippingRates({
  address,
  selectedRateId,
  onSelectRate,
}: ShippingRatesProps) {
  const { rates, loading, error, selectedRate } = useShippingRates(address);

  if (loading) {
    return (
      <Card className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />
        <Skeleton className="h-16 w-full rounded-lg" variant="rectangular" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-destructive/10">
        <p className="text-sm text-destructive">{error}</p>
      </Card>
    );
  }

  if (rates.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-text-muted">
          Vui lòng nhập địa chỉ giao hàng để tính phí vận chuyển
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {rates.map((rate, index) => {
        const rateId = `${rate.provider}-${index}`;
        const isSelected = selectedRateId === rateId || (!selectedRateId && index === 0);

        return (
          <Card
            key={rateId}
            className={`p-4 cursor-pointer transition-all ${
              isSelected
                ? 'border-primary border-2 bg-primary/5'
                : 'border hover:border-primary/50'
            }`}
            onClick={() => onSelectRate?.(rate)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="shipping-rate"
                    checked={isSelected}
                    onChange={() => onSelectRate?.(rate)}
                    className="mt-1"
                  />
                  <span className="font-semibold">{rate.provider}</span>
                  <span className="text-sm text-text-muted">- {rate.service}</span>
                </div>
                {rate.note && (
                  <p className="text-xs text-text-muted ml-6">{rate.note}</p>
                )}
                <p className="text-xs text-text-muted ml-6">
                  Dự kiến giao hàng: {rate.estimatedDays} ngày
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary text-lg">
                  {formatShippingCost(rate.cost)}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

