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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-theme">
      <Navbar />
      <Hero />
      <TrustBar />
      <Problem />
      <CoreFeatures />
      <ProductShowcase />
      <HowItWorks />
      <Industries />
      <Analytics />
      <Integrations />
      <Security />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}