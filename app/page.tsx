'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Login Page instead of POS
    router.replace('/login');
  }, [router]);

  // Optional: Show a loading state while redirect happens
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Loading...</h1>
      </div>
    </div>
  );
}