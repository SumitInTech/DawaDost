import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SearchProvider } from './context/SearchContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import HowItWorksPage from './pages/HowItWorksPage.jsx';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Only scroll to top if not explicitly focusing or anchoring
    if (!search.includes('focus=search') && !window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SearchProvider>
        <ScrollToTop />
        <div className="page-wrapper">
          <Navbar />
          <main className="main-content" id="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<ResultsPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              {/* Catch-all fallback */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </SearchProvider>
    </BrowserRouter>
  );
}
