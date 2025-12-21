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
 * ✅ FIX: Use comprehensive styles to prevent "ghost" DOM layout shift
 * The div wrapper is necessary for dangerouslySetInnerHTML, but must not affect layout
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
      style={{
        display: 'none', // ✅ FIX: Hide from layout
        position: 'absolute', // ✅ FIX: Remove from document flow
        visibility: 'hidden', // ✅ FIX: Additional hiding
        width: 0, // ✅ FIX: Zero width
        height: 0, // ✅ FIX: Zero height
        overflow: 'hidden', // ✅ FIX: Hide overflow
        margin: 0, // ✅ FIX: No margin
        padding: 0, // ✅ FIX: No padding
        border: 'none', // ✅ FIX: No border
      }}
      data-script-type="header"
      aria-hidden="true" // ✅ FIX: Hide from screen readers
    />
  );
}

/**
 * Footer Scripts Component
 * 
 * Renders before </body>
 * 
 * ✅ FIX: Use comprehensive styles to prevent "ghost" DOM layout shift
 * The div wrapper is necessary for dangerouslySetInnerHTML, but must not affect layout
 */
export function FooterScripts({ footerScripts }: ScriptsInjectorProps) {
  if (!footerScripts) {
    return null;
  }

  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: footerScripts }}
      style={{
        display: 'none', // ✅ FIX: Hide from layout
        position: 'absolute', // ✅ FIX: Remove from document flow
        visibility: 'hidden', // ✅ FIX: Additional hiding
        width: 0, // ✅ FIX: Zero width
        height: 0, // ✅ FIX: Zero height
        overflow: 'hidden', // ✅ FIX: Hide overflow
        margin: 0, // ✅ FIX: No margin
        padding: 0, // ✅ FIX: No padding
        border: 'none', // ✅ FIX: No border
      }}
      data-script-type="footer"
      aria-hidden="true" // ✅ FIX: Hide from screen readers
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

