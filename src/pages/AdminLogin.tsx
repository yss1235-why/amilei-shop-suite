import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';

const AdminLogin = () => {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          
          if (!adminDoc.exists()) {
            toast.error('You are not authorized as an admin');
            await auth.signOut();
            return;
          }

          const adminData = adminDoc.data();
          const subscriptionExpiry = adminData.subscriptionExpiry?.toDate();
          const now = new Date();

          if (subscriptionExpiry < now) {
            toast.error('Your subscription has expired. Please renew to continue.');
            await auth.signOut();
            return;
          }

          navigate('/admin/dashboard');
        } catch (error) {
          console.error('Error checking admin:', error);
          toast.error('Failed to verify admin status');
        }
      }
    };

    checkAdmin();
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user is admin
      const adminDoc = await getDoc(doc(db, 'admins', result.user.uid));
      
      if (!adminDoc.exists()) {
        toast.error('You are not authorized as an admin');
        await auth.signOut();
        return;
      }

      const adminData = adminDoc.data();
      const subscriptionExpiry = adminData.subscriptionExpiry?.toDate();
      const now = new Date();

      if (subscriptionExpiry < now) {
        toast.error('Your subscription has expired. Please renew to continue.');
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
            Amilei Admin
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
