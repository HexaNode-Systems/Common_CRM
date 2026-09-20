import { Helmet } from "react-helmet-async";
import Navbar from "../components/landing/Navbar.jsx";
import Hero from "../components/landing/Hero.jsx";
import TrustBar from "../components/landing/TrustBar.jsx";
import Problem from "../components/landing/Problem.jsx";
import CoreFeatures from "../components/landing/CoreFeatures.jsx";
import ProductShowcase from "../components/landing/ProductShowcase.jsx";
import HowItWorks from "../components/landing/HowItWorks.jsx";
import Industries from "../components/landing/Industries.jsx";
import Analytics from "../components/landing/Analytics.jsx";
import Integrations from "../components/landing/Integrations.jsx";
import Security from "../components/landing/Security.jsx";
import Pricing from "../components/landing/Pricing.jsx";
import Testimonials from "../components/landing/Testimonials.jsx";
import FAQ from "../components/landing/FAQ.jsx";
import FinalCTA from "../components/landing/FinalCTA.jsx";
import Footer from "../components/landing/Footer.jsx";
import ScrollToHash from "../components/ScrollToHash.jsx";
import StickyContactButtons from "../components/landing/StickyContactButtons.jsx";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-theme overflow-x-clip">
      <Helmet>
        <title>Appnix CRM Pro | WhatsApp CRM Software for Sales Teams</title>
        <meta
          name="description"
          content="Appnix CRM Pro is a WhatsApp CRM software for managing leads, chats, pipelines, projects and teams from one workspace."
        />
        <meta
          name="keywords"
          content="CRM software, lead management CRM, WhatsApp CRM, sales pipeline tool, team capacity CRM, CRM for real estate, CRM for agencies"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.appnix.info/" />
      </Helmet>

      {/* Handles smooth-scrolling to a section when the URL has a #hash */}
      <ScrollToHash />

      <Navbar />
      <Hero />
      <TrustBar />
      <Problem />

      {/* Each target section is wrapped in a div with a matching id.
          scroll-mt-20 keeps the section from hiding under the sticky navbar. */}
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
      <StickyContactButtons />
    </div>
  );
}
