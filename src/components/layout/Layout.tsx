import { ReactNode } from 'react';
import { Header } from './Header';
import { ActivityTicker } from './ActivityTicker';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
  showTicker?: boolean;
}

export function Layout({ children, showTicker = true }: LayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background grid-bg relative">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-50" />
      
      {/* Header */}
      <Header />
      
      {/* Activity Ticker - only show when logged in */}
      {user && showTicker && (
        <div className="fixed top-16 left-0 right-0 z-40">
          <ActivityTicker />
        </div>
      )}
      
      {/* Main Content */}
      <main className={`pt-${user && showTicker ? '24' : '16'} min-h-screen`}>
        {children}
      </main>

      {/* Honeypot - hidden from view */}
      {/* Flag: DELTA{cheaters_never_prosper} */}
    </div>
  );
}
