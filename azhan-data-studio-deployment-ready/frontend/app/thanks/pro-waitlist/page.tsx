import type { Metadata } from "next";
import MarketingShell from "../../components/marketing-shell";

export const metadata: Metadata = {
  title: "Pro Waitlist | Azhan Data Studio",
  robots: { index: false, follow: false },
};

export default function ProWaitlistThanks(){
  return <MarketingShell>
    <section className="marketingPageHero centered marketingThanksPage">
      <span className="marketingEyebrow">DATA STUDIO PRO</span>
      <h1>You’re on the early-interest list.</h1>
      <p>Thanks for registering your interest. This helps shape which Pro capabilities are prioritised first.</p>
      <div className="marketingHeroActions"><a className="marketingPrimaryButton" href="/studio">Continue to Data Studio →</a><a className="marketingSecondaryButton" href="/pricing">Back to Pricing</a></div>
    </section>
  </MarketingShell>;
}
