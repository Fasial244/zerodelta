import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useAuth } from '@/hooks/useAuth';
import { MaintenanceLockScreen } from './MaintenanceLockScreen';
import { toast } from 'sonner';

interface MaintenanceWrapperProps {
  children: ReactNode;
}

export function MaintenanceWrapper({ children }: MaintenanceWrapperProps) {
  const location = useLocation();
  const { settings, isLoading } = useSystemSettings();
  const { isAdmin } = useAuth();

  // Show toast when maintenance mode changes
  useEffect(() => {
    if (!isLoading && settings) {
      // Only show toast to admins when maintenance is toggled
      if (settings.game_paused && isAdmin) {
        toast.warning('Maintenance mode is active', {
          description: 'Regular users cannot access the platform',
          duration: 5000,
        });
      }
    }
  }, [settings?.game_paused, isLoading, isAdmin]);

  // Show loading state
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