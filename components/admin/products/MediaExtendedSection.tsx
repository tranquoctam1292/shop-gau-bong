'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, X, Image as ImageIcon, Video, RotateCw } from 'lucide-react';

interface VideoData {
  url: string;
  type: 'youtube' | 'vimeo' | 'upload';
  thumbnail?: string;
}

interface MediaExtendedData {
  videos?: VideoData[];
  view360Images?: string[];
  imageAltTexts?: Record<string, string>; // imageUrl -> altText
}

interface MediaExtendedSectionProps {
  data: MediaExtendedData;
  onChange: (data: MediaExtendedData) => void;
  productImages?: string[]; // Existing product images for alt text management
}

export function MediaExtendedSection({ data, onChange, productImages = [] }: MediaExtendedSectionProps) {
  const [videoInput, setVideoInput] = useState({ url: '', type: 'youtube' as const, thumbnail: '' });
  const [view360Input, setView360Input] = useState('');
  const [altTextInputs, setAltTextInputs] = useState<Record<string, string>>({});

  const updateField = (field: keyof MediaExtendedData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addVideo = () => {
    if (videoInput.url.trim()) {
      const videos = data.videos || [];
      // Check if URL is YouTube or Vimeo
      let videoType: 'youtube' | 'vimeo' | 'upload' = 'upload';
      if (videoInput.url.includes('youtube.com') || videoInput.url.includes('youtu.be')) {
        videoType = 'youtube';
      } else if (videoInput.url.includes('vimeo.com')) {
        videoType = 'vimeo';
      }

      updateField('videos', [
        ...videos,
        {
          url: videoInput.url.trim(),
          type: videoType,
          thumbnail: videoInput.thumbnail.trim() || undefined,
        },
      ]);
      setVideoInput({ url: '', type: 'youtube', thumbnail: '' });
    }
  };

  const removeVideo = (index: number) => {
    const videos = data.videos || [];
    updateField('videos', videos.filter((_, i) => i !== index));
  };

  const addView360Image = () => {
    if (view360Input.trim()) {
      const images = data.view360Images || [];
      if (!images.includes(view360Input.trim())) {
        updateField('view360Images', [...images, view360Input.trim()]);
        setView360Input('');
      }
    }
  };

  const removeView360Image = (imageUrl: string) => {
    const images = data.view360Images || [];
    updateField('view360Images', images.filter((img) => img !== imageUrl));
  };

  const updateAltText = (imageUrl: string, altText: string) => {
    const altTexts = data.imageAltTexts || {};
    updateField('imageAltTexts', { ...altTexts, [imageUrl]: altText });
  };

  const getVideoThumbnail = (video: VideoData) => {
    if (video.thumbnail) return video.thumbnail;
    if (video.type === 'youtube') {
      const videoId = video.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
    }
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media mở rộng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Videos */}
        <div>
          <Label className="mb-3 block flex items-center gap-2">
            <Video className="w-4 h-4" />
            Video sản phẩm
          </Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                value={videoInput.type}
                onChange={(e) => setVideoInput({ ...videoInput, type: e.target.value as any })}
                className="border rounded px-3 py-2"
              >
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="upload">Upload (URL)</option>
              </select>
              <Input
                value={videoInput.url}
                onChange={(e) => setVideoInput({ ...videoInput, url: e.target.value })}
                placeholder="URL video (YouTube, Vimeo hoặc direct URL)"
                className="flex-1"
              />
              <Button type="button" onClick={addVideo} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Thêm
              </Button>
            </div>
            {videoInput.type !== 'upload' && (
              <div>
                <Label htmlFor="videoThumbnail">Thumbnail (tùy chọn)</Label>
                <Input
                  id="videoThumbnail"
                  type="url"
                  value={videoInput.thumbnail}
                  onChange={(e) => setVideoInput({ ...videoInput, thumbnail: e.target.value })}
                  placeholder="URL thumbnail image"
                />
              </div>
            )}
            {data.videos && data.videos.length > 0 && (
              <div className="space-y-2">
                {data.videos.map((video, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Video className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{video.type.toUpperCase()}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{video.url}</p>
                      {getVideoThumbnail(video) && (
                        <img
                          src={getVideoThumbnail(video)}
                          alt="Video thumbnail"
                          className="w-24 h-16 object-cover rounded mt-2"
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeVideo(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 360° View Images */}
        <div>
          <Label className="mb-3 block flex items-center gap-2">
            <RotateCw className="w-4 h-4" />
            Ảnh xoay 360 độ
          </Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={view360Input}
                onChange={(e) => setView360Input(e.target.value)}
                placeholder="URL hình ảnh 360°"
                className="flex-1"
              />
              <Button type="button" onClick={addView360Image} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Thêm
              </Button>
            </div>
            {data.view360Images && data.view360Images.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {data.view360Images.map((imageUrl, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`360 view ${idx + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                      onClick={() => removeView360Image(imageUrl)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Image Alt Text Management */}
        {productImages.length > 0 && (
          <div>
            <Label className="mb-3 block flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Alt Text cho hình ảnh
            </Label>
            <div className="space-y-3">
              {productImages.map((imageUrl) => (
                <div key={imageUrl} className="flex gap-3">
                  <div className="w-20 h-20 flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt="Product"
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      value={data.imageAltTexts?.[imageUrl] || ''}
                      onChange={(e) => updateAltText(imageUrl, e.target.value)}
                      placeholder="Nhập alt text cho hình ảnh này"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

