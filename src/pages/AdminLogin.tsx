import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/contexts/StoreContext';

// 🔧 Get admin emails from environment variable (comma-separated)
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || '')
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter((email: string) => email.length > 0);

const AdminLogin = () => {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const { settings } = useStore();

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        // Check if logged-in user is in the admin list
        const userEmail = user.email?.toLowerCase() || '';
        if (!ADMIN_EMAILS.includes(userEmail)) {
          toast.error('You are not authorized as an admin');
          await auth.signOut();
          return;
        }

        navigate('/admin/dashboard');
      }
    };

    checkAdmin();
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Check if user is in the admin list
      const userEmail = result.user.email?.toLowerCase() || '';
      if (!ADMIN_EMAILS.includes(userEmail)) {
        toast.error('You are not authorized as an admin');
        await auth.signOut();
        return;
      }

      toast.success('Welcome back!');
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {settings?.storeName ? `${settings.storeName} Admin` : 'Admin Login'}
          </CardTitle>
          <CardDescription>
            Sign in with your Google account to manage your store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGoogleSignIn}
            className="w-full bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent"
            size="lg"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
