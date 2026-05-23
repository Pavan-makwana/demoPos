'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext'; // Check your import path
import { FiLoader } from 'react-icons/fi';

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tenantId, loading } = useAuth();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Don't do anything until Firebase finishes checking their token
    if (!loading) {
      
      // SECURITY CHECK 1: Are they even logged in?
      if (!user) {
        router.push('/login');
        return;
      }

      // SECURITY CHECK 2: Does the URL match their actual Database Tenant ID?
      // Example: If a cashier at Kapp's Corner tries to type /bluezone/admin
      if (tenantId && params.tenantId !== tenantId) {
        console.warn("Unauthorized cross-tenant access attempt intercepted.");
        // Redirect them back to their own safe dashboard
        router.push(`/${tenantId}/admin`);
      }
    }
  }, [user, tenantId, loading, params.tenantId, router]);

  // The "Bouncer" Loading Screen
  // Keeps the screen blank/loading until we are 100% sure they belong here
  if (loading || !user || (tenantId && params.tenantId !== tenantId)) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <FiLoader className="mb-4 h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground tracking-widest">
          SECURING WORKSPACE...
        </p>
      </div>
    );
  }

  // If they pass all security checks, unlock the doors and render the pages
  return <div className="h-screen w-full overflow-hidden">{children}</div>;
}