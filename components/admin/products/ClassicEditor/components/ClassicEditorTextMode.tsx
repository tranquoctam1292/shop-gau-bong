/**
 * ClassicEditor Text Mode
 * 
 * Text mode with QuickTags toolbar and textarea
 */

'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useClassicEditorContext } from '../context/ClassicEditorContext';

export function ClassicEditorTextMode() {
  const {
    textareaRef,
    textContent,
    setTextContent,
    onChange,
    insertQuickTag,
    addLink,
    addImage,
    setTimeoutSafe,
    isMounted,
  } = useClassicEditorContext();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setTextContent(newContent);
    onChange(newContent);
  };

  const handleBulletList = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    // Additional null check
    if (!textarea) return;
    
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
      
      // Use setTimeoutSafe for DOM update
      setTimeoutSafe(() => {
        if (isMounted() && textareaRef.current) {
          textareaRef.current.value = newText;
          // Set cursor position after inserted list
          const listLength = `<ul>\n${listItems}\n</ul>`.length;
          const newCursorPos = start + listLength;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    } else {
      insertQuickTag('<ul>\n<li>', '</li>\n</ul>');
    }
  };

  const handleOrderedList = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    // Additional null check
    if (!textarea) return;
    
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
      
      // Use setTimeoutSafe for DOM update
      setTimeoutSafe(() => {
        if (isMounted() && textareaRef.current) {
          textareaRef.current.value = newText;
          // Set cursor position after inserted list
          const listLength = `<ol>\n${listItems}\n</ol>`.length;
          const newCursorPos = start + listLength;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    } else {
      insertQuickTag('<ol>\n<li>', '</li>\n</ol>');
    }
  };

  return (
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
          onClick={handleBulletList}
          className="h-7 text-xs"
        >
          ul
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleOrderedList}
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
  );
}

