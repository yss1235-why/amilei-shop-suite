import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Package, MessageCircle, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/cart';
import { generateInvoice } from '@/lib/invoiceGenerator';
import { toast } from 'sonner';
interface OrderItem {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  salePrice?: number;
  quantity: number;
}

interface Order {
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  courierCharges: number;
  total: number;
  createdAt: any;
}

const Order = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [storeName, setStoreName] = useState('Amilei eCollection');
  const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        setIsAdmin(user.email === adminEmail);
      }
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('orderId', '==', orderId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          setOrder(snapshot.docs[0].data() as Order);
        } else {
          toast.error('Order not found');
        }

      // Fetch settings for WhatsApp and Store Name
        const settingsDoc = await getDoc(doc(db, 'settings', 'store'));
        if (settingsDoc.exists()) {
          const settings = settingsDoc.data();
          setWhatsappNumber(settings.whatsappNumber || '');
          setStoreName(settings.storeName || 'Amilei eCollection');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleContactSeller = () => {
    if (!order || !whatsappNumber) return;

    const message = `Hi! I have a question about my order:\n\nOrder ID: ${order.orderId}\nTotal: ${formatCurrency(order.total)}\n\nPlease assist me.`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleGenerateInvoice = () => {
    if (!order) return;

    try {
      generateInvoice({
        orderId: order.orderId,
        items: order.items,
        subtotal: order.subtotal,
        courierCharges: order.courierCharges,
        total: order.total,
        createdAt: order.createdAt,
        storeName,
        whatsappNumber
      });
      toast.success('Invoice generated successfully!');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-muted-foreground">The order you're looking for doesn't exist or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              Order Details
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Order ID: {order.orderId}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-4">Items</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => {
                  const itemPrice = item.salePrice || item.price;
                  return (
                    <div key={index} className="flex gap-4 p-3 rounded-lg bg-secondary/30">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md bg-secondary"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{item.name}</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-accent font-semibold">{formatCurrency(itemPrice)}</span>
                          <span className="text-muted-foreground">× {item.quantity}</span>
                        </div>
                        <p className="text-sm font-semibold mt-1">
                          Subtotal: {formatCurrency(itemPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
              </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Courier and Packaging Charges</span>
                <span className="font-semibold">
                  {order.courierCharges === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    formatCurrency(order.courierCharges)
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-accent">{formatCurrency(order.total)}</span>
              </div>
              <p className="text-sm text-muted-foreground text-center pt-2">
                GST not included
              </p>
            </div>

           {/* Action Buttons - Show different buttons for Admin vs User */}
            {isAdmin ? (
              // Admin View: Generate Invoice Button
              <Button
                onClick={handleGenerateInvoice}
                className="w-full bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent"
                size="lg"
              >
                <FileText className="mr-2 h-5 w-5" />
                Generate Invoice (PDF)
              </Button>
            ) : (
              // User View: Contact Seller Button
              whatsappNumber && (
                <Button
                  onClick={handleContactSeller}
                  className="w-full bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent"
                  size="lg"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Contact Seller
                </Button>
              )
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Order;
