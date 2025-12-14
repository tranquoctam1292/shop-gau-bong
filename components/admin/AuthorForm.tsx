'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { generateSlug } from '@/lib/utils/slug';
import { useToastContext } from '@/components/providers/ToastProvider';

interface AuthorFormData {
  name: string;
  slug: string;
  email: string;
  bio: string;
  avatar: string;
  socialLinks: {
    website?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
  };
}

interface AuthorFormProps {
  authorId?: string;
  initialData?: Partial<AuthorFormData>;
}

export function AuthorForm({ authorId, initialData }: AuthorFormProps) {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AuthorFormData>({
    name: '',
    slug: '',
    email: '',
    bio: '',
    avatar: '',
    socialLinks: {},
    ...initialData,
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (!authorId && formData.name && !formData.slug) {
      const slug = generateSlug(formData.name);
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, authorId]);

  // Load author data if editing
  useEffect(() => {
    if (authorId && !initialData) {
      async function fetchAuthor() {
        try {
          const response = await fetch(`/api/admin/authors/${authorId}`);
          const data = await response.json();
          if (data.author) {
            setFormData({
              name: data.author.name || '',
              slug: data.author.slug || '',
              email: data.author.email || '',
              bio: data.author.bio || '',
              avatar: data.author.avatar || '',
              socialLinks: data.author.socialLinks || {},
            });
          }
        } catch (error) {
          console.error('Error fetching author:', error);
        }
      }
      fetchAuthor();
    }
  }, [authorId, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = authorId
        ? `/api/admin/authors/${authorId}`
        : '/api/admin/authors';
      const method = authorId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(error.error || 'Có lỗi xảy ra khi lưu tác giả', 'error');
        return;
      }

      showToast(
        authorId ? 'Đã cập nhật tác giả thành công' : 'Đã tạo tác giả thành công',
        'success'
      );

      router.push('/admin/authors');
      router.refresh();
    } catch (error) {
      console.error('Error saving author:', error);
      showToast('Có lỗi xảy ra khi lưu tác giả', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin tác giả</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Tên tác giả *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="bio">Tiểu sử</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="avatar">URL Avatar</Label>
            <Input
              id="avatar"
              type="url"
              value={formData.avatar}
              onChange={(e) => setFormData((prev) => ({ ...prev, avatar: e.target.value }))}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liên kết mạng xã hội</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.socialLinks.website || ''}
              onChange={(e) => setFormData((prev) => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, website: e.target.value },
              }))}
            />
          </div>
          <div>
            <Label htmlFor="twitter">Twitter</Label>
            <Input
              id="twitter"
              type="url"
              value={formData.socialLinks.twitter || ''}
              onChange={(e) => setFormData((prev) => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, twitter: e.target.value },
              }))}
            />
          </div>
          <div>
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              type="url"
              value={formData.socialLinks.facebook || ''}
              onChange={(e) => setFormData((prev) => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, facebook: e.target.value },
              }))}
            />
          </div>
          <div>
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              type="url"
              value={formData.socialLinks.linkedin || ''}
              onChange={(e) => setFormData((prev) => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, linkedin: e.target.value },
              }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Đang lưu...' : authorId ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  );
}

