import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Loader2 } from 'lucide-react';

interface Product {
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
  isFeatured: boolean;
}

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        const productsList = snapshot.docs.map(doc => {
          const data = doc.data();
          // Handle backward compatibility
          const images = data.images || (data.imageUrl ? [data.imageUrl] : []);
          return {
            id: doc.id,
            ...data,
            images
          };
        }) as Product[];
        
        const featured = productsList.find(p => p.isFeatured);
        const regular = productsList.filter(p => !p.isFeatured);
        
        setFeaturedProduct(featured || null);
        setProducts(regular);
        setFilteredProducts(regular);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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

return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} searchQuery={searchQuery} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Welcome to Amilei eCollection
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our curated collection of premium products
          </p>
        </div>

        {/* Featured Product */}
        {featuredProduct && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">
                Product of the Day
              </span>
            </h2>
            <div className="max-w-md mx-auto">
              <ProductCard {...featuredProduct} />
            </div>
          </section>
        )}

        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {searchQuery ? 'Search Results' : 'All Products'}
            </h2>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                Found {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </p>
            )}
          </div>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchQuery 
                  ? `No products found for "${searchQuery}"`
                  : 'No products available at the moment'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-accent hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </section>
    </main>
      <Footer />
    </div>
  );
};

export default Index;
