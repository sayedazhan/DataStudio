export function StudioProductVisual(){
  return <div className="studioProductVisual" aria-label="Azhan Data Studio analytics workspace preview">
    <div className="studioProductGlow studioProductGlowOne"/><div className="studioProductGlow studioProductGlowTwo"/>
    <div className="studioLaptop">
      <div className="studioLaptopScreen">
        <div className="studioMiniSidebar"><div className="studioMiniBrand">A</div><span className="active">▤ Overview</span><span>◇ Data Quality</span><span>▥ Dashboard</span><span>↔ Compare</span><span>⌁ Forecast</span><span>Σ Statistics</span><span>▣ Reports</span></div>
        <div className="studioMiniCanvas">
          <div className="studioMiniTop"><div><strong>sales_data.xlsx</strong><small>Analysis complete</small></div><span>96% Quality</span></div>
          <div className="studioMiniKpis"><div><small>Total Revenue</small><b>$128K</b><em>↑ 18.4%</em></div><div><small>Total Records</small><b>1,024</b><em>Analysed</em></div><div><small>Data Quality</small><b>96%</b><em>Strong</em></div><div><small>Top Category</small><b>Products</b><em>41.3%</em></div></div>
          <div className="studioMiniCharts"><div className="studioMiniLine"><strong>Revenue Trend</strong><div className="miniLineGrid"><svg viewBox="0 0 420 120" preserveAspectRatio="none"><polyline points="0,98 45,87 82,76 122,63 162,66 202,48 244,57 286,42 324,23 363,38 420,16" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg></div></div><div className="studioMiniDonut"><strong>Category Share</strong><div><span>$128K</span></div></div></div>
          <div className="studioMiniBottom"><div><strong>Revenue by Region</strong><i style={{width:"92%"}}/><i style={{width:"74%"}}/><i style={{width:"58%"}}/><i style={{width:"41%"}}/></div><div><strong>Top Products</strong><i style={{width:"88%"}}/><i style={{width:"69%"}}/><i style={{width:"52%"}}/><i style={{width:"36%"}}/></div></div>
        </div>
      </div>
      <div className="studioLaptopBase"/>
    </div>
    <div className="studioFloatingCard studioFloatingOne"><span>▥</span><b>Dashboard</b><small>Auto-generated</small></div>
    <div className="studioFloatingCard studioFloatingTwo"><span>↗</span><b>Forecast</b><small>Future trends</small></div>
    <div className="studioFloatingCard studioFloatingThree"><span>▣</span><b>Report</b><small>Ready to share</small></div>
  </div>;
}

export function MiniReportStack(){
  return <div className="miniReportStack" aria-label="Professional report preview">
    <article><span>AZHAN DATA STUDIO</span><strong>Data Analysis<br/>Report</strong><small>From data to insights.<br/>Automatically.</small><div className="miniReportBars"><i/><i/><i/><i/></div></article>
    <article><span>EXECUTIVE SUMMARY</span><strong>Key Insights at a Glance</strong><div className="miniReportKpis"><b>$128K</b><b>107</b><b>96%</b><b>39</b></div><div className="miniReportList"><i/><i/><i/></div></article>
    <article><span>PERFORMANCE OVERVIEW</span><strong>Revenue & Units Performance</strong><div className="miniReportChart"><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="miniReportSmallBars"><i/><i/><i/><i/></div></article>
    <article><span>PRODUCT ANALYSIS</span><strong>Product Performance</strong><div className="miniReportBars"><i/><i/><i/><i/></div><div className="miniReportTable"><i/><i/><i/><i/></div></article>
  </div>;
}


export type MarketingIconName = "analyse" | "clean" | "compare" | "monthly" | "forecast" | "scenario" | "statistics" | "report" | "upload" | "explore" | "sales" | "operations" | "inventory" | "finance" | "customer" | "business";

export function MarketingIcon({ name, size = 22 }: { name: MarketingIconName; size?: number }){
  const common = { width:size, height:size, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:1.9, strokeLinecap:"round" as const, strokeLinejoin:"round" as const, "aria-hidden":true };
  if(name === "analyse" || name === "business") return <svg {...common}><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19V3"/><path d="M3 19h20"/></svg>;
  if(name === "clean") return <svg {...common}><path d="M12 3l1.4 4.2L17.5 9l-4.1 1.8L12 15l-1.4-4.2L6.5 9l4.1-1.8L12 3Z"/><path d="M5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z"/></svg>;
  if(name === "compare") return <svg {...common}><path d="M7 7h12"/><path d="m16 4 3 3-3 3"/><path d="M17 17H5"/><path d="m8 14-3 3 3 3"/></svg>;
  if(name === "monthly") return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2"/></svg>;
  if(name === "forecast") return <svg {...common}><path d="M4 18 10 12l4 3 6-9"/><path d="M15 6h5v5"/></svg>;
  if(name === "scenario") return <svg {...common}><path d="M4 18c3-6 6-8 9-6s4 5 7 1"/><path d="M4 12c4-2 7-2 10 1s4 3 6 2"/><path d="M4 7c3 0 6 1 8 3"/></svg>;
  if(name === "statistics") return <svg {...common}><path d="M18 4H7l6 8-6 8h11"/></svg>;
  if(name === "report") return <svg {...common}><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 12h6M9 16h6M9 8h2"/></svg>;
  if(name === "upload") return <svg {...common}><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/><path d="M5 14v5h14v-5"/></svg>;
  if(name === "explore") return <svg {...common}><circle cx="11" cy="11" r="6"/><path d="m16 16 5 5"/><path d="m9 13 4-4"/></svg>;
  if(name === "sales") return <svg {...common}><path d="M4 19V9M10 19v-5M16 19V6M22 19V3"/><path d="m4 8 5-3 5 2 7-4"/></svg>;
  if(name === "operations") return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7-.6-1.5.9-1.9-2.1-2.1-1.9.9-1.5-.6L11.5 3h-3l-.7 2-1.5.6-1.9-.9-2.1 2.1.9 1.9-.6 1.5-2 .7v3l2 .7.6 1.5-.9 1.9 2.1 2.1 1.9-.9 1.5.6.7 2h3l.7-2 1.5-.6 1.9.9 2.1-2.1-.9-1.9.6-1.5 2-.7Z"/></svg>;
  if(name === "inventory") return <svg {...common}><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="m4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>;
  if(name === "finance") return <svg {...common}><ellipse cx="8" cy="6" rx="4" ry="2"/><path d="M4 6v8c0 1 2 2 4 2s4-1 4-2V6"/><ellipse cx="16" cy="10" rx="4" ry="2"/><path d="M12 10v8c0 1 2 2 4 2s4-1 4-2v-8"/></svg>;
  if(name === "customer") return <svg {...common}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.5-4 3-6 6-6s5.5 2 6 6"/><path d="M14 14c3 0 5 2 5.5 5"/></svg>;
  return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 16V9M12 16v-4M16 16V7"/></svg>;
}

export function PremiumHeroVisual(){
  return <div className="premiumHeroVisual" aria-label="Azhan Data Studio dashboard shown on a laptop">
    <div className="premiumHeroHalo premiumHeroHaloA"/><div className="premiumHeroHalo premiumHeroHaloB"/>
    <img src="/hero-product.png" alt="Azhan Data Studio analytics workspace on a laptop"/>
    <div className="premiumFloat premiumFloatChart"><MarketingIcon name="analyse" size={24}/></div>
    <div className="premiumFloat premiumFloatDonut"><span className="premiumMiniDonut"/></div>
    <div className="premiumFloat premiumFloatTable"><span/><span/><span/></div>
  </div>;
}

export function PremiumReportVisual(){
  return <div className="premiumReportVisual" aria-label="Azhan Data Studio professional report preview">
    <div className="premiumReportGlow"/>
    <img src="/report-stack.png" alt="Azhan Data Studio professional data analysis report pages"/>
  </div>;
}
