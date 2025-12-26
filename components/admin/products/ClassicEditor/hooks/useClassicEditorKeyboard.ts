/**
 * ClassicEditor Keyboard Shortcuts Hook
 * 
 * Handles all keyboard shortcuts for the editor
 */

import { useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import type { EditorMode } from '../types';

interface UseClassicEditorKeyboardOptions {
  editor: Editor | null;
  mode: EditorMode;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  showToolbarRow2: boolean;
  setShowToolbarRow2: (show: boolean) => void;
  setShowMediaModal: (show: boolean) => void;
  insertQuickTag: (openTag: string, closeTag: string, insertText?: string) => void;
  addLink: () => void;
  setTextContent: (content: string) => void;
  onChange: (html: string) => void;
}

export function useClassicEditorKeyboard({
  editor,
  mode,
  textareaRef,
  showToolbarRow2,
  setShowToolbarRow2,
  setShowMediaModal,
  insertQuickTag,
  addLink,
  setTextContent,
  onChange,
}: UseClassicEditorKeyboardOptions): void {
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
  }, [editor, mode, showToolbarRow2, textareaRef, insertQuickTag, addLink, setShowMediaModal, setShowToolbarRow2, setTextContent, onChange]);
}

