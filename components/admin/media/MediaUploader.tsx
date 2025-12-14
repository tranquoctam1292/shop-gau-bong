'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useToastContext } from '@/components/providers/ToastProvider';

export interface UploadFile {
  file: File;
  id: string;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: {
    _id: string;
    url: string;
    name: string;
    type: string;
    size: number;
  };
}

interface MediaUploaderProps {
  onUploadComplete?: (files: UploadFile[]) => void;
  onUploadStart?: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  folder?: string;
  className?: string;
}

/**
 * MediaUploader Component
 * 
 * Drag & drop file upload with progress tracking
 * Supports multiple file uploads
 */
export function MediaUploader({
  onUploadComplete,
  onUploadStart,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/*', 'video/*', 'application/pdf'],
  folder,
  className,
}: MediaUploaderProps) {
  const { showToast } = useToastContext();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => ({
        file,
        errors: errors.map((e: any) => e.message).join(', '),
      }));
      console.error('Rejected files:', errors);
    }

    // Limit number of files
    const filesToUpload = acceptedFiles.slice(0, maxFiles);
    if (acceptedFiles.length > maxFiles) {
      console.warn(`Only first ${maxFiles} files will be uploaded`);
    }

    // Create upload file objects
    const newFiles: UploadFile[] = filesToUpload.map((file) => {
      const id = `${Date.now()}-${Math.random()}`;
      const preview = file.type.startsWith('image/') 
        ? URL.createObjectURL(file) 
        : undefined;

      return {
        file,
        id,
        preview,
        progress: 0,
        status: 'pending' as const,
      };
    });

    setUploadFiles((prev) => [...prev, ...newFiles]);
    
    if (onUploadStart) {
      onUploadStart(filesToUpload);
    }

    // Start upload
    setIsUploading(true);
    await uploadFilesSequentially(newFiles);
  }, [maxFiles, onUploadStart]);

  const uploadFilesSequentially = async (files: UploadFile[]) => {
    const results: UploadFile[] = [];

    for (const uploadFile of files) {
      try {
        // Update status to uploading
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
          )
        );

        // Create FormData
        const formData = new FormData();
        formData.append('file', uploadFile.file);
        if (folder) {
          formData.append('folder', folder);
        }

        // Upload file
        const response = await fetch('/api/admin/media', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();

        // Update status to success
        const successFile: UploadFile = {
          ...uploadFile,
          status: 'success',
          progress: 100,
          result: data.data,
        };

        setUploadFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? successFile : f))
        );

        results.push(successFile);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        const errorFile: UploadFile = {
          ...uploadFile,
          status: 'error',
          progress: 0,
          error: errorMessage,
        };

        setUploadFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? errorFile : f))
        );

        results.push(errorFile);
      }
    }

    setIsUploading(false);

    // Show summary toast
    const successCount = results.filter((f) => f.status === 'success').length;
    const errorCount = results.filter((f) => f.status === 'error').length;
    
    if (successCount > 0 && errorCount === 0) {
      showToast(`Đã upload ${successCount} file thành công`, 'success');
    } else if (successCount > 0 && errorCount > 0) {
      showToast(`Đã upload ${successCount} file thành công, ${errorCount} file lỗi`, 'warning');
    } else if (errorCount > 0) {
      showToast(`Có lỗi xảy ra khi upload ${errorCount} file`, 'error');
    }

    if (onUploadComplete) {
      onUploadComplete(results);
    }
  };

  const removeFile = (id: string) => {
    setUploadFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAll = () => {
    uploadFiles.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setUploadFiles([]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    multiple: true,
    disabled: isUploading,
  });

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary/50',
              isUploading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              {isDragActive
                ? 'Thả file vào đây...'
                : 'Kéo thả file vào đây hoặc click để chọn'}
            </p>
            <p className="text-xs text-gray-500">
              Hỗ trợ: Ảnh, Video, PDF (Tối đa {maxSize / 1024 / 1024}MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Đang upload ({uploadFiles.length})</h3>
              {uploadFiles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  disabled={isUploading}
                >
                  Xóa tất cả
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {uploadFiles.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {/* Preview */}
                  {uploadFile.preview ? (
                    <img
                      src={uploadFile.preview}
                      alt={uploadFile.file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {uploadFile.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    )}
                    {uploadFile.error && (
                      <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex items-center gap-2">
                    {uploadFile.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {uploadFile.status === 'success' && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                      disabled={uploadFile.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
