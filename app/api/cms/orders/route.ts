/**
 * Public Orders API Route
 * POST /api/cms/orders - Create new order (checkout)
 * 
 * Public endpoint for creating orders from checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

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
  total: z.number().min(0),
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
      total: validatedData.total,
      currency: 'VND',
      customerNote: validatedData.customerNote,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const orderResult = await orders.insertOne(orderDoc);
    const orderId = orderResult.insertedId.toString();
    
    // Create order items
    const itemsToInsert = validatedData.lineItems.map((item) => ({
      orderId,
      productId: item.productId,
      variationId: item.variationId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
      total: item.price * item.quantity,
      createdAt: new Date(),
    }));
    
    if (itemsToInsert.length > 0) {
      await orderItems.insertMany(itemsToInsert);
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
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

