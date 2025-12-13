'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Eye, Bold, Italic, List, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { generateSlug } from '@/lib/utils/slug';

interface PostFormData {
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  authorId: string;
  categoryId: string;
  tagIds: string[];
  status: 'draft' | 'publish';
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

interface PostEditorProps {
  postId?: string;
  initialData?: Partial<PostFormData & { content: string }>;
}

export function PostEditor({ postId, initialData }: PostEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authors, setAuthors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    slug: '',
    excerpt: '',
    featuredImage: '',
    authorId: '',
    categoryId: '',
    tagIds: [],
    status: 'draft',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    ...initialData,
  });

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Bắt đầu viết bài viết của bạn...',
      }),
    ],
    content: initialData?.content || '',
    immediatelyRender: false, // Fix SSR hydration mismatch
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  // Fetch authors
  useEffect(() => {
    async function fetchData() {
      try {
        const authorsRes = await fetch('/api/admin/authors');
        const authorsData = await authorsRes.json();
        setAuthors(authorsData.authors || []);
        
        // Post categories API will be created later if needed
        setCategories([]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!postId && formData.title && !formData.slug) {
      const slug = generateSlug(formData.title);
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title, postId]);

  // Load post data if editing
  useEffect(() => {
    if (postId && !initialData) {
      async function fetchPost() {
        try {
          const response = await fetch(`/api/admin/posts/${postId}`);
          const data = await response.json();
          if (data.post) {
            const post = data.post;
            setFormData({
              title: post.title || '',
              slug: post.slug || '',
              excerpt: post.excerpt || '',
              featuredImage: post.featuredImage || '',
              authorId: post.authorId || '',
              categoryId: post.categoryId || '',
              tagIds: post.tagIds || [],
              status: post.status || 'draft',
              seoTitle: post.seoTitle || '',
              seoDescription: post.seoDescription || '',
              seoKeywords: post.seoKeywords || '',
            });
            if (editor && post.content) {
              editor.commands.setContent(post.content);
            }
          }
        } catch (error) {
          console.error('Error fetching post:', error);
        }
      }
      fetchPost();
    }
  }, [postId, initialData, editor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;

    setLoading(true);

    try {
      const payload = {
        ...formData,
        content: editor.getHTML(),
      };

      const url = postId
        ? `/api/admin/posts/${postId}`
        : '/api/admin/posts';
      const method = postId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Có lỗi xảy ra');
        return;
      }

      router.push('/admin/posts');
      router.refresh();
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Có lỗi xảy ra khi lưu bài viết');
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    const url = window.prompt('Nhập URL hình ảnh:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('Nhập URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  if (!editor) {
    return <div className="text-center py-12">Đang tải editor...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
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
            <Label htmlFor="excerpt">Mô tả ngắn</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="featuredImage">URL hình ảnh đại diện</Label>
            <Input
              id="featuredImage"
              type="url"
              value={formData.featuredImage}
              onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="authorId">Tác giả</Label>
              <Select
                value={formData.authorId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, authorId: value }))}
              >
                <SelectTrigger id="authorId">
                  <SelectValue placeholder="Chọn tác giả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Chọn tác giả</SelectItem>
                  {authors.map((author) => (
                    <SelectItem key={author._id} value={author._id}>
                      {author.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as 'draft' | 'publish' }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Bản nháp</SelectItem>
                  <SelectItem value="publish">Xuất bản</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Nội dung bài viết</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="border-b p-2 flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-gray-200' : ''}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-gray-200' : ''}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLink}
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addImage}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Editor */}
          <EditorContent editor={editor} />
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              value={formData.seoTitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea
              id="seoDescription"
              value={formData.seoDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="seoKeywords">SEO Keywords</Label>
            <Input
              id="seoKeywords"
              value={formData.seoKeywords}
              onChange={(e) => setFormData((prev) => ({ ...prev, seoKeywords: e.target.value }))}
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
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
          {loading ? 'Đang lưu...' : postId ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  );
}

