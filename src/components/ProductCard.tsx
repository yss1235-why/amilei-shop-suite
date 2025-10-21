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
    <Card className={`group overflow-hidden transition-all hover:shadow-[--shadow-product] border-border/50 ${!inStock ? 'opacity-60' : ''}`}>
       <div className="relative aspect-square overflow-hidden bg-secondary/50">
          {isFeatured && (
            <Badge className="absolute top-2 left-2 z-10 bg-gradient-to-r from-accent to-accent/90">
              Product of the Day
            </Badge>
          )}
          {discountPercent && discountPercent > 0 && (
            <Badge variant="destructive" className="absolute top-2 right-2 z-10">
              {discountPercent}% OFF
            </Badge>
          )}
         {sizes && sizes.length > 0 && (
            <Badge variant="secondary" className="absolute bottom-2 left-2 z-10 text-xs">
              {sizes.length} {sizes.length === 1 ? 'size' : 'sizes'}
            </Badge>
          )}
          {!inStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Badge variant="secondary" className="text-base px-4 py-2">
                Out of Stock
              </Badge>
            </div>
          )}
          
          {/* Image Navigation for multiple images */}
          {productImages.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              
              {/* Image indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
                {productImages.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'w-4 bg-accent'
                        : 'w-1.5 bg-background/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          
          <img
            src={displayImage}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-base line-clamp-2 mb-2 text-card-foreground">
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
            className="w-full bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent"
          >
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProductCard;
