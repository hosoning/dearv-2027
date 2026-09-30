import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: '3D 回憶小屋',
  description: '一個珍藏回憶的 3D 互動空間',
  manifest: 'manifest.json',
  icons: {
    icon: 'icon.svg',
    apple: 'icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '回憶小屋',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="overscroll-none bg-black antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
