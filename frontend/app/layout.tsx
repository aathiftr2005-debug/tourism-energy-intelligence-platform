import './globals.css';
import type { Viewport } from 'next';
import Sidebar from '@/components/UI/Sidebar';
import CustomCursor from '@/components/UI/CustomCursor';
import { ToastProvider } from '@/components/UI/Toast';
import { ThemeProvider } from '@/lib/theme/ThemeContext';

export const metadata = {
  title: 'Tourism Energy Intelligence',
  description: 'AI-powered seasonal energy demand forecasting for European tourism regions',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <div className="map-wallpaper" />
        <div className="map-wallpaper-overlay" />
        <div className="grid-overlay" />
        <div className="scan-lines" />
        <CustomCursor />
        
        <ThemeProvider>
          <ToastProvider>
            <div className="tei-layout">
              <Sidebar />
              <main id="main-content" className="tei-main">{children}</main>
            </div>
          </ToastProvider>
        </ThemeProvider>
        
      </body>
    </html>
  );
}
