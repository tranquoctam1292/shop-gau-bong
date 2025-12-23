'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, FileText, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToastContext } from '@/components/providers/ToastProvider';

// Template data can be any product form data structure
type TemplateData = Record<string, unknown>;

interface ProductTemplate {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  templateData: TemplateData;
  createdAt: string;
}

interface TemplateSelectorProps {
  onLoadTemplate: (templateData: TemplateData) => void;
  onSaveTemplate?: (name: string, description: string, category: string, templateData: TemplateData) => void;
  currentFormData?: TemplateData;
}

export function TemplateSelector({ onLoadTemplate, onSaveTemplate, currentFormData }: TemplateSelectorProps) {
  const { showToast } = useToastContext();
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/products/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/products/templates/${templateId}`);
      const data = await response.json();
      if (data.template) {
        onLoadTemplate(data.template.templateData);
        showToast('Đã tải template thành công', 'success');
      } else {
        showToast('Không tìm thấy template', 'error');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      showToast('Có lỗi xảy ra khi tải template', 'error');
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      showToast('Vui lòng nhập tên template', 'error');
      return;
    }

    if (!onSaveTemplate || !currentFormData) {
      showToast('Không thể lưu template', 'error');
      return;
    }

    try {
      onSaveTemplate(templateName, templateDescription, templateCategory, currentFormData);
      showToast('Đã lưu template thành công', 'success');
      setShowSaveDialog(false);
      setTemplateName('');
      setTemplateDescription('');
      setTemplateCategory('');
      fetchTemplates();
    } catch (error: unknown) {
      console.error('Error saving template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu template';
      showToast(errorMessage, 'error');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Bạn có chắc muốn xóa template này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Đã xóa template thành công', 'success');
        fetchTemplates();
      } else {
        const error = await response.json();
        showToast(error?.error || 'Có lỗi xảy ra khi xóa template', 'error');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      showToast('Có lỗi xảy ra khi xóa template', 'error');
    }
  };

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'Khác';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, ProductTemplate[]>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Product Templates
        </CardTitle>
        {onSaveTemplate && currentFormData && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
          >
            <Save className="w-4 h-4 mr-2" />
            Lưu template
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Save Template Dialog */}
        {showSaveDialog && (
          <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
            <div>
              <Label>Tên template *</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ví dụ: Gấu bông cơ bản"
              />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={2}
                placeholder="Mô tả template..."
              />
            </div>
            <div>
              <Label>Danh mục</Label>
              <Input
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                placeholder="Ví dụ: Gấu bông, Đồ chơi"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveTemplate} size="sm">
                Lưu
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSaveDialog(false);
                  setTemplateName('');
                  setTemplateDescription('');
                  setTemplateCategory('');
                }}
              >
                Hủy
              </Button>
            </div>
          </div>
        )}

        {/* Templates List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Đang tải...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có template nào. Lưu template để sử dụng sau.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                <div className="space-y-2">
                  {categoryTemplates.map((template) => (
                    <div
                      key={template._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{template.name}</p>
                        {template.description && (
                          <p className="text-xs text-gray-500">{template.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadTemplate(template._id)}
                        >
                          Sử dụng
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template._id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

