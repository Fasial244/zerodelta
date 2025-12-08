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
  const showTickerBar = user && showTicker;

  return (
    <div className="min-h-screen bg-background grid-bg relative">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-50" />
      
      {/* Header - fixed at top */}
      <Header />
      
      {/* Activity Ticker - sticky below header */}
      {showTickerBar && (
        <div className="fixed top-16 left-0 right-0 z-40">
          <ActivityTicker />
        </div>
      )}
      
      {/* Main Content - adjust padding based on ticker visibility */}
      <main className={`min-h-screen ${showTickerBar ? 'pt-24' : 'pt-16'}`}>
        {children}
      </main>

      {/* Honeypot - hidden from view */}
      {/* Flag: DELTA{cheaters_never_prosper} */}
    </div>
  );
}
