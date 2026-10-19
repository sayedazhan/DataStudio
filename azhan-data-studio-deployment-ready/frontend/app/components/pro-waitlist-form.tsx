"use client";

import { useState, type FormEvent } from "react";

function encodeForm(form: HTMLFormElement) {
  const data = new FormData(form);
  const body = new URLSearchParams();
  data.forEach((value, key) => body.append(key, String(value)));
  return body.toString();
}

export default function ProWaitlistForm() {
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
      window.location.assign("/thanks/pro-waitlist");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form name="pro-waitlist" onSubmit={handleSubmit} className="marketingWaitlistForm">
      <input type="hidden" name="form-name" value="pro-waitlist" />
      <p className="marketingBotField" aria-hidden="true"><label>Leave this field empty <input name="bot-field" /></label></p>
      <div className="marketingFormGrid">
        <label>
          <span>Name</span>
          <input name="name" type="text" autoComplete="name" required placeholder="Your name" />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
        </label>
        <label>
          <span>Company <em>optional</em></span>
          <input name="company" type="text" autoComplete="organization" placeholder="Company name" />
        </label>
        <label>
          <span>What interests you most?</span>
          <select name="interest" defaultValue="saved-analyses">
            <option value="saved-analyses">Saved analyses & history</option>
            <option value="premium-reports">Premium reports</option>
            <option value="automation">Excel / workflow automation</option>
            <option value="ai-intelligence">AI-powered intelligence</option>
            <option value="higher-limits">Higher usage limits</option>
            <option value="business">Business / team use</option>
          </select>
        </label>
      </div>
      <label className="marketingConsentLine">
        <input type="checkbox" name="product-updates" value="yes" defaultChecked />
        <span>Keep me updated about Data Studio Pro and major product releases.</span>
      </label>
      <button className="marketingPrimaryButton" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Joining…" : "Join the Pro Waitlist →"}
      </button>
      {status === "error" && <small className="marketingFormNote">Something went wrong. Please try again.</small>}
      {status !== "error" && <small className="marketingFormNote">No account is created. Your details are used only to follow up about Data Studio and product updates.</small>}
    </form>
  );
}
