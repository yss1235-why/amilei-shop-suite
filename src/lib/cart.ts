export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  salePrice?: number;
  courierCharges?: number;
  stockCount: number;
  selectedSize?: string;
  quantity: number;
}
const CART_KEY = 'amilei_cart';

export const getCart = (): CartItem[] => {
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
};

export const saveCart = (cart: CartItem[]): void => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number = 1): void => {
  const cart = getCart();
  const existingItem = cart.find(i => i.productId === item.productId);
  
  if (existingItem) {
    // Don't exceed stock limit
    const newQuantity = Math.min(existingItem.quantity + quantity, item.stockCount);
    existingItem.quantity = newQuantity;
    existingItem.stockCount = item.stockCount; // Update stock info
  } else {
    // Ensure initial quantity doesn't exceed stock
    const validQuantity = Math.min(quantity, item.stockCount);
    cart.push({ ...item, quantity: validQuantity });
  }
  
  saveCart(cart);
};

export const updateCartItemQuantity = (productId: string, quantity: number): void => {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  
  if (item) {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      // 🔧 Enforce stock limit
      item.quantity = Math.min(quantity, item.stockCount);
      saveCart(cart);
    }
  }
};

export const removeFromCart = (productId: string): void => {
  const cart = getCart();
  const filtered = cart.filter(i => i.productId !== productId);
  saveCart(filtered);
};

export const clearCart = (): void => {
  localStorage.removeItem(CART_KEY);
};

// 🔧 UPDATED CALCULATION
export const getCartTotal = (defaultCourierCharges: number, freeShippingThreshold: number): {
  subtotal: number;
  courier: number;
  total: number;
  courierBreakdown: { productName: string; charge: number }[];
} => {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => {
    const price = item.salePrice || item.price;
    return sum + (price * item.quantity);
  }, 0);
  
  // Calculate total courier charges
  let totalCourierCharges = 0;
  const courierBreakdown: { productName: string; charge: number }[] = [];
  
  if (subtotal < freeShippingThreshold) {
    cart.forEach(item => {
      // Use product-specific courier charge or default
      const charge = item.courierCharges !== undefined ? item.courierCharges : defaultCourierCharges;
      const itemCourierCharge = charge * item.quantity;
      
      totalCourierCharges += itemCourierCharge;
      courierBreakdown.push({
        productName: item.name,
        charge: itemCourierCharge
      });
    });
  }
  
  const total = subtotal + totalCourierCharges;
  
  return { 
    subtotal, 
    courier: totalCourierCharges, 
    total,
    courierBreakdown 
  };
};

export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// NEW FUNCTION - Add this after formatCurrency
export const reduceProductStock = async (productId: string, quantity: number) => {
  try {
    const { doc, getDoc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    
    const productRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
      throw new Error('Product not found');
    }
    
    const currentStock = productDoc.data().stockCount;
    const newStock = currentStock - quantity;
    
    // Update stock count
    await updateDoc(productRef, {
      stockCount: Math.max(0, newStock),
      inStock: newStock > 0
    });
    
    return newStock;
  } catch (error) {
    console.error('Error reducing stock:', error);
    throw error;
  }
};
