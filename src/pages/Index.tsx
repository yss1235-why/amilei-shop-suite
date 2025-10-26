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
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
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
    
    const featured = productsList.filter(p => p.isFeatured);
    const regular = productsList.filter(p => !p.isFeatured);
    
    // Sort regular products: in-stock first (alphabetically), then out-of-stock (alphabetically)
        const sortedRegular = regular.sort((a, b) => {
          // First sort by stock status (in-stock first)
          if (a.inStock !== b.inStock) {
            return a.inStock ? -1 : 1;
          }
          // Then sort alphabetically by name within each group
          return a.name.localeCompare(b.name);
        });
    
    setFeaturedProducts(featured);
    setProducts(sortedRegular);
    setFilteredProducts(sortedRegular);
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
        {/* Featured Products Section */}
{featuredProducts.length > 0 && (
  <section className="mb-16">
    <div className="bg-gradient-to-br from-accent/5 via-accent/3 to-transparent rounded-3xl p-6 md:p-10 border border-accent/10 shadow-sm">
      <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
        <span className="bg-gradient-to-r from-accent via-accent/90 to-accent/70 bg-clip-text text-transparent tracking-tight">
          Featured Products
        </span>
      </h2>
      
      <div className={`grid gap-6 ${
        featuredProducts.length === 1 
          ? 'max-w-md mx-auto' 
          : featuredProducts.length === 2 
          ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto' 
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {featuredProducts.map(product => (
          <div key={product.id} className="transform transition-all duration-300 hover:scale-[1.02]">
            <ProductCard {...product} />
          </div>
        ))}
      </div>
    </div>
  </section>
)}
        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
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
