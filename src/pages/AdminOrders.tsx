import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Package, Eye, Edit, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/cart';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface OrderItem {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  salePrice?: number;
  quantity: number;
}

interface Order {
  id: string;
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  courierCharges: number;
  total: number;
  createdAt: any;
  status: string;
  whatsappSent: boolean;
  invoiceGenerated: boolean;
  invoiceGeneratedAt: any;
  stockReduced: boolean;  // NEW FIELD
  stockReducedAt: any;  // NEW FIELD
  adminNotes: string;
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newNote, setNewNote] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-green-500' },
    { value: 'completed', label: 'Completed', color: 'bg-green-700' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' }
  ];

  const fetchOrders = async () => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      setOrders(ordersList);
      setFilteredOrders(ordersList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(order =>
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchQuery]);

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      const orderRef = doc(db, 'orders', selectedOrder.id);
      await updateDoc(orderRef, {
        status: newStatus,
        lastUpdated: new Date()
      });

      toast.success('Order status updated');
      setDialogOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleAddNote = async () => {
    if (!selectedOrder || !newNote.trim()) return;

    try {
      const orderRef = doc(db, 'orders', selectedOrder.id);
      const updatedNotes = selectedOrder.adminNotes 
        ? `${selectedOrder.adminNotes}\n\n[${new Date().toLocaleString()}]\n${newNote}`
        : `[${new Date().toLocaleString()}]\n${newNote}`;

      await updateDoc(orderRef, {
        adminNotes: updatedNotes,
        lastUpdated: new Date()
      });

      toast.success('Note added');
      setNewNote('');
      setDialogOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    if (!statusOption) return null;

    return (
      <Badge className={`${statusOption.color} text-white`}>
        {statusOption.label}
      </Badge>
    );
  };

  const getOrderStats = () => {
    const pending = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0);

    return { pending, completed, totalRevenue };
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

  const stats = getOrderStats();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Orders Management</h1>
          <p className="text-muted-foreground">Track and manage all customer orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Revenue: {formatCurrency(stats.totalRevenue)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by Order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        {filteredOrders.length > 0 ? (
          <div className="grid gap-4">
            {filteredOrders.map(order => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{order.orderId}</h3>
                        {getStatusBadge(order.status)}
                       {order.invoiceGenerated && (
                            <Badge variant="secondary">
                              <FileText className="h-3 w-3 mr-1" />
                              Invoice Generated
                            </Badge>
                          )}
                          {order.stockReduced && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Stock Reduced
                            </Badge>
                          )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.createdAt?.toDate?.().toLocaleString() || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Items:</span>{' '}
                        {order.items.length} | {' '}
                        <span className="text-muted-foreground">Total:</span>{' '}
                        <span className="font-semibold text-accent">
                          {formatCurrency(order.total)}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/order/${order.orderId}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Dialog open={dialogOpen && selectedOrder?.id === order.id} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setNewStatus(order.status);
                              setNewNote('');
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Manage Order: {order.orderId}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Update Status */}
                            <div className="space-y-2">
                              <Label>Update Status</Label>
                              <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button onClick={handleUpdateStatus} className="w-full" size="sm">
                                Update Status
                              </Button>
                            </div>

                            {/* Add Note */}
                            <div className="space-y-2">
                              <Label>Add Internal Note</Label>
                              <Textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Add note about this order..."
                                rows={3}
                              />
                              <Button onClick={handleAddNote} className="w-full" size="sm" variant="outline">
                                Add Note
                              </Button>
                            </div>

                            {/* Show existing notes */}
                            {order.adminNotes && (
                              <div className="space-y-2">
                                <Label>Previous Notes</Label>
                                <div className="bg-secondary/50 p-3 rounded-md text-sm max-h-40 overflow-y-auto">
                                  <pre className="whitespace-pre-wrap font-sans">
                                    {order.adminNotes}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No orders found</h2>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Orders will appear here once customers place them'}
            </p>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
