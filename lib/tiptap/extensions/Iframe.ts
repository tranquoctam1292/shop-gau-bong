import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Custom Video Embed Wrapper extension for Tiptap
 * Preserves div.video-embed-wrapper with iframe inside
 */
export const VideoEmbedWrapper = Node.create({
  name: 'videoEmbedWrapper',

  group: 'block',

  content: 'iframe',

  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style'),
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
      class: {
        default: 'video-embed-wrapper',
        parseHTML: (element) => element.getAttribute('class') || 'video-embed-wrapper',
        renderHTML: (attributes) => {
          return { class: attributes.class || 'video-embed-wrapper' };
        },
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
          const style = element.getAttribute('style');
          const className = element.getAttribute('class') || 'video-embed-wrapper';
          // #region agent log
          if (typeof window !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Iframe.ts:42',message:'VideoEmbedWrapper parseHTML',data:{hasStyle:!!style,styleLength:style?.length,className},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          }
          // #endregion
          return {
            style: style,
            class: className,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = {
      class: HTMLAttributes.class || 'video-embed-wrapper',
      ...(HTMLAttributes.style && { style: HTMLAttributes.style }),
    };
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Iframe.ts:60',message:'VideoEmbedWrapper renderHTML',data:{hasStyle:!!attrs.style,styleLength:attrs.style?.length,className:attrs.class,attrsKeys:Object.keys(attrs)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion
    // Return div with proper attributes and content slot (0 means render children here)
    return ['div', attrs, 0];
  },
});

/**
 * Custom Iframe extension for Tiptap
 * Allows embedding iframes (for video embeds, etc.)
 */
export const Iframe = Node.create({
  name: 'iframe',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      frameborder: {
        default: '0',
      },
      allowfullscreen: {
        default: false,
      },
      allow: {
        default: null,
      },
      width: {
        default: '100%',
      },
      height: {
        default: '400px',
      },
      style: {
        default: null,
      },
      class: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          return {
            src: element.getAttribute('src'),
            frameborder: element.getAttribute('frameborder') || '0',
            allowfullscreen: element.hasAttribute('allowfullscreen'),
            allow: element.getAttribute('allow'),
            width: element.getAttribute('width') || '100%',
            height: element.getAttribute('height') || '400px',
            style: element.getAttribute('style'),
            class: element.getAttribute('class'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['iframe', mergeAttributes(HTMLAttributes)];
  },
});
