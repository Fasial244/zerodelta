import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { 
  Shield, 
  LogOut, 
  User, 
  Settings, 
  Trophy,
  Map,
  Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { settings, countdown, gameState } = useSystemSettings();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Shield className="h-8 w-8 text-primary" />
          </motion.div>
          <span className="text-xl font-bold text-glow-cyan font-mono">
            {settings?.event_title || 'ZeroDelta'}
          </span>
        </Link>

        {/* Countdown Timer */}
        <div className="hidden md:flex items-center gap-2">
          <div className={`
            px-4 py-1 rounded border font-mono text-sm
            ${gameState === 'active' ? 'border-neon-green text-neon-green' : ''}
            ${gameState === 'before_start' ? 'border-neon-yellow text-neon-yellow' : ''}
            ${gameState === 'ended' ? 'border-neon-red text-neon-red' : ''}
            ${gameState === 'paused' ? 'border-neon-orange text-neon-orange animate-pulse' : ''}
          `}>
            {gameState === 'before_start' && 'STARTS IN: '}
            {gameState === 'active' && 'REMAINING: '}
            {countdown}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/challenges">
                <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
                  <Map className="h-4 w-4" />
                  <span>Challenges</span>
                </Button>
              </Link>
              
              <Link to="/leaderboard">
                <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
                  <Trophy className="h-4 w-4" />
                  <span>Leaderboard</span>
                </Button>
              </Link>

              {/* Admin Button - Only visible to admins */}
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="gap-2 text-secondary">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </Link>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline font-mono">
                      {profile?.username || 'User'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/activity')}>
                    <Activity className="h-4 w-4 mr-2" />
                    Activity
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button className="gap-2 bg-primary text-primary-foreground">
                <Shield className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
