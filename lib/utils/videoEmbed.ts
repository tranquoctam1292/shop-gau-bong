/**
 * Video Embed Utility
 * Handles OEmbed video detection and conversion to iframe
 */

// Whitelist of allowed video domains for security
const ALLOWED_VIDEO_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
  'tiktok.com',
  'www.tiktok.com',
  'vm.tiktok.com',
  'dailymotion.com',
  'www.dailymotion.com',
  'facebook.com',
  'www.facebook.com',
  'fb.watch',
];

/**
 * Check if URL is from an allowed video domain
 */
export function isAllowedVideoDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    const result = ALLOWED_VIDEO_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'videoEmbed.ts:32',message:'isAllowedVideoDomain check',data:{url,hostname,result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return result;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'videoEmbed.ts:36',message:'isAllowedVideoDomain error',data:{url,error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return false;
  }
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /youtube\.com\/embed\/([^"&?\/\s]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract Vimeo video ID from URL
 */
function extractVimeoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract TikTok video ID from URL
 */
function extractTikTokId(url: string): string | null {
  const pattern = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/;
  const match = url.match(pattern);
  return match && match[1] ? match[1] : null;
}

/**
 * Generate iframe HTML for video embed
 */
function generateVideoIframe(provider: string, videoId: string, url: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  
  switch (provider) {
    case 'youtube':
      // Return HTML that Tiptap can parse - use div wrapper with iframe inside
      return `<div class="video-embed-wrapper" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1rem 0;">
        <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen="true"></iframe>
      </div>`;
    
    case 'vimeo':
      return `<div class="video-embed-wrapper" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1rem 0;">
        <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen="true"></iframe>
      </div>`;
    
    case 'tiktok':
      // TikTok requires oEmbed API, but we can create a placeholder
      return `<div class="tiktok-embed" data-video-id="${videoId}" style="max-width: 325px; min-height: 575px; margin: 1rem 0;">
        <blockquote cite="${url}" class="tiktok-embed">
          <section>
            <a target="_blank" title="${videoId}" href="${url}">${url}</a>
          </section>
        </blockquote>
      </div>`;
    
    default:
      return '';
  }
}

/**
 * Convert video URL to iframe embed HTML
 * Returns null if URL is not a valid video URL
 */
export function convertVideoUrlToEmbed(url: string): string | null {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'videoEmbed.ts:119',message:'convertVideoUrlToEmbed called',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  if (!isAllowedVideoDomain(url)) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'videoEmbed.ts:122',message:'Domain not allowed',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return null;
  }

  // Try YouTube
  const youtubeId = extractYouTubeId(url);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'videoEmbed.ts:128',message:'YouTube ID extraction',data:{youtubeId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  if (youtubeId) {
    const result = generateVideoIframe('youtube', youtubeId, url);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'videoEmbed.ts:131',message:'YouTube iframe generated',data:{resultLength:result.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return result;
  }

  // Try Vimeo
  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return generateVideoIframe('vimeo', vimeoId, url);
  }

  // Try TikTok
  const tiktokId = extractTikTokId(url);
  if (tiktokId) {
    return generateVideoIframe('tiktok', tiktokId, url);
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'videoEmbed.ts:145',message:'No video ID found',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  return null;
}

/**
 * Check if text is a standalone video URL (on its own line)
 */
export function isStandaloneVideoUrl(text: string): boolean {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'videoEmbed.ts:148',message:'isStandaloneVideoUrl called',data:{text:text.substring(0,100),textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // Remove whitespace
  const trimmed = text.trim();
  
  // Check if it's a valid URL
  try {
    new URL(trimmed);
  } catch {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'videoEmbed.ts:157',message:'Invalid URL format',data:{trimmed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return false;
  }

  // Check if it's a video URL
  if (!isAllowedVideoDomain(trimmed)) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'videoEmbed.ts:163',message:'Not an allowed video domain',data:{trimmed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return false;
  }

  // Check if it's on its own line (no other text on the same line)
  // This is a simple check - in practice, you might want more sophisticated detection
  const lines = text.split('\n');
  const urlLine = lines.find(line => line.trim() === trimmed);
  const result = urlLine !== undefined;
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'videoEmbed.ts:171',message:'isStandaloneVideoUrl result',data:{trimmed,linesCount:lines.length,result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  return result;
}

/**
 * Fetch OEmbed data from provider API (for future use)
 * Currently, we use direct iframe generation, but this can be used for more complex cases
 */
export async function fetchOEmbedData(url: string): Promise<{ html: string } | null> {
  try {
    // Use noembed.com as a universal oEmbed provider
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.html ? { html: data.html } : null;
  } catch (error) {
    console.error('Error fetching oEmbed data:', error);
    return null;
  }
}
