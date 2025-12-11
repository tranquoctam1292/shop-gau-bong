'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, FileText, Download } from 'lucide-react';

export default function ProductImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Detect format from file extension
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'json') {
        setFormat('json');
      } else if (extension === 'csv') {
        setFormat('csv');
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      
      // Convert numeric fields
      if (row.price) row.price = parseFloat(row.price) || 0;
      if (row.stockQuantity) row.stockQuantity = parseInt(row.stockQuantity) || 0;
      if (row.length) row.length = parseFloat(row.length) || undefined;
      if (row.width) row.width = parseFloat(row.width) || undefined;
      if (row.height) row.height = parseFloat(row.height) || undefined;
      if (row.weight) row.weight = parseFloat(row.weight) || undefined;
      
      // Convert arrays
      if (row.tags) row.tags = row.tags.split(',').filter((t: string) => t.trim());
      if (row.images) row.images = row.images.split(',').filter((img: string) => img.trim());
      
      // Convert boolean
      if (row.isActive !== undefined) {
        row.isActive = row.isActive === 'true' || row.isActive === true;
      }
      
      rows.push(row);
    }
    
    return rows;
  };

  const handleImport = async () => {
    if (!file) {
      alert('Vui lòng chọn file để import');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const text = await file.text();
      let products: any[] = [];
      
      if (format === 'json') {
        products = JSON.parse(text);
        if (!Array.isArray(products)) {
          throw new Error('JSON file must contain an array of products');
        }
      } else if (format === 'csv') {
        products = parseCSV(text);
      }
      
      if (products.length === 0) {
        alert('File không chứa dữ liệu sản phẩm');
        setLoading(false);
        return;
      }
      
      // Send to API
      const response = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          format,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data.results);
        if (data.results.success > 0) {
          alert(`Import thành công ${data.results.success} sản phẩm!`);
        }
      } else {
        alert(data.error || 'Có lỗi xảy ra khi import');
      }
    } catch (error: any) {
      console.error('Error importing products:', error);
      alert(`Lỗi: ${error.message || 'Có lỗi xảy ra khi import'}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Gấu bông Teddy',
        slug: 'gau-bong-teddy',
        description: 'Mô tả sản phẩm',
        shortDescription: 'Mô tả ngắn',
        sku: 'TEDDY-001',
        price: 150000,
        category: 'Gấu bông',
        tags: 'teddy,bear,soft',
        images: 'https://example.com/image1.jpg',
        status: 'publish',
        isActive: true,
        stockQuantity: 100,
        length: 30,
        width: 25,
        height: 35,
        weight: 0.5,
        material: 'Cotton',
        origin: 'Vietnam',
      },
    ];
    
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-template.json';
    a.click();
    URL.revokeObjectURL(url);
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
          <h1 className="text-3xl font-bold text-gray-900">Import sản phẩm</h1>
          <p className="text-gray-600 mt-2">Import sản phẩm từ file CSV hoặc JSON</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Form */}
        <Card>
          <CardHeader>
            <CardTitle>Import sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Chọn file</Label>
              <Input
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Hỗ trợ file CSV hoặc JSON
              </p>
            </div>

            <div>
              <Label>Định dạng</Label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
                className="w-full border rounded px-3 py-2 mt-1"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>

            {file && (
              <div className="p-3 bg-gray-50 rounded border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                disabled={!file || loading}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {loading ? 'Đang import...' : 'Import'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Template & Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Hướng dẫn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Các trường bắt buộc:</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>name - Tên sản phẩm</li>
                <li>price - Giá sản phẩm</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Các trường tùy chọn:</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>slug, description, shortDescription, sku</li>
                <li>category, tags, images</li>
                <li>status, isActive, stockQuantity</li>
                <li>length, width, height, weight, material, origin</li>
              </ul>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Tải template mẫu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Kết quả import</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-green-600 font-medium">
                  Thành công: {result.success}
                </span>
                <span className="text-red-600 font-medium">
                  Thất bại: {result.failed}
                </span>
              </div>
              
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Chi tiết lỗi:</h4>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {result.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                        Dòng {error.row}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

