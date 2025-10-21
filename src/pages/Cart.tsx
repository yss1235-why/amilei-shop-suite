import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import {
  getCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  formatCurrency,
  getCartTotal
} from '@/lib/cart';
import { toast } from 'sonner';

const Cart = () => {
  const [cart, setCart] = useState(getCart());
  const [courierCharges, setCourierCharges] = useState(100);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(2000);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [gstMessage, setGstMessage] = useState('GST not included');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'store'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setCourierCharges(data.courierCharges || 100);
          setFreeShippingThreshold(data.freeShippingThreshold || 2000);
          setWhatsappNumber(data.whatsappNumber || '');
          setGstMessage(data.gstMessage || 'GST not included');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

 const handleQuantityChange = (productId: string, newQuantity: number) => {
    const item = cart.find(i => i.productId === productId);
    if (item && newQuantity > item.stockCount) {
      toast.error(`Only ${item.stockCount} items available in stock`);
      return;
    }
    updateCartItemQuantity(productId, newQuantity);
    setCart(getCart());
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleRemove = (productId: string) => {
    removeFromCart(productId);
    setCart(getCart());
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Item removed from cart');
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      const { subtotal, courier, total, courierBreakdown } = getCartTotal(courierCharges, freeShippingThreshold);
      const orderId = `ORD-${Date.now()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

     await addDoc(collection(db, 'orders'), {
  orderId,
  items: cart,
  subtotal,
  courierCharges: courier,
  courierBreakdown,
  total,
  createdAt: new Date(),
  expiresAt,
  status: 'pending',
  whatsappSent: true,
  invoiceGenerated: false,
  invoiceGeneratedAt: null,
  adminNotes: '',
  lastUpdated: new Date()
});

      const orderUrl = `${window.location.origin}/order/${orderId}`;
      const message = `Hi! I'd like to place an order from Amilei:\n\nOrder ID: ${orderId}\nOrder Details: ${orderUrl}\n\nTotal: ${formatCurrency(total)} (${gstMessage})\n\nPlease confirm availability!`;
      
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      clearCart();
      window.dispatchEvent(new Event('cartUpdated'));
      
      window.open(whatsappUrl, '_blank');
      navigate(`/order/${orderId}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
    }
  };

  const { subtotal, courier, total, courierBreakdown } = getCartTotal(courierCharges, freeShippingThreshold);

  if (cart.length === 0) {
   return (
  <div className="min-h-screen bg-background flex flex-col">
    <Header />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center py-12">
            <CardContent>
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Add some products to get started</p>
              <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-accent to-accent/90">
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

 return (
  <div className="min-h-screen bg-background flex flex-col">
    <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => {
              const itemPrice = item.salePrice || item.price;
              return (
                <Card key={item.productId}>
                  <CardContent className="p-4 flex gap-4">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-md bg-secondary"
                    />
                    
                   <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.name}</h3>
                      {item.selectedSize && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Size: <span className="font-medium">{item.selectedSize}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                          <span className="font-bold text-accent">{formatCurrency(itemPrice)}</span>
                          {item.salePrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatCurrency(item.price)}
                            </span>
                          )}
                        </div>
                        {/* 🔧 Stock warning */}
                        {item.stockCount < 10 && (
                          <p className="text-xs text-orange-600 mb-2">
                            Only {item.stockCount} left in stock
                          </p>
                        )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemove(item.productId)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {/* 🔧 UPDATED COURIER DISPLAY */}
                 <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Courier and Packaging Charges</span>
                      <span className="font-semibold">
                        {courier === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          formatCurrency(courier)
                        )}
                      </span>
                    </div>
                    
                    {/* Show breakdown if there are charges */}
                    {courier > 0 && courierBreakdown.length > 0 && (
                      <div className="text-xs text-muted-foreground pl-4 space-y-1">
                        {courierBreakdown.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="truncate max-w-[150px]">{item.productName}</span>
                            <span>{formatCurrency(item.charge)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {subtotal < freeShippingThreshold && (
                    <p className="text-sm text-muted-foreground">
                      Add {formatCurrency(freeShippingThreshold - subtotal)} more for free shipping
                    </p>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-accent">{formatCurrency(total)}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    {gstMessage}
                  </p>
                  
                  <Button 
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent"
                    size="lg"
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </main>
      <Footer />
    </div>
  );
};
export default Cart;
