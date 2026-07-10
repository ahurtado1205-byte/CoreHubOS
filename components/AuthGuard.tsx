'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePMS } from '../context/PMSContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = usePMS();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Determine if path is public
    const isPublicPath = pathname === '/login' || 
      pathname.startsWith('/l/') ||
      pathname.startsWith('/w/') ||
      pathname.startsWith('/book/') ||
      pathname.startsWith('/precheckin/') ||
      (pathname.startsWith('/funnels/') && pathname !== '/funnels' && !pathname.endsWith('/edit'));

    // Never redirect away from public pages - they should always be accessible
    if (isPublicPath) return;

    if (!isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated && !isInitialized && pathname !== '/onboarding') {
      router.push('/onboarding');
    } else if (isAuthenticated && isInitialized && (pathname === '/login' || pathname === '/onboarding')) {
      router.push('/roomrack');
    }
  }, [isAuthenticated, isInitialized, pathname, router, mounted]);

  if (!mounted) return null;

  const isPublicPath = pathname === '/login' || 
    pathname.startsWith('/l/') ||
    pathname.startsWith('/w/') ||
    pathname.startsWith('/book/') ||
    pathname.startsWith('/precheckin/') ||
    (pathname.startsWith('/funnels/') && pathname !== '/funnels' && !pathname.endsWith('/edit'));

  // Always render public pages regardless of auth state
  if (isPublicPath) return <>{children}</>;

  // Render nothing while redirecting to prevent flash
  if (!isAuthenticated) return null;
  if (isAuthenticated && !isInitialized && pathname !== '/onboarding') return null;

  return <>{children}</>;
}
