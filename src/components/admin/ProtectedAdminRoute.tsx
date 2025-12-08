import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoadingAdmin } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      console.warn('Unauthorized: No user logged in');
      navigate('/auth');
      return;
    }

    if (!authLoading && !isLoadingAdmin && user && !isAdmin) {
      console.warn('Unauthorized: User is not an admin');
      navigate('/');
    }
  }, [user, isAdmin, authLoading, isLoadingAdmin, navigate]);

  if (authLoading || isLoadingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-mono">VERIFYING ACCESS...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
