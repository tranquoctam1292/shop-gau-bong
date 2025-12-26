/**
 * ClassicEditor Toolbar Row 1
 * 
 * Core formatting buttons: Add Media, Bold, Italic, Strike, Lists, Blockquote, HR, Alignment, Link, Read More
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Type,
  MoreHorizontal,
  Upload,
} from 'lucide-react';
import { useClassicEditorContext } from '../context/ClassicEditorContext';

export function ClassicEditorToolbarRow1() {
  const {
    mode,
    editor,
    textareaRef,
    setShowMediaModal,
    showToolbarRow2,
    setShowToolbarRow2,
    insertQuickTag,
    addLink,
    insertReadMore,
    setTextContent,
    onChange,
    setTimeoutSafe,
    isMounted,
  } = useClassicEditorContext();

  // Track current paragraph alignment for active state
  const [currentAlignment, setCurrentAlignment] = useState<'left' | 'center' | 'right' | null>(null);

  // Sync alignment state with editor
  useEffect(() => {
    if (!editor || mode !== 'visual') {
      setCurrentAlignment(null);
      return;
    }

    const updateAlignment = () => {
      try {
        const { $from } = editor.state.selection;
        const paragraph = $from.node(-1);
        if (paragraph && paragraph.type.name === 'paragraph') {
          const attrs = paragraph.attrs;
          const style = attrs.style || '';
          if (style.includes('text-align: left')) {
            setCurrentAlignment('left');
          } else if (style.includes('text-align: center')) {
            setCurrentAlignment('center');
          } else if (style.includes('text-align: right')) {
            setCurrentAlignment('right');
          } else {
            setCurrentAlignment(null);
          }
        } else {
          setCurrentAlignment(null);
        }
      } catch {
        setCurrentAlignment(null);
      }
    };

    // Update on selection change
    editor.on('selectionUpdate', updateAlignment);
    // Initial update
    updateAlignment();

    return () => {
      editor.off('selectionUpdate', updateAlignment);
    };
  }, [editor, mode]);

  const handleBulletList = () => {
    if (mode === 'visual' && editor) {
      editor.chain().focus().toggleBulletList().run();
    } else if (mode === 'text' && textareaRef.current) {
      const textarea = textareaRef.current;
      // Additional null check after mode check
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      if (selectedText) {
        const lines = selectedText.split('\n').filter(l => l.trim());
        const listItems = lines.map(line => `<li>${line}</li>`).join('\n');
        const listHtml = `<ul>\n${listItems}\n</ul>`;
        const newText = textarea.value.substring(0, start) + listHtml + textarea.value.substring(end);
        setTextContent(newText);
        onChange(newText);
        
        // Use setTimeoutSafe for DOM update
        setTimeoutSafe(() => {
          if (isMounted() && textareaRef.current) {
            textareaRef.current.value = newText;
            // Set cursor position after inserted list
            const newCursorPos = start + listHtml.length;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            textareaRef.current.focus();
          }
        }, 0);
      } else {
        insertQuickTag('<ul>\n<li>', '</li>\n</ul>');
      }
    }
  };

  const handleOrderedList = () => {
    if (mode === 'visual' && editor) {
      editor.chain().focus().toggleOrderedList().run();
    } else if (mode === 'text' && textareaRef.current) {
      const textarea = textareaRef.current;
      // Additional null check after mode check
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      if (selectedText) {
        const lines = selectedText.split('\n').filter(l => l.trim());
        const listItems = lines.map(line => `<li>${line}</li>`).join('\n');
        const listHtml = `<ol>\n${listItems}\n</ol>`;
        const newText = textarea.value.substring(0, start) + listHtml + textarea.value.substring(end);
        setTextContent(newText);
        onChange(newText);
        
        // Use setTimeoutSafe for DOM update
        setTimeoutSafe(() => {
          if (isMounted() && textareaRef.current) {
            textareaRef.current.value = newText;
            // Set cursor position after inserted list
            const newCursorPos = start + listHtml.length;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            textareaRef.current.focus();
          }
        }, 0);
      } else {
        insertQuickTag('<ol>\n<li>', '</li>\n</ol>');
      }
    }
  };

  const handleBlockquote = () => {
    if (mode === 'visual' && editor) {
      editor.chain().focus().toggleBlockquote().run();
    } else if (mode === 'text' && textareaRef.current) {
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      
      if (selectedText) {
        // Wrap selected text in blockquote
        const blockquoteHtml = `<blockquote>${selectedText}</blockquote>`;
        const newText = textarea.value.substring(0, start) + blockquoteHtml + textarea.value.substring(end);
        setTextContent(newText);
        onChange(newText);
        
        setTimeoutSafe(() => {
          if (isMounted() && textareaRef.current) {
            textareaRef.current.value = newText;
            // Set cursor position after inserted blockquote
            const newCursorPos = start + blockquoteHtml.length;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            textareaRef.current.focus();
          }
        }, 0);
      } else {
        // No selection, insert empty blockquote tags
        insertQuickTag('<blockquote>', '</blockquote>');
      }
    }
  };

  const handleHorizontalRule = () => {
    if (mode === 'visual' && editor) {
      editor.chain().focus().setHorizontalRule().run();
    } else if (mode === 'text' && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const newText = textarea.value.substring(0, start) + '<hr />' + textarea.value.substring(start);
      setTextContent(newText);
      onChange(newText);
      setTimeoutSafe(() => {
        if (isMounted() && textareaRef.current) {
          textareaRef.current.value = newText;
          textareaRef.current.setSelectionRange(start + '<hr />'.length, start + '<hr />'.length);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const handleAlignLeft = () => {
    if (mode === 'visual' && editor) {
      const { state, view } = editor;
      const { $from, $to } = state.selection;
      
      // Find all paragraphs in selection
      const paragraphs: Array<{ pos: number; node: any }> = [];
      state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type.name === 'paragraph') {
          paragraphs.push({ pos, node });
        }
      });
      
      if (paragraphs.length > 0) {
        // Update all paragraphs in selection
        const tr = state.tr;
        paragraphs.forEach(({ pos, node }) => {
          const currentStyle = node.attrs.style || '';
          const newStyle = currentStyle.replace(/text-align:\s*[^;]+;?/gi, '').trim();
          const updatedStyle = newStyle ? `${newStyle}; text-align: left;` : 'text-align: left;';
          
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            style: updatedStyle,
          });
        });
        view.dispatch(tr);
        editor.chain().focus().run();
      } else {
        // No paragraph found, wrap selection or insert new paragraph
        const selectedContent = state.doc.textBetween($from.pos, $to.pos);
        if (selectedContent) {
          editor.chain().focus().deleteSelection().insertContent(`<p style="text-align: left;">${selectedContent}</p>`).run();
        } else {
          // Check if we're in a paragraph but it wasn't found (edge case)
          const parent = $from.parent;
          if (parent.type.name === 'paragraph') {
            const currentStyle = parent.attrs.style || '';
            const newStyle = currentStyle.replace(/text-align:\s*[^;]+;?/gi, '').trim();
            const updatedStyle = newStyle ? `${newStyle}; text-align: left;` : 'text-align: left;';
            
            const tr = state.tr;
            tr.setNodeMarkup($from.before($from.depth), undefined, {
              ...parent.attrs,
              style: updatedStyle,
            });
            view.dispatch(tr);
            editor.chain().focus().run();
          } else {
            editor.chain().focus().insertContent('<p style="text-align: left;"></p>').run();
          }
        }
      }
    }
  };

  const handleAlignCenter = () => {
    if (mode === 'visual' && editor) {
      const { state, view } = editor;
      const { $from, $to } = state.selection;
      
      // Find all paragraphs in selection
      const paragraphs: Array<{ pos: number; node: any }> = [];
      state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type.name === 'paragraph') {
          paragraphs.push({ pos, node });
        }
      });
      
      if (paragraphs.length > 0) {
        // Update all paragraphs in selection
        const tr = state.tr;
        paragraphs.forEach(({ pos, node }) => {
          const currentStyle = node.attrs.style || '';
          const newStyle = currentStyle.replace(/text-align:\s*[^;]+;?/gi, '').trim();
          const updatedStyle = newStyle ? `${newStyle}; text-align: center;` : 'text-align: center;';
          
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            style: updatedStyle,
          });
        });
        view.dispatch(tr);
        editor.chain().focus().run();
      } else {
        // No paragraph found, wrap selection or insert new paragraph
        const selectedContent = state.doc.textBetween($from.pos, $to.pos);
        if (selectedContent) {
          editor.chain().focus().deleteSelection().insertContent(`<p style="text-align: center;">${selectedContent}</p>`).run();
        } else {
          // Check if we're in a paragraph but it wasn't found (edge case)
          const parent = $from.parent;
          if (parent.type.name === 'paragraph') {
            const currentStyle = parent.attrs.style || '';
            const newStyle = currentStyle.replace(/text-align:\s*[^;]+;?/gi, '').trim();
            const updatedStyle = newStyle ? `${newStyle}; text-align: center;` : 'text-align: center;';
            
            const tr = state.tr;
            tr.setNodeMarkup($from.before($from.depth), undefined, {
              ...parent.attrs,
              style: updatedStyle,
            });
            view.dispatch(tr);
            editor.chain().focus().run();
          } else {
            editor.chain().focus().insertContent('<p style="text-align: center;"></p>').run();
          }
        }
      }
    }
  };

  const handleAlignRight = () => {
    if (mode === 'visual' && editor) {
      const { state, view } = editor;
      const { $from, $to } = state.selection;
      
      // Find all paragraphs in selection
      const paragraphs: Array<{ pos: number; node: any }> = [];
      state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type.name === 'paragraph') {
          paragraphs.push({ pos, node });
        }
      });
      
      if (paragraphs.length > 0) {
        // Update all paragraphs in selection
        const tr = state.tr;
        paragraphs.forEach(({ pos, node }) => {
          const currentStyle = node.attrs.style || '';
          const newStyle = currentStyle.replace(/text-align:\s*[^;]+;?/gi, '').trim();
          const updatedStyle = newStyle ? `${newStyle}; text-align: right;` : 'text-align: right;';
          
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            style: updatedStyle,
          });
        });
        view.dispatch(tr);
        editor.chain().focus().run();
      } else {
        // No paragraph found, wrap selection or insert new paragraph
        const selectedContent = state.doc.textBetween($from.pos, $to.pos);
        if (selectedContent) {
          editor.chain().focus().deleteSelection().insertContent(`<p style="text-align: right;">${selectedContent}</p>`).run();
        } else {
          // Check if we're in a paragraph but it wasn't found (edge case)
          const parent = $from.parent;
          if (parent.type.name === 'paragraph') {
            const currentStyle = parent.attrs.style || '';
            const newStyle = currentStyle.replace(/text-align:\s*[^;]+;?/gi, '').trim();
            const updatedStyle = newStyle ? `${newStyle}; text-align: right;` : 'text-align: right;';
            
            const tr = state.tr;
            tr.setNodeMarkup($from.before($from.depth), undefined, {
              ...parent.attrs,
              style: updatedStyle,
            });
            view.dispatch(tr);
            editor.chain().focus().run();
          } else {
            editor.chain().focus().insertContent('<p style="text-align: right;"></p>').run();
          }
        }
      }
    }
  };

  return (
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
        onClick={handleBulletList}
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
        onClick={handleOrderedList}
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
        onClick={handleBlockquote}
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
        onClick={handleHorizontalRule}
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
        onClick={handleAlignLeft}
        disabled={mode === 'text'}
        className={currentAlignment === 'left' ? 'bg-background' : ''}
        title="Căn trái"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAlignCenter}
        disabled={mode === 'text'}
        className={currentAlignment === 'center' ? 'bg-background' : ''}
        title="Căn giữa"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAlignRight}
        disabled={mode === 'text'}
        className={currentAlignment === 'right' ? 'bg-background' : ''}
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
  );
}

