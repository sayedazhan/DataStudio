"use client";

import { ReactNode, useState } from "react";

type ToolKey = "analysis" | "clean" | "monthly" | "compare" | "forecast" | "scenario" | "statistics" | "report";

type Props = {
  active: ToolKey;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

type NavItem = {
  key: ToolKey;
  href: string;
  icon: string;
  label: string;
  description: string;
  badge?: string;
  children?: Array<{ label: string; href: string }>;
};

function Mark(){
  return <span className="dataStudioMark" aria-hidden="true"><span className="dataStudioA">A</span><span className="dataStudioBars"><i/><i/><i/></span></span>;
}

const navItems: NavItem[] = [
  {
    key: "analysis", href: "/studio", icon: "▤", label: "Analyse Single File", description: "Insights, quality and visuals",
    children: [
      { label: "Overview", href: "/studio" },
      { label: "Columns", href: "/studio" },
      { label: "Data Quality", href: "/studio" },
      { label: "Dashboard", href: "/studio" },
      { label: "Insights", href: "/studio" },
      { label: "Export & Report", href: "/studio" },
    ],
  },
  {
    key: "clean", href: "/clean", icon: "✦", label: "Clean My Data", description: "Fix common data-quality issues", badge: "NEW",
    children: [
      { label: "Workspace", href: "/clean" },
      { label: "Quality Scan", href: "/clean#clean-quality" },
      { label: "Cleaning Options", href: "/clean#clean-options" },
      { label: "Preview & Download", href: "/clean#clean-download" },
    ],
  },
  {
    key: "monthly", href: "/monthly", icon: "▦", label: "Monthly Intelligence", description: "Append files and track movement", badge: "NEW",
    children: [
      { label: "File Library", href: "/monthly" },
      { label: "Configure", href: "/monthly#monthly-config" },
      { label: "Intelligence", href: "/monthly#monthly-results" },
      { label: "Report", href: "/monthly#monthly-report" },
    ],
  },
  {
    key: "compare", href: "/compare", icon: "↔", label: "Compare Datasets", description: "Find and explain what changed",
    children: [
      { label: "Select Versions", href: "/compare" },
      { label: "Match Records", href: "/compare#compare-setup" },
      { label: "Comparison", href: "/compare#comparison-results" },
      { label: "Changed Records", href: "/compare#compare-records" },
    ],
  },
  {
    key: "forecast", href: "/forecast", icon: "↗", label: "Forecast", description: "Project a metric into future periods",
    children: [
      { label: "History", href: "/forecast" },
      { label: "Configure", href: "/forecast#forecast-setup" },
      { label: "Forecast", href: "/forecast#forecast-results" },
      { label: "Diagnostics", href: "/forecast#forecast-diagnostics" },
    ],
  },
  {
    key: "scenario", href: "/scenario", icon: "◇", label: "Scenario", description: "Test assumptions before you decide",
    children: [
      { label: "Dataset", href: "/scenario" },
      { label: "Model", href: "/scenario#scenario-model" },
      { label: "Assumptions", href: "/scenario#scenario-assumptions" },
      { label: "Dashboard", href: "/scenario#scenario-results" },
    ],
  },
  {
    key: "statistics", href: "/statistics", icon: "Σ", label: "Statistics", description: "Validate relationships and differences", badge: "NEW",
    children: [
      { label: "Dataset", href: "/statistics" },
      { label: "Question", href: "/statistics#statistics-question" },
      { label: "Results", href: "/statistics#statistics-results" },
    ],
  },
];

export default function StudioToolShell({ active, title, subtitle, children }: Props){
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className={`studioAppShell studioToolShell ${menuOpen ? "studioMenuOpen" : ""}`}>
    <aside className="studioSidebar" aria-label="Studio navigation">
      <a className="studioSidebarBrand" href="/studio" aria-label="Azhan Data Studio home"><Mark/><span><strong>Azhan Data Studio</strong><small>Studio Workspace</small></span></a>
      <a className="studioNewAnalysis" href="/studio"><span>＋</span> New Analysis</a>
      <div className="studioPrimaryNav" aria-label="Analytics workspace">
        <span className="studioPrimaryNavLabel">ANALYTICS WORKSPACE</span>
        {navItems.map((item) => {
          const expanded = item.key === active;
          return <div className={`studioPrimaryNavBlock ${expanded ? "expanded" : ""}`} key={item.key}>
            <a className={`studioPrimaryNavItem ${expanded ? "active" : ""}`} href={item.href} onClick={() => setMenuOpen(false)}>
              <span className="studioPrimaryNavIcon">{item.icon}</span>
              <span className="studioPrimaryNavCopy"><strong>{item.label}</strong><small>{item.description}</small></span>
              {item.badge && <em>{item.badge}</em>}
              {expanded && <span className="studioPrimaryNavChevron">⌄</span>}
            </a>
            {expanded && item.children && <div className="studioPrimarySubNav">
              {item.children.map((child, index) => <a href={child.href} onClick={() => setMenuOpen(false)} key={`${item.key}-${child.label}-${index}`}>{child.label}</a>)}
            </div>}
          </div>;
        })}
      </div>
      <div className="studioSidebarFoot"><a href="/features">Tools & Features</a><a href="/guides/check-excel-data-quality">Guides</a></div>
    </aside>
    {menuOpen && <button className="studioSidebarBackdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
    <section className="studioAppMain">
      <header className="studioCommandBar studioToolCommandBar">
        <div className="studioCommandLeft"><button className="studioMobileMenuButton" onClick={() => setMenuOpen(true)} aria-label="Open Studio menu">☰</button><div className="studioToolTitle"><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</div></div>
        <div className="studioToolCommandHint"><kbd>Studio</kbd><span>Focused workspace</span></div>
        <div className="studioCommandActions"><a className="studioToolbarButton" href="/studio">← <span>Overview</span></a><a className="studioReportButton" href="/studio">＋ <span>New Analysis</span></a></div>
      </header>
      <div className="studioToolCanvas">{children}</div>
      <aside className="studioWhiteLabelStrip" aria-label="White-label reporting">
        <span><strong>Need your own branding?</strong> Company-branded and white-label reports are available with your own name, logo and report identity.</span>
        <a href="/contact#white-label">Contact Azhan →</a>
      </aside>
      <div className="studioStatusBar studioToolStatus"><span className="studioStatusReady"><i/> Workspace ready</span><span>{title}</span><span className="studioStatusType">Azhan Data Studio v5.1.0</span></div>
      <nav className="studioMobileNav" aria-label="Mobile Studio navigation"><a href="/studio"><span>▤</span><small>Analyse</small></a><a className={active === "clean" ? "active" : ""} href="/clean"><span>✦</span><small>Clean</small></a><a className={active === "compare" ? "active" : ""} href="/compare"><span>↔</span><small>Compare</small></a><a className={active === "forecast" ? "active" : ""} href="/forecast"><span>↗</span><small>Forecast</small></a><button onClick={() => setMenuOpen(true)}><span>•••</span><small>More</small></button></nav>
    </section>
  </div>;
}
