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
import { Iframe, VideoEmbedWrapper } from '@/lib/tiptap/extensions/Iframe';
import { convertVideoUrlToEmbed, isStandaloneVideoUrl } from '@/lib/utils/videoEmbed';
import { useToastContext } from '@/components/providers/ToastProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaLibraryModal } from './MediaLibraryModal';
import { InlineImageToolbar } from './InlineImageToolbar';
import { ImageEditorErrorBoundary } from './ImageEditorErrorBoundary';
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
  const { showToast } = useToastContext();
  const [mode, setMode] = useState<'visual' | 'text'>('visual');
  const [showToolbarRow2, setShowToolbarRow2] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [textContent, setTextContent] = useState(value);
  const [isToolbarSticky, setIsToolbarSticky] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Tiptap editor for Visual mode
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            class: {
              default: null,
              parseHTML: element => element.getAttribute('class'),
              renderHTML: attributes => {
                if (!attributes.class) {
                  return {};
                }
                return {
                  class: attributes.class,
                };
              },
            },
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                if (!attributes.style) {
                  return {};
                }
                return {
                  style: attributes.style,
                };
              },
            },
            width: {
              default: null,
              parseHTML: element => element.getAttribute('width'),
              renderHTML: attributes => {
                if (!attributes.width) {
                  return {};
                }
                return {
                  width: attributes.width,
                };
              },
            },
            height: {
              default: null,
              parseHTML: element => element.getAttribute('height'),
              renderHTML: attributes => {
                if (!attributes.height) {
                  return {};
                }
                return {
                  height: attributes.height,
                };
              },
            },
          };
        },
      }).configure({
        inline: true,
        allowBase64: false, // Disable Base64 - force server upload via paste handler
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
      // Video Embed extensions for video embeds
      VideoEmbedWrapper,
      Iframe,
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

  // Handle paste events for video embedding and image upload
  useEffect(() => {
    if (!editor) return;

    const handlePaste = async (view: any, event: ClipboardEvent) => {
      const clipboardData = event.clipboardData || (window as any).clipboardData;
      if (!clipboardData) {
        return false;
      }

      // Handle image paste - upload to server instead of Base64
      const items = Array.from(clipboardData.items) as DataTransferItem[];
      const imageItem = items.find((item) => item.type.indexOf('image') !== -1);
      
      if (imageItem) {
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (file) {
          // Upload image to server
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'products'); // Organize in products folder
            
            const response = await fetch('/api/admin/media/upload', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              const imageUrl = data.url || data.media?.url;
              
              if (imageUrl) {
                // Insert image with server URL
                editor.chain().focus().setImage({ 
                  src: imageUrl,
                  alt: file.name || 'Product image'
                }).run();
                
                // Update content
                const newHtml = editor.getHTML();
                setTextContent(newHtml);
                onChange(newHtml);
                return true;
              }
            } else {
              const errorData = await response.json().catch(() => ({}));
              showToast(errorData.error || 'Không thể upload ảnh. Vui lòng thử lại.', 'error');
            }
          } catch (error) {
            console.error('Error uploading pasted image:', error);
            showToast('Có lỗi xảy ra khi upload ảnh. Vui lòng thử lại.', 'error');
          }
        }
        return true;
      }

      const pastedText = clipboardData.getData('text/plain');
      if (!pastedText) return false;

      // Check if pasted text is a standalone video URL
      const isStandalone = isStandaloneVideoUrl(pastedText);
      
      if (isStandalone) {
        const embedHtml = convertVideoUrlToEmbed(pastedText.trim());
        
        if (embedHtml) {
          event.preventDefault();
          // Insert video embed using editor commands
          // Parse HTML to extract iframe and create proper node structure
          setTimeout(() => {
            
            // Parse HTML to extract wrapper and iframe for proper node structure
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = embedHtml;
            const wrapper = tempDiv.querySelector('div.video-embed-wrapper');
            const iframe = wrapper?.querySelector('iframe');
            
            if (wrapper && iframe) {
              // Extract attributes
              const wrapperStyle = wrapper.getAttribute('style') || '';
              const wrapperClass = wrapper.getAttribute('class') || 'video-embed-wrapper';
              const iframeAttrs = {
                src: iframe.getAttribute('src') || '',
                frameborder: iframe.getAttribute('frameborder') || '0',
                allowfullscreen: iframe.hasAttribute('allowfullscreen'),
                allow: iframe.getAttribute('allow') || '',
                style: iframe.getAttribute('style') || '',
                class: iframe.getAttribute('class') || '',
                width: iframe.getAttribute('width') || '100%',
                height: iframe.getAttribute('height') || '400px',
              };
              
              // Insert as proper node structure to avoid paragraph wrapping
              editor.chain()
                .focus()
                .insertContent({
                  type: 'videoEmbedWrapper',
                  attrs: {
                    style: wrapperStyle,
                    class: wrapperClass,
                  },
                  content: [
                    {
                      type: 'iframe',
                      attrs: iframeAttrs,
                    },
                  ],
                })
                .run();
            } else {
              // Fallback to raw HTML insert
              editor.commands.insertContent(embedHtml);
            }
          }, 0);
          return true;
        }
      }

      // Check if pasted text contains video URLs on their own lines
      const lines = pastedText.split('\n');
      let hasVideoUrl = false;
      let modifiedText = pastedText;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (isStandaloneVideoUrl(trimmedLine)) {
          const embedHtml = convertVideoUrlToEmbed(trimmedLine);
          if (embedHtml) {
            hasVideoUrl = true;
            // Replace the line with embed HTML
            modifiedText = modifiedText.replace(trimmedLine, embedHtml);
          }
        }
      }

      if (hasVideoUrl) {
        event.preventDefault();
        setTimeout(() => {
          editor.commands.insertContent(modifiedText);
        }, 0);
        return true;
      }

      return false; // Let default paste handler handle it
    };

    // Register paste handler
    editor.view.dom.addEventListener('paste', (e: ClipboardEvent) => {
      handlePaste(editor.view, e);
    });

    return () => {
      editor.view.dom.removeEventListener('paste', handlePaste as any);
    };
  }, [editor]);

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

  // Keyboard shortcuts handler
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey;
      const altKey = event.altKey;
      const shiftKey = event.shiftKey;

      // System shortcuts (Ctrl/Cmd + ...)
      if (ctrlKey && !altKey && !shiftKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            if (!event.shiftKey) {
              event.preventDefault();
              if (mode === 'visual') {
                editor.commands.undo();
              }
            }
            break;
          case 'y':
            event.preventDefault();
            if (mode === 'visual') {
              editor.commands.redo();
            }
            break;
          case 'a':
            event.preventDefault();
            if (mode === 'visual') {
              editor.commands.selectAll();
            } else if (textareaRef.current) {
              textareaRef.current.select();
            }
            break;
          case 'b':
            event.preventDefault();
            if (mode === 'visual') {
              editor.commands.toggleBold();
            } else {
              insertQuickTag('<strong>', '</strong>');
            }
            break;
          case 'i':
            event.preventDefault();
            if (mode === 'visual') {
              editor.commands.toggleItalic();
            } else {
              insertQuickTag('<em>', '</em>');
            }
            break;
          case 'u':
            event.preventDefault();
            if (mode === 'visual') {
              const { from, to } = editor.state.selection;
              const selectedText = editor.state.doc.textBetween(from, to);
              if (selectedText) {
                editor.chain().focus().deleteSelection().insertContent(`<u>${selectedText}</u>`).run();
              } else {
                editor.chain().focus().insertContent('<u></u>').run();
              }
            } else {
              insertQuickTag('<u>', '</u>');
            }
            break;
          case 'k':
            event.preventDefault();
            addLink();
            break;
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
            event.preventDefault();
            if (mode === 'visual') {
              const level = parseInt(event.key) as 1 | 2 | 3 | 4 | 5 | 6;
              editor.commands.toggleHeading({ level });
            }
            break;
          case '7':
            event.preventDefault();
            if (mode === 'visual') {
              editor.commands.setParagraph();
            }
            break;
        }
      }

      // Alt + Shift shortcuts
      if (altKey && shiftKey && !ctrlKey) {
        switch (event.key.toLowerCase()) {
          case 'x':
            event.preventDefault();
            if (mode === 'visual') {
              const { from, to } = editor.state.selection;
              const selectedText = editor.state.doc.textBetween(from, to);
              if (selectedText) {
                editor.chain().focus().deleteSelection().insertContent(`<code>${selectedText}</code>`).run();
              } else {
                editor.chain().focus().insertContent('<code></code>').run();
              }
            } else {
              insertQuickTag('<code>', '</code>');
            }
            break;
          case 'd':
            event.preventDefault();
            if (mode === 'visual') {
              editor.commands.toggleStrike();
            } else {
              insertQuickTag('<del>', '</del>');
            }
            break;
          case 'q':
            event.preventDefault();
            if (mode === 'visual') {
              editor.commands.toggleBlockquote();
            } else {
              insertQuickTag('<blockquote>', '</blockquote>');
            }
            break;
          case 'u':
            event.preventDefault();
            if (mode === 'visual') {
              editor.commands.toggleBulletList();
            } else {
              if (textareaRef.current) {
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
            }
            break;
          case 'o':
            event.preventDefault();
            if (mode === 'visual') {
              editor.commands.toggleOrderedList();
            } else {
              if (textareaRef.current) {
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
            }
            break;
          case 'm':
            event.preventDefault();
            setShowMediaModal(true);
            break;
          case 'l':
            event.preventDefault();
            if (mode === 'visual' && editor) {
              const { from, to } = editor.state.selection;
              const selectedContent = editor.state.doc.textBetween(from, to);
              if (selectedContent) {
                editor.chain().focus().deleteSelection().insertContent(`<p style="text-align: left;">${selectedContent}</p>`).run();
              } else {
                editor.chain().focus().insertContent('<p style="text-align: left;"></p>').run();
              }
            }
            break;
          case 'c':
            event.preventDefault();
            if (mode === 'visual' && editor) {
              const { from, to } = editor.state.selection;
              const selectedContent = editor.state.doc.textBetween(from, to);
              if (selectedContent) {
                editor.chain().focus().deleteSelection().insertContent(`<p style="text-align: center;">${selectedContent}</p>`).run();
              } else {
                editor.chain().focus().insertContent('<p style="text-align: center;"></p>').run();
              }
            }
            break;
          case 'r':
            event.preventDefault();
            if (mode === 'visual' && editor) {
              const { from, to } = editor.state.selection;
              const selectedContent = editor.state.doc.textBetween(from, to);
              if (selectedContent) {
                editor.chain().focus().deleteSelection().insertContent(`<p style="text-align: right;">${selectedContent}</p>`).run();
              } else {
                editor.chain().focus().insertContent('<p style="text-align: right;"></p>').run();
              }
            }
            break;
          case 'j':
            event.preventDefault();
            if (mode === 'visual' && editor) {
              const { from, to } = editor.state.selection;
              const selectedContent = editor.state.doc.textBetween(from, to);
              if (selectedContent) {
                editor.chain().focus().deleteSelection().insertContent(`<p style="text-align: justify;">${selectedContent}</p>`).run();
              } else {
                editor.chain().focus().insertContent('<p style="text-align: justify;"></p>').run();
              }
            }
            break;
          case 'z':
            event.preventDefault();
            setShowToolbarRow2(!showToolbarRow2);
            break;
          case 'w':
            // Distraction-free mode - Toggle fullscreen editor
            event.preventDefault();
            if (editor) {
              const editorElement = editor.view.dom.closest('.border');
              if (editorElement) {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  editorElement.requestFullscreen().catch(() => {
                    // Fallback: Just hide/show toolbar
                    setShowToolbarRow2(false);
                  });
                }
              }
            }
            break;
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('keydown', handleKeyDown);

    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, mode, showToolbarRow2]);

  // Handle sticky toolbar on scroll
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let cleanup: (() => void) | null = null;

    const setupScrollListener = () => {
      if (!toolbarRef.current || !editorContainerRef.current) {
        // Retry after a short delay
        timeoutId = setTimeout(setupScrollListener, 100);
        return;
      }

      const handleScroll = () => {
        const toolbar = toolbarRef.current;
        const container = editorContainerRef.current;
        if (!toolbar || !container) return;

        const toolbarRect = toolbar.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        
        // Admin bar height (32px as per spec)
        const adminBarHeight = 32;
        
        // Check if toolbar is scrolled out of view (above viewport)
        const isToolbarOutOfView = toolbarRect.top < adminBarHeight;
        
        // Check if we're still within the editor container
        // Toolbar should hide when we scroll past the container bottom or before container top
        const containerTop = containerRect.top;
        const containerBottom = containerRect.bottom;
        const isWithinContainer = containerTop < window.innerHeight && containerBottom > adminBarHeight;
        
        // Show sticky toolbar when:
        // 1. Original toolbar is scrolled out of view (above viewport)
        // 2. We're still within the editor container
        // 3. We've scrolled down (not at the top)
        if (isToolbarOutOfView && isWithinContainer && scrollY > 0) {
          setIsToolbarSticky(true);
        } else {
          setIsToolbarSticky(false);
        }
      };

      // Listen to scroll events on window
      window.addEventListener('scroll', handleScroll, { passive: true });
      // Also check on initial load and resize
      handleScroll();
      window.addEventListener('resize', handleScroll, { passive: true });

      // Store cleanup function
      cleanup = () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    };

    // Start checking for refs
    setupScrollListener();

    // Return cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

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
    <div ref={editorContainerRef} className="border border-input rounded-lg overflow-hidden">
      {/* Sticky Toolbar (shown when scrolled) */}
      {isToolbarSticky && toolbarRef.current && (() => {
        const toolbar = toolbarRef.current;
        if (!toolbar) return null;
        const toolbarRect = toolbar.getBoundingClientRect();
        const stickyStyle: React.CSSProperties = {
          position: 'fixed',
          top: '32px',
          width: toolbar.offsetWidth + 'px',
          left: toolbarRect.left + 'px',
          zIndex: 9999,
          backgroundColor: 'hsl(var(--muted))',
        };
        return (
          <div 
            className="bg-muted border-b border-input shadow-lg"
            style={stickyStyle}
          >
          {/* Render same toolbar content as original - using same structure */}
          {/* Row 1: Add Media + Core Formatting */}
          <div className="flex items-center gap-1 p-2 border-b border-input">
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
                onValueChange={(value) => {
                  if (mode === 'visual' && editor) {
                    if (value === 'paragraph') {
                      editor.chain().focus().setParagraph().run();
                    } else if (value.startsWith('heading')) {
                      const level = parseInt(value.replace('heading', '')) as 1 | 2 | 3 | 4 | 5 | 6;
                      editor.chain().focus().toggleHeading({ level }).run();
                    }
                  }
                }}
                disabled={mode === 'text'}
              >
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paragraph">Đoạn văn</SelectItem>
                  <SelectItem value="heading1">Tiêu đề 1</SelectItem>
                  <SelectItem value="heading2">Tiêu đề 2</SelectItem>
                  <SelectItem value="heading3">Tiêu đề 3</SelectItem>
                  <SelectItem value="heading4">Tiêu đề 4</SelectItem>
                  <SelectItem value="heading5">Tiêu đề 5</SelectItem>
                  <SelectItem value="heading6">Tiêu đề 6</SelectItem>
                </SelectContent>
              </Select>
              <div className="h-6 w-px bg-border mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (editor) {
                    const { from, to } = editor.state.selection;
                    const selectedText = editor.state.doc.textBetween(from, to);
                    if (selectedText) {
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
                    editor.chain().focus().unsetBold().unsetItalic().unsetStrike().run();
                  }
                }}
                disabled={mode === 'text' || !editor?.can().unsetBold()}
                title="Tẩy định dạng"
              >
                <Code className="h-4 w-4" />
              </Button>
            </div>
          )}
          </div>
        );
      })()}

      {/* Toolbar */}
      <div ref={toolbarRef} className="bg-muted border-b border-input">
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
              onValueChange={(value) => {
                if (mode === 'visual' && editor) {
                  if (value === 'paragraph') {
                    editor.chain().focus().setParagraph().run();
                  } else if (value.startsWith('heading')) {
                    const level = parseInt(value.replace('heading', '')) as 1 | 2 | 3 | 4 | 5 | 6;
                    editor.chain().focus().toggleHeading({ level }).run();
                  }
                }
              }}
              disabled={mode === 'text'}
            >
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paragraph">Đoạn văn</SelectItem>
                <SelectItem value="heading1">Tiêu đề 1</SelectItem>
                <SelectItem value="heading2">Tiêu đề 2</SelectItem>
                <SelectItem value="heading3">Tiêu đề 3</SelectItem>
                <SelectItem value="heading4">Tiêu đề 4</SelectItem>
                <SelectItem value="heading5">Tiêu đề 5</SelectItem>
                <SelectItem value="heading6">Tiêu đề 6</SelectItem>
              </SelectContent>
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
        <ImageEditorErrorBoundary>
          <div className="relative">
            <EditorContent editor={editor} />
            {editor && <InlineImageToolbar editor={editor} />}
          </div>
        </ImageEditorErrorBoundary>
      ) : (
        <div className="relative">
          {/* QuickTags Toolbar for Text Mode */}
          <div ref={toolbarRef} className="border-b border-input p-2 bg-muted flex gap-1 flex-wrap">
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
            // Check if we're inserting a video embed wrapper
            if (html.includes('video-embed-wrapper')) {
              // Parse the HTML to extract wrapper and iframe
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = html;
              const wrapper = tempDiv.querySelector('div.video-embed-wrapper');
              const iframe = wrapper?.querySelector('iframe');
              
              if (wrapper && iframe) {
                // Extract attributes
                const wrapperStyle = wrapper.getAttribute('style') || '';
                const wrapperClass = wrapper.getAttribute('class') || 'video-embed-wrapper';
                const iframeAttrs = {
                  src: iframe.getAttribute('src') || '',
                  frameborder: iframe.getAttribute('frameborder') || '0',
                  allowfullscreen: iframe.hasAttribute('allowfullscreen'),
                  allow: iframe.getAttribute('allow') || '',
                  style: iframe.getAttribute('style') || '',
                  class: iframe.getAttribute('class') || '',
                  width: iframe.getAttribute('width') || '100%',
                  height: iframe.getAttribute('height') || '400px',
                };
                
                try {
                  // Insert as proper node structure to avoid paragraph wrapping
                  editor.chain()
                    .focus()
                    .insertContent({
                      type: 'videoEmbedWrapper',
                      attrs: {
                        style: wrapperStyle,
                        class: wrapperClass,
                      },
                      content: [
                        {
                          type: 'iframe',
                          attrs: iframeAttrs,
                        },
                      ],
                    })
                    .run();
                } catch (error) {
                  // Fallback to raw HTML insert
                  editor.chain().focus().insertContent(html).run();
                }
              } else {
                // Fallback to raw HTML insert
                editor.chain().focus().insertContent(html).run();
              }
            } else {
              // Insert HTML into Tiptap editor
              editor.chain().focus().insertContent(html).run();
            }
            
            // Update textContent for sync
            const newHtml = editor.getHTML();
            
            // Check if video embed wrapper exists in DOM
            const editorElement = editor.view.dom;
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
