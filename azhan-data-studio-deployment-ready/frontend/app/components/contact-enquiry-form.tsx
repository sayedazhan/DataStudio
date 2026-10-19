"use client";

import { useState, type FormEvent } from "react";

function encodeForm(form: HTMLFormElement) {
  const data = new FormData(form);
  const body = new URLSearchParams();
  data.forEach((value, key) => body.append(key, String(value)));
  return body.toString();
}

export default function ContactEnquiryForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    try {
      const response = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encodeForm(event.currentTarget),
      });

      if (!response.ok) throw new Error(`Form submission failed: ${response.status}`);
      window.location.assign("/thanks/contact");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form name="data-studio-contact" onSubmit={handleSubmit} className="marketingContactForm">
      <input type="hidden" name="form-name" value="data-studio-contact" />
      <p className="marketingBotField" aria-hidden="true"><label>Leave this field empty <input name="bot-field" /></label></p>
      <label><span>Name</span><input name="name" type="text" autoComplete="name" required placeholder="Your name" /></label>
      <label><span>Email</span><input name="email" type="email" autoComplete="email" required placeholder="you@company.com" /></label>
      <label><span>Company <em>optional</em></span><input name="company" type="text" autoComplete="organization" placeholder="Company name" /></label>
      <label><span>Enquiry type</span><select name="enquiry-type" defaultValue="custom-dashboard"><option value="custom-dashboard">Custom dashboard</option><option value="white-label">White-label reporting</option><option value="automation">Workflow automation</option><option value="data-analysis">Custom data analysis</option><option value="business-use">Business / team use</option><option value="product-feedback">Product feedback</option><option value="technical-support">Technical support</option><option value="other">Other</option></select></label>
      <label className="full"><span>What are you trying to achieve?</span><textarea name="message" rows={5} required placeholder="Describe the current process, the data you work with and the outcome you need." /></label>
      <button className="marketingPrimaryButton" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send Enquiry →"}
      </button>
      {status === "error" && <small className="marketingFormNote">Something went wrong. Please try again.</small>}
    </form>
  );
}
