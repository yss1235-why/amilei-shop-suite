import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminLayout from '@/components/AdminLayout';
import CloudinaryUpload from '@/components/CloudinaryUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    salePrice: '',
    imageUrl: '',
    stockCount: '',
    courierCharges: '', // 🔧 NEW FIELD
    inStock: true,
    isFeatured: false
  });

  useEffect(() => {
    if (isEdit && id) {
      const fetchProduct = async () => {
        try {
          const productDoc = await getDoc(doc(db, 'products', id));
          if (productDoc.exists()) {
            const data = productDoc.data();
            setFormData({
              name: data.name || '',
              description: data.description || '',
              price: data.price?.toString() || '',
              salePrice: data.salePrice?.toString() || '',
              imageUrl: data.imageUrl || '',
              stockCount: data.stockCount?.toString() || '',
              courierCharges: data.courierCharges?.toString() || '', // 🔧 NEW FIELD
              inStock: data.inStock ?? true,
              isFeatured: data.isFeatured ?? false
            });
          }
        } catch (error) {
          console.error('Error fetching product:', error);
          toast.error('Failed to load product');
        }
      };
      fetchProduct();
    }
  }, [isEdit, id]);

  const handleImageUpload = (url: string) => {
    setFormData({ ...formData, imageUrl: url });
    toast.success('Image uploaded successfully');
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.imageUrl || !formData.stockCount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const price = parseFloat(formData.price);
      const salePrice = formData.salePrice ? parseFloat(formData.salePrice) : undefined;
      const stockCount = parseInt(formData.stockCount);
      // Only set courierCharges if a value is provided, otherwise undefined (will use default)
      const courierCharges = formData.courierCharges && formData.courierCharges.trim() !== '' 
        ? parseFloat(formData.courierCharges) 
        : undefined;

      // Calculate discount percentage
      let discountPercent = 0;
      if (salePrice && salePrice < price) {
        discountPercent = Math.round(((price - salePrice) / price) * 100);
      }

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price,
        salePrice,
        discountPercent,
        imageUrl: formData.imageUrl.trim(),
        stockCount,
        courierCharges, // 🔧 NEW FIELD (optional)
        inStock: formData.inStock,
        isFeatured: formData.isFeatured
      };

      if (isEdit && id) {
        await updateDoc(doc(db, 'products', id), productData);
        toast.success('Product updated successfully');
      } else {
        await addDoc(collection(db, 'products'), productData);
        toast.success('Product added successfully');
      }

      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/products')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? 'Edit Product' : 'Add New Product'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  maxLength={100}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={4}
                  required
                />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Sale Price (₹)</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Stock Count & Courier Charges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockCount">Stock Quantity *</Label>
                  <Input
                    id="stockCount"
                    type="number"
                    min="0"
                    value={formData.stockCount}
                    onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                {/* 🔧 NEW FIELD */}
               <div className="space-y-2">
                  <Label htmlFor="courierCharges">
                    Courier and Packaging Charges (₹)
                    <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
                  </Label>
                  <Input
                    id="courierCharges"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.courierCharges}
                    onChange={(e) => setFormData({ ...formData, courierCharges: e.target.value })}
                    placeholder="Default store rate"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use default store courier and packaging charges
                  </p>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Product Image *</Label>
                <CloudinaryUpload
                  onUpload={handleImageUpload}
                  currentImage={formData.imageUrl}
                />
              </div>

              {/* Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="inStock">In Stock</Label>
                  <Switch
                    id="inStock"
                    checked={formData.inStock}
                    onCheckedChange={(checked) => setFormData({ ...formData, inStock: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isFeatured">Mark as Featured (Product of the Day)</Label>
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEdit ? 'Update Product' : 'Add Product'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/products')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminProductForm;
