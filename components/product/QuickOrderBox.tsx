'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Zap } from 'lucide-react';

interface QuickOrderBoxProps {
  productId?: number;
  productName?: string;
  quantity?: number;
  variationId?: number;
  onQuickOrder?: (phone: string) => Promise<void>;
}

export function QuickOrderBox({ 
  productId, 
  productName, 
  quantity = 1,
  variationId,
  onQuickOrder 
}: QuickOrderBoxProps) {
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validatePhone = (phoneNumber: string): boolean => {
    // Vietnamese phone: 10-11 digits, may start with 0 or +84
    const cleaned = phoneNumber.replace(/[\s-]/g, '');
    const regex = /^(\+84|0)?[1-9][0-9]{8,9}$/;
    return regex.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số');
      return;
    }

    setIsSubmitting(true);

    try {
      if (onQuickOrder) {
        await onQuickOrder(phone);
      } else {
        // Default: Zalo Notification (Option 1)
        const adminPhone = '0924923399'; // TODO: Move to env variable
        const message = encodeURIComponent(
          `Đặt hàng nhanh\n` +
          `SĐT: ${phone}\n` +
          `Sản phẩm: ${productName || 'N/A'}\n` +
          `Số lượng: ${quantity}`
        );
        const zaloLink = `https://zalo.me/${adminPhone}?text=${message}`;
        window.open(zaloLink, '_blank');
      }

      setSuccess(true);
      setPhone(''); // Clear input after success
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
      console.error('Quick order error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
      {/* Title with Icon */}
      <div className="flex items-center gap-1.5 mb-2">
        <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
        <h3 className="font-bold text-text-main text-sm">
          Đặt hàng nhanh
        </h3>
      </div>
      
      {/* Horizontal Inline Form - Responsive flex with no wrap */}
      <form onSubmit={handleSubmit} className="flex items-start gap-2 flex-nowrap overflow-hidden">
        <div className="flex-1 min-w-0">
          <Input
            type="tel"
            placeholder="Nhập SĐT..."
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError(null);
            }}
            className="h-9 text-sm border-2 border-pink-200 focus:border-pink-400 rounded-lg w-full"
            disabled={isSubmitting}
            aria-label="Số điện thoại đặt hàng nhanh"
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'phone-error' : undefined}
          />
        </div>

        <Button
          type="submit"
          className="h-9 w-auto min-w-[44px] px-2 sm:px-3 bg-[#D6336C] hover:bg-[#BE185D] text-white flex-shrink-0"
          disabled={isSubmitting || !phone.trim()}
          aria-label="Gửi yêu cầu đặt hàng nhanh"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>

      {/* Error and Success Messages */}
      {error && (
        <p id="phone-error" className="text-xs text-destructive mt-1.5" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-green-600 mt-1.5" role="status">
          ✓ Đã gửi thông tin. Chúng tôi sẽ liên hệ với bạn sớm nhất!
        </p>
      )}
    </div>
  );
}

