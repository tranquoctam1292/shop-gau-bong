import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { formatOrderForInvoiceREST } from '@/lib/utils/invoiceREST';
import jsPDF from 'jspdf';
// @ts-ignore - jspdf-autotable doesn't have type definitions
import autoTable from 'jspdf-autotable';

/**
 * API Route: Generate và download PDF Invoice
 * GET /api/invoice/[orderId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;
    const { orders, orderItems } = await getCollections();

    // Find order by ObjectId or orderNumber
    let order = null;
    
    if (ObjectId.isValid(orderId)) {
      order = await orders.findOne({ _id: new ObjectId(orderId) });
    }
    
    if (!order) {
      order = await orders.findOne({ orderNumber: orderId });
    }
    
    // Try parsing as number (legacy support)
    if (!order) {
    const orderIdNum = parseInt(orderId, 10);
      if (!isNaN(orderIdNum)) {
        order = await orders.findOne({ orderNumber: String(orderIdNum) });
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch order items
    const items = await orderItems
      .find({ orderId: order._id.toString() })
      .toArray();

    // Format order data for invoice
    let invoiceData;
    try {
      // Map order items to format expected by invoice formatter
      const formattedItems = items.map((item: any) => ({
        productName: item.productName || '',
        sku: item.sku,
        quantity: item.quantity || 0,
        price: item.price || 0,
      }));
      
      invoiceData = formatOrderForInvoiceREST({
        ...order,
        items: formattedItems,
      } as any);
      if (!invoiceData) {
        console.error('formatOrderForInvoiceREST returned null');
        return NextResponse.json(
          { error: 'Failed to format invoice data' },
          { status: 500 }
        );
      }
    } catch (formatError: any) {
      console.error('Error formatting invoice data:', formatError);
      return NextResponse.json(
        { error: `Failed to format invoice data: ${formatError.message}` },
        { status: 500 }
      );
    }

    // Generate PDF
    let pdf;
    try {
      pdf = generateInvoicePDF(invoiceData);
    } catch (pdfError: any) {
      console.error('Error generating PDF:', pdfError);
      return NextResponse.json(
        { error: `Failed to generate PDF: ${pdfError.message}` },
        { status: 500 }
      );
    }

    // Return PDF as response
    // Convert Uint8Array to Buffer for NextResponse
    const pdfBuffer = Buffer.from(pdf);
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceData.orderNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

/**
 * Generate PDF Invoice using jsPDF
 */
function generateInvoicePDF(data: {
  orderNumber: string;
  orderDate: string;
  status: string;
  billing: any;
  shipping: any;
  items: Array<{ name: string; sku?: string; quantity: number; price: string; total: string }>;
  subtotal: string;
  shippingTotal: string;
  totalTax: string;
  total: string;
  currency: string;
  paymentMethod?: string;
  customerNote?: string;
}): Uint8Array {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('HÓA ĐƠN BÁN HÀNG', 105, 20, { align: 'center' });

  // Shop Info
  doc.setFontSize(12);
  doc.text('SHOP GẤU BÔNG', 20, 35);
  doc.setFontSize(10);
  doc.text('Địa chỉ: [Địa chỉ shop]', 20, 42);
  doc.text('Hotline: [Số điện thoại]', 20, 48);
  doc.text('Email: [Email shop]', 20, 54);

  // Order Info
  doc.setFontSize(12);
  doc.text(`Mã đơn hàng: #${data.orderNumber}`, 20, 65);
  doc.setFontSize(10);
  doc.text(`Ngày đặt: ${data.orderDate}`, 20, 72);
  doc.text(`Trạng thái: ${data.status}`, 20, 78);

  // Billing Address
  doc.setFontSize(12);
  doc.text('Thông tin khách hàng:', 20, 90);
  doc.setFontSize(10);
  let yPos = 97;
  doc.text(
    `${data.billing.firstName} ${data.billing.lastName}`,
    20,
    yPos
  );
  yPos += 7;
  if (data.billing.email) {
    doc.text(`Email: ${data.billing.email}`, 20, yPos);
    yPos += 7;
  }
  if (data.billing.phone) {
    doc.text(`Điện thoại: ${data.billing.phone}`, 20, yPos);
    yPos += 7;
  }
  doc.text(data.billing.address1, 20, yPos);
  yPos += 7;
  if (data.billing.address2) {
    doc.text(data.billing.address2, 20, yPos);
    yPos += 7;
  }
  doc.text(
    `${data.billing.city}, ${data.billing.postcode}`,
    20,
    yPos
  );

  // Shipping Address (if different)
  if (
    data.shipping.address1 &&
    data.shipping.address1 !== data.billing.address1
  ) {
    yPos += 10;
    doc.setFontSize(12);
    doc.text('Địa chỉ giao hàng:', 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.text(
      `${data.shipping.firstName} ${data.shipping.lastName}`,
      20,
      yPos
    );
    yPos += 7;
    doc.text(data.shipping.address1, 20, yPos);
    yPos += 7;
    if (data.shipping.address2) {
      doc.text(data.shipping.address2, 20, yPos);
      yPos += 7;
    }
    doc.text(
      `${data.shipping.city}, ${data.shipping.postcode}`,
      20,
      yPos
    );
  }

  // Items Table
  const tableStartY = yPos + 15;
  autoTable(doc, {
    startY: tableStartY,
    head: [['Sản phẩm', 'SKU', 'SL', 'Đơn giá', 'Thành tiền']],
    body: data.items.map((item) => [
      item.name,
      item.sku || '-',
      item.quantity.toString(),
      formatPriceForPDF(item.price),
      formatPriceForPDF(item.total),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [255, 158, 181], textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
  });

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 50;

  // Totals
  let totalsY = finalY + 10;
  doc.setFontSize(10);
  doc.text('Tạm tính:', 150, totalsY, { align: 'right' });
  doc.text(formatPriceForPDF(data.subtotal), 195, totalsY, { align: 'right' });
  totalsY += 7;

  if (parseFloat(data.shippingTotal) > 0) {
    doc.text('Phí vận chuyển:', 150, totalsY, { align: 'right' });
    doc.text(formatPriceForPDF(data.shippingTotal), 195, totalsY, {
      align: 'right',
    });
    totalsY += 7;
  }

  if (parseFloat(data.totalTax) > 0) {
    doc.text('Thuế:', 150, totalsY, { align: 'right' });
    doc.text(formatPriceForPDF(data.totalTax), 195, totalsY, { align: 'right' });
    totalsY += 7;
  }

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Tổng cộng:', 150, totalsY, { align: 'right' });
  doc.text(formatPriceForPDF(data.total), 195, totalsY, { align: 'right' });
  totalsY += 7;

  // Payment Method
  if (data.paymentMethod) {
    totalsY += 5;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Phương thức thanh toán: ${data.paymentMethod}`, 20, totalsY);
  }

  // Customer Note
  if (data.customerNote) {
    totalsY += 10;
    doc.setFontSize(10);
    doc.text('Ghi chú:', 20, totalsY);
    totalsY += 7;
    doc.text(data.customerNote, 20, totalsY, { maxWidth: 170 });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text(
    'Cảm ơn bạn đã mua sắm tại Shop Gấu Bông!',
    105,
    pageHeight - 20,
    { align: 'center' }
  );

  // Return PDF as Uint8Array
  return doc.output('arraybuffer') as unknown as Uint8Array;
}

/**
 * Format price for PDF (remove currency symbols, keep numbers)
 */
function formatPriceForPDF(price: string | number): string {
  // Convert to string if number
  const priceStr = typeof price === 'number' ? price.toString() : String(price || '0');
  // Remove all non-numeric characters except decimal point
  const numericPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(numericPrice);
  if (isNaN(num)) return '0';
  // Format with thousand separators
  return new Intl.NumberFormat('vi-VN').format(Math.round(num)) + ' ₫';
}


