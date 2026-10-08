"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { PORTFOLIO_URL, SUPPORT_URL } from "../lib/config";

export function MarketingMark(){
  return <span className="marketingMark" aria-hidden="true"><span>A</span><i/><i/><i/></span>;
}

export function MarketingHeader(){
  const [openMenu, setOpenMenu] = useState<"product" | "solutions" | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const closeMenu = () => setOpenMenu(null);

  return <header className="marketingHeader">
    <div className="marketingNavWrap">
      <a className="marketingBrand" href="/" onClick={closeMenu}><MarketingMark/><span><strong>Azhan Data Studio</strong><small>Automated Data Intelligence</small></span></a>
      <nav ref={navRef} className="marketingNav" aria-label="Primary navigation">
        <div className={`marketingNavMenu ${openMenu === "product" ? "isOpen" : ""}`}>
          <button type="button" className="marketingNavTrigger" aria-expanded={openMenu === "product"} onClick={() => setOpenMenu(openMenu === "product" ? null : "product")}>Product</button>
          {openMenu === "product" && <div className="marketingDropdown marketingProductDropdown">
            <a href="/product" onClick={closeMenu}><span>◫</span><div><strong>Platform overview</strong><small>See the complete Data Studio workflow</small></div></a>
            <a href="/features/csv-excel-analysis" onClick={closeMenu}><span>↗</span><div><strong>Excel & CSV Analysis</strong><small>Profile data and uncover insights</small></div></a>
            <a href="/features/data-quality-checker" onClick={closeMenu}><span>✓</span><div><strong>Data Quality</strong><small>Find missing values, duplicates and issues</small></div></a>
            <a href="/features/excel-dashboard-generator" onClick={closeMenu}><span>▥</span><div><strong>Dashboard Generator</strong><small>Create KPIs and visual dashboards</small></div></a>
            <a href="/features/compare-excel-files" onClick={closeMenu}><span>↔</span><div><strong>Compare Datasets</strong><small>Understand what changed</small></div></a>
            <a href="/features/data-forecasting" onClick={closeMenu}><span>⌁</span><div><strong>Forecast</strong><small>Project future performance</small></div></a>
            <a href="/statistics" onClick={closeMenu}><span>Σ</span><div><strong>Statistics</strong><small>Explore distributions and relationships</small></div></a>
            <a href="/reports" onClick={closeMenu}><span>▣</span><div><strong>Reporting Studio</strong><small>Generate professional reports</small></div></a>
          </div>}
        </div>
        <div className={`marketingNavMenu ${openMenu === "solutions" ? "isOpen" : ""}`}>
          <button type="button" className="marketingNavTrigger" aria-expanded={openMenu === "solutions"} onClick={() => setOpenMenu(openMenu === "solutions" ? null : "solutions")}>Solutions</button>
          {openMenu === "solutions" && <div className="marketingDropdown">
            <a href="/solutions" onClick={closeMenu}><span>◆</span><div><strong>Solutions overview</strong><small>Common ways businesses use Data Studio</small></div></a>
            <a href="/solutions/sales-analysis" onClick={closeMenu}><span>↗</span><div><strong>Sales & Revenue</strong><small>Track performance and growth</small></div></a>
            <a href="/solutions/operations-analysis" onClick={closeMenu}><span>⚙</span><div><strong>Operations</strong><small>Find bottlenecks and process signals</small></div></a>
            <a href="/solutions/inventory-analysis" onClick={closeMenu}><span>◇</span><div><strong>Inventory</strong><small>Monitor stock and movement</small></div></a>
            <a href="/solutions/financial-analysis" onClick={closeMenu}><span>$</span><div><strong>Finance</strong><small>Analyse financial datasets</small></div></a>
          </div>}
        </div>
        <a href="/reports" onClick={closeMenu}>Reports</a>
        <a href="/guides" onClick={closeMenu}>Guides</a>
        <a href="/pricing" onClick={closeMenu}>Pricing</a>
        <a href="/contact" onClick={closeMenu}>Contact</a>
      </nav>
      <div className="marketingNavActions"><a className="marketingSearchButton" href="/features" aria-label="Explore features">⌕</a><a className="marketingSecondaryButton" href="/reports#sample-report">View Sample Report</a><a className="marketingPrimaryButton" href="/studio">Launch Studio <span>→</span></a></div>
    </div>
  </header>;
}

export function MarketingFooter(){
  return <footer className="marketingFooter">
    <div className="marketingFooterTop">
      <div className="marketingFooterBrand"><a className="marketingBrand" href="/"><MarketingMark/><span><strong>Azhan Data Studio</strong><small>Automated Data Intelligence</small></span></a><p>Turn Excel and CSV data into dashboards, insights and professional reports — without building everything manually.</p><div className="marketingFooterCtas"><a href="/studio">Launch Studio →</a><a href={SUPPORT_URL} target="_blank" rel="noreferrer">Support Data Studio ↗</a></div></div>
      <div><strong>Product</strong><a href="/product">Platform</a><a href="/features">Features</a><a href="/reports">Reports</a><a href="/white-label-reports">White-label reports</a><a href="/pricing">Pricing / Pro</a></div>
      <div><strong>Solutions</strong><a href="/solutions/sales-analysis">Sales & Revenue</a><a href="/solutions/operations-analysis">Operations</a><a href="/solutions/inventory-analysis">Inventory</a><a href="/solutions/financial-analysis">Finance</a><a href="/solutions#business-performance">Business Performance</a></div>
      <div><strong>Resources</strong><a href="/guides">Guides</a><a href="/support">Support</a><a href="/reports#sample-report">Sample report</a><a href="/about">About</a><a href="/contact">Contact Azhan</a></div>
      <div><strong>Legal</strong><a href="/privacy">Privacy</a><a href="/terms">Terms & Disclaimer</a><a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">Built by Azhan Hassan ↗</a></div>
    </div>
    <div className="marketingFooterBottom"><span>© 2026 Azhan Data Studio · Automated Data Intelligence</span><span>Built by Azhan Hassan</span><a href="/support">Support the project</a></div>
  </footer>;
}

export default function MarketingShell({ children }: { children: ReactNode }){
  return <div className="marketingSite"><MarketingHeader/><main>{children}</main><MarketingFooter/></div>;
}
