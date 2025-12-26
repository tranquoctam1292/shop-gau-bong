/**
 * ClassicEditor Extensions
 * 
 * Tiptap extensions configuration for ClassicEditor
 */

import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Paragraph from '@tiptap/extension-paragraph';
import { Iframe, VideoEmbedWrapper } from '@/lib/tiptap/extensions/Iframe';
import type { Extensions } from '@tiptap/react';

/**
 * Extended Paragraph extension with style attribute support for text-align
 */
const ParagraphWithStyle = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
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
    };
  },
});

/**
 * Create Tiptap extensions for ClassicEditor
 */
export function createClassicEditorExtensions(placeholder: string = 'Nhập nội dung...'): Extensions {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      // Disable default paragraph, use our extended version
      paragraph: false,
    }),
    // Use extended paragraph with style support
    ParagraphWithStyle,
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
    Placeholder.configure({
      placeholder,
    }),
  ];
}

