import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImageCarousel from '@/components/ImageCarousel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Loader2, ArrowLeft } from 'lucide-react';
import { formatCurrency, addToCart } from '@/lib/cart';
import { toast } from 'sonner';
import ShareButton from '@/components/ShareButton';

interface SizeOption {
  name: string;
  image?: string;
}

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
  sizes?: (string | SizeOption)[];
  isFeatured: boolean;
}
const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedSizeImage, setSelectedSizeImage] = useState<string | null>(null);
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

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a variant');
      return;
    }

    // Generate a unique variant ID for cart distinction
    const variantId = selectedSize ? `${id}-${selectedSize}` : id;

    addToCart({
      productId: id,
      productName: product.name,
      selectedVariantId: variantId,
      variantName: selectedSize || 'Default',
      price: product.salePrice || product.price,
      image: selectedSizeImage || product.images[0],
      stockCount: product.stockCount,
      courierCharges: product.courierCharges,
      // Legacy fields for backward compatibility
      name: product.name,
      imageUrl: selectedSizeImage || product.images[0],
      salePrice: product.salePrice,
      selectedSize: selectedSize || undefined,
      selectedSizeImage: selectedSizeImage || undefined
    }, quantity);

    toast.success(`Added ${quantity} ${selectedSize || ''} to cart!`);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
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
          className="mb-6 hover:bg-secondary transition-all duration-300 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Product Image Carousel */}
          <div className="relative">
            {product.isFeatured && (
              <Badge className="absolute top-4 left-4 z-10 bg-gradient-to-r from-accent to-accent/90 shadow-lg px-4 py-2 font-medium tracking-wide">
                Featured Product
              </Badge>
            )}
            {product.discountPercent && product.discountPercent > 0 && (
              <Badge variant="destructive" className="absolute top-4 right-4 z-10 shadow-lg px-4 py-2 font-semibold">
                {product.discountPercent}% OFF
              </Badge>
            )}
            {!product.inStock && (
              <Badge variant="destructive" className="absolute top-4 left-4 z-10 shadow-lg px-4 py-2 font-semibold">
                Out of Stock
              </Badge>
            )}
            <ImageCarousel
              images={selectedSizeImage ? [selectedSizeImage] : product.images}
              productName={product.name}
            />
            {selectedSizeImage && (
              <div className="mt-2 text-center">
                <Badge variant="secondary" className="text-xs">
                  Showing image for: {selectedSize}
                </Badge>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold">{product.name}</h1>
            </div>

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

            <Card className="mb-6 bg-white shadow-sm">
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
            {/* Size Selector */}
            {product.inStock && product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Select Size <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {product.sizes.map((size, index) => {
                    const sizeName = typeof size === 'string' ? size : size.name;
                    const sizeImage = typeof size === 'string' ? null : size.image;

                    return (
                      <Button
                        key={index}
                        type="button"
                        variant={selectedSize === sizeName ? 'default' : 'outline'}
                        className={`transition-all duration-300 font-medium ${selectedSize === sizeName
                          ? 'bg-accent shadow-md scale-105'
                          : 'hover:border-accent/50 hover:bg-accent/5'
                          }`}
                        onClick={() => {
                          setSelectedSize(sizeName);
                          setSelectedSizeImage(sizeImage || null);
                        }}
                      >
                        {sizeName}
                      </Button>
                    );
                  })}
                </div>
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
                    className="hover:bg-accent/10 hover:border-accent/50 transition-all duration-300"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                    className="hover:bg-accent/10 hover:border-accent/50 transition-all duration-300"
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
              className="w-full bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent shadow-md hover:shadow-lg transition-all duration-300 font-semibold tracking-wide"
            >
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>
        </div>
      </main>

      {/* Floating Share Button - Always visible */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-blue-500 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-blue-600 transition-all duration-300">
          <ShareButton productName={product.name} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
