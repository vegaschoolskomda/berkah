"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { pingEmployeeActivity } from '@/lib/api';

function readablePageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  return pathname
    .split('?')[0]
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/[-_]/g, ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' / ') || 'Halaman';
}

export function EmployeeActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const pageTitle = typeof document !== 'undefined'
      ? (document.title || readablePageTitle(pathname))
      : readablePageTitle(pathname);

    const sendPing = () => {
      pingEmployeeActivity({ path: pathname, pageTitle }).catch(() => {
        // Silent fail: tracking must not block user navigation.
      });
    };

    sendPing();
    const intervalId = window.setInterval(sendPing, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [pathname]);

  return null;
}
