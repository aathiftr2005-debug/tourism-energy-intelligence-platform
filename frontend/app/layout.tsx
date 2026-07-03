import './globals.css';
import Sidebar from '@/components/UI/Sidebar';
import CustomCursor from '@/components/UI/CustomCursor';
import { ToastProvider } from '@/components/UI/Toast';


export const metadata = {
  title: 'Tourism Energy Intelligence',
  description: 'AI-powered seasonal energy demand forecasting for European tourism regions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <div className="map-wallpaper">
          <img src="/eu-map-bg.jpg" alt="" aria-hidden="true" loading="lazy" />
          <div className="map-wallpaper-overlay" />
        </div>
        <div className="grid-overlay" />
        <div className="scan-lines" />
        <CustomCursor />
        
          <ToastProvider>
            <div className="tei-layout">
              <Sidebar />
              <main id="main-content" className="tei-main">{children}</main>
            </div>
          </ToastProvider>
        
      </body>
    </html>
  );
}
