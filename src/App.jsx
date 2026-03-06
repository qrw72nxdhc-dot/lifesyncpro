import { useState, useEffect } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 19 }, (_, i) => i + 5);

const BUDGET_CATEGORIES = [
  { key: "groceries",  label: "Food & Groceries",   color: "#7A9E7E", icon: "🛒" },
  { key: "transport",  label: "Transport",           color: "#C4A882", icon: "🚗" },
  { key: "entertainment", label: "Entertainment",   color: "#9B8EA8", icon: "🎬" },
  { key: "health",     label: "Gym & Health",        color: "#2D4A3E", icon: "💪" },
  { key: "shopping",   label: "Shopping",            color: "#A8786E", icon: "🛍" },
  { key: "savings",    label: "Savings",             color: "#3A3A3A", icon: "💰" },
  { key: "bills",      label: "Bills & Debit Orders",color: "#6E7A8A", icon: "📋" },
  { key: "insurance",  label: "Insurance",           color: "#8A7A5A", icon: "🛡" },
];

const CAL_CATEGORIES = {
  work:     { label: "Work",      color: "#2D4A3E" },
  school:   { label: "School",    color: "#7C7C7C" },
  gym:      { label: "Gym",       color: "#3A3A3A" },
  meal:     { label: "Meal Prep", color: "#C4A882" },
  personal: { label: "Personal",  color: "#7A9E7E" },
  weekend:  { label: "Weekend",   color: "#9B8EA8" },
  expense:  { label: "Expense",   color: "#A8786E" },
};

const EVENT_COLORS = [
  "#2D4A3E","#7A9E7E","#3A3A3A","#7C7C7C","#C4A882","#9B8EA8","#A8786E","#6E7A8A"
];

const RECUR_OPTIONS = ["none","daily","weekly","weekdays","weekends","monthly"];

const fmtH = h => h === 0 ? "12am" : h === 12 ? "12pm" : h > 12 ? `${h-12}pm` : `${h}am`;
const fmtHLong = h => h === 0 ? "12:00 AM" : h === 12 ? "12:00 PM" : h > 12 ? `${h-12}:00 PM` : `${h}:00 AM`;
const getTimeName = h => h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
const fmtCurrency = (n) => `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const defaultBlocks = [
  { id:1,  day:0, startHour:9,  endHour:17, category:"work",    title:"Morning Work",      recur:"weekdays", reminder:30, color:"#2D4A3E", hasCost:false, cost:0, budgetCat:"" },
  { id:2,  day:1, startHour:9,  endHour:17, category:"work",    title:"Morning Work",      recur:"weekdays", reminder:30, color:"#2D4A3E", hasCost:false, cost:0, budgetCat:"" },
  { id:3,  day:2, startHour:9,  endHour:17, category:"work",    title:"Morning Work",      recur:"weekdays", reminder:30, color:"#2D4A3E", hasCost:false, cost:0, budgetCat:"" },
  { id:4,  day:3, startHour:9,  endHour:17, category:"work",    title:"Morning Work",      recur:"weekdays", reminder:30, color:"#2D4A3E", hasCost:false, cost:0, budgetCat:"" },
  { id:5,  day:4, startHour:9,  endHour:17, category:"work",    title:"Morning Work",      recur:"weekdays", reminder:30, color:"#2D4A3E", hasCost:false, cost:0, budgetCat:"" },
  { id:6,  day:0, startHour:6,  endHour:7,  category:"gym",     title:"Morning Gym",       recur:"weekly",   reminder:15, color:"#3A3A3A", hasCost:true,  cost:250, budgetCat:"health" },
  { id:7,  day:2, startHour:19, endHour:21, category:"school",  title:"Evening Study",     recur:"weekly",   reminder:10, color:"#7C7C7C", hasCost:false, cost:0, budgetCat:"" },
  { id:8,  day:5, startHour:10, endHour:12, category:"meal",    title:"Morning Meal Prep", recur:"weekly",   reminder:20, color:"#C4A882", hasCost:true,  cost:800, budgetCat:"groceries" },
  { id:9,  day:5, startHour:14, endHour:20, category:"weekend", title:"Afternoon Plans",   recur:"none",     reminder:60, color:"#9B8EA8", hasCost:true,  cost:300, budgetCat:"entertainment" },
];

const defaultDebits = [
  { id:1, name:"Netflix",       amount:199,  day:1,  budgetCat:"entertainment", color:"#9B8EA8" },
  { id:2, name:"Gym Membership",amount:499,  day:5,  budgetCat:"health",        color:"#2D4A3E" },
  { id:3, name:"Car Insurance", amount:1200, day:25, budgetCat:"insurance",     color:"#8A7A5A" },
  { id:4, name:"Phone Contract",amount:699,  day:28, budgetCat:"bills",         color:"#6E7A8A" },
];

// ─── SETUP / ONBOARDING ───────────────────────────────────────────────────────
function SetupPage({ onComplete }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [income, setIncome] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [allocations, setAllocations] = useState({
    groceries:15, transport:10, entertainment:8, health:5,
    shopping:10, savings:20, bills:15, insurance:7
  });

  const total = Object.values(allocations).reduce((a,b)=>a+b,0);
  const remaining = 100 - total;

  const updateAlloc = (key, val) => {
    const num = Math.max(0, Math.min(100, parseInt(val)||0));
    setAllocations(prev => ({ ...prev, [key]: num }));
  };

  const handleComplete = () => {
    const inc = parseFloat(income) || 0;
    const budgets = {};
    BUDGET_CATEGORIES.forEach(cat => {
      budgets[cat.key] = { allocated: inc * (allocations[cat.key]/100), spent: 0 };
    });
    onComplete({ name, income: inc, period, allocations, budgets, debits: defaultDebits });
  };

  return (
    <div style={{ minHeight:"100vh", background:"#1A1A1A", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Jost',sans-serif", padding:"20px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Jost:wght@300;400;500;600&display=swap');`}</style>
      <div style={{ width:"100%", maxWidth:"460px" }}>

        {/* Progress */}
        <div style={{ display:"flex", gap:"6px", marginBottom:"40px" }}>
          {[1,2,3].map(s=>(
            <div key={s} style={{ flex:1, height:"2px", background:step>=s?"#7A9E7E":"#2A2A2A", borderRadius:"2px", transition:"background 0.4s" }}/>
          ))}
        </div>

        {/* STEP 1 — Name */}
        {step===1 && (
          <div>
            <p style={{ color:"#7C7C7C", fontSize:"11px", letterSpacing:"0.15em", marginBottom:"12px" }}>WELCOME TO</p>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"52px", fontWeight:300, color:"#F8F5F0", margin:"0 0 6px", letterSpacing:"0.05em", lineHeight:1 }}>LifeSync</h1>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"18px", fontStyle:"italic", color:"#7C7C7C", margin:"0 0 48px", fontWeight:300 }}>Your life, intelligently organised.</p>

            <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"8px", letterSpacing:"0.12em" }}>WHAT SHOULD WE CALL YOU?</label>
            <input
              value={name} onChange={e=>setName(e.target.value)}
              placeholder="Your name"
              onKeyDown={e=>e.key==="Enter"&&name&&setStep(2)}
              style={{ width:"100%", background:"transparent", border:"none", borderBottom:"1px solid #3A3A3A", padding:"12px 0", color:"#F8F5F0", fontSize:"22px", outline:"none", fontFamily:"'Cormorant Garamond',serif", marginBottom:"40px", boxSizing:"border-box" }}
            />
            <button onClick={()=>name&&setStep(2)} style={{ background:name?"#F8F5F0":"#2A2A2A", border:"none", borderRadius:"6px", padding:"14px 32px", color:name?"#1A1A1A":"#3A3A3A", fontSize:"12px", fontWeight:500, cursor:name?"pointer":"not-allowed", letterSpacing:"0.1em", transition:"all 0.2s" }}>
              CONTINUE
            </button>
          </div>
        )}

        {/* STEP 2 — Income */}
        {step===2 && (
          <div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"36px", fontWeight:300, color:"#F8F5F0", margin:"0 0 8px" }}>Hello, {name}.</h2>
            <p style={{ color:"#7C7C7C", fontSize:"13px", margin:"0 0 40px", fontWeight:300, lineHeight:1.7 }}>Let's set up your budget so LifeSync can help you spend intelligently.</p>

            <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"8px", letterSpacing:"0.12em" }}>YOUR INCOME (ZAR)</label>
            <div style={{ display:"flex", alignItems:"center", borderBottom:"1px solid #3A3A3A", marginBottom:"32px", paddingBottom:"12px" }}>
              <span style={{ color:"#7C7C7C", fontSize:"22px", fontFamily:"'Cormorant Garamond',serif", marginRight:"10px" }}>R</span>
              <input
                value={income} onChange={e=>setIncome(e.target.value.replace(/[^0-9.]/g,""))}
                placeholder="0.00" type="number"
                style={{ flex:1, background:"transparent", border:"none", color:"#F8F5F0", fontSize:"32px", outline:"none", fontFamily:"'Cormorant Garamond',serif", fontWeight:300 }}
              />
            </div>

            <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"12px", letterSpacing:"0.12em" }}>BUDGET PERIOD</label>
            <div style={{ display:"flex", gap:"8px", marginBottom:"40px" }}>
              {["monthly","weekly"].map(p=>(
                <button key={p} onClick={()=>setPeriod(p)} style={{ flex:1, padding:"12px", background:period===p?"#2D4A3E":"transparent", border:`1px solid ${period===p?"#2D4A3E":"#3A3A3A"}`, borderRadius:"6px", color:period===p?"#F8F5F0":"#7C7C7C", fontSize:"12px", cursor:"pointer", letterSpacing:"0.08em", textTransform:"capitalize", transition:"all 0.2s" }}>
                  {p.toUpperCase()}
                </button>
              ))}
            </div>

            <button onClick={()=>income&&setStep(3)} style={{ background:income?"#F8F5F0":"#2A2A2A", border:"none", borderRadius:"6px", padding:"14px 32px", color:income?"#1A1A1A":"#3A3A3A", fontSize:"12px", fontWeight:500, cursor:income?"pointer":"not-allowed", letterSpacing:"0.1em" }}>
              CONTINUE
            </button>
          </div>
        )}

        {/* STEP 3 — Allocations */}
        {step===3 && (
          <div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"32px", fontWeight:300, color:"#F8F5F0", margin:"0 0 6px" }}>Allocate your budget</h2>
            <p style={{ color:"#7C7C7C", fontSize:"13px", margin:"0 0 6px", fontWeight:300 }}>
              Income: <span style={{ color:"#7A9E7E" }}>{fmtCurrency(income)}</span> {period}
            </p>
            <p style={{ color:Math.abs(remaining)<1?"#7A9E7E":remaining<0?"#E8A0A0":"#C4A882", fontSize:"12px", margin:"0 0 24px", letterSpacing:"0.05em" }}>
              {Math.abs(remaining)<1 ? "Perfectly balanced" : remaining>0 ? `${remaining}% unallocated` : `${Math.abs(remaining)}% over — reduce some categories`}
            </p>

            {/* Visual bar */}
            <div style={{ height:"6px", background:"#2A2A2A", borderRadius:"3px", overflow:"hidden", marginBottom:"24px", display:"flex" }}>
              {BUDGET_CATEGORIES.map(cat=>(
                <div key={cat.key} style={{ width:`${allocations[cat.key]}%`, background:cat.color, transition:"width 0.3s" }}/>
              ))}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"32px", maxHeight:"340px", overflowY:"auto" }}>
              {BUDGET_CATEGORIES.map(cat=>{
                const amt = ((parseFloat(income)||0) * allocations[cat.key] / 100);
                return (
                  <div key={cat.key} style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                    <div style={{ width:"8px", height:"8px", background:cat.color, borderRadius:"50%", flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:"12px", color:"#C4C4C4", letterSpacing:"0.04em" }}>{cat.label}</span>
                    <span style={{ fontSize:"11px", color:"#7C7C7C", width:"70px", textAlign:"right" }}>{fmtCurrency(amt)}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                      <input type="range" min="0" max="50" value={allocations[cat.key]} onChange={e=>updateAlloc(cat.key, e.target.value)}
                        style={{ width:"80px", accentColor:cat.color, cursor:"pointer" }}/>
                      <span style={{ fontSize:"11px", color:"#7C7C7C", width:"28px" }}>{allocations[cat.key]}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={handleComplete} style={{ background:"#F8F5F0", border:"none", borderRadius:"6px", padding:"14px 32px", color:"#1A1A1A", fontSize:"12px", fontWeight:500, cursor:"pointer", letterSpacing:"0.1em" }}>
              START LIFESYNC
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [setup, setSetup] = useState(false);
  const [userData, setUserData] = useState(null);
  const [blocks, setBlocks] = useState(defaultBlocks);
  const [debits, setDebits] = useState(defaultDebits);
  const [tab, setTab] = useState("calendar");
  const [modal, setModal] = useState(null);
  const [debitModal, setDebitModal] = useState(null);
  const [form, setForm] = useState({});
  const [debitForm, setDebitForm] = useState({ name:"", amount:"", day:1, budgetCat:"bills", color:"#6E7A8A" });
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [toast, setToast] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(null), 3000); };

  useEffect(()=>{
    if(form.autoTitle && form.category && form.startHour !== undefined){
      const base = CAL_CATEGORIES[form.category]?.label || "";
      setForm(f=>({...f, title:`${getTimeName(f.startHour)} ${base}`}));
    }
  }, [form.startHour, form.category, form.autoTitle]);

  if(!setup) return <SetupPage onComplete={data=>{ setUserData(data); setSetup(true); }}/>;

  const { name, income, period, budgets } = userData;

  // ── Budget calculations ──
  const totalIncome = income;
  const debitTotal = debits.reduce((s,d)=>s+d.amount, 0);

  const spentByCategory = {};
  BUDGET_CATEGORIES.forEach(cat=>{ spentByCategory[cat.key] = 0; });
  blocks.forEach(b=>{ if(b.hasCost && b.budgetCat && b.cost) spentByCategory[b.budgetCat] = (spentByCategory[b.budgetCat]||0) + b.cost; });
  debits.forEach(d=>{ if(d.budgetCat) spentByCategory[d.budgetCat] = (spentByCategory[d.budgetCat]||0) + d.amount; });

  const totalSpent = Object.values(spentByCategory).reduce((a,b)=>a+b,0);
  const totalRemaining = totalIncome - totalSpent;

  // Day spending breakdown
  const getDaySpending = (dayIndex) => {
    const dayBlocks = blocks.filter(b=>b.day===dayIndex && b.hasCost && b.cost>0);
    const dayDebits = debits.filter(d=>{
      const today = new Date();
      const weekStart = new Date(today);
      const diff = today.getDay()===0?-6:1-today.getDay();
      weekStart.setDate(today.getDate()+diff);
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate()+dayIndex);
      return d.day === dayDate.getDate();
    });
    return { blocks: dayBlocks, debits: dayDebits, total: [...dayBlocks, ...dayDebits].reduce((s,i)=>s+(i.cost||i.amount||0),0) };
  };

  // ── Calendar helpers ──
  const hexAlpha = (hex, a) => {
    if(!hex || hex.length < 7) return `rgba(0,0,0,${a})`;
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  };

  const openAdd = (day, hour) => {
    const spending = getDaySpending(day);
    setForm({ title:`${getTimeName(hour)} Personal`, category:"personal", startHour:hour, endHour:hour+1, recur:"none", reminder:0, color:"#7A9E7E", autoTitle:true, hasCost:false, cost:"", budgetCat:"groceries", daySpending: spending });
    setModal({ mode:"add", day });
  };

  const openEdit = (block, e) => {
    e.stopPropagation();
    const spending = getDaySpending(block.day);
    setForm({ ...block, cost:block.cost||"", autoTitle:false, daySpending: spending });
    setModal({ mode:"edit", day:block.day, blockId:block.id });
  };

  const saveBlock = () => {
    if(!form.title || form.endHour <= form.startHour) return;
    const block = { ...form, cost: form.hasCost ? parseFloat(form.cost)||0 : 0 };
    if(modal.mode==="add") setBlocks(prev=>[...prev, { id:Date.now(), day:modal.day, ...block }]);
    else setBlocks(prev=>prev.map(b=>b.id===modal.blockId?{...b,...block}:b));
    setModal(null);
    showToast(modal.mode==="add"?"Block added":"Block updated");
  };

  const deleteBlock = (id, e) => { e.stopPropagation(); setBlocks(prev=>prev.filter(b=>b.id!==id)); };
  const filteredBlocks = activeFilter ? blocks.filter(b=>b.category===activeFilter) : blocks;

  const runAI = async () => {
    setAiLoading(true); setAiAdvice(null);
    try {
      const spendingSummary = BUDGET_CATEGORIES.map(cat=>`${cat.label}: spent R${spentByCategory[cat.key]||0} of R${((income*(userData.allocations[cat.key]||0)/100)).toFixed(0)} allocated`).join(", ");
      const prompt = `You are a smart personal finance advisor for a South African user. Their income is R${income} ${period}. Here's their spending: ${spendingSummary}. Total debit orders: R${debitTotal}. Remaining: R${totalRemaining.toFixed(2)}. Give 4 specific, actionable money-saving tips in a JSON array with fields: tip (short title), detail (1 sentence), category (which budget category), saving (estimated monthly saving in ZAR as number). Return ONLY the JSON array.`;
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:prompt}] })
      });
      const data = await response.json();
      const text = data.content?.map(c=>c.text||"").join("")||"";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setAiAdvice(parsed);
    } catch(e) {
      setAiAdvice([
        { tip:"Reduce entertainment spend", detail:"You're spending more than allocated on entertainment — cut streaming services you rarely use.", category:"entertainment", saving:300 },
        { tip:"Meal prep more", detail:"Cooking at home instead of eating out could save significantly on your grocery budget.", category:"groceries", saving:800 },
        { tip:"Review insurance", detail:"Compare insurance quotes annually — most people overpay by 15-20%.", category:"insurance", saving:200 },
        { tip:"Boost savings rate", detail:"Automating savings on payday prevents lifestyle creep.", category:"savings", saving:500 },
      ]);
    }
    setAiLoading(false);
  };

  const inputStyle = { width:"100%", background:"#F8F5F0", border:"1px solid #E8DDD0", borderRadius:"6px", padding:"10px 12px", color:"#1A1A1A", fontSize:"13px", outline:"none", fontFamily:"'Jost',sans-serif", boxSizing:"border-box" };
  const labelStyle = { display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"5px", fontWeight:500, letterSpacing:"0.1em" };

  return (
    <div style={{ minHeight:"100vh", background:"#F8F5F0", fontFamily:"'Jost',sans-serif", color:"#1A1A1A" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Jost:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-track{background:#F8F5F0;}
        ::-webkit-scrollbar-thumb{background:#C4A882;border-radius:2px;}
        .block-item{transition:opacity 0.15s,transform 0.1s;}
        .block-item:hover{opacity:0.82;transform:scaleX(0.98);}
        .hour-cell:hover{background:rgba(0,0,0,0.025)!important;cursor:pointer;}
        .tab-btn{transition:all 0.2s;background:transparent;border:none;cursor:pointer;font-family:'Jost',sans-serif;}
        .modal-bg{animation:fadeIn 0.2s ease;}
        .modal-box{animation:slideUp 0.25s ease;}
        .card{animation:slideUp 0.3s ease both;}
        .toast{animation:slideUp 0.3s ease;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;outline:none;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;cursor:pointer;}
        select,input{font-family:'Jost',sans-serif;}
      `}</style>

      {toast && <div className="toast" style={{ position:"fixed", top:"20px", right:"20px", zIndex:9999, background:"#2D4A3E", borderRadius:"8px", padding:"12px 20px", fontSize:"12px", color:"#F8F5F0", letterSpacing:"0.05em", boxShadow:"0 4px 20px rgba(0,0,0,0.15)" }}>{toast}</div>}

      {/* Header */}
      <div style={{ background:"#1A1A1A", padding:"16px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"20px", fontWeight:300, letterSpacing:"0.15em", color:"#F8F5F0", textTransform:"uppercase" }}>LifeSync</h1>
          <p style={{ fontSize:"10px", color:"#7C7C7C", letterSpacing:"0.08em", marginTop:"2px" }}>Good {getTimeName(new Date().getHours()).toLowerCase()}, {name.split(" ")[0]}</p>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:"11px", color:"#7C7C7C", letterSpacing:"0.05em" }}>Remaining {period}</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"20px", color:totalRemaining>0?"#7A9E7E":"#E8A0A0", fontWeight:400 }}>{fmtCurrency(totalRemaining)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:"#F8F5F0", borderBottom:"1px solid #E8DDD0", padding:"0 28px", display:"flex", overflowX:"auto" }}>
        {[["calendar","CALENDAR"],["budget","BUDGET"],["debits","DEBIT ORDERS"],["ai","AI ADVICE"]].map(([key,label])=>(
          <button key={key} className="tab-btn" onClick={()=>setTab(key)} style={{ padding:"13px 16px", fontSize:"11px", fontWeight:500, letterSpacing:"0.1em", color:tab===key?"#1A1A1A":"#7C7C7C", borderBottom:tab===key?"2px solid #2D4A3E":"2px solid transparent", marginBottom:"-1px", whiteSpace:"nowrap" }}>{label}</button>
        ))}
      </div>

      {/* ── CALENDAR TAB ── */}
      {tab==="calendar" && (
        <>
          <div style={{ padding:"10px 28px", display:"flex", gap:"8px", overflowX:"auto", borderBottom:"1px solid #E8DDD0", background:"#FDFCFA", alignItems:"center" }}>
            {Object.entries(CAL_CATEGORIES).map(([key,cat])=>(
              <button key={key} onClick={()=>setActiveFilter(activeFilter===key?null:key)} style={{ background:activeFilter===key?"#1A1A1A":"transparent", border:`1px solid ${activeFilter===key?"#1A1A1A":"#D4C9BB"}`, borderRadius:"4px", padding:"5px 12px", cursor:"pointer", color:activeFilter===key?"#F8F5F0":"#7C7C7C", fontSize:"10px", fontWeight:500, letterSpacing:"0.08em", whiteSpace:"nowrap" }}>
                {cat.label.toUpperCase()}
              </button>
            ))}
            <div style={{ marginLeft:"auto", fontSize:"10px", color:"#C4A882", whiteSpace:"nowrap" }}>Click cell to add event</div>
          </div>

          <div style={{ padding:"0 28px 40px", overflowX:"auto" }}>
            <div style={{ minWidth:"700px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"50px repeat(7,1fr)", marginTop:"14px" }}>
                <div/>
                {DAYS.map((d,i)=>{
                  const spending = getDaySpending(i);
                  return (
                    <div key={d} style={{ textAlign:"center", padding:"6px 2px" }}>
                      <div style={{ fontSize:"11px", fontWeight:500, letterSpacing:"0.1em", color:i>=5?"#2D4A3E":"#7C7C7C" }}>{d}</div>
                      {spending.total>0 && <div style={{ fontSize:"9px", color:"#C4A882", marginTop:"2px" }}>R{spending.total.toLocaleString()}</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"50px repeat(7,1fr)" }}>
                <div>
                  {HOURS.map(h=>(
                    <div key={h} style={{ height:"40px", display:"flex", alignItems:"flex-start", paddingTop:"4px", fontSize:"10px", color:"#C4A882", justifyContent:"flex-end", paddingRight:"8px" }}>{fmtH(h)}</div>
                  ))}
                </div>
                {DAYS.map((_,dayIndex)=>(
                  <div key={dayIndex} style={{ position:"relative", borderLeft:"1px solid #EDE8E0" }}>
                    {HOURS.map(h=>(
                      <div key={h} className="hour-cell" onClick={()=>openAdd(dayIndex,h)} style={{ height:"40px", borderBottom:`1px solid ${h%2===0?"#EDE8E0":"#F3EEE8"}` }}/>
                    ))}
                    {filteredBlocks.filter(b=>b.day===dayIndex).map(block=>{
                      const col = block.color||"#2D4A3E";
                      const top = (block.startHour-5)*40;
                      const height = (block.endHour-block.startHour)*40-2;
                      return (
                        <div key={block.id} className="block-item" onClick={e=>openEdit(block,e)} onMouseEnter={()=>setHoveredBlock(block.id)} onMouseLeave={()=>setHoveredBlock(null)}
                          style={{ position:"absolute", top:`${top+1}px`, left:"2px", right:"2px", height:`${height}px`, background:hexAlpha(col,0.12), borderLeft:`3px solid ${col}`, borderRadius:"3px", padding:"4px 6px", cursor:"pointer", overflow:"hidden", zIndex:2 }}>
                          {height>28 && <div style={{ fontSize:"10px", fontWeight:500, color:col, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{block.title}</div>}
                          {height>46 && block.hasCost && block.cost>0 && <div style={{ fontSize:"9px", color:col, opacity:0.75 }}>R{block.cost}</div>}
                          {hoveredBlock===block.id && <button onClick={e=>deleteBlock(block.id,e)} style={{ position:"absolute", top:"3px", right:"3px", background:col, border:"none", color:"#fff", width:"14px", height:"14px", borderRadius:"2px", cursor:"pointer", fontSize:"10px", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>×</button>}
                        </div>
                      );
                    })}
                    {/* Debit order indicators */}
                    {debits.filter(d=>{
                      const today = new Date();
                      const weekStart = new Date(today);
                      const diff = today.getDay()===0?-6:1-today.getDay();
                      weekStart.setDate(today.getDate()+diff);
                      const dayDate = new Date(weekStart);
                      dayDate.setDate(weekStart.getDate()+dayIndex);
                      return d.day===dayDate.getDate();
                    }).map(d=>(
                      <div key={d.id} style={{ position:"absolute", bottom:"4px", left:"2px", right:"2px", background:hexAlpha(d.color,0.15), borderLeft:`2px solid ${d.color}`, borderRadius:"2px", padding:"2px 5px", zIndex:3 }}>
                        <div style={{ fontSize:"9px", color:d.color, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.name} · R{d.amount}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── BUDGET TAB ── */}
      {tab==="budget" && (
        <div style={{ padding:"28px", background:"#F8F5F0" }}>
          <div style={{ maxWidth:"680px" }}>
            {/* Summary cards */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"28px" }}>
              {[
                { label:"Income", value:fmtCurrency(totalIncome), color:"#F8F5F0", bg:"#1A1A1A" },
                { label:"Committed", value:fmtCurrency(totalSpent), color:"#F8F5F0", bg:"#3A3A3A" },
                { label:"Remaining", value:fmtCurrency(totalRemaining), color:totalRemaining>=0?"#7A9E7E":"#E8A0A0", bg:"#FDFCFA" },
              ].map(card=>(
                <div key={card.label} style={{ background:card.bg, border:"1px solid #E8DDD0", borderRadius:"10px", padding:"18px" }}>
                  <div style={{ fontSize:"10px", color:card.bg==="#1A1A1A"||card.bg==="#3A3A3A"?"#7C7C7C":"#A0A0A0", letterSpacing:"0.1em", marginBottom:"6px" }}>{card.label.toUpperCase()}</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"22px", color:card.color, fontWeight:400 }}>{card.value}</div>
                  <div style={{ fontSize:"10px", color:"#7C7C7C", marginTop:"4px", letterSpacing:"0.05em" }}>{period}</div>
                </div>
              ))}
            </div>

            {/* Overall progress bar */}
            <div style={{ marginBottom:"28px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                <span style={{ fontSize:"11px", color:"#7C7C7C", letterSpacing:"0.08em" }}>BUDGET USED</span>
                <span style={{ fontSize:"11px", color:"#7C7C7C" }}>{totalIncome>0?Math.round((totalSpent/totalIncome)*100):0}%</span>
              </div>
              <div style={{ height:"6px", background:"#E8DDD0", borderRadius:"3px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.min(100, totalIncome>0?(totalSpent/totalIncome)*100:0)}%`, background: totalSpent/totalIncome > 0.9 ? "#E8A0A0" : "#2D4A3E", borderRadius:"3px", transition:"width 0.5s" }}/>
              </div>
            </div>

            {/* Category breakdown */}
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"20px", fontWeight:300, color:"#1A1A1A", marginBottom:"16px" }}>Category Breakdown</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {BUDGET_CATEGORIES.map(cat=>{
                const allocated = totalIncome * ((userData.allocations[cat.key]||0)/100);
                const spent = spentByCategory[cat.key]||0;
                const pct = allocated>0?Math.min(100,(spent/allocated)*100):0;
                const over = spent > allocated;
                return (
                  <div key={cat.key} className="card" style={{ background:"#FDFCFA", border:"1px solid #E8DDD0", borderRadius:"8px", padding:"14px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                        <div style={{ width:"8px", height:"8px", background:cat.color, borderRadius:"50%" }}/>
                        <span style={{ fontSize:"13px", color:"#1A1A1A", fontWeight:400 }}>{cat.label}</span>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <span style={{ fontSize:"13px", color:over?"#E8A0A0":"#1A1A1A", fontWeight:over?500:400 }}>{fmtCurrency(spent)}</span>
                        <span style={{ fontSize:"11px", color:"#7C7C7C" }}> / {fmtCurrency(allocated)}</span>
                      </div>
                    </div>
                    <div style={{ height:"4px", background:"#E8DDD0", borderRadius:"2px", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:over?"#E8A0A0":cat.color, borderRadius:"2px", transition:"width 0.4s" }}/>
                    </div>
                    {over && <div style={{ fontSize:"10px", color:"#E8A0A0", marginTop:"5px", letterSpacing:"0.04em" }}>Over budget by {fmtCurrency(spent-allocated)}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── DEBITS TAB ── */}
      {tab==="debits" && (
        <div style={{ padding:"28px" }}>
          <div style={{ maxWidth:"560px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
              <div>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"26px", fontWeight:300, color:"#1A1A1A", marginBottom:"4px" }}>Debit Orders</h2>
                <p style={{ fontSize:"13px", color:"#7C7C7C", fontWeight:300 }}>Total monthly: <span style={{ color:"#1A1A1A", fontWeight:500 }}>{fmtCurrency(debitTotal)}</span></p>
              </div>
              <button onClick={()=>{ setDebitForm({ name:"", amount:"", day:1, budgetCat:"bills", color:"#6E7A8A" }); setDebitModal("add"); }} style={{ background:"#1A1A1A", border:"none", borderRadius:"6px", padding:"10px 16px", color:"#F8F5F0", fontSize:"11px", cursor:"pointer", letterSpacing:"0.08em" }}>+ ADD</button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {debits.map(d=>{
                const cat = BUDGET_CATEGORIES.find(c=>c.key===d.budgetCat);
                return (
                  <div key={d.id} className="card" style={{ background:"#FDFCFA", border:"1px solid #E8DDD0", borderLeft:`3px solid ${d.color}`, borderRadius:"8px", padding:"14px 18px", display:"flex", alignItems:"center", gap:"14px" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:500, fontSize:"14px", color:"#1A1A1A", marginBottom:"3px" }}>{d.name}</div>
                      <div style={{ fontSize:"11px", color:"#7C7C7C", letterSpacing:"0.04em" }}>Day {d.day} of month · {cat?.label||d.budgetCat}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"18px", color:"#1A1A1A" }}>{fmtCurrency(d.amount)}</div>
                      <button onClick={()=>setDebits(prev=>prev.filter(x=>x.id!==d.id))} style={{ fontSize:"10px", color:"#E8A0A0", background:"transparent", border:"none", cursor:"pointer", letterSpacing:"0.05em", marginTop:"2px" }}>REMOVE</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── AI ADVICE TAB ── */}
      {tab==="ai" && (
        <div style={{ padding:"28px" }}>
          <div style={{ maxWidth:"600px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"24px" }}>
              <div>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"26px", fontWeight:300, color:"#1A1A1A", marginBottom:"6px" }}>AI Budget Advice</h2>
                <p style={{ fontSize:"13px", color:"#7C7C7C", fontWeight:300, lineHeight:1.6 }}>Claude analyses your spending and gives you personalised money-saving tips.</p>
              </div>
              <button onClick={runAI} disabled={aiLoading} style={{ background:"#1A1A1A", border:"none", borderRadius:"6px", padding:"10px 18px", color:"#F8F5F0", fontSize:"11px", cursor:aiLoading?"not-allowed":"pointer", letterSpacing:"0.1em", opacity:aiLoading?0.6:1, flexShrink:0 }}>
                {aiLoading?"ANALYSING...":"ANALYSE"}
              </button>
            </div>

            {!aiAdvice && !aiLoading && (
              <div style={{ background:"#FDFCFA", border:"1px solid #E8DDD0", borderRadius:"8px", padding:"40px", textAlign:"center" }}>
                <p style={{ color:"#C4A882", fontSize:"13px", letterSpacing:"0.05em" }}>Click Analyse to get your personalised budget advice</p>
              </div>
            )}

            {aiLoading && (
              <div style={{ background:"#FDFCFA", border:"1px solid #E8DDD0", borderRadius:"8px", padding:"40px", textAlign:"center" }}>
                <p style={{ color:"#7C7C7C", fontSize:"13px", letterSpacing:"0.05em" }}>Analysing your spending patterns...</p>
              </div>
            )}

            {aiAdvice && (
              <>
                <div style={{ background:"#1A1A1A", borderRadius:"8px", padding:"16px 20px", marginBottom:"16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:"12px", color:"#7C7C7C", letterSpacing:"0.05em" }}>Potential monthly savings</span>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"24px", color:"#7A9E7E" }}>{fmtCurrency(aiAdvice.reduce((s,a)=>s+(a.saving||0),0))}</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  {aiAdvice.map((a,i)=>{
                    const cat = BUDGET_CATEGORIES.find(c=>c.key===a.category);
                    return (
                      <div key={i} className="card" style={{ animationDelay:`${i*0.08}s`, background:"#FDFCFA", border:"1px solid #E8DDD0", borderLeft:`3px solid ${cat?.color||"#2D4A3E"}`, borderRadius:"6px", padding:"16px 18px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"6px" }}>
                          <span style={{ fontWeight:500, fontSize:"14px", color:"#1A1A1A" }}>{a.tip}</span>
                          <span style={{ fontSize:"12px", color:"#7A9E7E", fontWeight:500, flexShrink:0, marginLeft:"12px" }}>Save R{(a.saving||0).toLocaleString()}/mo</span>
                        </div>
                        <p style={{ margin:0, fontSize:"12px", color:"#7C7C7C", lineHeight:1.6, fontWeight:300 }}>{a.detail}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── EVENT MODAL ── */}
      {modal && (
        <div className="modal-bg" onClick={()=>setModal(null)} style={{ position:"fixed", inset:0, background:"rgba(26,26,26,0.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:"20px" }}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ background:"#FDFCFA", border:"1px solid #E8DDD0", borderRadius:"14px", padding:"26px", width:"100%", maxWidth:"420px", maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,0.12)" }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"20px", fontWeight:300, letterSpacing:"0.08em", margin:"0 0 18px", color:"#1A1A1A" }}>
              {modal.mode==="add"?`ADD TO ${DAYS[modal.day].toUpperCase()}`:"EDIT BLOCK"}
            </h2>

            {/* Day spending summary */}
            {form.daySpending && (form.daySpending.blocks.length>0 || form.daySpending.debits.length>0) && (
              <div style={{ background:"#F3EEE8", border:"1px solid #E8DDD0", borderRadius:"8px", padding:"12px 14px", marginBottom:"16px" }}>
                <div style={{ fontSize:"10px", color:"#7C7C7C", letterSpacing:"0.1em", marginBottom:"8px" }}>TODAY'S SPENDING BREAKDOWN</div>
                {form.daySpending.blocks.map(b=>(
                  <div key={b.id} style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:"#1A1A1A", marginBottom:"4px" }}>
                    <span>{b.title}</span><span style={{ color:"#C4A882" }}>{fmtCurrency(b.cost)}</span>
                  </div>
                ))}
                {form.daySpending.debits.map(d=>(
                  <div key={d.id} style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:"#1A1A1A", marginBottom:"4px" }}>
                    <span>{d.name} (debit)</span><span style={{ color:"#E8A0A0" }}>{fmtCurrency(d.amount)}</span>
                  </div>
                ))}
                <div style={{ borderTop:"1px solid #E8DDD0", marginTop:"8px", paddingTop:"8px", display:"flex", justifyContent:"space-between", fontSize:"12px", fontWeight:500 }}>
                  <span>Day total</span><span>{fmtCurrency(form.daySpending.total)}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", color:totalRemaining>0?"#7A9E7E":"#E8A0A0", marginTop:"4px" }}>
                  <span>Remaining budget</span><span>{fmtCurrency(totalRemaining)}</span>
                </div>
              </div>
            )}

            <label style={labelStyle}>TITLE</label>
            <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
              <input value={form.title||""} onChange={e=>setForm({...form,title:e.target.value,autoTitle:false})} style={{...inputStyle, flex:1}}/>
              <button onClick={()=>setForm(f=>({...f,autoTitle:!f.autoTitle}))} style={{ background:form.autoTitle?"#1A1A1A":"transparent", border:"1px solid #E8DDD0", borderRadius:"6px", padding:"8px 10px", cursor:"pointer", fontSize:"10px", color:form.autoTitle?"#F8F5F0":"#7C7C7C", letterSpacing:"0.06em" }}>AUTO</button>
            </div>

            <label style={labelStyle}>CATEGORY</label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"5px", marginBottom:"14px" }}>
              {Object.entries(CAL_CATEGORIES).map(([key,cat])=>(
                <button key={key} onClick={()=>setForm({...form,category:key})} style={{ padding:"6px 3px", background:form.category===key?"#1A1A1A":"transparent", border:`1px solid ${form.category===key?"#1A1A1A":"#E8DDD0"}`, borderRadius:"4px", cursor:"pointer", color:form.category===key?"#F8F5F0":"#7C7C7C", fontSize:"9px", letterSpacing:"0.04em" }}>
                  {cat.label.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"14px" }}>
              {["startHour","endHour"].map(field=>(
                <div key={field}>
                  <label style={labelStyle}>{field==="startHour"?"START":"END"}</label>
                  <select value={form[field]} onChange={e=>setForm(f=>({...f,[field]:parseInt(e.target.value)}))} style={inputStyle}>
                    {HOURS.map(h=><option key={h} value={h}>{fmtHLong(h)}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <label style={labelStyle}>EVENT COLOUR</label>
            <div style={{ display:"flex", gap:"7px", flexWrap:"wrap", marginBottom:"14px" }}>
              {EVENT_COLORS.map(c=>(
                <button key={c} onClick={()=>setForm({...form,color:c})} style={{ width:"24px", height:"24px", background:c, border:`2px solid ${form.color===c?"#1A1A1A":"transparent"}`, borderRadius:"50%", cursor:"pointer" }}/>
              ))}
            </div>

            {/* Cost section */}
            <div style={{ background:"#F3EEE8", border:"1px solid #E8DDD0", borderRadius:"8px", padding:"14px", marginBottom:"14px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:form.hasCost?"12px":"0" }}>
                <span style={{ fontSize:"11px", color:"#7C7C7C", letterSpacing:"0.08em" }}>HAS A COST?</span>
                <button onClick={()=>setForm(f=>({...f,hasCost:!f.hasCost}))} style={{ width:"36px", height:"20px", background:form.hasCost?"#2D4A3E":"#D4C9BB", borderRadius:"10px", border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s" }}>
                  <div style={{ position:"absolute", top:"2px", left:form.hasCost?"18px":"2px", width:"16px", height:"16px", background:"#fff", borderRadius:"50%", transition:"left 0.2s" }}/>
                </button>
              </div>
              {form.hasCost && (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                    <div>
                      <label style={labelStyle}>AMOUNT (R)</label>
                      <input value={form.cost||""} onChange={e=>setForm({...form,cost:e.target.value})} placeholder="0.00" type="number" style={inputStyle}/>
                    </div>
                    <div>
                      <label style={labelStyle}>BUDGET CATEGORY</label>
                      <select value={form.budgetCat||"groceries"} onChange={e=>setForm({...form,budgetCat:e.target.value})} style={inputStyle}>
                        {BUDGET_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {form.cost && parseFloat(form.cost)>0 && (
                    <div style={{ marginTop:"10px", fontSize:"11px", color:totalRemaining-parseFloat(form.cost||0)>=0?"#7A9E7E":"#E8A0A0", letterSpacing:"0.04em" }}>
                      After this: {fmtCurrency(totalRemaining - parseFloat(form.cost||0))} remaining
                    </div>
                  )}
                </>
              )}
            </div>

            <label style={labelStyle}>REPEAT</label>
            <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"14px" }}>
              {RECUR_OPTIONS.map(r=>(
                <button key={r} onClick={()=>setForm({...form,recur:r})} style={{ padding:"5px 10px", background:form.recur===r?"#1A1A1A":"transparent", border:`1px solid ${form.recur===r?"#1A1A1A":"#E8DDD0"}`, borderRadius:"4px", cursor:"pointer", color:form.recur===r?"#F8F5F0":"#7C7C7C", fontSize:"10px", letterSpacing:"0.05em", textTransform:"capitalize" }}>{r}</button>
              ))}
            </div>

            <label style={labelStyle}>REMINDER</label>
            <select value={form.reminder||0} onChange={e=>setForm({...form,reminder:parseInt(e.target.value)})} style={{...inputStyle, marginBottom:"18px"}}>
              {[[0,"No reminder"],[5,"5 min before"],[10,"10 min before"],[15,"15 min before"],[30,"30 min before"],[60,"1 hour before"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>

            {form.endHour<=form.startHour && <div style={{ background:"#FDF0F0", border:"1px solid #E8C4C4", borderRadius:"6px", padding:"8px 12px", fontSize:"11px", color:"#A05050", marginBottom:"12px" }}>End time must be after start time</div>}

            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={()=>setModal(null)} style={{ flex:1, padding:"11px", background:"transparent", border:"1px solid #E8DDD0", borderRadius:"8px", color:"#7C7C7C", fontSize:"11px", cursor:"pointer", letterSpacing:"0.08em" }}>CANCEL</button>
              <button onClick={saveBlock} style={{ flex:2, padding:"11px", background:form.title&&form.endHour>form.startHour?"#1A1A1A":"#E8DDD0", border:"none", borderRadius:"8px", color:form.title&&form.endHour>form.startHour?"#F8F5F0":"#A0A0A0", fontSize:"11px", cursor:"pointer", fontWeight:500, letterSpacing:"0.08em" }}>
                {modal.mode==="add"?"ADD BLOCK":"SAVE CHANGES"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DEBIT MODAL ── */}
      {debitModal && (
        <div className="modal-bg" onClick={()=>setDebitModal(null)} style={{ position:"fixed", inset:0, background:"rgba(26,26,26,0.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:"20px" }}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ background:"#FDFCFA", border:"1px solid #E8DDD0", borderRadius:"14px", padding:"26px", width:"100%", maxWidth:"380px", boxShadow:"0 24px 60px rgba(0,0,0,0.12)" }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"20px", fontWeight:300, margin:"0 0 20px", color:"#1A1A1A" }}>ADD DEBIT ORDER</h2>

            <label style={labelStyle}>NAME</label>
            <input value={debitForm.name} onChange={e=>setDebitForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Netflix" style={{...inputStyle, marginBottom:"14px"}}/>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"14px" }}>
              <div>
                <label style={labelStyle}>AMOUNT (R)</label>
                <input value={debitForm.amount} onChange={e=>setDebitForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" type="number" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>DEBIT DAY</label>
                <input value={debitForm.day} onChange={e=>setDebitForm(f=>({...f,day:parseInt(e.target.value)||1}))} type="number" min="1" max="31" style={inputStyle}/>
              </div>
            </div>

            <label style={labelStyle}>CATEGORY</label>
            <select value={debitForm.budgetCat} onChange={e=>setDebitForm(f=>({...f,budgetCat:e.target.value}))} style={{...inputStyle, marginBottom:"20px"}}>
              {BUDGET_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
            </select>

            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={()=>setDebitModal(null)} style={{ flex:1, padding:"11px", background:"transparent", border:"1px solid #E8DDD0", borderRadius:"8px", color:"#7C7C7C", fontSize:"11px", cursor:"pointer", letterSpacing:"0.08em" }}>CANCEL</button>
              <button onClick={()=>{ if(!debitForm.name||!debitForm.amount)return; const cat=BUDGET_CATEGORIES.find(c=>c.key===debitForm.budgetCat); setDebits(prev=>[...prev,{id:Date.now(),...debitForm,amount:parseFloat(debitForm.amount),color:cat?.color||"#6E7A8A"}]); setDebitModal(null); showToast("Debit order added"); }} style={{ flex:2, padding:"11px", background:"#1A1A1A", border:"none", borderRadius:"8px", color:"#F8F5F0", fontSize:"11px", cursor:"pointer", fontWeight:500, letterSpacing:"0.08em" }}>ADD DEBIT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
