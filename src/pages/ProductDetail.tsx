// In the interface at the top, add:
interface Product {
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  discountPercent?: number;
  courierCharges?: number; // 🔧 NEW FIELD
  imageUrl: string;
  inStock: boolean;
  stockCount: number;
  isFeatured: boolean;
}

// In the handleAddToCart function, update:
const handleAddToCart = () => {
  if (!product || !id) return;
  
  if (!product.inStock) {
    toast.error('Product out of stock');
    return;
  }
  
  addToCart({
    productId: id,
    name: product.name,
    imageUrl: product.imageUrl,
    price: product.price,
    salePrice: product.salePrice,
    courierCharges: product.courierCharges // 🔧 NEW FIELD
  }, quantity);
  
  toast.success(`Added ${quantity} item(s) to cart!`);
  window.dispatchEvent(new Event('cartUpdated'));
};
