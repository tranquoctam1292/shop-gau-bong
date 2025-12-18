/**
 * Admin Order Items API Route
 * PATCH /api/admin/orders/[id]/items - Update order items
 * 
 * Protected route - requires authentication
 * Only allows editing when order status is 'pending' or 'confirmed'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';
import { canEditOrder, type OrderStatus } from '@/lib/utils/orderStateMachine';
import { recalculateOrderTotals } from '@/lib/utils/recalculateOrderTotals';
import {
  createHistoryEntry,
  type ActorType,
} from '@/lib/services/orderHistory';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Order items update schema
const orderItemsUpdateSchema = z.object({
  action: z.enum(['add', 'remove', 'update_quantity']),
  itemId: z.string().optional(), // For remove/update_quantity
  productId: z.string().optional(), // For add
  variationId: z.string().optional(), // For add (variable products)
  productName: z.string().optional(), // For add
  quantity: z.number().min(1).optional(), // For add/update_quantity
  price: z.number().min(0).optional(), // For add
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { orders, orderItems } = await getCollections();
      const { id } = params;
      const body = await req.json();

    // Validate input
    const validatedData = orderItemsUpdateSchema.parse(body);

    // Find order
    let order = null;
    let orderId: ObjectId | null = null;

    if (ObjectId.isValid(id)) {
      orderId = new ObjectId(id);
      order = await orders.findOne({ _id: orderId });
    }

    if (!order) {
      order = await orders.findOne({ orderNumber: id });
      if (order) {
        orderId = order._id;
      }
    }

    if (!order || !orderId) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order can be edited
    if (!canEditOrder(order.status as OrderStatus)) {
      return NextResponse.json(
        {
          error: 'Order cannot be edited',
          message: `Orders can only be edited when status is "pending" or "confirmed". Current status: "${order.status}"`,
        },
        { status: 400 }
      );
    }

    // Get current admin user for history logging
    // req.adminUser is available from withAuthAdmin middleware
    const actorId: string | undefined = req.adminUser?._id?.toString();
    const actorName: string | undefined = req.adminUser?.full_name || req.adminUser?.username || 'Admin';
    const actorType: ActorType = 'admin';

    // Get current order items
    const currentItems = await orderItems.find({ orderId: orderId.toString() }).toArray();

    let updatedItems = [...currentItems];
    let historyDescription = '';

    // Handle different actions
    if (validatedData.action === 'add') {
      // Validate required fields for add
      if (!validatedData.productId || !validatedData.productName || !validatedData.quantity || !validatedData.price) {
        return NextResponse.json(
          { error: 'Missing required fields for add action' },
          { status: 400 }
        );
      }

      // Check stock availability before adding item
      try {
        const { checkStockAvailability } = await import('@/lib/services/inventory');
        const stockCheck = await checkStockAvailability(
          validatedData.productId,
          validatedData.variationId,
          validatedData.quantity
        );

        if (!stockCheck.canFulfill) {
          return NextResponse.json(
            {
              error: 'Insufficient stock',
              message: `Không đủ hàng trong kho. Còn lại: ${stockCheck.available}, Yêu cầu: ${validatedData.quantity}`,
              stockInfo: stockCheck,
            },
            { status: 400 }
          );
        }

        // Reserve stock for the new item
        const { reserveStock } = await import('@/lib/services/inventory');
        await reserveStock(orderId.toString(), [
          {
            productId: validatedData.productId,
            variationId: validatedData.variationId,
            quantity: validatedData.quantity,
          },
        ]);
      } catch (error: any) {
        return NextResponse.json(
          {
            error: 'Stock check failed',
            message: error.message || 'Không thể kiểm tra tồn kho',
          },
          { status: 400 }
        );
      }

      // Fetch product to get costPrice snapshot
      const { products } = await getCollections();
      const product = await products.findOne({ _id: new ObjectId(validatedData.productId) });
      
      let costPrice: number | undefined = undefined;
      
      // Get costPrice from product or variant
      if (product) {
        // For variable products, check variant costPrice first
        if (validatedData.variationId && product.productDataMetaBox?.variations) {
          const variant = product.productDataMetaBox.variations.find(
            (v: any) => v.id === validatedData.variationId || (v as { _id?: { toString: () => string } })._id?.toString() === validatedData.variationId
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

      // Create new order item with costPrice snapshot
      const newItem = {
        orderId: orderId.toString(),
        productId: validatedData.productId,
        variationId: validatedData.variationId,
        productName: validatedData.productName,
        quantity: validatedData.quantity,
        price: validatedData.price,
        costPrice: costPrice, // Snapshot costPrice at time of order
        total: validatedData.price * validatedData.quantity,
        createdAt: new Date(),
      };

      const insertResult = await orderItems.insertOne(newItem);
      updatedItems.push({ ...newItem, _id: insertResult.insertedId });

      historyDescription = `Thêm sản phẩm "${validatedData.productName}" (Số lượng: ${validatedData.quantity})`;
    } else if (validatedData.action === 'remove') {
      // Validate required fields for remove
      if (!validatedData.itemId) {
        return NextResponse.json(
          { error: 'Missing itemId for remove action' },
          { status: 400 }
        );
      }

      // Find item to remove
      const itemToRemove = currentItems.find(
        (item) => item._id?.toString() === validatedData.itemId
      );

      if (!itemToRemove) {
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        );
      }

      // Release reserved stock before removing item
      try {
        const { releaseStock } = await import('@/lib/services/inventory');
        await releaseStock(orderId.toString(), [
          {
            productId: itemToRemove.productId,
            variationId: itemToRemove.variationId,
            quantity: itemToRemove.quantity,
          },
        ]);
      } catch (error: any) {
        console.error('[Order Items API] Error releasing stock:', error);
        // Continue with item removal even if stock release fails
      }

      // Remove item
      await orderItems.deleteOne({ _id: new ObjectId(validatedData.itemId) });
      updatedItems = updatedItems.filter(
        (item) => item._id?.toString() !== validatedData.itemId
      );

      historyDescription = `Xóa sản phẩm "${itemToRemove.productName}"`;
    } else if (validatedData.action === 'update_quantity') {
      // Validate required fields for update_quantity
      if (!validatedData.itemId || !validatedData.quantity) {
        return NextResponse.json(
          { error: 'Missing itemId or quantity for update_quantity action' },
          { status: 400 }
        );
      }

      // Find item to update
      const itemToUpdate = currentItems.find(
        (item) => item._id?.toString() === validatedData.itemId
      );

      if (!itemToUpdate) {
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        );
      }

      // Check stock availability if quantity is increasing
      if (validatedData.quantity > itemToUpdate.quantity) {
        const quantityDiff = validatedData.quantity - itemToUpdate.quantity;
        try {
          const { checkStockAvailability, reserveStock } = await import('@/lib/services/inventory');
          const stockCheck = await checkStockAvailability(
            itemToUpdate.productId,
            itemToUpdate.variationId,
            quantityDiff
          );

          if (!stockCheck.canFulfill) {
            return NextResponse.json(
              {
                error: 'Insufficient stock',
                message: `Không đủ hàng trong kho để tăng số lượng. Còn lại: ${stockCheck.available}, Cần thêm: ${quantityDiff}`,
                stockInfo: stockCheck,
              },
              { status: 400 }
            );
          }

          // Reserve additional stock
          await reserveStock(orderId.toString(), [
            {
              productId: itemToUpdate.productId,
              variationId: itemToUpdate.variationId,
              quantity: quantityDiff,
            },
          ]);
        } catch (error: any) {
          return NextResponse.json(
            {
              error: 'Stock check failed',
              message: error.message || 'Không thể kiểm tra tồn kho',
            },
            { status: 400 }
          );
        }
      } else if (validatedData.quantity < itemToUpdate.quantity) {
        // Release stock if quantity is decreasing
        const quantityDiff = itemToUpdate.quantity - validatedData.quantity;
        try {
          const { releaseStock } = await import('@/lib/services/inventory');
          await releaseStock(orderId.toString(), [
            {
              productId: itemToUpdate.productId,
              variationId: itemToUpdate.variationId,
              quantity: quantityDiff,
            },
          ]);
        } catch (error: any) {
          console.error('[Order Items API] Error releasing stock:', error);
          // Continue with quantity update even if stock release fails
        }
      }

      // Update item quantity
      const newTotal = itemToUpdate.price * validatedData.quantity;
      await orderItems.updateOne(
        { _id: new ObjectId(validatedData.itemId) },
        {
          $set: {
            quantity: validatedData.quantity,
            total: newTotal,
          },
        }
      );

      updatedItems = updatedItems.map((item) =>
        item._id?.toString() === validatedData.itemId
          ? { ...item, quantity: validatedData.quantity, total: newTotal }
          : item
      );

      historyDescription = `Cập nhật số lượng sản phẩm "${itemToUpdate.productName}" từ ${itemToUpdate.quantity} sang ${validatedData.quantity}`;
    }

    // Recalculate totals
    const totals = recalculateOrderTotals({
      items: updatedItems.map((item) => ({
        _id: item._id?.toString(),
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        variant: (item as any).attributes ? {
          size: (item as any).attributes?.size,
          color: (item as any).attributes?.color,
        } : undefined,
      })),
      shippingAddress: order.shipping,
      currentShippingTotal: order.shippingTotal || 0,
      discountTotal: order.discountTotal || 0,
    });

    // Update order totals
    // Increment version for optimistic locking
    const currentVersion = order.version || 0;
    await orders.updateOne(
      { _id: orderId },
      {
        $set: {
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
          shippingTotal: totals.shippingTotal,
          discountTotal: totals.discountTotal,
          grandTotal: totals.grandTotal, // Final total after tax/shipping/discount
          version: currentVersion + 1, // Increment version for optimistic locking
          updatedAt: new Date(),
        },
      }
    );

    // Create history entry
    const historyAction = validatedData.action === 'add' 
      ? 'add_item' 
      : validatedData.action === 'remove' 
      ? 'remove_item' 
      : 'update_status';
    
    await createHistoryEntry({
      orderId: orderId.toString(),
      action: historyAction as any,
      description: historyDescription,
      actorId,
      actorType,
      actorName,
      metadata: {
        action: validatedData.action,
        itemId: validatedData.itemId,
        productId: validatedData.productId,
        quantity: validatedData.quantity,
      },
    });

    // Fetch updated order with items
    const updatedOrder = await orders.findOne({ _id: orderId });
    const items = await orderItems.find({ orderId: orderId.toString() }).toArray();

    return NextResponse.json({
      order: {
        ...updatedOrder,
        items,
      },
      totals,
    });
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

    console.error('[Admin Order Items API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to update order items',
        details:
          process.env.NODE_ENV === 'development'
            ? { stack: error.stack }
            : undefined,
      },
      { status: 500 }
    );
    }
  }, 'order:update'); // Order items update requires update permission
}

