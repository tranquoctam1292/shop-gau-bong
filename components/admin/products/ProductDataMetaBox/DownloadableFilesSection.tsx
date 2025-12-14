'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, Upload, File } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

export interface DownloadableFile {
  id: string;
  name: string;
  url: string;
  downloadLimit?: number;
  downloadExpiry?: string;
}

interface DownloadableFilesSectionProps {
  files: DownloadableFile[];
  onFilesChange: (files: DownloadableFile[]) => void;
}

/**
 * Downloadable Files Section
 * Features:
 * - Add/Remove files
 * - File upload (Data URL for PoC)
 * - Download limit và expiry date
 * - Table/list view
 */
export function DownloadableFilesSection({
  files,
  onFilesChange,
}: DownloadableFilesSectionProps) {
  const { showToast } = useToastContext();

  const handleAddFile = () => {
    const newFile: DownloadableFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      url: '',
    };
    onFilesChange([...files, newFile]);
  };

  const handleRemoveFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const handleFileChange = (id: string, field: keyof DownloadableFile, value: string | number | undefined) => {
    onFilesChange(
      files.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const handleFileUpload = async (id: string, file: File) => {
    try {
      // Convert to data URL (in production, upload to server)
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === 'string') {
            resolve(result);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsDataURL(file);
      });

      handleFileChange(id, 'url', dataUrl);
      if (!files.find((f) => f.id === id)?.name) {
        handleFileChange(id, 'name', file.name);
      }
      showToast('Đã tải file thành công', 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Không thể đọc file. Vui lòng thử lại.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold flex items-center gap-2">
            <File className="h-4 w-4" />
            Tệp tin tải xuống
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            Thêm các file mà khách hàng có thể tải xuống sau khi mua sản phẩm
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddFile}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm file
        </Button>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-input rounded-lg">
          <File className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Chưa có file nào</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Thêm file" để bắt đầu
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-4 border border-input rounded-lg bg-background space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* File Name */}
                  <div className="space-y-1">
                    <Label htmlFor={`file-name-${file.id}`} className="text-xs">
                      Tên file
                    </Label>
                    <Input
                      id={`file-name-${file.id}`}
                      type="text"
                      placeholder="VD: Hướng dẫn sử dụng.pdf"
                      value={file.name}
                      onChange={(e) => handleFileChange(file.id, 'name', e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-1">
                    <Label htmlFor={`file-upload-${file.id}`} className="text-xs">
                      File
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const selectedFile = e.target.files?.[0];
                          if (selectedFile) {
                            handleFileUpload(file.id, selectedFile);
                          }
                          // Reset input để có thể chọn lại file cùng tên
                          e.target.value = '';
                        }}
                        id={`file-upload-${file.id}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`file-upload-${file.id}`) as HTMLInputElement;
                          input?.click();
                        }}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {file.url ? 'Thay đổi file' : 'Chọn file'}
                      </Button>
                      {file.url && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <File className="h-3 w-3" />
                          Đã chọn
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Download Limit & Expiry */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`file-limit-${file.id}`} className="text-xs">
                        Giới hạn tải (lượt)
                      </Label>
                      <Input
                        id={`file-limit-${file.id}`}
                        type="number"
                        min="0"
                        placeholder="Không giới hạn"
                        value={file.downloadLimit || ''}
                        onChange={(e) =>
                          handleFileChange(
                            file.id,
                            'downloadLimit',
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`file-expiry-${file.id}`} className="text-xs">
                        Hết hạn tải
                      </Label>
                      <Input
                        id={`file-expiry-${file.id}`}
                        type="datetime-local"
                        value={file.downloadExpiry || ''}
                        onChange={(e) =>
                          handleFileChange(file.id, 'downloadExpiry', e.target.value || undefined)
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(file.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
