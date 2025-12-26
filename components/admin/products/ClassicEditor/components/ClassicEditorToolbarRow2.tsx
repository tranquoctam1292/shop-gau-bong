/**
 * ClassicEditor Toolbar Row 2
 * 
 * Advanced formatting: Headings, Underline, Justify, Text Color, Clear Format, Undo/Redo
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Underline as UnderlineIcon,
  AlignJustify,
  Palette,
  Code,
  Undo,
  Redo,
} from 'lucide-react';
import { useClassicEditorContext } from '../context/ClassicEditorContext';

export function ClassicEditorToolbarRow2() {
  const {
    mode,
    editor,
    textareaRef,
    setTextContent,
    onChange,
    insertQuickTag,
    setTimeoutSafe,
    isMounted,
  } = useClassicEditorContext();

  // Track current heading level for Select sync
  const [currentHeading, setCurrentHeading] = useState<string>('paragraph');

  // Sync heading select with editor state
  useEffect(() => {
    if (!editor || mode !== 'visual') {
      setCurrentHeading('paragraph');
      return;
    }

    const updateHeading = () => {
      if (editor.isActive('heading', { level: 1 })) {
        setCurrentHeading('heading1');
      } else if (editor.isActive('heading', { level: 2 })) {
        setCurrentHeading('heading2');
      } else if (editor.isActive('heading', { level: 3 })) {
        setCurrentHeading('heading3');
      } else if (editor.isActive('heading', { level: 4 })) {
        setCurrentHeading('heading4');
      } else if (editor.isActive('heading', { level: 5 })) {
        setCurrentHeading('heading5');
      } else if (editor.isActive('heading', { level: 6 })) {
        setCurrentHeading('heading6');
      } else {
        setCurrentHeading('paragraph');
      }
    };

    // Update on selection change
    editor.on('selectionUpdate', updateHeading);
    // Initial update
    updateHeading();

    return () => {
      editor.off('selectionUpdate', updateHeading);
    };
  }, [editor, mode]);

  const handleHeadingChange = (value: string) => {
    if (mode === 'visual' && editor) {
      if (value === 'paragraph') {
        editor.chain().focus().setParagraph().run();
        setCurrentHeading('paragraph');
      } else if (value.startsWith('heading')) {
        const levelStr = value.replace('heading', '');
        const level = parseInt(levelStr, 10);
        // Validate level range (1-6)
        if (!isNaN(level) && level >= 1 && level <= 6) {
          editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
          setCurrentHeading(value);
        }
      }
    }
  };

  const handleUnderline = () => {
    if (mode === 'visual' && editor) {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      if (selectedText) {
        editor.chain().focus().deleteSelection().insertContent(`<u>${selectedText}</u>`).run();
      } else {
        editor.chain().focus().insertContent('<u></u>').run();
      }
    }
  };

  const handleJustify = () => {
    if (mode === 'visual' && editor) {
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
  };

  const handleTextColor = () => {
    const color = prompt('Nhập mã màu (VD: #FF0000, rgb(255,0,0), red):');
    if (!color) return;
    
    // Sanitize color value - remove potentially dangerous characters
    const sanitizedColor = color.trim().replace(/[<>'"&]/g, '');
    
    // Validate color format - support hex, rgb, rgba, hsl, named colors
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i;
    const rgbaRegex = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[01]?\.?\d*\s*\)$/i;
    const hslRegex = /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/i;
    const namedColors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey', 'brown', 'cyan', 'magenta', 'lime', 'navy', 'teal', 'olive', 'maroon', 'silver', 'gold'];
    
    const isValidColor = 
      hexRegex.test(sanitizedColor) ||
      rgbRegex.test(sanitizedColor) ||
      rgbaRegex.test(sanitizedColor) ||
      hslRegex.test(sanitizedColor) ||
      namedColors.includes(sanitizedColor.toLowerCase());
    
    if (!isValidColor) {
      alert('Mã màu không hợp lệ. Sử dụng format:\n- Hex: #FF0000 hoặc #F00\n- RGB: rgb(255,0,0)\n- RGBA: rgba(255,0,0,0.5)\n- HSL: hsl(0,100%,50%)\n- Tên màu: red, blue, green, etc.');
      return;
    }

    if (mode === 'visual' && editor) {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      if (selectedText) {
        editor.chain().focus().deleteSelection().insertContent(`<span style="color: ${sanitizedColor};">${selectedText}</span>`).run();
      } else {
        editor.chain().focus().insertContent(`<span style="color: ${sanitizedColor};">text</span>`).run();
      }
    } else if (mode === 'text' && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      const wrappedText = selectedText || 'text';
      const newText = textarea.value.substring(0, start) + `<span style="color: ${sanitizedColor};">${wrappedText}</span>` + textarea.value.substring(end);
      setTextContent(newText);
      onChange(newText);
      setTimeoutSafe(() => {
        if (isMounted() && textareaRef.current) {
          textareaRef.current.value = newText;
          const newCursorPos = start + `<span style="color: ${sanitizedColor};">${wrappedText}</span>`.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const handleClearFormat = () => {
    if (mode === 'visual' && editor) {
      editor.chain().focus().unsetBold().unsetItalic().unsetStrike().run();
    }
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b border-input">
      <Select
        value={currentHeading}
        onValueChange={handleHeadingChange}
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
        onClick={handleUnderline}
        title="Gạch chân"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleJustify}
        title="Căn đều 2 bên"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>

      <div className="h-6 w-px bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleTextColor}
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
        onClick={handleClearFormat}
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
  );
}

