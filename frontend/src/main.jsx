import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [tab, setTab] = useState("company");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [hrEmail, setHrEmail] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const onScroll = () => document.getElementById("navbar")?.classList.toggle("scrolled", window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goVerify = () => document.getElementById("section3")?.scrollIntoView({behavior:"smooth"});

  const handleFile = (selected) => {
    if (!selected) return;
    const valid = ["image/png","image/jpeg","application/pdf"];
    if (!valid.includes(selected.type)) return alert("Invalid file type. Please upload PDF, PNG, or JPEG.");
    if (selected.size > 5 * 1024 * 1024) return alert("File is too large. Maximum size is 5MB.");
    setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const analyze = async (e) => {
    e.preventDefault();
    if (tab === "offer" && !file) return;
    setLoading(true); setResult(null);
    try {
      let response;
      if (tab === "offer") {
        const form = new FormData();
        form.append("file", file);
        response = await fetch(`${API_URL}/api/analyze/offer`, {method:"POST", body:form});
      } else {
        const payload = tab === "company"
          ? {companyName, websiteUrl}
          : {email: hrEmail};
        response = await fetch(`${API_URL}/api/analyze/${tab}`, {
          method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)
        });
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API request failed");
      setResult(data);
      setTimeout(() => document.getElementById("section4")?.scrollIntoView({behavior:"smooth"}), 50);
    } catch (err) {
      setResult({error: err.message});
      setTimeout(() => document.getElementById("section4")?.scrollIntoView({behavior:"smooth"}), 50);
    } finally { setLoading(false); }
  };

  const score = result?.trustScore ?? 0;
  const riskLevel = score > 75 ? "Low" : score > 40 ? "Medium" : "High";
  const statusClass = result?.status === "Real" ? "badge-success" : result?.status === "Suspicious" ? "badge-warning" : "badge-danger";
  const riskClass = riskLevel === "Low" ? "badge-success" : riskLevel === "Medium" ? "badge-warning" : "badge-danger";

  return <div>
    <nav className="navbar" id="navbar">
      <div className="nav-container">
        <div className="logo" onClick={()=>document.getElementById("section1")?.scrollIntoView({behavior:"smooth"})}>
          <span className="logo-shield">🛡️</span> OfferLens <span className="logo-ai">AI</span>
        </div>
      </div>
    </nav>

    <header className="hero" id="section1"><div className="hero-content">
      <h1 className="hero-title">Check Internship Companies <span className="gradient-text">Before You Apply</span></h1>
      <p className="hero-subtitle">AI-powered internship scam detection for students. Don't let fake offers ruin your career.</p>
      <div className="hero-buttons">
        <button className="btn btn-primary" onClick={goVerify}>Verify Company</button>
        <button className="btn btn-secondary" onClick={goVerify}>Upload Offer Letter</button>
      </div>
    </div></header>

    <section className="features" id="section2"><div className="container">
      <h2 className="section-title">Powerful <span className="gradient-text">Protection</span> Tools</h2>
      <p className="section-subtitle">Everything you need to ensure your internship is legitimate.</p>
      <div className="features-grid">
        {[["🏢","Company Verification","Cross-references company details against legitimacy signals and scam-risk patterns."],
          ["🌐","Website Analysis","Checks the supplied website URL for common trust and domain-risk signals."],
          ["📄","Offer Letter Scanner","Upload an offer letter to detect suspicious payment requests, contact details and common scam wording."],
          ["✉️","Email Verification","Checks whether the HR email uses a corporate domain or a free/disposable provider."],
          ["⭐","Student Reviews","Use the analysis report as a first screening step before trusting an internship offer."],
          ["📊","Trust Score","Get a clear calculated percentage score indicating the current safety level."]].map(([icon,title,desc]) =>
          <div className="feature-card" key={title}><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{desc}</p></div>)}
      </div>
    </div></section>

    <section className="verify-section" id="section3"><div className="container">
      <h2 className="section-title">Verify Your <span className="gradient-text">Internship</span></h2>
      <p className="section-subtitle">Choose an option below to start the analysis.</p>
      <div className="tabs">
        {["company","offer","email"].map(t=><button key={t} className={`tab-btn ${tab===t?"active":""}`} onClick={()=>setTab(t)}>
          {t==="company"?"Verify Company":t==="offer"?"Upload Offer Letter":"Verify Email"}
        </button>)}
      </div>

      {tab==="company" && <div className="tab-content active"><form className="verify-form" onSubmit={analyze}>
        <div className="form-group"><label>Company Name</label><input value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="e.g. Google, Microsoft" required /></div>
        <div className="form-group"><label>Company Website (Optional)</label><input type="url" value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)} placeholder="https://company.com" /></div>
        <button className="btn btn-primary form-btn" disabled={loading}><span className={loading?"hidden":""}>Analyze with AI</span>{loading&&<div className="loader" />}</button>
      </form></div>}

      {tab==="offer" && <div className="tab-content active"><form className="verify-form" onSubmit={analyze}>
        <div className={`upload-area ${dragging?"dragging":""}`} onClick={()=>fileRef.current?.click()}
          onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0])}}>
          <div className="upload-icon">📤</div><p>Drag & drop your offer letter here, or <span className="upload-link">browse</span></p><small>Supports PDF, PNG, JPEG (Max 5MB)</small>
          <input ref={fileRef} type="file" accept=".png,.jpeg,.jpg,.pdf" hidden onChange={e=>handleFile(e.target.files?.[0])}/>
        </div>
        {file&&<div className="file-preview"><span>📄 {file.name}</span><button type="button" className="btn btn-sm btn-secondary" onClick={removeFile}>Remove</button></div>}
        <button className="btn btn-primary form-btn" disabled={!file||loading}><span className={loading?"hidden":""}>Analyze Document</span>{loading&&<div className="loader" />}</button>
      </form></div>}

      {tab==="email" && <div className="tab-content active"><form className="verify-form" onSubmit={analyze}>
        <div className="form-group"><label>HR Email Address</label><input type="email" value={hrEmail} onChange={e=>setHrEmail(e.target.value)} placeholder="hr@company.com" required /></div>
        <button className="btn btn-primary form-btn" disabled={loading}><span className={loading?"hidden":""}>Verify Email</span>{loading&&<div className="loader" />}</button>
      </form></div>}
    </div></section>

    <section className="result-section" id="section4" style={{display:result?"block":"none"}}><div className="container"><div className="result-card">
      {result?.error ? <div className="error-text"><h3>Analysis Failed</h3><p>{result.error}</p></div> :
      result && <><div className="result-header"><h2>Analysis Report</h2><button className="btn btn-secondary btn-sm" onClick={goVerify}>New Scan</button></div>
        <div className="result-score-container"><div className="score-circle" style={{"--score":score}}><div className="score-inner"><span className="score-value">{score}</span><span className="score-label">Trust Score</span></div></div></div>
        <div className="status-badges"><div className={`badge ${statusClass}`}>Status: {result.status}</div><div className={`badge ${riskClass}`}>Risk Level: {riskLevel}</div></div>
        <div className="details-grid">
          <div className="detail-box"><h3>🚩 Red Flags</h3><ul className="detail-list">{(result.redFlags?.length?result.redFlags:["None detected"]).map((x,i)=><li key={i}>{x}</li>)}</ul></div>
          <div className="detail-box"><h3>✅ Reasons</h3><ul className="detail-list"><li>{result.reason||"No specific reasons provided."}</li></ul></div>
          <div className="detail-box detail-box-full"><h3>💡 Recommendations</h3><ul className="detail-list"><li>{result.recommendation||"Proceed with standard caution."}</li></ul></div>
        </div></>}
    </div></div></section>
    <footer className="footer"><p>© 2026 OfferLens AI. All rights reserved.</p></footer>
  </div>;
}
createRoot(document.getElementById("root")).render(<App />);
