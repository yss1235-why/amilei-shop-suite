import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, LayoutDashboard, Package, Settings, ShoppingCart, FileText } from 'lucide-react';
import { toast } from 'sonner';

// Get admin email from environment variable
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

// Validate admin email is configured
if (!ADMIN_EMAIL || ADMIN_EMAIL === 'your-admin-email@gmail.com') {
  console.error('⚠️ ADMIN EMAIL NOT CONFIGURED! Please set VITE_ADMIN_EMAIL in your .env file');
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [user, loading] = useAuthState(auth);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAdmin = async () => {
      console.log('🔍 Checking admin access...');
      console.log('User:', user?.email);
      console.log('Admin Email:', ADMIN_EMAIL);
      
      if (!loading) {
        if (!user) {
          console.log('❌ No user logged in, redirecting to login');
          navigate('/admin');
          return;
        }

        if (user.email !== ADMIN_EMAIL) {
          console.log('❌ Unauthorized: User email does not match admin email');
          toast.error('Unauthorized access - not an admin');
          await signOut(auth);
          navigate('/admin');
          return;
        }

        console.log('✅ Admin access granted');
        setIsCheckingAuth(false);
      }
    };

    checkAdmin();
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/admin');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  if (loading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const navItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/products', icon: Package, label: 'Products' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/admin/invoices', icon: FileText, label: 'Invoices' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/admin/dashboard" className="flex items-center space-x-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Amilei Admin
            </h1>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-accent'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-b bg-card">
        <div className="container mx-auto flex items-center gap-4 px-4 py-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 text-sm font-medium whitespace-nowrap px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
