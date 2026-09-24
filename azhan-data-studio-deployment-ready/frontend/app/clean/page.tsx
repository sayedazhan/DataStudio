"use client";

import { apiFetch } from "../lib/api";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { PORTFOLIO_URL, SUPPORT_URL } from "../lib/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const MAX_BYTES = 50 * 1024 * 1024;

type WorkbookSheet = { index:number; name:string; rows:number; columns:number; analysis_ready:boolean; classification:string; recommended:boolean };
type WorkbookInfo = { filename:string; file_size_bytes:number; sheet_count:number; recommended_sheet?:string|null; sheets:WorkbookSheet[] };
type CleanAnalysis = {
  rows:number; columns:number; duplicate_rows:number; blank_rows:number; missing_values:number; empty_string_cells:number; whitespace_cells:number;
  issue_count:number; completeness_percent:number; quality_score:number;
  header_changes:Array<{before:string;after:string}>;
  case_issue_columns:Array<{column:string;variant_groups:number;examples:string[][]}>;
  date_issue_columns:Array<{column:string;parseable_percent:number;target_format:string}>;
  recommended_actions:Record<string, boolean>;
};
type Preparation = { filename:string; file_type:string; sheet_name?:string|null; analysis:CleanAnalysis; preview:Record<string,unknown>[] };

type Options = { remove_duplicates:boolean; remove_blank_rows:boolean; trim_whitespace:boolean; clean_headers:boolean; standardise_dates:boolean; standardise_text_case:boolean };

function formatNumber(value:number){return new Intl.NumberFormat("en-AU").format(value)}
function formatBytes(bytes:number){if(bytes<1024)return `${bytes} B`; if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`; return `${(bytes/1024/1024).toFixed(1)} MB`}
function DataStudioMark(){return <span className="dataStudioMark" aria-hidden="true"><span className="dataStudioA">A</span><span className="dataStudioBars"><i/><i/><i/></span></span>}

export default function CleanMyDataPage(){
  const inputRef = useRef<HTMLInputElement>(null);
  const [file,setFile]=useState<File|null>(null);
  const [workbook,setWorkbook]=useState<WorkbookInfo|null>(null);
  const [sheet,setSheet]=useState("");
  const [prep,setPrep]=useState<Preparation|null>(null);
  const [drag,setDrag]=useState(false);
  const [loading,setLoading]=useState(false);
  const [cleaning,setCleaning]=useState(false);
  const [error,setError]=useState("");
  const [outputFormat,setOutputFormat]=useState<"xlsx"|"csv">("xlsx");
  const [options,setOptions]=useState<Options>({remove_duplicates:true,remove_blank_rows:true,trim_whitespace:true,clean_headers:true,standardise_dates:true,standardise_text_case:false});

  async function pickFile(next:File|null){
    setError(""); setPrep(null); setWorkbook(null); setSheet("");
    if(!next){setFile(null);return}
    const ext = next.name.toLowerCase().split(".").pop();
    if(!["csv","xlsx"].includes(ext||"")){setError("Please upload a CSV or XLSX file.");return}
    if(next.size>MAX_BYTES){setError("File exceeds the current 50 MB limit.");return}
    setFile(next);
    if(ext==="xlsx"){
      setLoading(true);
      try{
        const fd=new FormData(); fd.append("file",next);
        const r=await apiFetch(`${API_URL}/api/datasets/workbook`,{method:"POST",body:fd});
        if(!r.ok) throw new Error((await r.json()).detail||"Unable to inspect workbook.");
        const body=await r.json() as { workbook?: WorkbookInfo } | WorkbookInfo;
        const data=("workbook" in body && body.workbook ? body.workbook : body) as WorkbookInfo;
        if(!data || !Array.isArray(data.sheets)) throw new Error("Workbook metadata was returned in an unexpected format.");
        setWorkbook(data);
        setSheet(data.recommended_sheet||data.sheets.find(s=>s.analysis_ready)?.name||"");
      }catch(e){setError(e instanceof Error?e.message:"Unable to inspect workbook.")}
      finally{setLoading(false)}
    }
  }

  async function analyse(){
    if(!file)return; setLoading(true); setError(""); setPrep(null);
    try{
      const fd=new FormData(); fd.append("file",file); if(sheet)fd.append("sheet_name",sheet);
      const r=await apiFetch(`${API_URL}/api/datasets/clean/prepare`,{method:"POST",body:fd});
      if(!r.ok) throw new Error((await r.json()).detail||"Unable to scan dataset.");
      setPrep(await r.json());
    }catch(e){setError(e instanceof Error?e.message:"Unable to scan dataset.")}
    finally{setLoading(false)}
  }

  async function cleanAndDownload(){
    if(!file)return; setCleaning(true); setError("");
    try{
      const fd=new FormData(); fd.append("file",file); if(sheet)fd.append("sheet_name",sheet);
      Object.entries(options).forEach(([k,v])=>fd.append(k,String(v))); fd.append("output_format",outputFormat);
      const r=await apiFetch(`${API_URL}/api/datasets/clean`,{method:"POST",body:fd});
      if(!r.ok){let msg="Unable to clean dataset."; try{msg=(await r.json()).detail||msg}catch{} throw new Error(msg)}
      const blob=await r.blob();
      const cd=r.headers.get("content-disposition")||""; const m=cd.match(/filename="?([^\"]+)"?/i); const name=m?.[1]||`cleaned_data.${outputFormat}`;
      const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
      await analyse();
    }catch(e){setError(e instanceof Error?e.message:"Unable to clean dataset.")}
    finally{setCleaning(false)}
  }

  const a=prep?.analysis;
  return <main>
    <header className="topbar"><a className="brand" href="/"><DataStudioMark/><span className="brandText"><strong>Azhan Data Studio</strong><small>Automated Data Intelligence</small></span></a><div className="topbarActions"><a className="creatorBadge" href={PORTFOLIO_URL} target="_blank" rel="noreferrer"><span className="creatorLabel">CREATED BY</span><span className="creatorName">Azhan Hassan</span><span className="creatorRole">Data &amp; AI Automation Specialist</span><span className="portfolioCta">View Portfolio ↗</span></a><a className="supportTopButton" href={SUPPORT_URL||"#support"} target={SUPPORT_URL?"_blank":undefined}>☕ Support</a></div></header>
    <nav className="studioModeBar"><div className="studioModeInner"><a className="studioModeTab" href="/"><span className="studioModeIcon">▤</span><span><strong>Analyse Single File</strong><small>Discover insights, quality and visuals</small></span></a><a className="studioModeTab active" href="/clean"><span className="studioModeIcon">✦</span><span><strong>Clean My Data</strong><small>Fix common data-quality issues</small></span><em>NEW</em></a><a className="studioModeTab" href="/monthly"><span className="studioModeIcon">▦</span><span><strong>Monthly Intelligence</strong><small>Append files and track movement</small></span></a><a className="studioModeTab" href="/compare"><span className="studioModeIcon">↔</span><span><strong>Compare Datasets</strong><small>Find and explain what changed</small></span></a><a className="studioModeTab" href="/forecast"><span className="studioModeIcon">↗</span><span><strong>Forecast</strong><small>Project metrics forward</small></span></a><a className="studioModeTab" href="/scenario"><span className="studioModeIcon">◇</span><span><strong>Scenario</strong><small>Test assumptions</small></span></a><a className="studioModeTab" href="/statistics"><span className="studioModeIcon">Σ</span><span><strong>Statistics</strong><small>Validate relationships</small></span></a></div></nav>

    <section className="cleanHero"><div><span className="panelKicker">CLEAN MY DATA · NEW UTILITY</span><h1>Messy file in. Clean file out.</h1><p>Scan a CSV or Excel file for duplicates, blank rows, whitespace, inconsistent headers, mixed date formats and text-case variations — then clean the selected issues and download a refreshed file.</p><div className="cleanTrust"><span>No login</span><span>CSV + Excel</span><span>Up to 50 MB</span><span>Conservative cleaning rules</span></div></div></section>

    <section className="cleanShell">
      <div className={`cleanDrop ${drag?"drag":""}`} onDragOver={(e:DragEvent)=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={(e:DragEvent)=>{e.preventDefault();setDrag(false);void pickFile(e.dataTransfer.files?.[0]||null)}} onClick={()=>inputRef.current?.click()}>
        <input ref={inputRef} hidden type="file" accept=".csv,.xlsx" onChange={(e:ChangeEvent<HTMLInputElement>)=>void pickFile(e.target.files?.[0]||null)}/>
        <div className="cleanDropIcon">⇩</div><div><strong>{file?file.name:"Drop your CSV or Excel file here"}</strong><span>{file?`${formatBytes(file.size)} · Click to replace`:"or click to browse · max 50 MB"}</span></div>
      </div>
      {workbook&&Array.isArray(workbook.sheets)&&<div className="cleanSheetRow"><label><span>Excel sheet</span><select value={sheet} onChange={e=>{setSheet(e.target.value);setPrep(null)}}>{workbook.sheets.filter(s=>s.analysis_ready).map(s=><option key={s.name} value={s.name}>{s.name} · {formatNumber(s.rows)} rows × {s.columns} cols{s.recommended?" · Recommended":""}</option>)}</select></label></div>}
      <div className="cleanActionRow"><div><strong>First, scan the file.</strong><span>Nothing is changed until you choose Clean &amp; Download.</span></div><button className="primaryButton" disabled={!file||loading||(file?.name.toLowerCase().endsWith(".xlsx")&&!sheet)} onClick={()=>void analyse()}>{loading?"Scanning…":prep?"Scan again":"Scan data quality"}</button></div>
      {error&&<div className="errorBox">{error}</div>}

      {a&&<>
        <section className="cleanScorePanel"><div className="cleanScore"><span>DATA QUALITY SCORE</span><strong>{a.quality_score}</strong><small>/100</small></div><div className="cleanScoreCopy"><h2>{a.issue_count===0?"Your dataset already looks clean.":`We found ${formatNumber(a.issue_count)} potential quality issues.`}</h2><p>Review what was detected, choose the fixes you want, then download a cleaned copy. The original upload is never overwritten.</p></div><div className="cleanMini"><span>Completeness</span><strong>{a.completeness_percent}%</strong></div></section>

        <section className="cleanIssueGrid">
          <Issue label="Duplicate rows" value={a.duplicate_rows} detail="Exact repeated rows" tone={a.duplicate_rows?"warn":"good"}/>
          <Issue label="Blank rows" value={a.blank_rows} detail="Rows with no populated values" tone={a.blank_rows?"warn":"good"}/>
          <Issue label="Whitespace cells" value={a.whitespace_cells} detail="Leading or trailing spaces" tone={a.whitespace_cells?"warn":"good"}/>
          <Issue label="Blank text cells" value={a.empty_string_cells} detail="Empty strings that can become nulls" tone={a.empty_string_cells?"warn":"good"}/>
          <Issue label="Header changes" value={a.header_changes.length} detail="Columns that can use clean snake_case" tone={a.header_changes.length?"info":"good"}/>
          <Issue label="Mixed date columns" value={a.date_issue_columns.length} detail="Mostly dates using mixed formats" tone={a.date_issue_columns.length?"info":"good"}/>
          <Issue label="Case inconsistency" value={a.case_issue_columns.length} detail="e.g. Melbourne / MELBOURNE" tone={a.case_issue_columns.length?"info":"good"}/>
          <Issue label="Missing values" value={a.missing_values} detail="Existing null values are reported, not filled" tone={a.missing_values?"neutral":"good"}/>
        </section>

        <section className="cleanControls"><div className="cleanControlsHead"><div><span className="panelKicker">CHOOSE CLEANING RULES</span><h2>Clean automatically, but stay in control.</h2><p>High-confidence fixes are enabled by default. Text-case standardisation is optional because business labels can be intentionally different.</p></div></div><div className="cleanOptionGrid">
          <Toggle label="Remove duplicate rows" detail="Keep the first instance of each exact row." checked={options.remove_duplicates} onChange={v=>setOptions({...options,remove_duplicates:v})}/>
          <Toggle label="Remove blank rows" detail="Delete rows where every value is blank." checked={options.remove_blank_rows} onChange={v=>setOptions({...options,remove_blank_rows:v})}/>
          <Toggle label="Trim whitespace" detail="Trim text and turn blank strings into nulls." checked={options.trim_whitespace} onChange={v=>setOptions({...options,trim_whitespace:v})}/>
          <Toggle label="Clean column names" detail="Convert headers to consistent snake_case." checked={options.clean_headers} onChange={v=>setOptions({...options,clean_headers:v})}/>
          <Toggle label="Standardise dates" detail="Convert highly date-like text columns to YYYY-MM-DD." checked={options.standardise_dates} onChange={v=>setOptions({...options,standardise_dates:v})}/>
          <Toggle label="Standardise text case" detail="Use the most common spelling for case-only variants." checked={options.standardise_text_case} onChange={v=>setOptions({...options,standardise_text_case:v})}/>
        </div><div className="cleanDownloadBar"><label><span>Download format</span><select value={outputFormat} onChange={e=>setOutputFormat(e.target.value as "xlsx"|"csv")}><option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV (.csv)</option></select></label><button className="cleanDownloadButton" disabled={cleaning} onClick={()=>void cleanAndDownload()}>{cleaning?"Cleaning file…":"✦ Clean & Download"}</button></div></section>

        <section className="cleanDetailGrid">
          <div><h3>Column-name preview</h3>{a.header_changes.length?a.header_changes.slice(0,8).map(x=><p key={x.before}><code>{x.before}</code><span>→</span><code>{x.after}</code></p>):<div className="cleanEmpty">No header changes needed.</div>}</div>
          <div><h3>Detected date columns</h3>{a.date_issue_columns.length?a.date_issue_columns.map(x=><p key={x.column}><strong>{x.column}</strong><span>{x.parseable_percent}% parseable → {x.target_format}</span></p>):<div className="cleanEmpty">No mixed date formats detected.</div>}</div>
          <div><h3>Case-variation examples</h3>{a.case_issue_columns.length?a.case_issue_columns.slice(0,6).map(x=><p key={x.column}><strong>{x.column}</strong><span>{x.examples[0]?.join(" / ")}</span></p>):<div className="cleanEmpty">No case-only variants detected.</div>}</div>
        </section>

        <section className="cleanPreview"><div><span className="panelKicker">SOURCE PREVIEW</span><h2>First {Math.min(prep?.preview.length||0,8)} rows</h2></div>{prep&&prep.preview.length>0&&<div className="cleanTableWrap"><table><thead><tr>{Object.keys(prep.preview[0]).map(k=><th key={k}>{k}</th>)}</tr></thead><tbody>{prep.preview.map((row,i)=><tr key={i}>{Object.keys(prep.preview[0]).map(k=><td key={k}>{String(row[k]??"—")}</td>)}</tr>)}</tbody></table></div>}</section>
      </>}
    </section>
    <footer className="siteFooter"><strong>Azhan Data Studio</strong><span>Created by Azhan Hassan · Data &amp; AI Automation Specialist</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">View Portfolio ↗</a></footer>
  </main>
}

function Issue({label,value,detail,tone}:{label:string;value:number;detail:string;tone:string}){return <article className={`cleanIssue ${tone}`}><span>{label}</span><strong>{formatNumber(value)}</strong><small>{detail}</small></article>}
function Toggle({label,detail,checked,onChange}:{label:string;detail:string;checked:boolean;onChange:(v:boolean)=>void}){return <label className="cleanToggle"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><span className="cleanSwitch"/><span><strong>{label}</strong><small>{detail}</small></span></label>}
