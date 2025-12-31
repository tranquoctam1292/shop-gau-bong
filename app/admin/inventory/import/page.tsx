'use client';

/**
 * Inventory Import Page
 * Trang nhap du lieu ton kho tu CSV
 */

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

// ============================================
// Types
// ============================================

interface ParsedRow {
  sku: string;
  stockQuantity: number;
  adjustmentType?: string;
  reason?: string;
  valid: boolean;
  error?: string;
}

interface ImportResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ row: number; sku: string; error: string }>;
}

type ImportMode = 'set' | 'add';

// ============================================
// Component
// ============================================

export default function ImportPage() {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importMode, setImportMode] = useState<ImportMode>('set');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Parse CSV file
  const parseCSV = useCallback((content: string): ParsedRow[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('File CSV phải có ít nhất 1 dòng header và 1 dòng dữ liệu');
    }

    // Parse header
    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(',').map((h) => h.trim().replace(/"/g, ''));

    // Find column indexes
    const skuIndex = headers.findIndex((h) => h === 'sku' || h === 'mã sku');
    const stockIndex = headers.findIndex(
      (h) => h === 'stock quantity' || h === 'stockquantity' || h === 'số lượng' || h === 'stock'
    );

    if (skuIndex === -1) {
      throw new Error('Không tìm thấy cột SKU trong file CSV');
    }
    if (stockIndex === -1) {
      throw new Error('Không tìm thấy cột Stock Quantity trong file CSV');
    }

    // Parse data rows
    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles basic quoted fields)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const sku = values[skuIndex]?.replace(/"/g, '') || '';
      const stockStr = values[stockIndex]?.replace(/"/g, '') || '';
      const stockQuantity = parseInt(stockStr, 10);

      // Validate
      if (!sku) {
        rows.push({
          sku: '',
          stockQuantity: 0,
          valid: false,
          error: 'SKU trống',
        });
        continue;
      }

      if (isNaN(stockQuantity) || stockQuantity < 0) {
        rows.push({
          sku,
          stockQuantity: 0,
          valid: false,
          error: 'Số lượng không hợp lệ',
        });
        continue;
      }

      rows.push({
        sku,
        stockQuantity,
        valid: true,
      });
    }

    return rows;
  }, []);

  // Handle file upload
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      setFile(selectedFile);
      setImportResult(null);
      setParseError(null);

      // Read and parse file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const rows = parseCSV(content);
          setParsedData(rows);
        } catch (error) {
          setParseError(error instanceof Error ? error.message : 'Lỗi khi đọc file');
          setParsedData([]);
        }
      };
      reader.onerror = () => {
        setParseError('Lỗi khi đọc file');
        setParsedData([]);
      };
      reader.readAsText(selectedFile);
    },
    [parseCSV]
  );

  // Handle import
  const handleImport = async () => {
    const validRows = parsedData.filter((r) => r.valid);
    if (validRows.length === 0) {
      setParseError('Không có dữ liệu hợp lệ để import');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const response = await fetch('/api/admin/inventory/import', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows: validRows.map((r) => ({
            sku: r.sku,
            stockQuantity: r.stockQuantity,
            adjustmentType: 'import',
            reason: `Import từ CSV - ${importMode === 'set' ? 'Đặt thành' : 'Thêm'} ${r.stockQuantity}`,
          })),
          mode: importMode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Lỗi khi import');
      }

      const result: ImportResult = await response.json();
      setImportResult(result);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Lỗi khi import');
    } finally {
      setIsImporting(false);
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    const template = 'SKU,Stock Quantity\nSKU-001,100\nSKU-002,50';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const validCount = parsedData.filter((r) => r.valid).length;
  const invalidCount = parsedData.filter((r) => !r.valid).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Nhập tồn kho từ CSV
          </h1>
          <p className="text-muted-foreground">
            Upload file CSV để cập nhật số lượng tồn kho hàng loạt
          </p>
        </div>
        <Link href="/admin/inventory">
          <Button variant="outline">Quay lại</Button>
        </Link>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hướng dẫn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Định dạng file CSV:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Cột <strong>SKU</strong>: Mã SKU sản phẩm/biến thể</li>
                <li>Cột <strong>Stock Quantity</strong>: Số lượng tồn kho</li>
                <li>Dòng đầu tiên là header</li>
                <li>Mã hóa UTF-8</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Chế độ import:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>Đặt thành</strong>: Đặt tồn kho = giá trị trong file</li>
                <li><strong>Thêm vào</strong>: Tồn kho hiện tại + giá trị trong file</li>
              </ul>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Tải file mẫu
          </Button>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload File</CardTitle>
          <CardDescription>Chọn file CSV để import</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <Label htmlFor="csv-file">File CSV</Label>
              <div className="mt-2">
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90
                    cursor-pointer"
                />
              </div>
            </div>

            <div className="w-[200px]">
              <Label htmlFor="import-mode">Chế độ</Label>
              <Select value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                <SelectTrigger id="import-mode" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Đặt thành (Set)</SelectItem>
                  <SelectItem value="add">Thêm vào (Add)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
              <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parse Error */}
      {parseError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Lỗi</p>
            <p className="text-sm text-red-700 mt-1">{parseError}</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Xem trước dữ liệu</span>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Hợp lệ: {validCount}
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Lỗi: {invalidCount}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Số lượng</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 100).map((row, index) => (
                    <TableRow key={index} className={!row.valid ? 'bg-red-50' : ''}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono">{row.sku || '-'}</TableCell>
                      <TableCell className="text-center">{row.stockQuantity}</TableCell>
                      <TableCell className="text-center">
                        {row.valid ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive">{row.error}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsedData.length > 100 && (
              <p className="text-sm text-muted-foreground mt-2">
                Hiển thị 100/{parsedData.length} dòng
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      {parsedData.length > 0 && validCount > 0 && !importResult && (
        <div className="flex justify-end">
          <Button onClick={handleImport} disabled={isImporting} className="min-w-[150px]">
            {isImporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Đang import...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import {validCount} dòng
              </>
            )}
          </Button>
        </div>
      )}

      {/* Import Progress */}
      {isImporting && (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Đang import...</span>
                <span>{validCount} dòng</span>
              </div>
              <Progress value={50} className="animate-pulse" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <div className={`rounded-lg border p-4 flex items-start gap-3 ${
          importResult.success
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50'
        }`}>
          {importResult.success ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {importResult.success ? 'Import thành công!' : 'Import hoàn tất với lỗi'}
            </p>
            <div className="mt-2 space-y-2">
              <p className={`text-sm ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                Đã xử lý: <strong>{importResult.processed}</strong> | Lỗi:{' '}
                <strong>{importResult.failed}</strong>
              </p>
              {importResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-sm">Chi tiết lỗi:</p>
                  <ul className="list-disc list-inside text-sm mt-1 text-red-700">
                    {importResult.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>
                        Dòng {err.row} (SKU: {err.sku}): {err.error}
                      </li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li>...và {importResult.errors.length - 10} lỗi khác</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions after import */}
      {importResult && (
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setParsedData([]);
              setImportResult(null);
              setParseError(null);
            }}
          >
            Import file khác
          </Button>
          <Link href="/admin/inventory">
            <Button>Xem tồn kho</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
