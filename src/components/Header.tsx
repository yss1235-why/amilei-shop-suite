import { Link } from 'react-router-dom';
import { ShoppingCart, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCart } from '@/lib/cart';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

const Header = ({ onSearch, searchQuery = '' }: HeaderProps) => {
  const [cartCount, setCartCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = getCart();
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);
    
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const handleSearch = (value: string) => {
    setLocalQuery(value);
    onSearch?.(value);
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    onSearch?.('');
  };

  return (
  <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-md transition-all duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
  Amilei eCollection
</h1>
        </Link>
        
        {/* Desktop Search */}
        {onSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={localQuery}
                onChange={(e) => handleSearch(e.target.value)}
               className="w-full pl-10 pr-10 bg-white border-border text-foreground placeholder:text-muted-foreground focus:bg-white focus:border-primary/40 focus:shadow-sm transition-all"
              />
              {localQuery && (
                <button
                  onClick={handleClearSearch}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Mobile Search Toggle */}
          {onSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className="md:hidden text-foreground hover:bg-secondary transition-all duration-300 hover:scale-105"
            >
              {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>
          )}

          {/* Cart Icon */}
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative text-foreground hover:bg-secondary transition-all duration-300 hover:scale-105">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge 
                  variant="default" 
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-accent shadow-md animate-pulse"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {onSearch && showSearch && (
        <div className="md:hidden border-t border-border px-4 py-3 bg-white/95 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              type="text"
              placeholder="Search products..."
              value={localQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary/30 transition-all"
              autoFocus
            />
            {localQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
