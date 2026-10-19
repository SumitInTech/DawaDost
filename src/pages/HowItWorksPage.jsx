import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Building2,
  FileCheck2,
  Scale,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  AlertTriangle,
  Database,
  CheckCircle2
} from 'lucide-react';
import ProcessStep from '../components/ProcessStep.jsx';
import PriceExampleCard from '../components/PriceExampleCard.jsx';
import SafetyBanner from '../components/SafetyBanner.jsx';

export default function HowItWorksPage() {
  const navigate = useNavigate();

  const handleCompareClick = () => {
    navigate('/?focus=search');
  };

  return (
    <div className="how-it-works-page">
      {/* HERO SECTION */}
      <section className="hiw-hero-section">
        <div className="container">
          <div className="hiw-hero-content">
            <span className="eyebrow">HOW DAWA DOST WORKS</span>
            <h1 className="hiw-heading">
              From medicine search to clearer price comparisons.
            </h1>
            <p className="hiw-supporting-text">
              Dawa Dost combines pharmacy price information, medicine details, and unit-price calculations to help users
              understand differences between comparable listings.
            </p>

            {/* Simple Visual Flow */}
            <div className="hiw-visual-flow card" aria-label="Process overview flow">
              <div className="flow-step">
                <div className="flow-step-circle">1</div>
                <span className="flow-step-label">Search</span>
              </div>
              <div className="flow-arrow" aria-hidden="true">→</div>
              <div className="flow-step">
                <div className="flow-step-circle">2</div>
                <span className="flow-step-label">Find listings</span>
              </div>
              <div className="flow-arrow" aria-hidden="true">→</div>
              <div className="flow-step">
                <div className="flow-step-circle">3</div>
                <span className="flow-step-label">Check details</span>
              </div>
              <div className="flow-arrow" aria-hidden="true">→</div>
              <div className="flow-step">
                <div className="flow-step-circle flow-step-highlight">4</div>
                <span className="flow-step-label">Compare prices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION A: FOUR STEPS */}
      <section className="hiw-steps-section">
        <div className="container">
          <div className="section-header-centered">
            <span className="eyebrow">STEP-BY-STEP METHODOLOGY</span>
            <h2 className="section-title">The Four-Step Comparison Flow</h2>
            <p className="section-subtitle">
              How our system processes pharmaceutical catalog data into transparent unit-level comparisons.
            </p>
          </div>

          <div className="hiw-process-grid">
            <ProcessStep
              number="1"
              icon={Search}
              title="Search for a medicine"
              description="Enter your prescribed branded medicine name (such as Augmentin 625 Duo, Dolo 650, or Pan 40) and 6-digit delivery pincode."
            />
            <ProcessStep
              number="2"
              icon={Building2}
              title="Find pharmacy listings"
              description="Our system queries indexed retail and digital pharmacies including Tata 1mg, Apollo Pharmacy, PharmEasy, and Netmeds."
            />
            <ProcessStep
              number="3"
              icon={FileCheck2}
              title="Check active salt, strength & dosage form"
              description="We verify pharmaceutical bio-equivalence: identical active chemical molecule, identical strength, and matching dosage form."
            />
            <ProcessStep
              number="4"
              icon={Scale}
              title="Compare prices per unit"
              description="We normalize package variations into transparent cost per tablet, capsule, or ml, highlighting verified potential savings."
              isLast={true}
            />
          </div>
        </div>
      </section>

      {/* SECTION B: WHAT MAKES A LISTING COMPARABLE? */}
      <section className="hiw-comparable-section">
        <div className="container">
          <div className="comparable-card card">
            <div className="comparable-header">
              <span className="eyebrow">CLINICAL STANDARD</span>
              <h2 className="comparable-title">What Makes a Listing Comparable?</h2>
              <p className="comparable-desc">
                Medicine equivalence is strictly grounded in scientific and pharmacological parity. A generic or alternative
                brand is only comparable when it satisfies three mandatory criteria:
              </p>
            </div>

            <div className="criteria-grid">
              <div className="criterion-card">
                <div className="criterion-icon-bubble">
                  <CheckCircle2 size={22} className="text-teal" />
                </div>
                <h3 className="criterion-title">1. Same Active Salt</h3>
                <p className="criterion-text">
                  The active pharmaceutical ingredient (API) must be chemically identical. For example, Amoxicillin + Clavulanic Acid cannot be substituted for pure Amoxicillin.
                </p>
              </div>

              <div className="criterion-card">
                <div className="criterion-icon-bubble">
                  <CheckCircle2 size={22} className="text-teal" />
                </div>
                <h3 className="criterion-title">2. Same Strength</h3>
                <p className="criterion-text">
                  The quantitative dosage must match precisely (e.g. 625 mg vs 625 mg, 650 mg vs 650 mg). Splitting higher doses or taking multiple low doses without physician approval is unsafe.
                </p>
              </div>

              <div className="criterion-card">
                <div className="criterion-icon-bubble">
                  <CheckCircle2 size={22} className="text-teal" />
                </div>
                <h3 className="criterion-title">3. Same Dosage Form</h3>
                <p className="criterion-text">
                  The release mechanism and route must be equivalent (e.g., standard film-coated tablet vs dispersible tablet vs oral suspension).
                </p>
              </div>
            </div>

            <div className="comparable-caution-box">
              <AlertTriangle size={18} className="text-warning" aria-hidden="true" />
              <p>
                <strong>Incomplete Information Notice:</strong> If a pharmacy listing does not fully specify salt proportions,
                release characteristics (e.g., sustained release SR vs immediate release), or manufacturer certification, Dawa
                Dost flags the match as <em>"Review details"</em> or <em>"Low confidence"</em> and cautions the user.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C: WHY PRICE PER UNIT MATTERS */}
      <section className="hiw-unit-matters-section">
        <div className="container">
          <div className="section-header-centered">
            <span className="eyebrow">MATH BEHIND THE SAVINGS</span>
            <h2 className="section-title">Why Price Per Unit Matters</h2>
            <p className="section-subtitle">
              Comparing pack prices directly leads to false savings conclusions.
            </p>
          </div>

          <PriceExampleCard />
        </div>
      </section>

      {/* SECTION D: DATA TRANSPARENCY */}
      <section className="hiw-transparency-section">
        <div className="container">
          <div className="section-header-centered">
            <span className="eyebrow">DATA INTEGRITY & SOURCES</span>
            <h2 className="section-title">Transparent Pharmacy Data</h2>
            <p className="section-subtitle">
              We never fabricate prices or hide data freshness. Here is how our ingestion pipeline operates:
            </p>
          </div>

          <div className="transparency-grid">
            <div className="transparency-card card">
              <div className="transparency-icon">
                <Database size={20} className="text-teal" />
              </div>
              <h3 className="transparency-title">Supported Pharmacy Sources</h3>
              <p className="transparency-text">
                We monitor reputable Indian retail chains and authorized digital pharmacy networks. Listings link directly
                to the original pharmacy web source so you can verify details.
              </p>
            </div>

            <div className="transparency-card card">
              <div className="transparency-icon">
                <Clock size={20} className="text-teal" />
              </div>
              <h3 className="transparency-title">Data Freshness & Caching</h3>
              <p className="transparency-text">
                Every listing displays an exact retrieval timestamp (e.g., "Retrieved 3 minutes ago"). If cached data is
                served to ensure fast response times, it is explicitly labelled as <em>Cached result</em>.
              </p>
            </div>

            <div className="transparency-card card">
              <div className="transparency-icon">
                <AlertTriangle size={20} className="text-warning" />
              </div>
              <h3 className="transparency-title">Source Failures & Downtime</h3>
              <p className="transparency-text">
                If a third-party pharmacy source experiences downtime or rate limits, successful results from other
                pharmacies remain completely visible, with clear status indicators for the affected source.
              </p>
            </div>

            <div className="transparency-card card">
              <div className="transparency-icon">
                <Sparkles size={20} className="text-teal" />
              </div>
              <h3 className="transparency-title">Match Confidence Indicators</h3>
              <p className="transparency-text">
                Each listing receives an algorithmic confidence classification: High Confidence, Review Details, or Low
                Confidence, keeping you fully informed of any slight chemical or formulation variance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION E: SAFETY */}
      <section className="hiw-safety-section">
        <div className="container">
          <div className="hiw-safety-card card">
            <div className="safety-icon-header">
              <ShieldAlert size={28} className="text-warning" />
              <div>
                <h3 className="safety-heading">Medical Safety & Responsibility</h3>
                <p className="safety-sub">Always consult your doctor or registered pharmacist.</p>
              </div>
            </div>

            <div className="safety-details-content">
              <p>
                Dawa Dost is designed strictly for price discovery, educational transparency, and consumer empowerment. It is
                <strong> not an online pharmacy, medical diagnosis tool, or prescription service</strong>.
              </p>
              <p>
                Patients respond differently to excipients, binders, and delivery coatings even when active ingredients are
                identical. <strong>Never substitute or alter prescribed medications without consulting your treating doctor or pharmacist.</strong>
              </p>
            </div>

            <SafetyBanner variant="amber" />
          </div>
        </div>
      </section>

      {/* SECTION F: FINAL CTA */}
      <section className="hiw-cta-section">
        <div className="container">
          <div className="final-cta-card card">
            <div className="cta-content">
              <h2 className="cta-title">Start comparing medicine prices now</h2>
              <p className="cta-subtitle">
                Search your prescribed brand and uncover transparent unit pricing across top pharmacies.
              </p>
            </div>
            <div className="cta-button-wrap">
              <button
                type="button"
                onClick={handleCompareClick}
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
