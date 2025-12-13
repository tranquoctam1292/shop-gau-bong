import { Node } from '@tiptap/core';

/**
 * Custom Video Embed extension for Tiptap
 * Allows embedding video wrapper divs with iframes inside
 */
export const VideoEmbed = Node.create({
  name: 'videoEmbed',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      html: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.video-embed-wrapper',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          return {
            html: element.outerHTML,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    if (!HTMLAttributes.html) return ['div', {}];
    // Return raw HTML - Tiptap will parse it
    return ['div', { ...HTMLAttributes }];
  },

  addCommands() {
    return {
      setVideoEmbed:
        (html: string) =>
        ({ commands }: { commands: any; tr?: any }) => {
          // Insert raw HTML directly
          return commands.insertContent(html);
        },
    } as any;
  },
});
