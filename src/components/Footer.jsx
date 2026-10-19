import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, ShieldCheck, HeartPulse } from 'lucide-react';

const CURRENT_YEAR = 2026;

export default function Footer() {
  return (
    <footer className="site-footer" id="safety-section">
      <div className="container footer-container">
        {/* Brand & Mission Column */}
        <div className="footer-col footer-col-brand">
          <div className="footer-logo">
            <div className="navbar-logo-icon">
              <Pill size={20} className="logo-pill" />
            </div>
            <span className="brand-name">Dawa Dost</span>
          </div>
          <p className="footer-tagline">
            <strong>Same medicine. Smarter savings.</strong><br />
            Compare medicine prices. Understand the difference.
          </p>
          <div className="footer-badge-strip">
            <span className="footer-pill-badge">
              <ShieldCheck size={14} /> Price Discovery Only
            </span>
            <span className="footer-pill-badge">
              <HeartPulse size={14} /> Unit Cost Transparency
            </span>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="footer-col">
          <h4 className="footer-heading">Navigation</h4>
          <ul className="footer-link-list">
            <li><Link to="/">Home & Search</Link></li>
            <li><Link to="/search">Medicine Comparison Results</Link></li>
            <li><Link to="/how-it-works">How It Works</Link></li>
            <li><a href="#hero-search-form">Search Medicine</a></li>
          </ul>
        </div>

        {/* Supported Pharmacies / Sources */}
        <div className="footer-col">
          <h4 className="footer-heading">Monitored Pharmacies</h4>
          <ul className="footer-link-list">
            <li><span>Tata 1mg</span></li>
            <li><span>Apollo Pharmacy</span></li>
            <li><span>PharmEasy</span></li>
            <li><span>Netmeds</span></li>
            <li><span>Truemeds</span></li>
          </ul>
        </div>

        {/* Safety & Governance */}
        <div className="footer-col footer-col-safety">
          <h4 className="footer-heading">Safety & Governance</h4>
          <p className="footer-safety-text">
            Dawa Dost is a pure price-comparison platform. It does NOT sell medicines, process orders, 
            prescribe drugs, or provide medical advice.
          </p>
          <p className="footer-safety-sub">
            Always consult your physician or licensed pharmacist before changing any medication or brand.
          </p>
        </div>
      </div>

      <div className="container footer-bottom">
        <p className="footer-copy">
          © {CURRENT_YEAR} Dawa Dost. Developed for Healthcare Transparency Hackathon.
        </p>
        <p className="footer-disclaimer-mini">
          All trademarks, pharmacy logos, and medicine names belong to their respective proprietary holders.
        </p>
      </div>
    </footer>
  );
}
