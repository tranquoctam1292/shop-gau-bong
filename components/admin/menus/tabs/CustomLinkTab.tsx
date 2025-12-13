'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface SelectedItem {
  id: string;
  type: 'page' | 'category' | 'product' | 'post' | 'custom';
  title: string;
  url?: string;
  referenceId?: string;
}

interface CustomLinkTabProps {
  selectedItems: SelectedItem[];
  onItemSelect: (item: SelectedItem) => void;
  onItemDeselect: (itemId: string, type: SelectedItem['type']) => void;
}

export function CustomLinkTab({
  selectedItems,
  onItemSelect,
  onItemDeselect,
}: CustomLinkTabProps) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');

  const customLinks = selectedItems.filter((item) => item.type === 'custom');

  const handleAdd = () => {
    if (!url.trim()) {
      return;
    }

    const linkId = `custom-${Date.now()}`;
    onItemSelect({
      id: linkId,
      type: 'custom',
      title: label.trim() || url.trim(),
      url: url.trim(),
    });

    // Reset form
    setUrl('');
    setLabel('');
  };

  const handleRemove = (itemId: string) => {
    onItemDeselect(itemId, 'custom');
  };

  return (
    <div className="space-y-4">
      {/* Add Custom Link Form */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="custom-url">URL *</Label>
          <Input
            id="custom-url"
            placeholder="https://example.com hoặc /path"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom-label">Nhãn (Label)</Label>
          <Input
            id="custom-label"
            placeholder="Tên hiển thị (tùy chọn)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
        </div>

        <Button
          onClick={handleAdd}
          disabled={!url.trim()}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm link
        </Button>
      </div>

      {/* Selected Custom Links */}
      {customLinks.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Các link đã thêm:</Label>
          <div className="border rounded-lg divide-y">
            {customLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors min-h-[44px]"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{link.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {link.url}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(link.id)}
                  className="ml-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

