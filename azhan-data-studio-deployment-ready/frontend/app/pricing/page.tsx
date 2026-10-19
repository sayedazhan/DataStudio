import type { Metadata } from "next";
import MarketingShell from "../components/marketing-shell";
import ProWaitlistForm from "../components/pro-waitlist-form";
import { SUPPORT_URL } from "../lib/config";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Data Studio Pricing | Free, Pro & Business",
  description: "Start Azhan Data Studio free for Excel and CSV analysis. Join the Data Studio Pro waitlist or contact Azhan for custom dashboards, white-label reports and workflow automation.",
  path: "/pricing",
  keywords: ["Excel data analysis pricing", "data analysis software pricing", "Data Studio Pro", "custom dashboard pricing", "white label reporting"],
});

export default function PricingPage(){
  return <MarketingShell>
    <section className="marketingPageHero centered"><span className="marketingEyebrow">PRICING</span><h1>Start free. Upgrade when Data Studio becomes part of your workflow.</h1><p>The core analysis experience stays easy to try. Pro is being shaped for repeat users, while Business / Custom is available for organisations that need branded reporting, tailored dashboards or automation.</p></section>

    <section className="marketingSection"><div className="marketingPricingGrid marketingPricingGridV53">
      <article className="featured"><span>AVAILABLE NOW</span><h2>Free</h2><strong>$0</strong><small>No account required</small><ul><li>✓ Excel & CSV analysis</li><li>✓ Data quality checks</li><li>✓ Automatic dashboards</li><li>✓ Compare, forecast & statistics</li><li>✓ Standard reporting workflow</li></ul><a className="marketingPrimaryButton" href="/studio">Analyse My Data Free →</a></article>
      <article><span>COMING SOON</span><h2>Data Studio Pro</h2><strong>Pricing TBC</strong><small>For repeat users</small><ul><li>✓ Saved analyses and history</li><li>✓ Premium report options</li><li>✓ Higher usage limits</li><li>✓ Advanced exports</li><li>✓ Future AI & automation features</li></ul><a className="marketingSecondaryButton" href="#pro-waitlist">Join the Waitlist</a></article>
      <article><span>FOR ORGANISATIONS</span><h2>Business / Custom</h2><strong>Contact Azhan</strong><small>Custom scope</small><ul><li>✓ Custom dashboards</li><li>✓ White-label company reports</li><li>✓ Tailored analysis workflows</li><li>✓ Excel / reporting automation</li><li>✓ Business use-case support</li></ul><a className="marketingSecondaryButton" href="/contact#business-enquiry">Discuss Your Requirement →</a></article>
    </div></section>

    <section className="marketingWaitlistSection" id="pro-waitlist">
      <div className="marketingWaitlistIntro"><span>DATA STUDIO PRO</span><h2>Help shape what Pro becomes.</h2><p>Join the early-interest list. No login or subscription is created today — this simply lets Azhan understand which capabilities users actually want before building accounts and billing.</p><div className="marketingWaitlistPoints"><span>✓ Saved analysis history</span><span>✓ Premium reports</span><span>✓ Higher limits</span><span>✓ Future AI & automation</span></div></div>
      <ProWaitlistForm />
    </section>

    <section className="marketingSupportBand"><div><span>SUPPORT THE PROJECT</span><h2>Using Data Studio and want to support development?</h2><p>A one-time contribution helps support hosting, continued development and future product improvements.</p></div><a className="marketingPrimaryButton" href={SUPPORT_URL} target="_blank" rel="noreferrer">Support Data Studio ↗</a></section>
  </MarketingShell>;
}
