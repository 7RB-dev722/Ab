import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import { ProductsGrid } from './components/ProductsGrid';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import { AnimatedBackground } from './components/AnimatedBackground';
import WinningPhotosPage from './components/WinningPhotosPage';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ImagePaymentPage from './components/ImagePaymentPage';
import LinkPaymentPage from './components/LinkPaymentPage';
import CompatibilityCheckPage from './components/CompatibilityCheckPage';
import PrePurchaseInfoPage from './components/PrePurchaseInfoPage';

// Component to handle dynamic favicon updates
const FaviconUpdater = () => {
  const { settings } = useSettings();
  
  useEffect(() => {
    const faviconUrl = settings.site_favicon_url;
    if (faviconUrl) {
      // Update standard icon
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;

      // Update apple touch icon
      let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleLink);
      }
      appleLink.href = faviconUrl;
    }
  }, [settings.site_favicon_url]);

  return null;
};

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <Header />
        <Hero />
        <ProductsGrid />
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <LanguageProvider>
        <FaviconUpdater />
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/winning-photos" element={<WinningPhotosPage />} />
            <Route path="/pay/:productId" element={<ImagePaymentPage />} />
            <Route path="/link-pay/:productId" element={<LinkPaymentPage />} />
            <Route path="/check-compatibility/:productId" element={<CompatibilityCheckPage />} />
            <Route path="/pre-purchase/:productId" element={<PrePurchaseInfoPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </SettingsProvider>
  );
}

export default App;
