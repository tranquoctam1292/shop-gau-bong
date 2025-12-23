/**
 * Shipment Service
 * 
 * Manages shipment creation and tracking for orders.
 * Supports multiple carriers: GHTK, GHN, Custom
 */

import { getCollections, ObjectId } from '@/lib/db';
import { getCarrierTrackingUrl, type Carrier } from '@/lib/utils/shipment';

export type { Carrier };

export interface ShipmentData {
  orderId: string;
  carrier: Carrier;
  trackingNumber: string;
  weight?: number; // kg
  estimatedDeliveryDate?: Date;
  carrierService?: string; // e.g., "Standard", "Express"
  carrierTrackingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate tracking number based on carrier
 * 
 * @param carrier - Carrier type
 * @param orderNumber - Order number for reference
 * @returns Tracking number
 */
function generateTrackingNumber(carrier: Carrier, orderNumber: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  switch (carrier) {
    case 'ghtk':
      return `GHTK${timestamp}${random}`;
    case 'ghn':
      return `GHN${timestamp}${random}`;
    case 'custom':
    default:
      return `CUSTOM${timestamp}${random}`;
  }
}

// getCarrierTrackingUrl is now exported from @/lib/utils/shipment

/**
 * Create shipment for an order
 * 
 * @param orderId - Order ID
 * @param carrier - Carrier type
 * @param weight - Total weight in kg (optional, will calculate from items if not provided)
 * @param carrierService - Carrier service type (optional)
 * @returns Created shipment data
 */
export async function createShipment(
  orderId: string,
  carrier: Carrier,
  weight?: number,
  carrierService?: string
): Promise<ShipmentData> {
  const { orders, orderItems, shipments } = await getCollections();

  // Find order
  const order = await orders.findOne({ _id: new ObjectId(orderId) });
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Check if shipment already exists
  const existingShipment = await shipments.findOne({ orderId });
  if (existingShipment) {
    throw new Error(`Shipment already exists for order ${orderId}`);
  }

  // Calculate weight from order items if not provided
  let finalWeight = weight;
  if (!finalWeight) {
    const items = await orderItems.find({ orderId }).toArray();
    finalWeight = items.reduce((total, item) => {
      // Use item weight if available, otherwise estimate
      const itemWeight = item.weight || 0.5; // Default 0.5kg per item
      return total + itemWeight * item.quantity;
    }, 0);
  }

  // Generate tracking number
  const trackingNumber = generateTrackingNumber(carrier, order.orderNumber);

  // Create shipment document
  const shipmentData: ShipmentData = {
    orderId,
    carrier,
    trackingNumber,
    weight: finalWeight,
    carrierService: carrierService || 'Standard',
    carrierTrackingUrl: getCarrierTrackingUrl(carrier, trackingNumber),
    estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await shipments.insertOne(shipmentData);

  // Update order with tracking number and carrier
  await orders.updateOne(
    { _id: new ObjectId(orderId) },
    {
      $set: {
        trackingNumber,
        carrier,
        updatedAt: new Date(),
      },
    }
  );

  return {
    ...shipmentData,
    orderId: shipmentData.orderId,
  };
}

/**
 * Get shipment by order ID
 * 
 * @param orderId - Order ID
 * @returns Shipment data or null
 */
export async function getShipmentByOrderId(orderId: string): Promise<ShipmentData | null> {
  const { shipments } = await getCollections();
  const shipment = await shipments.findOne({ orderId });
  return shipment as ShipmentData | null;
}

/**
 * Update shipment tracking information
 * 
 * @param orderId - Order ID
 * @param updates - Partial shipment data to update
 */
export async function updateShipment(
  orderId: string,
  updates: Partial<ShipmentData>
): Promise<void> {
  const { shipments } = await getCollections();
  
  await shipments.updateOne(
    { orderId },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    }
  );
}

