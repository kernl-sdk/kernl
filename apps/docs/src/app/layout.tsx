import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import { Scrollbar } from '@/components/scrollbar';
import './global.css';

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/kernl-logo.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider theme={{ forcedTheme: 'dark' }}>{children}</RootProvider>
        <Scrollbar />
      </body>
    </html>
  );
}
