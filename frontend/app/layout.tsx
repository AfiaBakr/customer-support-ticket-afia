import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'SupportFlow — AI-Powered Support. Human-Driven Resolution.',
  description:
    'SupportFlow intelligently triages customer tickets, helps agents prioritize issues, and keeps every conversation organized from first message to final resolution.',
};

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
};

// Runs before paint to prevent a light/dark flash.
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('supportflow.theme');
    var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    var theme = stored || (prefersLight ? 'light' : 'dark');
    var root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-bg text-content antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
