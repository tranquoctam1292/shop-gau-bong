'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
// TextAlign and Underline extensions - will be added if needed
// import TextAlign from '@tiptap/extension-text-align';
// import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { MediaLibraryModal } from './MediaLibraryModal';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Undo,
  Redo,
  Type,
  Palette,
  MoreHorizontal,
  Upload,
  Eye,
  Code2,
} from 'lucide-react';

interface ClassicEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/**
 * Classic WordPress Editor Component
 * Features:
 * - Visual/Text mode toggle
 * - Add Media button với modal
 * - Full toolbar (2 hàng)
 * - Text mode với QuickTags
 */
export function ClassicEditor({ value, onChange, placeholder = 'Nhập nội dung...' }: ClassicEditorProps) {
  const [mode, setMode] = useState<'visual' | 'text'>('visual');
  const [showToolbarRow2, setShowToolbarRow2] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [textContent, setTextContent] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Tiptap editor for Visual mode
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      // TextAlign and Underline will be added when extensions are installed
      // TextAlign.configure({
      //   types: ['heading', 'paragraph'],
      // }),
      // Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Only update if different to avoid unnecessary re-renders
      if (html !== textContent) {
        setTextContent(html);
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 border border-input rounded-b',
      },
    },
  });

  // Sync content when value prop changes (only if different to avoid loops)
  useEffect(() => {
    if (!editor || value === undefined) return;
    
    const currentHtml = editor.getHTML();
    // Only update if value is actually different and not from our own onChange
    if (value !== currentHtml) {
      editor.commands.setContent(value || '');
      setTextContent(value || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Only depend on value, not editor or textContent

  // Sync between Visual and Text mode
  useEffect(() => {
    if (!editor) return;
    
    if (mode === 'text') {
      // When switching to text mode, get HTML from visual editor
      const html = editor.getHTML();
      if (html !== textContent) {
        setTextContent(html);
      }
    } else if (mode === 'visual') {
      // When switching to visual mode, set content from text mode
      const currentHtml = editor.getHTML();
      // Only update if textContent is different to avoid unnecessary updates
      if (textContent && textContent !== currentHtml) {
        editor.commands.setContent(textContent);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]); // Only trigger on mode change, not editor or textContent

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setTextContent(newContent);
    onChange(newContent);
  };

  const insertQuickTag = (openTag: string, closeTag: string, insertText?: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const textToWrap = insertText || selectedText;

    let newText: string;
    let newCursorPos: number;

    if (textToWrap) {
      // Wrap text (either selected or provided)
      newText =
        textarea.value.substring(0, start) +
        `${openTag}${textToWrap}${closeTag}` +
        textarea.value.substring(end);
      newCursorPos = start + openTag.length + textToWrap.length + closeTag.length;
    } else {
      // Insert tags at cursor (for empty selection)
      newText =
        textarea.value.substring(0, start) +
        `${openTag}${closeTag}` +
        textarea.value.substring(end);
      newCursorPos = start + openTag.length;
    }

    // Update state and textarea
    setTextContent(newText);
    onChange(newText);
    
    // Use setTimeout to ensure DOM is updated before setting selection
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.value = newText;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const addLink = () => {
    const url = prompt('Nhập URL:');
    if (!url) return;

    // Validate URL format
    try {
      new URL(url);
    } catch {
      // If not valid URL, try adding http://
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        const fullUrl = `http://${url}`;
        try {
          new URL(fullUrl);
          // Use fullUrl if valid
        } catch {
          alert('URL không hợp lệ');
          return;
        }
      } else {
        alert('URL không hợp lệ');
        return;
      }
    }

    if (mode === 'visual' && editor) {
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
      );
      if (selectedText) {
        // If text is selected, wrap it in link
        editor.chain().focus().setLink({ href: url }).run();
      } else {
        // If no text selected, insert link with URL as text
        editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
      }
    } else {
      // Text mode
      if (!textareaRef.current) return;
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      
      const linkText = selectedText || prompt('Nhập text hiển thị:', url) || url;
      insertQuickTag(`<a href="${url}">`, '</a>', linkText);
    }
  };

  const addImage = () => {
    const url = prompt('Nhập URL hình ảnh:');
    if (!url) return;

    // Validate URL
    try {
      new URL(url);
    } catch {
      // If not valid URL, try adding http://
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
        alert('URL không hợp lệ. Vui lòng nhập URL đầy đủ (VD: https://example.com/image.jpg)');
        return;
      }
    }

    const alt = prompt('Nhập Alt Text (tùy chọn):') || '';

    if (mode === 'visual' && editor) {
      editor.chain().focus().setImage({ src: url, alt: alt || undefined }).run();
      // Update textContent for sync
      const newHtml = editor.getHTML();
      setTextContent(newHtml);
      onChange(newHtml);
    } else {
      const imgTag = alt ? `<img src="${url}" alt="${alt}" />` : `<img src="${url}" />`;
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const newText =
          textarea.value.substring(0, start) + imgTag + textarea.value.substring(start);
        setTextContent(newText);
        onChange(newText);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.value = newText;
            const newCursorPos = start + imgTag.length;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            textareaRef.current.focus();
          }
        }, 0);
      }
    }
  };

  const insertReadMore = () => {
    if (mode === 'visual' && editor) {
      editor.chain().focus().insertContent('<!--more-->').run();
      // Update textContent for sync
      const newHtml = editor.getHTML();
      setTextContent(newHtml);
      onChange(newHtml);
    } else {
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const newText =
          textarea.value.substring(0, start) +
          '<!--more-->' +
          textarea.value.substring(start);
        setTextContent(newText);
        onChange(newText);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.value = newText;
            const newCursorPos = start + '<!--more-->'.length;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            textareaRef.current.focus();
          }
        }, 0);
      }
    }
  };

  // Show loading state while editor initializes
  if (!editor) {
    return (
      <div className="border border-input rounded-lg p-8 text-center">
        <div className="text-muted-foreground">Đang tải editor...</div>
      </div>
    );
  }

  return (
    <div className="border border-input rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-muted border-b border-input">
        {/* Row 1: Add Media + Core Formatting */}
        <div className="flex items-center gap-1 p-2 border-b border-input">
          {/* Add Media Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowMediaModal(true)}
            className="mr-2"
          >
            <Upload className="h-4 w-4 mr-1" />
            Thêm Media
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          {/* Core Formatting */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (mode === 'visual' && editor) {
                editor.chain().focus().toggleBold().run();
              } else if (mode === 'text') {
                insertQuickTag('<strong>', '</strong>');
              }
            }}
            className={mode === 'visual' && editor?.isActive('bold') ? 'bg-background' : ''}
            disabled={mode === 'text' && !textareaRef.current}
            title="In đậm (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (mode === 'visual' && editor) {
                editor.chain().focus().toggleItalic().run();
              } else if (mode === 'text') {
                insertQuickTag('<em>', '</em>');
              }
            }}
            className={mode === 'visual' && editor?.isActive('italic') ? 'bg-background' : ''}
            disabled={mode === 'text' && !textareaRef.current}
            title="In nghiêng (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (mode === 'visual' && editor) {
                editor.chain().focus().toggleStrike().run();
              } else if (mode === 'text') {
                insertQuickTag('<del>', '</del>');
              }
            }}
            className={mode === 'visual' && editor?.isActive('strike') ? 'bg-background' : ''}
            disabled={mode === 'text' && !textareaRef.current}
            title="Gạch ngang"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (mode === 'visual' && editor) {
                editor.chain().focus().toggleBulletList().run();
              } else if (mode === 'text' && textareaRef.current) {
                const textarea = textareaRef.current;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = textarea.value.substring(start, end);
                if (selectedText) {
                  const lines = selectedText.split('\n').filter(l => l.trim());
                  const listItems = lines.map(line => `<li>${line}</li>`).join('\n');
                  const newText = textarea.value.substring(0, start) + `<ul>\n${listItems}\n</ul>` + textarea.value.substring(end);
                  setTextContent(newText);
                  onChange(newText);
                  textarea.value = newText;
                  textarea.focus();
                } else {
                  insertQuickTag('<ul>\n<li>', '</li>\n</ul>');
                }
              }
            }}
            className={mode === 'visual' && editor?.isActive('bulletList') ? 'bg-background' : ''}
            disabled={mode === 'text' && !textareaRef.current}
            title="Danh sách không thứ tự"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (mode === 'visual' && editor) {
                editor.chain().focus().toggleOrderedList().run();
              } else if (mode === 'text' && textareaRef.current) {
                const textarea = textareaRef.current;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = textarea.value.substring(start, end);
                if (selectedText) {
                  const lines = selectedText.split('\n').filter(l => l.trim());
                  const listItems = lines.map(line => `<li>${line}</li>`).join('\n');
                  const newText = textarea.value.substring(0, start) + `<ol>\n${listItems}\n</ol>` + textarea.value.substring(end);
                  setTextContent(newText);
                  onChange(newText);
                  textarea.value = newText;
                  textarea.focus();
                } else {
                  insertQuickTag('<ol>\n<li>', '</li>\n</ol>');
                }
              }
            }}
            className={mode === 'visual' && editor?.isActive('orderedList') ? 'bg-background' : ''}
            disabled={mode === 'text' && !textareaRef.current}
            title="Danh sách có thứ tự"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (mode === 'visual' && editor) {
                editor.chain().focus().toggleBlockquote().run();
              } else if (mode === 'text') {
                insertQuickTag('<blockquote>', '</blockquote>');
              }
            }}
            className={mode === 'visual' && editor?.isActive('blockquote') ? 'bg-background' : ''}
            disabled={mode === 'text' && !textareaRef.current}
            title="Trích dẫn"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (mode === 'visual' && editor) {
                editor.chain().focus().setHorizontalRule().run();
              } else if (mode === 'text' && textareaRef.current) {
                const textarea = textareaRef.current;
                const start = textarea.selectionStart;
                const newText = textarea.value.substring(0, start) + '<hr />' + textarea.value.substring(start);
                setTextContent(newText);
                onChange(newText);
                setTimeout(() => {
                  if (textareaRef.current) {
                    textareaRef.current.value = newText;
                    textareaRef.current.setSelectionRange(start + '<hr />'.length, start + '<hr />'.length);
                    textareaRef.current.focus();
                  }
                }, 0);
              }
            }}
            disabled={mode === 'text' && !textareaRef.current}
            title="Đường kẻ ngang"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (mode === 'visual' && editor) {
                const { from, to } = editor.state.selection;
                const selectedContent = editor.state.doc.textBetween(from, to);
                if (selectedContent) {
                  editor.chain().focus().deleteSelection().insertContent(`<p style="text-align: left;">${selectedContent}</p>`).run();
                } else {
                  const { $from } = editor.state.selection;
                  const paragraph = $from.node(-1);
                  if (paragraph && paragraph.type.name === 'paragraph') {
                    const paraText = paragraph.textContent;
                    const paraStart = $from.start(-1);
                    const paraEnd = $from.end(-1);
                    editor.chain().focus().setTextSelection({ from: paraStart, to: paraEnd }).deleteSelection().insertContent(`<p style="text-align: left;">${paraText}</p>`).run();
                  } else {
                    editor.chain().focus().insertContent('<p style="text-align: left;"></p>').run();
                  }
                }
              }
              // Alignment buttons don't work well in text mode, so disable them
            }}
            disabled={mode === 'text'}
            title="Căn trái"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (mode === 'visual' && editor) {
                const { from, to } = editor.state.selection;
                const selectedContent = editor.state.doc.textBetween(from, to);
                if (selectedContent) {
                  editor.chain().focus().deleteSelection().insertContent(`<p style="text-align: center;">${selectedContent}</p>`).run();
                } else {
                  const { $from } = editor.state.selection;
                  const paragraph = $from.node(-1);
                  if (paragraph && paragraph.type.name === 'paragraph') {
                    const paraText = paragraph.textContent;
                    const paraStart = $from.start(-1);
                    const paraEnd = $from.end(-1);
                    editor.chain().focus().setTextSelection({ from: paraStart, to: paraEnd }).deleteSelection().insertContent(`<p style="text-align: center;">${paraText}</p>`).run();
                  } else {
                    editor.chain().focus().insertContent('<p style="text-align: center;"></p>').run();
                  }
                }
              }
            }}
            disabled={mode === 'text'}
            title="Căn giữa"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (mode === 'visual' && editor) {
                const { from, to } = editor.state.selection;
                const selectedContent = editor.state.doc.textBetween(from, to);
                if (selectedContent) {
                  editor.chain().focus().deleteSelection().insertContent(`<p style="text-align: right;">${selectedContent}</p>`).run();
                } else {
                  const { $from } = editor.state.selection;
                  const paragraph = $from.node(-1);
                  if (paragraph && paragraph.type.name === 'paragraph') {
                    const paraText = paragraph.textContent;
                    const paraStart = $from.start(-1);
                    const paraEnd = $from.end(-1);
                    editor.chain().focus().setTextSelection({ from: paraStart, to: paraEnd }).deleteSelection().insertContent(`<p style="text-align: right;">${paraText}</p>`).run();
                  } else {
                    editor.chain().focus().insertContent('<p style="text-align: right;"></p>').run();
                  }
                }
              }
            }}
            disabled={mode === 'text'}
            title="Căn phải"
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addLink}
            title="Chèn/Sửa liên kết"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertReadMore}
            title="Thẻ Đọc tiếp"
          >
            <Type className="h-4 w-4" />
          </Button>

          <div className="flex-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowToolbarRow2(!showToolbarRow2)}
            title="Mở rộng thanh công cụ"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Row 2: Advanced Formatting (Toggle) */}
        {showToolbarRow2 && (
          <div className="flex items-center gap-1 p-2 border-b border-input">
            <Select
              defaultValue="paragraph"
              onChange={(e) => {
                if (mode === 'visual' && editor) {
                  const value = e.target.value;
                  if (value === 'paragraph') {
                    editor.chain().focus().setParagraph().run();
                  } else if (value.startsWith('heading')) {
                    const level = parseInt(value.replace('heading', '')) as 1 | 2 | 3 | 4 | 5 | 6;
                    editor.chain().focus().toggleHeading({ level }).run();
                  }
                }
              }}
              disabled={mode === 'text'}
              className="w-40 h-8 text-xs"
            >
              <option value="paragraph">Đoạn văn</option>
              <option value="heading1">Tiêu đề 1</option>
              <option value="heading2">Tiêu đề 2</option>
              <option value="heading3">Tiêu đề 3</option>
              <option value="heading4">Tiêu đề 4</option>
              <option value="heading5">Tiêu đề 5</option>
              <option value="heading6">Tiêu đề 6</option>
            </Select>

            <div className="h-6 w-px bg-border mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                // Underline - wrap selected text in <u> tag
                if (editor) {
                  const { from, to } = editor.state.selection;
                  const selectedText = editor.state.doc.textBetween(from, to);
                  if (selectedText) {
                    // Delete selected text first, then insert wrapped version
                    editor.chain().focus().deleteSelection().insertContent(`<u>${selectedText}</u>`).run();
                  } else {
                    editor.chain().focus().insertContent('<u></u>').run();
                  }
                }
              }}
              title="Gạch chân"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (editor) {
                  const { from, to } = editor.state.selection;
                  const selectedContent = editor.state.doc.textBetween(from, to);
                  if (selectedContent) {
                    editor.chain().focus().deleteSelection().insertContent(`<p style="text-align: justify;">${selectedContent}</p>`).run();
                  } else {
                    const { $from } = editor.state.selection;
                    const paragraph = $from.node(-1);
                    if (paragraph && paragraph.type.name === 'paragraph') {
                      const paraText = paragraph.textContent;
                      const paraStart = $from.start(-1);
                      const paraEnd = $from.end(-1);
                      editor.chain().focus().setTextSelection({ from: paraStart, to: paraEnd }).deleteSelection().insertContent(`<p style="text-align: justify;">${paraText}</p>`).run();
                    } else {
                      editor.chain().focus().insertContent('<p style="text-align: justify;"></p>').run();
                    }
                  }
                }
              }}
              title="Căn đều 2 bên"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const color = prompt('Nhập mã màu (VD: #FF0000):');
                if (!color) return;
                
                // Validate color format
                const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                if (!colorRegex.test(color) && !['red', 'blue', 'green', 'black', 'white'].includes(color.toLowerCase())) {
                  alert('Mã màu không hợp lệ. Sử dụng format #RRGGBB hoặc tên màu.');
                  return;
                }

                if (mode === 'visual' && editor) {
                  const { from, to } = editor.state.selection;
                  const selectedText = editor.state.doc.textBetween(from, to);
                  if (selectedText) {
                    editor.chain().focus().deleteSelection().insertContent(`<span style="color: ${color};">${selectedText}</span>`).run();
                  } else {
                    editor.chain().focus().insertContent(`<span style="color: ${color};">text</span>`).run();
                  }
                } else if (mode === 'text' && textareaRef.current) {
                  const textarea = textareaRef.current;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const selectedText = textarea.value.substring(start, end);
                  const wrappedText = selectedText || 'text';
                  const newText = textarea.value.substring(0, start) + `<span style="color: ${color};">${wrappedText}</span>` + textarea.value.substring(end);
                  setTextContent(newText);
                  onChange(newText);
                  setTimeout(() => {
                    if (textareaRef.current) {
                      textareaRef.current.value = newText;
                      const newCursorPos = start + `<span style="color: ${color};">${wrappedText}</span>`.length;
                      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                      textareaRef.current.focus();
                    }
                  }, 0);
                }
              }}
              disabled={mode === 'text' && !textareaRef.current}
              title="Màu chữ"
            >
              <Palette className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (mode === 'visual' && editor) {
                  // Clear formatting - remove all marks
                  editor.chain().focus().unsetBold().unsetItalic().unsetStrike().run();
                }
                // In text mode, clearing formatting is not straightforward, so disable
              }}
              disabled={mode === 'text' || !editor?.can().unsetBold()}
              title="Tẩy định dạng"
            >
              <Code className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (mode === 'visual' && editor) {
                  editor.chain().focus().undo().run();
                }
                // Undo/Redo in text mode would need custom implementation
              }}
              disabled={mode === 'text' || !editor?.can().undo()}
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (mode === 'visual' && editor) {
                  editor.chain().focus().redo().run();
                }
              }}
              disabled={mode === 'text' || !editor?.can().redo()}
              title="Làm lại (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex items-center justify-between p-2 bg-background">
          <div className="flex gap-1">
            <Button
              type="button"
              variant={mode === 'visual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('visual')}
              className="h-7"
            >
              <Eye className="h-3 w-3 mr-1" />
              Trực quan
            </Button>
            <Button
              type="button"
              variant={mode === 'text' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('text')}
              className="h-7"
            >
              <Code2 className="h-3 w-3 mr-1" />
              Văn bản
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      {mode === 'visual' ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="relative">
          {/* QuickTags Toolbar for Text Mode */}
          <div className="border-b border-input p-2 bg-muted flex gap-1 flex-wrap">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertQuickTag('<strong>', '</strong>')}
              className="h-7 text-xs"
            >
              b
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertQuickTag('<em>', '</em>')}
              className="h-7 text-xs"
            >
              i
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertQuickTag('<del>', '</del>')}
              className="h-7 text-xs"
            >
              del
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertQuickTag('<code>', '</code>')}
              className="h-7 text-xs"
            >
              code
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addLink}
              className="h-7 text-xs"
            >
              link
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addImage}
              className="h-7 text-xs"
            >
              img
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!textareaRef.current) return;
                const textarea = textareaRef.current;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = textarea.value.substring(start, end);
                
                if (selectedText) {
                  // Wrap each line in <li>
                  const lines = selectedText.split('\n').filter(l => l.trim());
                  const listItems = lines.map(line => `<li>${line}</li>`).join('\n');
                  const newText =
                    textarea.value.substring(0, start) +
                    `<ul>\n${listItems}\n</ul>` +
                    textarea.value.substring(end);
                  setTextContent(newText);
                  onChange(newText);
                  textarea.value = newText;
                  textarea.focus();
                } else {
                  insertQuickTag('<ul>\n<li>', '</li>\n</ul>');
                }
              }}
              className="h-7 text-xs"
            >
              ul
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!textareaRef.current) return;
                const textarea = textareaRef.current;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = textarea.value.substring(start, end);
                
                if (selectedText) {
                  // Wrap each line in <li>
                  const lines = selectedText.split('\n').filter(l => l.trim());
                  const listItems = lines.map(line => `<li>${line}</li>`).join('\n');
                  const newText =
                    textarea.value.substring(0, start) +
                    `<ol>\n${listItems}\n</ol>` +
                    textarea.value.substring(end);
                  setTextContent(newText);
                  onChange(newText);
                  textarea.value = newText;
                  textarea.focus();
                } else {
                  insertQuickTag('<ol>\n<li>', '</li>\n</ol>');
                }
              }}
              className="h-7 text-xs"
            >
              ol
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertQuickTag('<blockquote>', '</blockquote>')}
              className="h-7 text-xs"
            >
              quote
            </Button>
          </div>
          <Textarea
            ref={textareaRef}
            value={textContent}
            onChange={handleTextChange}
            className="min-h-[300px] font-mono text-sm rounded-none border-0 focus-visible:ring-0"
            placeholder="Nhập HTML hoặc văn bản..."
          />
        </div>
      )}

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onInsert={(html) => {
          if (!html) return;
          
          if (mode === 'visual' && editor) {
            // Insert HTML into Tiptap editor
            editor.chain().focus().insertContent(html).run();
            // Update textContent for sync
            const newHtml = editor.getHTML();
            setTextContent(newHtml);
            onChange(newHtml);
          } else {
            // Insert into textarea
            if (textareaRef.current) {
              const textarea = textareaRef.current;
              const start = textarea.selectionStart;
              const newText =
                textarea.value.substring(0, start) + html + textarea.value.substring(start);
              setTextContent(newText);
              onChange(newText);
              
              // Update textarea and set cursor position
              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.value = newText;
                  const newCursorPos = start + html.length;
                  textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                  textareaRef.current.focus();
                }
              }, 0);
            }
          }
        }}
      />
    </div>
  );
}
