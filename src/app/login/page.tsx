'use client';

import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, PlayCircle } from 'lucide-react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.replace('/');
    }
  }, [status, session, router]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome to Logic Looper</CardTitle>
          <CardDescription>
            Sign in to sync your progress, streak, and leaderboard scores across devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={() => signIn('google', { callbackUrl: '/' })}>
            <LogIn className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              <PlayCircle className="mr-2 h-4 w-4" />
              Continue as Guest
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
