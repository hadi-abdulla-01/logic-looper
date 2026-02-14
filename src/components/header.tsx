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
import { User, LogIn, LogOut, Trophy, Award } from 'lucide-react';

export function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        {session?.user && (
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="font-semibold">{session.user.totalScore || 0}</span>
            <span className="text-muted-foreground">points</span>
          </div>
        )}

        {!session && !isLoading ? (
          <Button onClick={() => signIn('google')} variant="default">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In with Google
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" disabled={isLoading}>
                <Avatar>
                  {session?.user?.image && (
                    <AvatarImage src={session.user.image} alt={session.user.name || 'User'} />
                  )}
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session?.user?.name || 'Guest'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email || 'Playing offline'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {session?.user && (
                <>
                  <DropdownMenuItem disabled>
                    <Award className="mr-2 h-4 w-4" />
                    <span>Streak: {session.user.streak || 0} days</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Trophy className="mr-2 h-4 w-4" />
                    <span>Score: {session.user.totalScore || 0}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {session ? (
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => signIn('google')}>
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Sign In</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
