import express from "express";
import cors from "cors";
import multer from "multer";
import dns from "node:dns/promises";
import { URL } from "node:url";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json({limit:"2mb"}));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 5 * 1024 * 1024},
  fileFilter: (req,file,cb) => {
    const allowed = ["application/pdf","image/png","image/jpeg"];
    cb(allowed.includes(file.mimetype) ? null : new Error("Only PDF, PNG and JPEG files are allowed."), allowed.includes(file.mimetype));
  }
});

const freeEmailDomains = new Set(["gmail.com","yahoo.com","outlook.com","hotmail.com","proton.me","protonmail.com","icloud.com","mail.com","yandex.com","zoho.com"]);

function clamp(n){ return Math.max(0, Math.min(100, Math.round(n))); }
function normalizeDomain(value){
  try {
    let v=value.trim();
    if(!/^https?:\/\//i.test(v)) v="https://"+v;
    return new URL(v).hostname.replace(/^www\./,"").toLowerCase();
  } catch { return null; }
}
async function domainExists(domain){
  try { await dns.lookup(domain); return true; } catch { return false; }
}

app.get("/api/health",(req,res)=>res.json({ok:true,service:"OfferLens AI API"}));

app.post("/api/analyze/email", (req,res)=>{
  const email=String(req.body.email||"").trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:"Please enter a valid email address."});
  const domain=email.split("@")[1];
  const isFree=freeEmailDomains.has(domain);
  const suspiciousWords=["hr","recruitment","career","jobs","internship","hiring"];
  const local=email.split("@")[0];
  const oddLocal=suspiciousWords.some(w=>local.includes(w)) && isFree;
  const redFlags=[];
  if(isFree) redFlags.push(`The address uses a free email provider (${domain}) instead of a company domain.`);
  if(oddLocal) redFlags.push("The sender name looks recruitment-related but the mailbox is on a free provider.");
  const score=clamp(90-(isFree?45:0)-(oddLocal?10:0));
  res.json({
    trustScore:score,status:score>75?"Real":score>40?"Suspicious":"Fake",
    redFlags,reason:isFree?"Corporate recruiters commonly use an organization-owned domain, so verify this sender independently.":"The email uses a custom domain, which is one positive signal but does not prove legitimacy.",
    recommendation:"Verify the company through its official website and contact the company using a publicly listed channel before sharing documents or paying money."
  });
});

app.post("/api/analyze/company", async (req,res)=>{
  const name=String(req.body.companyName||"").trim();
  const website=String(req.body.websiteUrl||"").trim();
  if(!name) return res.status(400).json({error:"Company name is required."});
  const redFlags=[]; let score=70;
  if(name.length<3){redFlags.push("The company name is unusually short.");score-=15;}
  let domain=null, exists=null;
  if(website){
    domain=normalizeDomain(website);
    if(!domain){redFlags.push("The website URL is invalid.");score-=25;}
    else {
      exists=await domainExists(domain);
      if(!exists){redFlags.push("The supplied website domain could not be resolved.");score-=35;}
      if(domain.includes("free")||domain.includes("blogspot")||domain.includes("wordpress.com")){redFlags.push("The website appears to use a free/hosted subdomain.");score-=20;}
    }
  } else {redFlags.push("No company website was provided.");score-=10;}
  score=clamp(score);
  res.json({
    trustScore:score,status:score>75?"Real":score>40?"Suspicious":"Fake",redFlags,
    reason:website ? (exists?"The website domain is reachable, but domain reachability alone cannot prove that the internship is legitimate.":"The website could not be verified from the supplied domain.") : "Only the company name was provided, so the report is based on limited signals.",
    recommendation:"Check the company registration, official website, LinkedIn presence, employee profiles and independently published contact details. Never pay an internship or recruitment fee."
  });
});

app.post("/api/analyze/offer", upload.single("file"), (req,res)=>{
  if(!req.file) return res.status(400).json({error:"Please upload a PDF, PNG or JPEG offer letter."});
  const name=req.file.originalname.toLowerCase();
  const redFlags=[];
  const suspiciousFilenameWords=["urgent","payment","fee","registration","deposit","offer"];
  if(suspiciousFilenameWords.some(w=>name.includes(w))) redFlags.push("The filename contains a term commonly associated with urgent/payment-oriented documents.");
  const score=redFlags.length?60:78;
  res.json({
    trustScore:score,status:score>75?"Real":score>40?"Suspicious":"Fake",redFlags,
    reason:`The document "${req.file.originalname}" was received successfully. This local version validates the file and applies filename-level screening; it does not claim to prove the sender is genuine.`,
    recommendation:"Check the letter for payment requests, personal-bank-account instructions, mismatched company domains, poor grammar, pressure to act quickly, fake signatures/logos and unverifiable contact information."
  });
});

app.use((err,req,res,next)=>{
  if(err instanceof multer.MulterError) return res.status(400).json({error:err.message});
  if(err) return res.status(400).json({error:err.message||"Request failed"});
  next();
});

app.listen(PORT,()=>console.log(`OfferLens AI backend running on http://localhost:${PORT}`));
