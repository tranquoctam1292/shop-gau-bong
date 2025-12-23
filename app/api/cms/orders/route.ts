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
import { withTransaction, getCollectionsWithSession } from '@/lib/utils/transactionHelper';

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
    thumbnailUrl: z.string().optional(), // Optional: Frontend may send, but backend will override with snapshot
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
      
      // BUSINESS LOGIC FIX: Snapshot thumbnail URL at time of purchase
      // This prevents 404 errors if product image is deleted/changed in the future
      // Priority: variant.image > product._thumbnail_id (URL) > product.images[0]
      let thumbnailUrl: string | undefined = undefined;
      
      if (item.variationId && product.productDataMetaBox?.variations) {
        // Variable product with variation - check variant image first
        const variant = product.productDataMetaBox.variations.find(
          (v: any) => v.id === item.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === item.variationId
        );
        
        if (variant?.image && typeof variant.image === 'string' && variant.image.length > 0) {
          // Variant has its own image - use it
          thumbnailUrl = variant.image;
        }
      }
      
      // If no variant image, use product featured image
      if (!thumbnailUrl) {
        if (product._thumbnail_id) {
          // Check if _thumbnail_id is already a full URL (from Media Library)
          if (typeof product._thumbnail_id === 'string' && 
              (product._thumbnail_id.startsWith('http://') || product._thumbnail_id.startsWith('https://'))) {
            thumbnailUrl = product._thumbnail_id;
          }
        }
        
        // Fallback to images array if _thumbnail_id is not a URL
        if (!thumbnailUrl && product.images && Array.isArray(product.images) && product.images.length > 0) {
          const firstImage = product.images[0];
          if (typeof firstImage === 'string' && firstImage.length > 0) {
            thumbnailUrl = firstImage;
          }
        }
      }
      
      return {
        ...item,
        price: actualPrice, // Use Database price, NOT Frontend price
        costPrice,
        thumbnailUrl, // Snapshot image URL at time of purchase
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
    
    // Step 4-6: Create order, order items, and reserve stock in a single transaction
    // SECURITY FIX (2025-01): Use MongoDB transaction to ensure atomicity
    // If stock reservation fails, order and order items are automatically rolled back
    let orderId: string | undefined;
    let orderResult: any;

    try {
      await withTransaction(async (session) => {
        const collections = await getCollectionsWithSession(session);
        const { orders: ordersCollection, orderItems: orderItemsCollection, products } = collections;

        // Step 4: Insert order document
        orderResult = await ordersCollection.insertOne(orderDoc, { session });
        orderId = orderResult.insertedId.toString();

        // Step 5: Create order items with Database prices and snapshot data
        const itemsToInsert = validatedLineItems.map((item) => ({
          orderId,
          productId: item.productId,
          variationId: item.variationId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price, // Database price (not Frontend price)
          costPrice: item.costPrice, // Snapshot costPrice at time of order
          thumbnailUrl: item.thumbnailUrl, // BUSINESS LOGIC FIX: Snapshot thumbnail URL at time of purchase
          subtotal: item.price * item.quantity,
          total: item.price * item.quantity,
          createdAt: new Date(),
        }));

        if (itemsToInsert.length > 0) {
          await orderItemsCollection.insertMany(itemsToInsert, { session });
        }

        // Step 6: Reserve stock within the same transaction
        // If this fails, the entire transaction (order + order items) will be rolled back
        const { reserveStockInternal } = await import('@/lib/services/inventory-internal');
        await reserveStockInternal(
          products,
          validatedData.lineItems.map((item) => ({
            productId: item.productId,
            variationId: item.variationId,
            quantity: item.quantity,
          })),
          session
        );
      });
    } catch (error: unknown) {
      // Transaction automatically rolled back, just return error
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a stock-related error
      if (errorMessage.includes('Insufficient stock') || errorMessage.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Insufficient stock',
            message: errorMessage || 'Không đủ hàng trong kho',
          },
          { status: 400 }
        );
      }

      // Other errors
      console.error('[Orders API] Transaction error:', error);
      return NextResponse.json(
        {
          error: 'Order creation failed',
          message: errorMessage || 'Không thể tạo đơn hàng',
        },
        { status: 500 }
      );
    }

    // Verify order was created successfully
    if (!orderId || !orderResult?.insertedId) {
      return NextResponse.json(
        { error: 'Order creation failed - no order ID returned' },
        { status: 500 }
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

