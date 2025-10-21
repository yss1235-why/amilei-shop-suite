import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, Eye, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/cart';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Invoice {
  id: string;
  invoiceId: string;
  orderId: string;
  generatedBy: string;
  generatedAt: any;
  orderTotal: number;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

const AdminInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInvoices = async () => {
    try {
      const invoicesRef = collection(db, 'invoices');
      const q = query(invoicesRef, orderBy('generatedAt', 'desc'));
      const snapshot = await getDocs(q);
      const invoicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
      
      setInvoices(invoicesList);
      setFilteredInvoices(invoicesList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInvoices(invoices);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = invoices.filter(invoice =>
      invoice.invoiceId.toLowerCase().includes(query) ||
      invoice.orderId.toLowerCase().includes(query)
    );
    setFilteredInvoices(filtered);
  }, [searchQuery, invoices]);

  const getTotalInvoiceAmount = () => {
    return invoices.reduce((sum, inv) => sum + inv.orderTotal, 0);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Invoices</h1>
          <p className="text-muted-foreground">Track all generated invoices</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Invoice Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {formatCurrency(getTotalInvoiceAmount())}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <Input
              placeholder="Search by Invoice ID or Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Invoices Table */}
        {filteredInvoices.length > 0 ? (
          <div className="grid gap-4">
            {filteredInvoices.map(invoice => (
              <Card key={invoice.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-accent" />
                        <h3 className="font-semibold text-lg">{invoice.invoiceId}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Order: {invoice.orderId}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Generated: {invoice.generatedAt?.toDate?.().toLocaleString() || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        By: {invoice.generatedBy}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Amount:</span>{' '}
                        <span className="font-semibold text-accent">
                          {formatCurrency(invoice.orderTotal)}
                        </span>
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Items: {invoice.orderItems.map(item => `${item.name} (${item.quantity})`).join(', ')}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/order/${invoice.orderId}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Order
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No invoices found</h2>
            <p className="text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Invoices will appear here once generated'}
            </p>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminInvoices;
