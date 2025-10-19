import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './cart';

interface OrderItem {
  name: string;
  price: number;
  salePrice?: number;
  quantity: number;
}

interface InvoiceData {
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  courierCharges: number;
  total: number;
  createdAt: any;
  storeName: string;
  whatsappNumber: string;
}

export const generateInvoice = (data: InvoiceData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header - Store Name
  doc.setFontSize(24);
  doc.setTextColor(234, 88, 12); // Accent color
  doc.text(data.storeName, pageWidth / 2, 20, { align: 'center' });
  
  // Order Info
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Order ID: ${data.orderId}`, pageWidth / 2, 28, { align: 'center' });
  
  const orderDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
  doc.text(`Date: ${orderDate.toLocaleDateString('en-IN')}`, pageWidth / 2, 34, { align: 'center' });
  
  // Contact Info
  doc.setFontSize(9);
  doc.text(`WhatsApp: ${data.whatsappNumber}`, pageWidth / 2, 40, { align: 'center' });
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 45, pageWidth - 15, 45);
  
  // Items Table
  const tableData = data.items.map(item => {
    const itemPrice = item.salePrice || item.price;
    return [
      item.name,
      item.quantity.toString(),
      formatCurrency(itemPrice),
      formatCurrency(itemPrice * item.quantity)
    ];
  });
  
  autoTable(doc, {
    startY: 50,
    head: [['Product', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [234, 88, 12], // Accent color
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    }
  });
  
  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || 50;
  
  // Totals
  const totalsStartY = finalY + 10;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Subtotal
  doc.text('Subtotal:', pageWidth - 80, totalsStartY);
  doc.text(formatCurrency(data.subtotal), pageWidth - 15, totalsStartY, { align: 'right' });
  
  // Courier Charges
  doc.text('Courier & Packaging:', pageWidth - 80, totalsStartY + 7);
  const courierText = data.courierCharges === 0 ? 'FREE' : formatCurrency(data.courierCharges);
  doc.text(courierText, pageWidth - 15, totalsStartY + 7, { align: 'right' });
  
  // Line before total
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - 80, totalsStartY + 12, pageWidth - 15, totalsStartY + 12);
  
  // Total
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(234, 88, 12); // Accent color
  doc.text('Total:', pageWidth - 80, totalsStartY + 20);
  doc.text(formatCurrency(data.total), pageWidth - 15, totalsStartY + 20, { align: 'right' });
  
  // GST Note
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('* GST not included', pageWidth / 2, totalsStartY + 30, { align: 'center' });
  
  // Footer
  doc.setFontSize(8);
  doc.text('Thank you for your order!', pageWidth / 2, doc.internal.pageSize.height - 20, { align: 'center' });
  doc.text('For any queries, contact us via WhatsApp', pageWidth / 2, doc.internal.pageSize.height - 15, { align: 'center' });
  
  // Save PDF
  doc.save(`Invoice-${data.orderId}.pdf`);
};
