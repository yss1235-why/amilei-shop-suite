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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
// Size Manager Component
const SizeManager = ({ sizes, onSizesChange }: { sizes: string[]; onSizesChange: (sizes: string[]) => void }) => {
  const [newSize, setNewSize] = useState('');

  const handleAddSize = () => {
    if (newSize.trim() && !sizes.includes(newSize.trim())) {
      onSizesChange([...sizes, newSize.trim()]);
      setNewSize('');
    }
  };

  const handleRemoveSize = (index: number) => {
    onSizesChange(sizes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label>Product Sizes (Optional)</Label>
      <p className="text-sm text-muted-foreground">
        Add sizes like "Small", "Medium", "4 inch", etc. Leave empty if no size variants.
      </p>
      
      <div className="flex gap-2">
        <Input
          value={newSize}
          onChange={(e) => setNewSize(e.target.value)}
          placeholder="e.g., Small, 4 inch, Premium"
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
        />
        <Button type="button" onClick={handleAddSize} variant="outline">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {sizes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sizes.map((size, index) => (
            <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
              {size}
              <button
                type="button"
                onClick={() => handleRemoveSize(index)}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

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
    images: [] as string[],
    stockCount: '',
    courierCharges: '',
    sizes: [] as string[],
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
            // Handle backward compatibility
            const images = data.images || (data.imageUrl ? [data.imageUrl] : []);
            
           setFormData({
              name: data.name || '',
              description: data.description || '',
              price: data.price?.toString() || '',
              salePrice: data.salePrice?.toString() || '',
              images: images,
              stockCount: data.stockCount?.toString() || '',
              courierCharges: data.courierCharges?.toString() || '',
              sizes: data.sizes || [],
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
 const handleImageUpload = (urls: string[]) => {
    setFormData({ ...formData, images: urls });
    toast.success('Images uploaded successfully');
  };

  const handleImageReorder = (images: string[]) => {
    setFormData({ ...formData, images });
  };

  const handleImageDelete = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
    toast.success('Image removed');
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || formData.images.length === 0 || !formData.stockCount) {
      toast.error('Please fill in all required fields including at least one image');
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
        images: formData.images,
        stockCount,
        courierCharges,
        sizes: formData.sizes,
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

           {/* Sizes */}
              <SizeManager
                sizes={formData.sizes}
                onSizesChange={(sizes) => setFormData({ ...formData, sizes })}
              />
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Product Images * (Up to 5 images)</Label>
                <CloudinaryUpload
                  onUpload={handleImageUpload}
                  currentImages={formData.images}
                  onReorder={handleImageReorder}
                  onDelete={handleImageDelete}
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
