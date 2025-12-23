/**
 * Shipment Info Component
 * 
 * Displays shipment information:
 * - Tracking number
 * - Carrier
 * - Link to carrier tracking page
 * - Estimated delivery date
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Truck, Package } from 'lucide-react';
import { getCarrierTrackingUrl, getCarrierLabel, type Carrier } from '@/lib/utils/shipment';

interface ShipmentInfoProps {
  orderId: string;
  trackingNumber?: string;
  carrier?: string;
}

export function ShipmentInfo({
  orderId,
  trackingNumber,
  carrier,
}: ShipmentInfoProps) {
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShipment() {
      if (!trackingNumber) {
        setLoading(false);
        return;
      }

      try {
        // In the future, we can fetch detailed shipment info from API
        // For now, we'll use the tracking number and carrier from order
        setShipment({
          trackingNumber,
          carrier: carrier as Carrier,
        });
      } catch (error) {
        console.error('Error fetching shipment:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchShipment();
  }, [orderId, trackingNumber, carrier]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Thông tin vận đơn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Đang tải...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trackingNumber || !carrier) {
    return null; // Don't show if no shipment
  }

  const trackingUrl = getCarrierTrackingUrl(carrier as Carrier, trackingNumber);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Thông tin vận đơn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Đơn vị vận chuyển:</span>
            <span className="font-semibold">{getCarrierLabel(carrier)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Mã vận đơn:</span>
            <span className="font-mono text-sm font-semibold">{trackingNumber}</span>
          </div>
        </div>

        {trackingUrl && trackingUrl !== '#' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(trackingUrl, '_blank')}
            className="w-full min-h-[44px]"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Theo dõi vận đơn
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

