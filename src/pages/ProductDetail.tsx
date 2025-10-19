import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/Header';
import ImageCarousel from '@/components/ImageCarousel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Loader2, ArrowLeft } from 'lucide-react';
import { formatCurrency, addToCart } from '@/lib/cart';
import { toast } from 'sonner';

interface Product {
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  discountPercent?: number;
  courierCharges?: number;
  images: string[];
  imageUrl?: string; // Backward compatibility
  inStock: boolean;
  stockCount: number;
  isFeatured: boolean;
}
const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        const productDoc = await getDoc(doc(db, 'products', id));
        if (productDoc.exists()) {
          const data = productDoc.data();
          // Handle backward compatibility
          const images = data.images || (data.imageUrl ? [data.imageUrl] : []);
          setProduct({ ...data, images } as Product);
        } else {
          toast.error('Product not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

   const handleAddToCart = () => {
    if (!product || !id) return;
    
    if (!product.inStock) {
      toast.error('Product out of stock');
      return;
    }
    
    addToCart({
      productId: id,
      name: product.name,
      imageUrl: product.images[0], // Use first image
      price: product.price,
      salePrice: product.salePrice,
      courierCharges: product.courierCharges
    }, quantity);
    
    toast.success(`Added ${quantity} item(s) to cart!`);
    window.dispatchEvent(new Event('cartUpdated'));
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

  if (!product) return null;

  const displayPrice = product.salePrice || product.price;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

       <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Product Image Carousel */}
          <div className="relative">
            {product.isFeatured && (
              <Badge className="absolute top-4 left-4 z-10 bg-gradient-to-r from-accent to-accent/90">
                Product of the Day
              </Badge>
            )}
            {product.discountPercent && product.discountPercent > 0 && (
              <Badge variant="destructive" className="absolute top-4 right-4 z-10">
                {product.discountPercent}% OFF
              </Badge>
            )}
            {!product.inStock && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                <Badge variant="secondary" className="text-lg px-6 py-3">
                  Out of Stock
                </Badge>
              </div>
            )}
            <ImageCarousel images={product.images} productName={product.name} />
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-accent">
                {formatCurrency(displayPrice)}
              </span>
              {product.salePrice && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            <Card className="mb-6">
              <CardContent className="p-4">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              </CardContent>
            </Card>

            {product.inStock && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">
                  {product.stockCount} items in stock
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            {product.inStock && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              size="lg"
              className="w-full bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent"
            >
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
