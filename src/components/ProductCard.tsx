import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, addToCart } from '@/lib/cart';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  discountPercent?: number;
  courierCharges?: number;
  images: string[];
  imageUrl?: string;
  inStock: boolean;
  stockCount: number;
  sizes?: string[];
  isFeatured?: boolean;
}

const ProductCard = ({
  id,
  name,
  price,
  salePrice,
  discountPercent,
  courierCharges,
  images,
  imageUrl,
  inStock,
  stockCount,
  sizes,
  isFeatured
}: ProductCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Handle backward compatibility
  const productImages = images && images.length > 0 ? images : (imageUrl ? [imageUrl] : []);
  const displayImage = productImages[currentImageIndex] || '/placeholder.svg';
  
  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (productImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (productImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
    }
  };
const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!inStock) {
      toast.error('Product out of stock');
      return;
    }
    
    addToCart({
      productId: id,
      name,
      imageUrl: productImages[0],
      price,
      salePrice,
      courierCharges,
      stockCount // 🔧 Pass stock count (use destructured variable, not props)
    }, 1);
    
    toast.success('Added to cart!');
    window.dispatchEvent(new Event('cartUpdated'));
  };
return (
  <Link to={`/product/${id}`}>
   <Card className={`group overflow-hidden transition-all duration-500 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1 border-border/40 ${!inStock ? 'opacity-60' : ''}`}>
     <div className="relative aspect-square overflow-hidden bg-white">
          {isFeatured && (
              <Badge className="absolute top-3 left-3 z-10 bg-gradient-to-r from-accent to-accent/90 shadow-lg px-3 py-1.5 font-semibold tracking-wide border border-accent/20">
                ⭐ Featured
              </Badge>
            )}
          {discountPercent && discountPercent > 0 && (
            <Badge variant="destructive" className="absolute top-3 right-3 z-10 shadow-md px-3 py-1.5 font-semibold">
              {discountPercent}% OFF
            </Badge>
          )}
         {sizes && sizes.length > 0 && (
            <Badge variant="secondary" className="absolute bottom-3 left-3 z-10 text-xs shadow-sm bg-background/80 backdrop-blur-sm border border-border/50 font-medium">
              {sizes.length} {sizes.length === 1 ? 'size' : 'sizes'}
            </Badge>
          )}
          {!inStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 backdrop-blur-md">
              <Badge variant="secondary" className="text-sm px-6 py-2.5 shadow-md font-semibold border border-border">
                Out of Stock
              </Badge>
            </div>
          )}
          
          {/* Image Navigation for multiple images */}
          {productImages.length > 1 && (
            <>
             <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md hover:scale-110"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md hover:scale-110"
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
              
              {/* Image indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                {productImages.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentImageIndex
                        ? 'w-6 bg-accent shadow-sm'
                        : 'w-1.5 bg-background/70 backdrop-blur-sm'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          
        <img
            src={displayImage}
            alt={name}
            className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
          />
        </div>
        
       <CardContent className="p-5">
         <h3 className="font-semibold text-base line-clamp-2 mb-3 text-foreground tracking-tight">
            {name}
          </h3>
          
          <div className="flex items-center gap-2">
            {salePrice ? (
              <>
                <span className="text-lg font-bold text-accent">
                  {formatCurrency(salePrice)}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(price)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-primary">
                {formatCurrency(price)}
              </span>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button 
            onClick={handleAddToCart}
            disabled={!inStock}
            className="w-full bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent shadow-sm hover:shadow-md transition-all duration-300 font-medium"
          >
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProductCard;
