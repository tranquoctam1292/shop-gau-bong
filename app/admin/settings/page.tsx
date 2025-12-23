'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Palette } from 'lucide-react';

/**
 * Settings Index Page
 * 
 * Redirects to appearance settings by default
 */
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to appearance settings (default)
    router.replace('/admin/settings/appearance');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Palette className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}

