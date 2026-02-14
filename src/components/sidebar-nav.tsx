'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LayoutGrid, Trophy, Award, User } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function SidebarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const menuItems = [
    { href: '/', label: 'Daily Puzzle', icon: LayoutGrid },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/achievements', label: 'Achievements', icon: Award },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="items-center">
        <Separator className="my-2" />
        <div className="flex items-center gap-3 p-2 rounded-md w-full transition-colors hover:bg-sidebar-accent">
          <Avatar className="h-9 w-9">
            <AvatarImage src={session?.user?.image || ''} />
            <AvatarFallback>{session?.user?.name?.[0] || <User />}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="font-medium text-sm truncate">{session?.user?.name || 'Guest User'}</span>
            <span className="text-xs text-muted-foreground truncate">{session?.user?.email || 'Sign in to save progress'}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
