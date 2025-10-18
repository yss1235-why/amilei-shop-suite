import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, addToCart } from '@/lib/cart';
import { toast } from 'sonner';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  discountPercent?: number;
  courierCharges?: number; // 🔧 NEW FIELD
  imageUrl: string;
  inStock: boolean;
  isFeatured?: boolean;
}

const ProductCard = ({
  id,
  name,
  price,
  salePrice,
  discountPercent,
  courierCharges, // 🔧 NEW FIELD
  imageUrl,
  inStock,
  isFeatured
}: ProductCardProps) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!inStock) {
      toast.error('Product out of stock');
      return;
    }
    
    addToCart({
      productId: id,
      name,
      imageUrl,
      price,
      salePrice,
      courierCharges // 🔧 NEW FIELD
    }, 1);
    
    toast.success('Added to cart!');
    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <Link to={`/product/${id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-[--shadow-product] border-border/50">
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
          {!inStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Badge variant="secondary" className="text-base px-4 py-2">
                Out of Stock
              </Badge>
            </div>
          )}
          <img
            src={imageUrl}
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
