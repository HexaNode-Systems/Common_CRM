import Navbar from '../components/landing/Navbar.jsx';
import Hero from '../components/landing/Hero.jsx';
import TrustBar from '../components/landing/TrustBar.jsx';
import Problem from '../components/landing/Problem.jsx';
import CoreFeatures from '../components/landing/CoreFeatures.jsx';
import ProductShowcase from '../components/landing/ProductShowcase.jsx';
import HowItWorks from '../components/landing/HowItWorks.jsx';
import Industries from '../components/landing/Industries.jsx';
import Analytics from '../components/landing/Analytics.jsx';
import Integrations from '../components/landing/Integrations.jsx';
import Security from '../components/landing/Security.jsx';
import Pricing from '../components/landing/Pricing.jsx';
import Testimonials from '../components/landing/Testimonials.jsx';
import FAQ from '../components/landing/FAQ.jsx';
import FinalCTA from '../components/landing/FinalCTA.jsx';
import Footer from '../components/landing/Footer.jsx';
import ScrollToHash from '../components/ScrollToHash.jsx';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-theme">
      {/* Handles smooth-scrolling to a section when the URL has a #hash */}
      <ScrollToHash />

      <Navbar />
      <Hero />
      <TrustBar />
      <Problem />

      {/* Wrapping each target section in a div with a matching id.
          scroll-mt-20 keeps the section from hiding under a sticky navbar. */}
      <div id="features" className="scroll-mt-20">
        <CoreFeatures />
      </div>

      <ProductShowcase />
      <HowItWorks />

      <div id="industries" className="scroll-mt-20">
        <Industries />
      </div>

      <Analytics />
      <Integrations />

      <div id="security" className="scroll-mt-20">
        <Security />
      </div>

      <div id="pricing" className="scroll-mt-20">
        <Pricing />
      </div>

      <Testimonials />

      <div id="faq" className="scroll-mt-20">
        <FAQ />
      </div>

      <FinalCTA />
      <Footer />
    </div>
  );
}