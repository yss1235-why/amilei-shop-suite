import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, PackageCheck, PackageX, Star, Plus, Settings as SettingsIcon, Loader2, ShoppingCart, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
 const [stats, setStats] = useState({
  total: 0,
  inStock: 0,
  outOfStock: 0,
  featured: 0
});
const [orderStats, setOrderStats] = useState({
  totalOrders: 0,
  pendingOrders: 0
});
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const products = productsSnapshot.docs.map(doc => doc.data());

        const total = products.length;
        const inStock = products.filter(p => p.inStock).length;
        const outOfStock = total - inStock;
        const featured = products.filter(p => p.isFeatured).length;

        setStats({ total, inStock, outOfStock, featured });

        // Fetch order stats
          const ordersSnapshot = await getDocs(collection(db, 'orders'));
          const orders = ordersSnapshot.docs.map(doc => doc.data());
          const totalOrders = orders.length;
          const pendingOrders = orders.filter(o => o.status === 'pending').length;
          
          setOrderStats({ totalOrders, pendingOrders });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
  { title: 'Total Products', value: stats.total, icon: Package, color: 'text-primary' },
  { title: 'In Stock', value: stats.inStock, icon: PackageCheck, color: 'text-green-600' },
  { title: 'Out of Stock', value: stats.outOfStock, icon: PackageX, color: 'text-destructive' },
  { title: 'Featured', value: stats.featured, icon: Star, color: 'text-accent' },
  { title: 'Total Orders', value: orderStats.totalOrders, icon: ShoppingCart, color: 'text-blue-600' },
  { title: 'Pending Orders', value: orderStats.pendingOrders, icon: AlertCircle, color: 'text-yellow-600' },
];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          {subscriptionExpiry && (
            <p className="text-muted-foreground">
              Subscription active until {subscriptionExpiry.toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
             <Card key={stat.title} className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
       <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button
              onClick={() => navigate('/admin/products/add')}
              className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
            <Button
              onClick={() => navigate('/admin/products')}
              variant="outline"
            >
              <Package className="mr-2 h-4 w-4" />
              View Products
            </Button>
            <Button
              onClick={() => navigate('/admin/settings')}
              variant="outline"
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Store Settings
            </Button>
            <Button
                onClick={() => navigate('/admin/orders')}
                variant="outline"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                View Orders
              </Button>
          </CardContent>
        </Card>

        {/* Getting Started */}
        {stats.total === 0 && (
         <Card className="border-accent/50 bg-accent/5 shadow-sm">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Welcome to your Amilei admin panel! Start by adding your first product and configuring store settings.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => navigate('/admin/products/add')}
                  className="bg-gradient-to-r from-accent to-accent/90"
                >
                  Add First Product
                </Button>
                <Button
                  onClick={() => navigate('/admin/settings')}
                  variant="outline"
                >
                  Configure Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
