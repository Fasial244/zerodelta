import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useAuth } from '@/hooks/useAuth';
import { MaintenanceLockScreen } from './MaintenanceLockScreen';
import { toast } from 'sonner';

interface MaintenanceWrapperProps {
  children: ReactNode;
}

const MAX_LOADING_TIME_MS = 10000; // 10 second timeout

export function MaintenanceWrapper({ children }: MaintenanceWrapperProps) {
  const location = useLocation();
  const { settings, isLoading: settingsLoading } = useSystemSettings();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Combined loading state
  const isLoading = (settingsLoading || authLoading) && !timedOut;

  // Timeout to prevent infinite loading
  useEffect(() => {
    if (!settingsLoading && !authLoading) {
      setTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      console.warn('MaintenanceWrapper: Loading timed out after', MAX_LOADING_TIME_MS, 'ms');
      setTimedOut(true);
    }, MAX_LOADING_TIME_MS);

    return () => clearTimeout(timer);
  }, [settingsLoading, authLoading]);

  // Show toast when maintenance mode changes
  useEffect(() => {
    if (!isLoading && settings) {
      if (settings.game_paused && isAdmin) {
        toast.warning('Maintenance mode is active', {
          description: 'Regular users cannot access the platform',
          duration: 5000,
        });
      }
    }
  }, [settings?.game_paused, isLoading, isAdmin]);

  // Show loading state (with timeout protection)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary font-mono">INITIALIZING...</div>
      </div>
    );
  }

  // If game is paused and user is not admin, show maintenance screen
  // Allow access to auth page so people can still log in
  if (settings?.game_paused && !isAdmin && location.pathname !== '/auth') {
    return <MaintenanceLockScreen />;
  }

  return <>{children}</>;
}