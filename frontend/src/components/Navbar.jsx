import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Pill, Menu, X, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/useTheme.js';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const handleCompareClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (location.pathname === '/') {
      const searchInput = document.getElementById('hero-medicine-input');
      if (searchInput) {
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => searchInput.focus(), 300);
      }
    } else {
      navigate('/?focus=search');
    }
  };

  const handleSafetyClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const safetySection = document.getElementById('safety-section');
    if (safetySection) {
      safetySection.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#safety-section');
    }
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <Link 
          to="/" 
          className="navbar-brand" 
          aria-label="Dawa Dost - Home"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="navbar-logo-icon">
            <Pill size={22} className="logo-pill" />
          </div>
          <div className="navbar-brand-text">
            <span className="brand-name">Dawa Dost</span>
            <span className="brand-sub">Price Intelligence</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="navbar-desktop-nav" aria-label="Main Navigation">
          {/* Dark Mode Toggler placed just before Home */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun size={19} className="theme-toggle-icon theme-toggle-sun" aria-hidden="true" />
            ) : (
              <Moon size={19} className="theme-toggle-icon theme-toggle-moon" aria-hidden="true" />
            )}
          </button>

          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            Home
          </NavLink>

          <NavLink
            to="/how-it-works"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            How It Works
          </NavLink>

          <a
            href="#safety-section"
            onClick={handleSafetyClick}
            className="nav-link"
          >
            About & Safety
          </a>

          <button
            type="button"
            onClick={handleCompareClick}
            className="btn btn-primary btn-sm btn-nav-cta"
          >
            <span>Compare Prices</span>
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </nav>

        {/* Mobile Header Controls */}
        <div className="navbar-mobile-controls">
          <button
            type="button"
            className="theme-toggle-btn theme-toggle-btn-mobile-header"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun size={20} className="theme-toggle-sun" aria-hidden="true" />
            ) : (
              <Moon size={20} className="theme-toggle-moon" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            className="navbar-mobile-toggle"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </NavLink>

          <NavLink
            to="/search"
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Search Results
          </NavLink>

          <NavLink
            to="/how-it-works"
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            How It Works
          </NavLink>

          <a
            href="#safety-section"
            className="mobile-nav-link"
            onClick={handleSafetyClick}
          >
            About & Safety
          </a>

          <div className="mobile-menu-cta-wrap">
            <button
              type="button"
              onClick={handleCompareClick}
              className="btn btn-primary btn-block"
            >
              <span>Compare Prices</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
