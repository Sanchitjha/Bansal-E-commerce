'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useShell } from '@/components/layout/StoreShell';

export default function AdminPage() {
  const router = useRouter();
  const shell = useShell();

  useEffect(() => {
    // Open the admin dashboard modal immediately
    shell.openAdmin();
    // Also keep the URL clean or with ?admin
    router.replace('/?admin=true');
  }, [router, shell]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-brand-cream">
      <div className="w-12 h-12 rounded-full border-4 border-amber-600 border-t-transparent animate-spin mb-4" />
      <h2 className="text-lg font-serif font-bold text-slate-800">Opening Luminary Admin Dashboard...</h2>
      <p className="text-sm text-slate-500 mt-1">Please wait a moment.</p>
    </div>
  );
}
