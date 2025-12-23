'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, FileText } from 'lucide-react';

export default function ProductExportPage() {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories.map((cat: any) => ({
            id: cat._id || cat.id,
            name: cat.name,
          })));
        }
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
      });
  }, []);

  const handleExport = async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        format,
      });
      if (category) {
        params.append('category', category);
      }
      if (status) {
        params.append('status', status);
      }
      
      const response = await fetch(`/api/admin/products/export?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `products-${Date.now()}.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }
      
      // Download file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      alert('Export thành công!');
    } catch (error: any) {
      console.error('Error exporting products:', error);
      alert(`Lỗi: ${error.message || 'Có lỗi xảy ra khi export'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Export sản phẩm</h1>
          <p className="text-gray-600 mt-2">Export sản phẩm ra file CSV hoặc JSON</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Định dạng</Label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div>
            <Label>Danh mục (tùy chọn)</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Trạng thái (tùy chọn)</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="publish">Đã xuất bản</option>
            </select>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleExport}
              disabled={loading}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {loading ? 'Đang export...' : `Export ${format.toUpperCase()}`}
            </Button>
          </div>

          <div className="p-4 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Lưu ý:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>File JSON: Dễ đọc và chỉnh sửa, phù hợp cho backup</li>
                  <li>File CSV: Phù hợp cho Excel, Google Sheets</li>
                  <li>Export sẽ bao gồm tất cả thông tin sản phẩm</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

