'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User, LogIn, LogOut, Trophy, Award, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getCompletedDates } from '@/lib/indexeddb';
import { calculateStreak } from '@/lib/date-utils';

export function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const { isOnline, justCameOnline } = useOnlineStatus();
  const [localStreak, setLocalStreak] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load streak from IndexedDB for guest users
  useEffect(() => {
    async function loadStreak() {
      try {
        const dates = await getCompletedDates();
        setLocalStreak(calculateStreak(dates));
      } catch { }
    }
    loadStreak();
  }, []);

  // Trigger background sync banner when coming back online
  useEffect(() => {
    if (justCameOnline && session?.user) {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 3000);
    }
  }, [justCameOnline, session]);

  const displayStreak = session?.user?.streak || localStreak;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1" />

      {/* Sync / Online Status Banner */}
      <div className="flex items-center gap-3">
        {/* Online/Offline Indicator */}
        <div
          className={cn(
            'hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-all duration-300',
            isOnline
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
          )}
        >
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Syncing indicator */}
        {isSyncing && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-primary animate-sync">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Syncing...</span>
          </div>
        )}

        {/* Streak Display */}
        {displayStreak > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
            <span className="text-base animate-fire select-none">🔥</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {displayStreak}
            </span>
          </div>
        )}

        {/* Score badge */}
        {session?.user?.totalScore && session.user.totalScore > 0 ? (
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="font-semibold">{session.user.totalScore.toLocaleString()}</span>
            <span className="text-muted-foreground">pts</span>
          </div>
        ) : null}

        {/* Auth Button */}
        {!session && !isLoading ? (
          <Button onClick={() => signIn('google')} variant="default" size="sm">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" disabled={isLoading}>
                <Avatar className="h-8 w-8">
                  {session?.user?.image && (
                    <AvatarImage src={session.user.image} alt={session.user.name || 'User'} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {session?.user?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session?.user?.name || 'Guest User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email || 'Playing locally — sign in to sync'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {session?.user ? (
                <>
                  <DropdownMenuItem disabled className="cursor-default">
                    <span className="mr-2 text-base">🔥</span>
                    <span>Streak: <strong>{session.user.streak || 0}</strong> days</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="cursor-default">
                    <Trophy className="mr-2 h-4 w-4 text-amber-500" />
                    <span>Score: <strong>{(session.user.totalScore || 0).toLocaleString()}</strong></span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem disabled className="cursor-default">
                    <span className="mr-2 text-base">🔥</span>
                    <span>Streak: <strong>{localStreak}</strong> days</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signIn('google')}>
                    <LogIn className="mr-2 h-4 w-4" />
                    <span>Sign in to sync progress</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
