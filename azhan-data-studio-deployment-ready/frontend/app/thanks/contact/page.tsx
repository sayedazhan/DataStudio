import type { Metadata } from "next";
import MarketingShell from "../../components/marketing-shell";

export const metadata: Metadata = {
  title: "Enquiry Received | Azhan Data Studio",
  robots: { index: false, follow: false },
};

export default function ContactThanks(){
  return <MarketingShell>
    <section className="marketingPageHero centered marketingThanksPage">
      <span className="marketingEyebrow">CONTACT</span>
      <h1>Your enquiry has been received.</h1>
      <p>Thanks for getting in touch. Your message includes the details needed to understand the request and follow up appropriately.</p>
      <div className="marketingHeroActions"><a className="marketingPrimaryButton" href="/">Back to Data Studio →</a><a className="marketingSecondaryButton" href="/studio">Launch Studio</a></div>
    </section>
  </MarketingShell>;
}
