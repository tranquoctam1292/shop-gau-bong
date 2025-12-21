/**
 * Scripts Injector Component
 * 
 * Injects header and footer scripts from site settings
 * 
 * This component must be used in layout.tsx to inject scripts
 * Header scripts are injected at the beginning of body (Next.js App Router limitation)
 * Footer scripts are injected before closing body tag
 */

import { getSiteSettings } from '@/lib/repositories/siteSettingsRepository';

interface ScriptsInjectorProps {
  headerScripts?: string;
  footerScripts?: string;
}

/**
 * Header Scripts Component
 * 
 * Injects scripts at the beginning of body (Next.js App Router doesn't allow <head> manipulation)
 * Uses dangerouslySetInnerHTML for raw HTML scripts (GA, FB Pixel, etc.)
 * 
 * ✅ OPTIMIZATION: Rendered at highest position in body for early execution
 * Note: Next.js Script component doesn't support dangerouslySetInnerHTML for raw HTML,
 * so we use div with dangerouslySetInnerHTML as the best approach for custom scripts
 */
export function HeaderScripts({ headerScripts }: ScriptsInjectorProps) {
  if (!headerScripts) {
    return null;
  }

  // Inject raw HTML scripts (GA, FB Pixel, etc.)
  // Note: In Next.js App Router, we inject at the beginning of body
  // as we cannot directly manipulate <head>
  // This ensures scripts execute as early as possible
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: headerScripts }}
      style={{ display: 'none' }}
      data-script-type="header"
    />
  );
}

/**
 * Footer Scripts Component
 * 
 * Renders before </body>
 */
export function FooterScripts({ footerScripts }: ScriptsInjectorProps) {
  if (!footerScripts) {
    return null;
  }

  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: footerScripts }}
      style={{ display: 'none' }}
    />
  );
}

/**
 * Fetch site settings and return scripts
 * 
 * Used in Server Components
 */
export async function getSiteScripts() {
  try {
    // getSiteSettings() now always returns a value (DEFAULT_SETTINGS if not exists)
    const settings = await getSiteSettings();
    return {
      headerScripts: settings.scripts?.headerScripts,
      footerScripts: settings.scripts?.footerScripts,
    };
  } catch (error) {
    console.error('[ScriptsInjector] Error fetching site settings:', error);
    return {
      headerScripts: undefined,
      footerScripts: undefined,
    };
  }
}

