import { Layout } from '@/components/layout/Layout';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Auth() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect after loading is complete AND user exists
    if (!isLoading && user) {
      navigate('/challenges');
    }
  }, [user, isLoading, navigate]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <Layout showTicker={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-primary font-mono">AUTHENTICATING...</div>
        </div>
      </Layout>
    );
  }

  // Already logged in - don't flash the form
  if (user) {
    return (
      <Layout showTicker={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-primary font-mono">REDIRECTING...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showTicker={false}>
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <AuthForm />
      </div>
    </Layout>
  );
}
