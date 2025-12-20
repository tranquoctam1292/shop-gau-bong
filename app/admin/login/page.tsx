'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for query params (e.g., passwordChanged, loggedOutAll)
  useEffect(() => {
    const passwordChanged = searchParams.get('passwordChanged');
    const loggedOutAll = searchParams.get('loggedOutAll');

    if (passwordChanged === 'true') {
      // Show success message
      setTimeout(() => {
        // Message will be shown in UI
      }, 100);
    }

    if (loggedOutAll === 'true') {
      // Show info message
      setTimeout(() => {
        // Message will be shown in UI
      }, 100);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 🔒 SECURITY FIX: Call signIn directly (all auth logic is now in NextAuth)
      // Rate limiting and password verification are handled by NextAuth authorize function
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Handle authentication errors from NextAuth
        // NextAuth returns 'CredentialsSignin' for invalid credentials or rate limiting
        if (result.error === 'CredentialsSignin') {
          setError('Tên đăng nhập hoặc mật khẩu không đúng. Hoặc tài khoản đã bị khóa.');
        } else {
          setError('Đăng nhập không thành công. Vui lòng thử lại.');
        }
        setLoading(false);
      } else if (result?.ok) {
        // ✅ Login successful - session is created
        // Now check user status from session and redirect accordingly

        // Get the current session to check if user must change password
        // The middleware will handle the redirect if mustChangePassword is true
        // Use router.push for client-side navigation (stays in app context)
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Đăng nhập Admin
          </CardTitle>
          <CardDescription className="text-center">
            Vui lòng đăng nhập để truy cập admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            
            {/* Show message if password changed or logged out all */}
            {searchParams.get('passwordChanged') === 'true' && (
              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                Đổi mật khẩu thành công. Vui lòng đăng nhập lại.
              </div>
            )}
            {searchParams.get('loggedOutAll') === 'true' && (
              <div className="p-3 text-sm text-blue-600 bg-blue-50 rounded-md">
                Đã đăng xuất khỏi tất cả thiết bị. Vui lòng đăng nhập lại.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                placeholder="admin"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

