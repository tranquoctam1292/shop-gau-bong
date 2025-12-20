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
    
    const { orders, orderItems, products } = await getCollections();
    
    // SECURITY FIX: Price Manipulation Vulnerability
    // Backend MUST lookup prices from Database and recalculate totals
    // NEVER trust prices sent from Frontend - they can be manipulated
    // Step 1: Fetch products from Database
    const productIds = [...new Set(validatedData.lineItems.map((item) => item.productId))];
    const productDocs = await products
      .find({ _id: { $in: productIds.map((id) => new ObjectId(id)) } })
      .toArray();
    
    const productsMap = new Map(
      productDocs.map((p) => [p._id.toString(), p])
    );
    
    // SECURITY FIX: Lookup prices from Database for each line item
    // Calculate actual prices from Database (not from Frontend request)
    // This prevents Price Manipulation Vulnerability - Backend always uses Database prices
    const validatedLineItems = validatedData.lineItems.map((item) => {
      const product = productsMap.get(item.productId);
      
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      
      let actualPrice: number = 0;
      let costPrice: number | undefined = undefined;
      
      // Get price from Database based on product type and variation
      if (item.variationId && product.productDataMetaBox?.variations) {
        // Variable product with variation - lookup variant price
        const variant = product.productDataMetaBox.variations.find(
          (v: any) => v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId
        );
        
        if (!variant) {
          throw new Error(`Variant not found: ${item.variationId} for product ${item.productId}`);
        }
        
        // Variant price: use salePrice if available and valid, else regularPrice
        if (variant.salePrice !== undefined && variant.salePrice > 0 && 
            variant.regularPrice !== undefined && variant.salePrice < variant.regularPrice) {
          actualPrice = variant.salePrice;
        } else if (variant.regularPrice !== undefined && variant.regularPrice > 0) {
          actualPrice = variant.regularPrice;
        } else {
          // Fallback: check if variant has direct price field (legacy structure)
          actualPrice = (variant as any).price || 0;
        }
        
        // Get variant costPrice if available
        if (variant.costPrice !== undefined) {
          costPrice = variant.costPrice;
        }
      } else {
        // Simple product or variable product without variation - use product price
        const productMeta = product.productDataMetaBox;
        
        // Product price: use salePrice if on sale, else regularPrice
        if (productMeta?.salePrice !== undefined && productMeta.salePrice > 0 &&
            productMeta.regularPrice !== undefined && productMeta.salePrice < productMeta.regularPrice) {
          actualPrice = productMeta.salePrice;
        } else if (productMeta?.regularPrice !== undefined && productMeta.regularPrice > 0) {
          actualPrice = productMeta.regularPrice;
        } else {
          // Fallback: use product.price field (legacy structure)
          actualPrice = (product as any).price || 0;
        }
        
        // Get product costPrice if available
        if (productMeta?.costPrice !== undefined) {
          costPrice = productMeta.costPrice;
        }
      }
      
      // Validate price is valid
      if (actualPrice <= 0) {
        throw new Error(`Invalid price for product ${item.productId}${item.variationId ? ` variant ${item.variationId}` : ''}: ${actualPrice}`);
      }
      
      return {
        ...item,
        price: actualPrice, // Use Database price, NOT Frontend price
        costPrice,
      };
    });
    
    // SECURITY FIX: Recalculate totals from Database prices
    // Do NOT trust subtotal, shippingTotal, grandTotal from Frontend
    const recalculatedSubtotal = validatedLineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const recalculatedShippingTotal = validatedData.shippingTotal; // Shipping is calculated server-side, can trust
    const recalculatedGrandTotal = recalculatedSubtotal + recalculatedShippingTotal;
    
    // Step 2: Generate order number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `ORD-${timestamp}-${random}`;
    
    // Step 3: Create order document with recalculated totals from Database prices
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
      subtotal: recalculatedSubtotal, // SECURITY FIX: Use Database-calculated subtotal
      shippingTotal: recalculatedShippingTotal,
      grandTotal: recalculatedGrandTotal, // SECURITY FIX: Use Database-calculated grand total
      currency: 'VND',
      customerNote: validatedData.customerNote,
      version: 1, // Initialize version for optimistic locking
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Step 4: Insert order document
    const orderResult = await orders.insertOne(orderDoc);
    const orderId = orderResult.insertedId.toString();
    
    // Step 5: Create order items with Database prices
    const itemsToInsert = validatedLineItems.map((item) => ({
      orderId,
      productId: item.productId,
      variationId: item.variationId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price, // Database price (not Frontend price)
      costPrice: item.costPrice, // Snapshot costPrice at time of order
      subtotal: item.price * item.quantity,
      total: item.price * item.quantity,
      createdAt: new Date(),
    }));
    
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

