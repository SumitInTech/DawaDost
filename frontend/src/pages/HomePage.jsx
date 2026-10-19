import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Scale,
  Search,
  Building2,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  Info,
  Layers,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import { useSearch } from '../context/useSearch.js';
import SearchBar from '../components/SearchBar.jsx';
import FeatureCard from '../components/FeatureCard.jsx';
import PriceExampleCard from '../components/PriceExampleCard.jsx';
import SafetyBanner from '../components/SafetyBanner.jsx';

export default function HomePage() {
  const { performSearch, loading, query, pincode } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if routed with query param ?focus=search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('focus') === 'search') {
      const inputEl = document.getElementById('hero-medicine-input');
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputEl.focus();
      }
    }
  }, [location]);

  const handleHeroSearch = async (searchQuery, searchPincode) => {
    const success = await performSearch(searchQuery, searchPincode);
    if (success) {
      navigate('/search');
    }
  };

  const handleScrollToSearch = () => {
    const inputEl = document.getElementById('hero-medicine-input');
    if (inputEl) {
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inputEl.focus();
    }
  };

  return (
    <div className="home-page-container">
      {/* SECTION A: HERO */}
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="container hero-container">
          {/* Left Column: Heading, Value Prop, and Search Form */}
          <div className="hero-left-col">
            <span className="eyebrow">SMARTER MEDICINE PRICE COMPARISON</span>
            <h1 id="hero-heading" className="hero-heading">
              Your medicine.<br />
              <span className="text-teal">Better price visibility.</span>
            </h1>
            <p className="hero-supporting-text">
              Compare branded medicines with equivalent listings across pharmacies. Understand price differences and
              potential savings with transparent, recently retrieved price information.
            </p>

            {/* Prominent Search Form */}
            <div className="hero-search-wrapper" id="hero-search-form">
              <SearchBar
                initialQuery={query}
                initialPincode={pincode}
                onSearch={handleHeroSearch}
                loading={loading}
                variant="hero"
                buttonText="Compare Prices"
                inputId="hero-medicine-input"
              />

              <div className="hero-quick-suggestions">
                <span className="suggestions-label">Try searching:</span>
                <button
                  type="button"
                  className="suggestion-chip"
                  onClick={() => handleHeroSearch('Augmentin 625 Duo', '110001')}
                >
                  Augmentin 625 Duo
                </button>
                <button
                  type="button"
                  className="suggestion-chip"
                  onClick={() => handleHeroSearch('Dolo 650', '110001')}
                >
                  Dolo 650
                </button>
                <button
                  type="button"
                  className="suggestion-chip"
                  onClick={() => handleHeroSearch('Pan 40', '110001')}
                >
                  Pan 40
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Polished Product Preview Card */}
          <div className="hero-right-col">
            <div className="preview-card card">
              <div className="preview-card-header">
                <div className="preview-header-left">
                  <h3 className="preview-card-title">Price comparison</h3>
                  <span className="preview-card-tag">Illustrative example</span>
                </div>
                <div className="preview-card-icon">
                  <Sparkles size={18} className="text-teal" />
                </div>
              </div>

              {/* Benchmark Branded Medicine */}
              <div className="preview-benchmark-box">
                <div className="preview-brand-row">
                  <span className="preview-brand-title">ExampleBrand 500 mg tablets</span>
                  <span className="preview-brand-badge">Reference Brand</span>
                </div>
                <div className="preview-price-row">
                  <span className="preview-price-label">Reference price:</span>
                  <span className="preview-price-val">₹120 per pack</span>
                </div>
              </div>

              {/* Equivalent Listing */}
              <div className="preview-equivalent-box">
                <div className="preview-equiv-top">
                  <div className="equiv-name-wrap">
                    <span className="equiv-name">Example Generic A</span>
                    <span className="equiv-source">Available at Example Pharmacy</span>
                  </div>
                  <span className="equiv-match-pill">Identical Active Salt</span>
                </div>

                <div className="preview-equiv-metrics">
                  <div className="metric-col">
                    <span className="metric-muted">Pack price</span>
                    <span className="metric-strong">₹72</span>
                  </div>
                  <div className="metric-col">
                    <span className="metric-muted">Price per unit</span>
                    <span className="metric-strong text-teal">₹7.20 / tablet</span>
                  </div>
                </div>

                <div className="preview-savings-strip">
                  <TrendingDown size={14} className="text-success" aria-hidden="true" />
                  <span>
                    Potential savings: <strong>₹48 per pack</strong>, assuming comparable quantities
                  </span>
                </div>
              </div>

              <div className="preview-card-footer">
                <Info size={13} className="footer-info-icon" aria-hidden="true" />
                <span>These are fictional examples, not real pharmacy listings. Not live prices.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: TRUST STRIP */}
      <section className="trust-strip-section" aria-label="Core Capabilities">
        <div className="container">
          <div className="trust-strip-grid">
            <FeatureCard
              icon={Scale}
              title="Compare cost per unit"
              description="Eliminate package size confusion. Standardized unit pricing across tablets, capsules, and liquids reveals genuine value."
            />
            <FeatureCard
              icon={Building2}
              title="Pharmacy price discovery"
              description="Aggregates pricing across licensed Indian retail and online pharmacies including Tata 1mg, Apollo Pharmacy, and PharmEasy."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Transparent comparisons"
              description="Clinical salt equivalence verification with data timestamps and clear match confidence indicators on every listing."
            />
          </div>
        </div>
      </section>

      {/* SECTION C: HOW IT WORKS PREVIEW */}
      <section className="how-it-works-preview-section">
        <div className="container">
          <div className="section-header-centered">
            <span className="eyebrow">SIMPLE 3-STEP PROCESS</span>
            <h2 className="section-title">How Dawa Dost Works</h2>
            <p className="section-subtitle">
              We empower consumers to make informed choices with transparent medicine data.
            </p>
          </div>

          <div className="steps-preview-grid">
            <div className="step-preview-card card">
              <div className="step-counter">1</div>
              <div className="step-icon-wrap">
                <Search size={22} className="text-teal" />
              </div>
              <h3 className="step-card-title">Search your medicine</h3>
              <p className="step-card-desc">
                Enter any prescribed branded medicine name and 6-digit delivery pincode into the search form.
              </p>
            </div>

            <div className="step-preview-card card">
              <div className="step-counter">2</div>
              <div className="step-icon-wrap">
                <Layers size={22} className="text-teal" />
              </div>
              <h3 className="step-card-title">Compare equivalent listings</h3>
              <p className="step-card-desc">
                Our engine matches products with the identical active chemical salt, strength, and dosage form.
              </p>
            </div>

            <div className="step-preview-card card">
              <div className="step-counter">3</div>
              <div className="step-icon-wrap">
                <TrendingDown size={22} className="text-teal" />
              </div>
              <h3 className="step-card-title">Understand potential savings</h3>
              <p className="step-card-desc">
                Review unit prices, pharmacy stock status, and savings before confirming with your doctor or pharmacist.
              </p>
            </div>
          </div>

          <div className="section-center-action">
            <Link to="/how-it-works" className="btn btn-teal-light">
              <span>Read Full Step-by-Step Guide</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION D: WHY PRICE PER UNIT MATTERS */}
      <section className="price-unit-section">
        <div className="container">
          <div className="section-header-centered">
            <span className="eyebrow">PRICING CLARITY</span>
            <h2 className="section-title">Why Price Per Unit Matters</h2>
            <p className="section-subtitle">
              Pack prices alone can be misleading when strip sizes differ between brands.
            </p>
          </div>

          <PriceExampleCard />
        </div>
      </section>

      {/* SECTION E: SAFETY AND TRANSPARENCY */}
      <section className="safety-section-block">
        <div className="container">
          <div className="safety-card-container card">
            <div className="safety-header">
              <div className="safety-icon-bubble">
                <HeartPulse size={24} className="text-warning" />
              </div>
              <div>
                <h3 className="safety-block-title">Safety, Governance & Medical Boundaries</h3>
                <p className="safety-block-subtitle">Our commitment to patient safety and clinical integrity</p>
              </div>
            </div>

            <div className="safety-body-text">
              <p>
                <strong>Dawa Dost is strictly a price comparison tool, NOT an online pharmacy.</strong> We do not stock,
                sell, dispense, or ship medications. We never recommend switching your prescription without professional
                supervision.
              </p>
              <p>
                Pharmaceutical prices, availability, and packaging frequently fluctuate. Always verify the active chemical
                salt, dosage strength, release profile, and manufacturer with your licensed doctor or pharmacist before
                considering any generic alternative.
              </p>
            </div>

            <SafetyBanner variant="amber" />
          </div>
        </div>
      </section>

      {/* SECTION F: FINAL CTA */}
      <section className="final-cta-section">
        <div className="container">
          <div className="final-cta-card card">
            <div className="cta-content">
              <h2 className="cta-title">Ready to compare medicine prices?</h2>
              <p className="cta-subtitle">
                Enter your prescribed medicine name and see equivalent listings across pharmacies in seconds.
              </p>
            </div>
            <div className="cta-button-wrap">
              <button
                type="button"
                onClick={handleScrollToSearch}
                className="btn btn-primary btn-lg"
              >
                <span>Compare Prices</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
