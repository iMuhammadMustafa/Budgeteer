import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

/**
 * Web-only root HTML shell. This wraps every page during the static web export
 * and is where PWA wiring lives (manifest, theme color, iOS add-to-home-screen
 * meta, icons, and service-worker registration). It does NOT run on native.
 *
 * Note: nothing in here is React-interactive — only static markup plus the
 * inline scripts below execute in the browser.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* App-like viewport: fill notches, lock zoom so it feels native on phones. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />

        {/* PWA manifest (served from /public). */}
        <link rel="manifest" href="/manifest.json" />

        {/* Browser chrome / status-bar tint, reactive to the OS color scheme. */}
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#F4F1E9" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#121315" />

        {/* iOS standalone behaviour for "Add to Home Screen". */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Budgeteer" />
        <meta name="application-name" content="Budgeteer" />

        {/* Icons. */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* Match the splash/app background so there's no white flash before hydration. */}
        <style dangerouslySetInnerHTML={{ __html: backgroundFlashFix }} />

        {/* Disable body scrolling so the app handles its own scroll views. */}
        <ScrollViewStyleReset />

        {/* Register the service worker that powers installability + offline shell. */}
        <script dangerouslySetInnerHTML={{ __html: registerServiceWorker }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const backgroundFlashFix = `
html, body { background-color: #F4F1E9; }
@media (prefers-color-scheme: dark) {
  html, body { background-color: #121315; }
}
`;

const registerServiceWorker = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (err) {
      console.warn('Service worker registration failed:', err);
    });
  });
}
`;
