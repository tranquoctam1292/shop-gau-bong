/**
 * Global Pattern Section
 * 
 * Allows admin to configure global SKU pattern
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToastContext } from '@/components/providers/ToastProvider';
import { TOKENS } from '@/lib/utils/skuTokens';
import { Loader2 } from 'lucide-react';

interface SkuSetting {
  _id?: string;
  categoryId?: string | null;
  pattern: string;
  separator: string;
  caseType: 'UPPER' | 'LOWER';
  createdAt?: Date;
  updatedAt?: Date;
}

const TOKEN_LIST = [
  { value: TOKENS.CATEGORY_CODE, label: 'Mã danh mục' },
  { value: TOKENS.BRAND_CODE, label: 'Mã thương hiệu' },
  { value: TOKENS.PRODUCT_NAME, label: 'Tên sản phẩm' },
  { value: TOKENS.ATTRIBUTE_VALUE, label: 'Giá trị thuộc tính' },
  { value: TOKENS.YEAR, label: 'Năm' },
  { value: TOKENS.INCREMENT, label: 'Số thứ tự' },
];

export function GlobalPatternSection() {
  const { showToast } = useToastContext();
  const queryClient = useQueryClient();
  const [pattern, setPattern] = useState('');
  const [separator, setSeparator] = useState('-');
  const [caseType, setCaseType] = useState<'UPPER' | 'LOWER'>('UPPER');

  // Fetch global setting
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['sku-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/sku/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    },
  });

  // Load global setting into form
  useEffect(() => {
    if (settingsData?.success && settingsData?.data?.global) {
      const global = settingsData.data.global as SkuSetting;
      setPattern(global.pattern || '');
      setSeparator(global.separator || '-');
      setCaseType(global.caseType || 'UPPER');
    } else if (settingsData?.success && !settingsData?.data?.global) {
      // No global setting, use defaults
      setPattern('{CATEGORY_CODE}-{PRODUCT_NAME}-{INCREMENT}');
      setSeparator('-');
      setCaseType('UPPER');
    }
  }, [settingsData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { pattern: string; separator: string; caseType: 'UPPER' | 'LOWER' }) => {
      const res = await fetch('/api/admin/sku/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          categoryId: null,
          pattern: data.pattern,
          separator: data.separator,
          caseType: data.caseType,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save settings');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku-settings'] });
      showToast('Đã lưu cài đặt pattern toàn cục', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Đã xảy ra lỗi khi lưu', 'error');
    },
  });

  const handleInsertToken = (token: string) => {
    setPattern((prev) => prev + token);
  };

  const handleSave = () => {
    if (!pattern.trim()) {
      showToast('Pattern không được để trống', 'error');
      return;
    }
    saveMutation.mutate({ pattern, separator, caseType });
  };

  // Generate preview
  const previewSku = (() => {
    try {
      let preview = pattern;
      preview = preview.replace(TOKENS.CATEGORY_CODE, 'AT');
      preview = preview.replace(TOKENS.BRAND_CODE, 'NK');
      preview = preview.replace(TOKENS.PRODUCT_NAME, 'GAU-BONG');
      preview = preview.replace(TOKENS.ATTRIBUTE_VALUE, 'DO');
      preview = preview.replace(TOKENS.YEAR, new Date().getFullYear().toString().slice(-2));
      preview = preview.replace(TOKENS.INCREMENT, '001');
      return caseType === 'UPPER' ? preview.toUpperCase() : preview.toLowerCase();
    } catch {
      return pattern;
    }
  })();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pattern Toàn Cục</CardTitle>
          <CardDescription>Quy tắc mặc định cho tất cả sản phẩm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pattern Toàn Cục</CardTitle>
        <CardDescription>Quy tắc mặc định cho tất cả sản phẩm</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pattern Input */}
        <div className="space-y-2">
          <Label htmlFor="pattern">Pattern</Label>
          <Input
            id="pattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="{CATEGORY_CODE}-{PRODUCT_NAME}-{INCREMENT}"
            className="font-mono"
          />
          <p className="text-sm text-gray-500">
            Sử dụng các token bên dưới để tạo pattern. Click vào token để chèn vào pattern.
          </p>
        </div>

        {/* Token Chips */}
        <div className="space-y-2">
          <Label>Tokens</Label>
          <div className="flex flex-wrap gap-2">
            {TOKEN_LIST.map((token) => (
              <Badge
                key={token.value}
                variant="outline"
                className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors px-3 py-1.5"
                onClick={() => handleInsertToken(token.value)}
                title={token.label}
              >
                {token.value}
              </Badge>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="space-y-2">
          <Label>Ký tự ngăn cách</Label>
          <div className="flex gap-4">
            {['-', '_', '.'].map((sep) => (
              <label
                key={sep}
                className="flex items-center gap-2 cursor-pointer p-2 rounded border hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="separator"
                  value={sep}
                  checked={separator === sep}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="font-mono text-lg">{sep}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Case Type */}
        <div className="space-y-2">
          <Label>Kiểu chữ</Label>
          <div className="flex gap-4">
            {(['UPPER', 'LOWER'] as const).map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer p-2 rounded border hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="caseType"
                  value={type}
                  checked={caseType === type}
                  onChange={(e) => setCaseType(e.target.value as 'UPPER' | 'LOWER')}
                  className="w-4 h-4"
                />
                <span>{type === 'UPPER' ? 'CHỮ HOA' : 'chữ thường'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Ví dụ</Label>
          <div className="p-4 bg-gray-50 rounded-lg border">
            <p className="text-sm text-gray-600 mb-1">SKU mẫu:</p>
            <p className="font-mono text-lg font-semibold">{previewSku || 'Chưa có pattern'}</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || !pattern.trim()}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu Cài Đặt'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

