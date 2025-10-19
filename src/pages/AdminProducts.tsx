import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, Star, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/cart';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  images: string[];
  imageUrl?: string; // Backward compatibility
  inStock: boolean;
  stockCount: number;
  isFeatured: boolean;
}

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

 const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
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
      setProducts(productsList);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteDoc(doc(db, 'products', deleteId));
      toast.success('Product deleted successfully');
      setProducts(products.filter(p => p.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Products</h1>
          <Button
            onClick={() => navigate('/admin/products/add')}
            className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Products List */}
        {products.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative aspect-square bg-secondary/50">
                  {product.isFeatured && (
                    <Badge className="absolute top-2 left-2 bg-gradient-to-r from-accent to-accent/90">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {!product.inStock && (
                    <Badge variant="secondary" className="absolute top-2 right-2">
                      Out of Stock
                    </Badge>
                  )}
                 <img
                    src={product.images[0] || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-background/80 text-xs px-2 py-1 rounded">
                      +{product.images.length - 1} more
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-1 mb-1">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      {product.salePrice ? (
                        <>
                          <span className="font-bold text-accent">{formatCurrency(product.salePrice)}</span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(product.price)}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold">{formatCurrency(product.price)}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Stock: {product.stockCount}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => setDeleteId(product.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No products yet</h2>
            <p className="text-muted-foreground mb-6">Start by adding your first product</p>
            <Button
              onClick={() => navigate('/admin/products/add')}
              className="bg-gradient-to-r from-accent to-accent/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminProducts;
