import { Layout } from '@/components/layout/Layout';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/challenges');
    }
  }, [user, navigate]);

  return (
    <Layout showTicker={false}>
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <AuthForm onSuccess={() => navigate('/challenges')} />
      </div>
    </Layout>
  );
}
