/**
 * Public Orders API Route
 * POST /api/cms/orders - Create new order (checkout)
 * 
 * Public endpoint for creating orders from checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { createOrderCreationHistory } from '@/lib/services/orderHistory';
import { handleValidationError } from '@/lib/utils/validation-errors';

export const dynamic = 'force-dynamic';

// Order create schema
const orderCreateSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  orderType: z.enum(['personal', 'gift']).default('personal'),
  buyerInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
  }).optional(),
  recipientInfo: z.object({
    name: z.string(),
    phone: z.string(),
    address: z.string(),
  }).optional(),
  billing: z.object({
    firstName: z.string(),
    lastName: z.string(),
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    postcode: z.string(),
    country: z.string().default('VN'),
  }),
  shipping: z.object({
    firstName: z.string(),
    lastName: z.string(),
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    postcode: z.string(),
    country: z.string().default('VN'),
  }),
  lineItems: z.array(z.object({
    productId: z.string(),
    variationId: z.string().optional(),
    productName: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
  })).min(1),
  paymentMethod: z.string(),
  paymentMethodTitle: z.string(),
  subtotal: z.number().min(0),
  shippingTotal: z.number().min(0),
  grandTotal: z.number().min(0), // Final total after tax/shipping/discount
  customerNote: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = orderCreateSchema.parse(body);
    
    const { orders, orderItems } = await getCollections();
    
    // Generate order number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `ORD-${timestamp}-${random}`;
    
    // Create order document
    const orderDoc = {
      orderNumber,
      customerName: validatedData.customerName,
      customerEmail: validatedData.customerEmail,
      customerPhone: validatedData.customerPhone,
      orderType: validatedData.orderType,
      buyerInfo: validatedData.buyerInfo,
      recipientInfo: validatedData.recipientInfo,
      billing: validatedData.billing,
      shipping: validatedData.shipping,
      paymentMethod: validatedData.paymentMethod,
      paymentMethodTitle: validatedData.paymentMethodTitle,
      paymentStatus: validatedData.paymentMethod === 'cod' || validatedData.paymentMethod === 'bank_transfer'
        ? 'pending'
        : 'pending',
      status: 'pending',
      subtotal: validatedData.subtotal,
      shippingTotal: validatedData.shippingTotal,
      grandTotal: validatedData.grandTotal, // Final total after tax/shipping/discount
      currency: 'VND',
      customerNote: validatedData.customerNote,
      version: 1, // Initialize version for optimistic locking
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const orderResult = await orders.insertOne(orderDoc);
    const orderId = orderResult.insertedId.toString();
    
    // Fetch products to get costPrice snapshot
    const { products } = await getCollections();
    const productIds = [...new Set(validatedData.lineItems.map((item) => item.productId))];
    const productDocs = await products
      .find({ _id: { $in: productIds.map((id) => new ObjectId(id)) } })
      .toArray();
    
    const productsMap = new Map(
      productDocs.map((p) => [p._id.toString(), p])
    );
    
    // Create order items with costPrice snapshot
    const itemsToInsert = validatedData.lineItems.map((item) => {
      const product = productsMap.get(item.productId);
      let costPrice: number | undefined = undefined;
      
      // Get costPrice from product or variant
      if (product) {
        // For variable products, check variant costPrice first
        if (item.variationId && product.productDataMetaBox?.variations) {
          const variant = product.productDataMetaBox.variations.find(
            (v: any) => v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId
          );
          if (variant && typeof variant.costPrice === 'number') {
            costPrice = variant.costPrice;
          }
        }
        
        // Fallback to product costPrice if variant doesn't have it
        if (costPrice === undefined && product.productDataMetaBox?.costPrice !== undefined) {
          costPrice = product.productDataMetaBox.costPrice;
        }
      }
      
      return {
        orderId,
        productId: item.productId,
        variationId: item.variationId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        costPrice: costPrice, // Snapshot costPrice at time of order
        subtotal: item.price * item.quantity,
        total: item.price * item.quantity,
        createdAt: new Date(),
      };
    });
    
    if (itemsToInsert.length > 0) {
      await orderItems.insertMany(itemsToInsert);
    }

    // Auto-reserve stock when order is created (status: Pending)
    try {
      const { reserveStock } = await import('@/lib/services/inventory');
      await reserveStock(
        orderId,
        validatedData.lineItems.map((item) => ({
          productId: item.productId,
          variationId: item.variationId,
          quantity: item.quantity,
        }))
      );
    } catch (error: any) {
      // If stock reservation fails, rollback order creation
      await orderItems.deleteMany({ orderId });
      await orders.deleteOne({ _id: orderResult.insertedId });
      return NextResponse.json(
        {
          error: 'Insufficient stock',
          message: error.message || 'Không đủ hàng trong kho',
        },
        { status: 400 }
      );
    }

    // Create order history entry
    try {
      await createOrderCreationHistory(
        orderId,
        orderNumber,
        validatedData.customerName
      );
    } catch (error) {
      // Log error but don't fail order creation
      console.error('[Orders API] Failed to create order history:', error);
    }
    
    // Fetch created order with items
    const createdOrder = await orders.findOne({ _id: orderResult.insertedId });
    const items = await orderItems.find({ orderId }).toArray();
    
    return NextResponse.json(
      {
        order: {
          ...createdOrder,
          items,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle Zod validation errors
    const validationError = handleValidationError(error);
    if (validationError) {
      return validationError;
    }
    
    console.error('[Orders API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create order',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

