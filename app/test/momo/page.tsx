'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/lib/utils/button-variants';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/input';
import { MoMoPayment } from '@/components/payment/MoMoPayment';

export default function MoMoTestPage() {
  const [orderId, setOrderId] = useState(`TEST_${Date.now()}`);
  const [amount, setAmount] = useState(10000);
  const [returnUrl, setReturnUrl] = useState(
    typeof window !== 'undefined' 
      ? `${window.location.origin}/test/momo?status=success`
      : ''
  );
  const [notifyUrl, setNotifyUrl] = useState(
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/payment/webhook/momo`
      : ''
  );
  const [testResult, setTestResult] = useState<any>(null);

  const handleTestAPI = async () => {
    try {
      setTestResult({ loading: true, error: null });

      const response = await fetch('/api/payment/momo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
          returnUrl,
          notifyUrl,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setTestResult({
          loading: false,
          error: data.error || 'API Error',
          data: null,
        });
        return;
      }

      setTestResult({
        loading: false,
        error: null,
        data,
      });
    } catch (error: any) {
      setTestResult({
        loading: false,
        error: error.message || 'Network Error',
        data: null,
      });
    }
  };

  return (
    <div className="container-mobile py-8 md:py-16">
      <h1 className="font-heading text-2xl md:text-3xl mb-6">
        MoMo Payment Integration Test
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Configuration */}
        <Card className="p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold mb-4">
            Test Configuration
          </h2>

          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Order ID
            </label>
            <Input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Amount (VND)
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              placeholder="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Return URL
            </label>
            <Input
              value={returnUrl}
              onChange={(e) => setReturnUrl(e.target.value)}
              placeholder="Return URL after payment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Notify URL (Webhook)
            </label>
            <Input
              value={notifyUrl}
              onChange={(e) => setNotifyUrl(e.target.value)}
              placeholder="Webhook URL for payment notification"
            />
          </div>

          <Button onClick={handleTestAPI} className="w-full">
            Test API Call
          </Button>
        </Card>

        {/* Test Results */}
        <Card className="p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold mb-4">
            Test Results
          </h2>

          {testResult?.loading && (
            <div className="text-center py-8">
              <div className="animate-pulse text-text-muted">Đang test...</div>
            </div>
          )}

          {testResult?.error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              <p className="font-semibold mb-2">Error:</p>
              <p className="text-sm">{testResult.error}</p>
            </div>
          )}

          {testResult?.data && (
            <div className="space-y-3">
              <div className="bg-green-50 text-green-800 p-4 rounded-lg">
                <p className="font-semibold mb-2">✅ API Call Success!</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
              {testResult.data.payUrl && (
                <a 
                  href={testResult.data.payUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={cn(buttonVariants(), 'w-full')}
                >
                  Open Payment URL
                </a>
              )}
            </div>
          )}

          {!testResult && (
            <div className="text-center py-8 text-text-muted">
              Click &quot;Test API Call&quot; to start testing
            </div>
          )}
        </Card>
      </div>

      {/* MoMo Payment Component Test */}
      <Card className="p-6 mt-6">
        <h2 className="font-heading text-xl font-semibold mb-4">
          MoMo Payment Component Test
        </h2>
        <MoMoPayment
          orderId={orderId}
          amount={amount}
          returnUrl={returnUrl}
          notifyUrl={notifyUrl}
          onPaymentSuccess={() => {
            alert('Payment Success!');
          }}
          onPaymentError={(error) => {
            alert(`Payment Error: ${error}`);
          }}
        />
      </Card>

      {/* Environment Check */}
      <Card className="p-6 mt-6">
        <h2 className="font-heading text-xl font-semibold mb-4">
          Environment Check
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">MOMO_PARTNER_CODE:</span>
            <span className={process.env.NEXT_PUBLIC_MOMO_PARTNER_CODE ? 'text-green-600' : 'text-destructive'}>
              {process.env.NEXT_PUBLIC_MOMO_PARTNER_CODE ? '✅ Set' : '❌ Not Set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">MOMO_ACCESS_KEY:</span>
            <span className={process.env.NEXT_PUBLIC_MOMO_ACCESS_KEY ? 'text-green-600' : 'text-destructive'}>
              {process.env.NEXT_PUBLIC_MOMO_ACCESS_KEY ? '✅ Set' : '❌ Not Set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">MOMO_ENV:</span>
            <span className="font-medium">
              {process.env.NEXT_PUBLIC_MOMO_ENV || 'sandbox'}
            </span>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-text-muted">
              <strong>Note:</strong> MOMO_SECRET_KEY should be set in server-side environment variables only (not NEXT_PUBLIC_*)
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

