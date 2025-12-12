'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Palette,
  Sparkles,
} from 'lucide-react';

interface ShortDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/**
 * Mini Editor for Product Short Description
 * Features:
 * - Minimal toolbar (Bulleted/Numbered List, Bold/Italic, Text Color, Link)
 * - Low height (150-200px)
 * - Template button for "Shop Gấu Bông" template
 */
export function ShortDescriptionEditor({
  value,
  onChange,
  placeholder = 'Mô tả ngắn gọn về sản phẩm (hiển thị trong danh sách sản phẩm)...',
}: ShortDescriptionEditorProps) {
  const [textContent, setTextContent] = useState(value);

  // Initialize Tiptap editor with minimal extensions
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings
        blockquote: false, // Disable blockquote
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== textContent) {
        setTextContent(html);
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] max-h-[200px] p-3 border border-input rounded-b overflow-y-auto',
      },
    },
  });

  // Sync content when value prop changes
  useEffect(() => {
    if (!editor || value === undefined) return;
    const currentHtml = editor.getHTML();
    if (value !== currentHtml) {
      editor.commands.setContent(value || '');
      setTextContent(value || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const addLink = () => {
    const url = prompt('Nhập URL:');
    if (!url) return;

    try {
      new URL(url);
    } catch {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        const fullUrl = `http://${url}`;
        try {
          new URL(fullUrl);
        } catch {
          alert('URL không hợp lệ');
          return;
        }
      } else {
        alert('URL không hợp lệ');
        return;
      }
    }

    if (editor) {
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
      );
      if (selectedText) {
        editor.chain().focus().setLink({ href: url }).run();
      } else {
        editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
      }
    }
  };

  const changeTextColor = () => {
    const color = prompt('Nhập mã màu (VD: #FF0000):');
    if (!color) return;

    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(color) && !['red', 'blue', 'green', 'black', 'white'].includes(color.toLowerCase())) {
      alert('Mã màu không hợp lệ. Sử dụng format #RRGGBB hoặc tên màu.');
      return;
    }

    if (editor) {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      if (selectedText) {
        editor.chain().focus().deleteSelection().insertContent(`<span style="color: ${color};">${selectedText}</span>`).run();
      } else {
        editor.chain().focus().insertContent(`<span style="color: ${color};">text</span>`).run();
      }
    }
  };

  const insertTemplate = () => {
    const template = `<ul>
    <li>✅ <b>Chất liệu:</b> Bông PP 3D tinh khiết, đàn hồi đa chiều.</li>
    <li>✅ <b>Vỏ gấu:</b> Nhung mịn cao cấp, không rụng lông.</li>
    <li>🎁 <b>Tặng kèm:</b> Thiệp chúc mừng + Gói quà miễn phí.</li>
    <li>⚡ <b>Bảo hành:</b> Đường chỉ trọn đời.</li>
    <li>🚚 <b>Giao hàng:</b> Hỏa tốc 2H nội thành.</li>
</ul>`;

    if (editor) {
      editor.chain().focus().insertContent(template).run();
      const newHtml = editor.getHTML();
      setTextContent(newHtml);
      onChange(newHtml);
    }
  };

  if (!editor) {
    return (
      <div className="border border-input rounded-lg p-8 text-center">
        <div className="text-muted-foreground">Đang tải editor...</div>
      </div>
    );
  }

  return (
    <div className="border border-input rounded-lg overflow-hidden">
      {/* Minimal Toolbar */}
      <div className="bg-muted border-b border-input flex items-center gap-1 p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-background' : ''}
          title="In đậm (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-background' : ''}
          title="In nghiêng (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-background' : ''}
          title="Danh sách không thứ tự"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-background' : ''}
          title="Danh sách có thứ tự"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={changeTextColor}
          title="Màu chữ"
        >
          <Palette className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addLink}
          title="Chèn/Sửa liên kết"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={insertTemplate}
          className="flex items-center gap-1"
          title="Chèn mẫu Gấu Bông"
        >
          <Sparkles className="h-4 w-4" />
          Chèn mẫu Gấu Bông
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
