export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  salePrice?: number;
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
    existingItem.quantity += quantity;
  } else {
    cart.push({ ...item, quantity });
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
      item.quantity = quantity;
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

export const getCartTotal = (courierCharges: number, freeShippingThreshold: number): {
  subtotal: number;
  courier: number;
  total: number;
} => {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => {
    const price = item.salePrice || item.price;
    return sum + (price * item.quantity);
  }, 0);
  
  const courier = subtotal >= freeShippingThreshold ? 0 : courierCharges;
  const total = subtotal + courier;
  
  return { subtotal, courier, total };
};

export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
