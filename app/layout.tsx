import type { Metadata, Viewport } from 'next';
import { Lato } from 'next/font/google';
import Script from 'next/script';
import type { ReactNode } from 'react';
import UpdateWatcher from '@/components/UpdateWatcher';
import { THEME_KEY } from '@/lib/theme-key';
import './globals.css';

const lato = Lato({ subsets: ['latin'], weight: ['300', '400', '700', '900'], display: 'swap' });

const ADSENSE_CLIENT = 'ca-pub-9017404753831118';
const GA_ID = 'G-2D6S1Q6YH0';

export const metadata: Metadata = {
  metadataBase: new URL('https://bell.ninja'),
  title: 'Bell Ninja - A Simple Timer',
  description: 'A simple answer to a constant question. When is the class bell going to ring?',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/img/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/img/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/img/favicons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/img/favicons/android-icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/img/favicons/apple-icon-152x152.png', sizes: '152x152' },
      { url: '/img/favicons/apple-icon-180x180.png', sizes: '180x180' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#d4363b',
};

/* Runs before the first paint, so a dark-mode visitor never sees a flash of red. */
const themeScript = `try{if(localStorage.getItem('${THEME_KEY}')==='dark')document.documentElement.dataset.theme='dark'}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={lato.className}>
        {children}
        <UpdateWatcher />
        {process.env.NODE_ENV === 'production' && (
          <>
            <Script
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
              crossOrigin="anonymous"
              strategy="afterInteractive"
            />
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="analytics" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
