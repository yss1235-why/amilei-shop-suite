import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    whatsappNumber: '',
    courierCharges: '100',
    freeShippingThreshold: '2000',
    gstMessage: 'GST not included'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'store'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setFormData({
            storeName: data.storeName || '',
            whatsappNumber: data.whatsappNumber || '',
            courierCharges: data.courierCharges?.toString() || '100',
            freeShippingThreshold: data.freeShippingThreshold?.toString() || '2000',
            gstMessage: data.gstMessage || 'GST not included'
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const settingsData = {
        storeName: formData.storeName.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        courierCharges: parseInt(formData.courierCharges) || 100,
        freeShippingThreshold: parseInt(formData.freeShippingThreshold) || 2000,
        gstMessage: formData.gstMessage.trim()
      };

      await setDoc(doc(db, 'settings', 'store'), settingsData);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Store Settings</h1>
          <p className="text-muted-foreground">Manage your store configuration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Info */}
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Basic store details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="Amilei eCollection"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input
                  id="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  placeholder="919876543210 (with country code, no +)"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Include country code without + symbol (e.g., 919876543210 for India)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Settings</CardTitle>
              <CardDescription>Configure delivery and packaging charges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courierCharges">Courier and Packaging Charges (₹)</Label>
                <Input
                  id="courierCharges"
                  type="number"
                  min="0"
                  value={formData.courierCharges}
                  onChange={(e) => setFormData({ ...formData, courierCharges: e.target.value })}
                  placeholder="100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (₹)</Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  min="0"
                  value={formData.freeShippingThreshold}
                  onChange={(e) => setFormData({ ...formData, freeShippingThreshold: e.target.value })}
                  placeholder="2000"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Orders above this amount get free shipping
                </p>
              </div>
            </CardContent>
          </Card>

          {/* GST Message */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Message</CardTitle>
              <CardDescription>Message displayed to customers about GST</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="gstMessage">GST Message</Label>
                <Textarea
                  id="gstMessage"
                  value={formData.gstMessage}
                  onChange={(e) => setFormData({ ...formData, gstMessage: e.target.value })}
                  placeholder="GST not included"
                  rows={2}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
