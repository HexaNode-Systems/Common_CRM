import { Helmet } from "react-helmet-async";
import JsonLd from "../components/JsonLd.jsx";
import { homeSchemaGraph } from "../utils/seoSchemas.js";
import PublicLanding from "../components/landing/PublicLanding.jsx";
import ScrollToHash from "../components/ScrollToHash.jsx";

export default function LandingPage() {
  return (
    <div>
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
      <JsonLd schema={homeSchemaGraph} />

      {/* Handles smooth-scrolling to a section when the URL has a #hash */}
      <ScrollToHash />

      <PublicLanding />
    </div>
  );
}
