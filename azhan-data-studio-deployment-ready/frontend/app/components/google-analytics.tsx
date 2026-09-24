"use client";

import Script from "next/script";
import { useEffect } from "react";
import { GA_MEASUREMENT_ID } from "../lib/config";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function sendEvent(name: string, parameters: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) return;
  window.gtag("event", name, parameters);
}

function safeText(element: Element | null) {
  return (element?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
}

export default function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const anchor = target.closest("a");
      const button = target.closest("button");

      if (anchor) {
        const href = anchor.getAttribute("href") ?? "";
        const text = safeText(anchor);

        if (href.includes("buy.stripe.com")) {
          sendEvent("support_click", { link_text: text || "Support", link_url: href });
          return;
        }

        if (anchor.classList.contains("seoPrimaryCta") || anchor.classList.contains("seoToolkitLink") || anchor.closest(".seoFeatureActions")) {
          sendEvent("feature_cta_click", { link_text: text || "Feature CTA", destination: href || "/" });
        }

        if (anchor.classList.contains("studioModeTab")) {
          sendEvent("tool_navigation", { tool: text || "Studio tool", destination: href || "/" });
        }
      }

      if (button) {
        const text = safeText(button);

        if (button.classList.contains("sampleDataButton")) {
          sendEvent("sample_data_click", { source: "analyse_home" });
          return;
        }

        if (window.location.pathname === "/" && /^(Analyse my data|Analyse .+|Analyse sheet|Re-analyse)/i.test(text)) {
          sendEvent("analysis_start", { action_label: text });
        }

        if (window.location.pathname === "/" && /Data Quality|Review data quality/i.test(text)) {
          sendEvent("data_quality_open", { source: "analyse_workspace", action_label: text });
        }

        if (window.location.pathname === "/" && button.closest(".workspaceNav") && /^Dashboard$/i.test(text)) {
          sendEvent("dashboard_open", { source: "analyse_workspace" });
        }

        if (/Customize Dashboard/i.test(text)) {
          sendEvent("dashboard_customize_open", { source: "dashboard" });
        }

        if (/Apply filters/i.test(text)) {
          sendEvent("dashboard_filter_apply", { source: "dashboard" });
        }

        if (/Export Dashboard/i.test(text)) {
          sendEvent("dashboard_export", { source: "dashboard", format: "branded_pdf" });
          return;
        }

        if (/Executive Summary PDF/i.test(text)) {
          sendEvent("report_export", { source: "reports", report_type: "executive_summary", format: "pdf" });
          return;
        }

        if (/Full Analysis PDF/i.test(text)) {
          sendEvent("report_export", { source: "reports", report_type: "full_analysis", format: "pdf" });
        }
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!GA_MEASUREMENT_ID) return null;

  const id = JSON.stringify(GA_MEASUREMENT_ID);
  const init = `
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
    window.gtag('js', new Date());
    window.gtag('config', ${id}, { anonymize_ip: true });
  `;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="azhan-data-studio-ga4" strategy="afterInteractive">{init}</Script>
    </>
  );
}
