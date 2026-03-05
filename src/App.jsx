import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://xyvjnqufsnffosqigbup.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dmpucXVmc25mZm9zcWlnYnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNzI5MjMsImV4cCI6MjA1NjY0ODkyM30.FfbzMCWsNDCsFkWsZ3EeO4r3amhFXhYKFbHKiHBDFqY"
);

const CATEGORIES = {
  work:     { label: "Work" },
  school:   { label: "School" },
  gym:      { label: "Gym" },
  meal:     { label: "Meal Prep" },
  personal: { label: "Personal" },
  weekend:  { label: "Weekend" },
};

const ALL_CATEGORIES = Object.keys(CATEGORIES);

const EVENT_COLORS = [
  { name: "Forest",   value: "#2D4A3E" },
  { name: "Sage",     value: "#7A9E7E" },
  { name: "Charcoal", value: "#3A3A3A" },
  { name: "Stone",    value: "#7C7C7C" },
  { name: "Sand",     value: "#C4A882" },
  { name: "Linen",    value: "#E8DDD0" },
  { name: "Ink",      value: "#1A1A2E" },
  { name: "Mist",     value: "#B0BEC5" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 19 }, (_, i) => i + 5);
const RECUR_OPTIONS = ["none", "daily", "weekly", "weekdays", "weekends"];

const fmtH = h => h === 12 ? "12pm" : h === 0 ? "12am" : h > 12 ? `${h-12}pm` : `${h}am`;
const fmtHLong = h => h === 0 ? "12:00 AM" : h === 12 ? "12:00 PM" : h > 12 ? `${h-12}:00 PM` : `${h}:00 AM`;
const getTimeName = h => h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";

const defaultBlocks = [
  { id:1,  day:0, startHour:9,  endHour:17, category:"work",     title:"Morning Work",     recur:"weekdays", reminder:30, color:"#2D4A3E" },
  { id:2,  day:1, startHour:9,  endHour:17, category:"work",     title:"Morning Work",     recur:"weekdays", reminder:30, color:"#2D4A3E" },
  { id:3,  day:2, startHour:9,  endHour:17, category:"work",     title:"Morning Work",     recur:"weekdays", reminder:30, color:"#2D4A3E" },
  { id:4,  day:3, startHour:9,  endHour:17, category:"work",     title:"Morning Work",     recur:"weekdays", reminder:30, color:"#2D4A3E" },
  { id:5,  day:4, startHour:9,  endHour:17, category:"work",     title:"Morning Work",     recur:"weekdays", reminder:30, color:"#2D4A3E" },
  { id:6,  day:0, startHour:6,  endHour:7,  category:"gym",      title:"Morning Gym",      recur:"weekly",   reminder:15, color:"#3A3A3A" },
  { id:7,  day:2, startHour:6,  endHour:7,  category:"gym",      title:"Morning Gym",      recur:"weekly",   reminder:15, color:"#3A3A3A" },
  { id:8,  day:4, startHour:6,  endHour:7,  category:"gym",      title:"Morning Gym",      recur:"weekly",   reminder:15, color:"#3A3A3A" },
  { id:9,  day:0, startHour:19, endHour:21, category:"school",   title:"Evening Study",    recur:"weekly",   reminder:10, color:"#7C7C7C" },
  { id:10, day:5, startHour:10, endHour:12, category:"meal",     title:"Morning Meal Prep",recur:"weekly",   reminder:20, color:"#C4A882" },
  { id:11, day:5, startHour:14, endHour:20, category:"weekend",  title:"Afternoon Plans",  recur:"none",     reminder:60, color:"#7A9E7E" },
  { id:12, day:1, startHour:19, endHour:21, category:"personal", title:"Evening Time",     recur:"weekly",   reminder:0,  color:"#B0BEC5" },
];

// ─── LANDING PAGE ────────────────────────────────────────────────────────────
function LandingPage({ onSignUp, onLogin }) {
  return (
    <div style={{ minHeight:"100vh", background:"#1A1A1A", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Jost',sans-serif", padding:"40px 20px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@300;400;500;600&display=swap');`}</style>
      <div style={{ textAlign:"center", maxWidth:"480px" }}>
        <div style={{ width:"48px", height:"48px", background:"#2D4A3E", borderRadius:"12px", margin:"0 auto 24px", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:"20px", height:"20px", border:"2px solid #7A9E7E", borderRadius:"50%" }}/>
        </div>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"48px", fontWeight:300, color:"#F8F5F0", letterSpacing:"0.08em", margin:"0 0 12px", lineHeight:1.1 }}>LifeSync</h1>
        <p style={{ color:"#7C7C7C", fontSize:"15px", fontWeight:300, letterSpacing:"0.05em", margin:"0 0 48px", lineHeight:1.7 }}>
          Your weekly rhythm, organised.<br/>Work, rest, health — all in one place.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          <button onClick={onSignUp} style={{ background:"#F8F5F0", border:"none", borderRadius:"8px", padding:"16px 32px", color:"#1A1A1A", fontSize:"14px", fontWeight:500, cursor:"pointer", letterSpacing:"0.08em" }}>
            CREATE ACCOUNT
          </button>
          <button onClick={onLogin} style={{ background:"transparent", border:"1px solid #3A3A3A", borderRadius:"8px", padding:"16px 32px", color:"#7C7C7C", fontSize:"14px", fontWeight:400, cursor:"pointer", letterSpacing:"0.08em" }}>
            SIGN IN
          </button>
        </div>
        <p style={{ color:"#3A3A3A", fontSize:"11px", marginTop:"32px", letterSpacing:"0.05em" }}>Free forever. No credit card required.</p>
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onBack, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#1A1A1A", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Jost',sans-serif", padding:"40px 20px" }}>
      <div style={{ width:"100%", maxWidth:"380px" }}>
        <button onClick={onBack} style={{ background:"transparent", border:"none", color:"#7C7C7C", fontSize:"12px", cursor:"pointer", letterSpacing:"0.08em", marginBottom:"32px", padding:0 }}>← BACK</button>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"32px", fontWeight:300, color:"#F8F5F0", margin:"0 0 8px", letterSpacing:"0.05em" }}>Welcome back</h2>
        <p style={{ color:"#7C7C7C", fontSize:"13px", margin:"0 0 32px", fontWeight:300 }}>Sign in to your LifeSync account</p>

        {error && <div style={{ background:"#3A1A1A", border:"1px solid #6A3A3A", borderRadius:"6px", padding:"10px 14px", fontSize:"12px", color:"#E8A0A0", marginBottom:"16px" }}>{error}</div>}

        <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"5px", letterSpacing:"0.1em" }}>EMAIL</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="your@email.com" style={{ width:"100%", background:"#252525", border:"1px solid #3A3A3A", borderRadius:"6px", padding:"12px 14px", color:"#F8F5F0", fontSize:"14px", outline:"none", marginBottom:"16px", fontFamily:"'Jost',sans-serif" }}/>

        <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"5px", letterSpacing:"0.1em" }}>PASSWORD</label>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" style={{ width:"100%", background:"#252525", border:"1px solid #3A3A3A", borderRadius:"6px", padding:"12px 14px", color:"#F8F5F0", fontSize:"14px", outline:"none", marginBottom:"24px", fontFamily:"'Jost',sans-serif" }} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>

        <button onClick={handleLogin} disabled={loading} style={{ width:"100%", background:"#F8F5F0", border:"none", borderRadius:"8px", padding:"14px", color:"#1A1A1A", fontSize:"13px", fontWeight:500, cursor:"pointer", letterSpacing:"0.08em", opacity:loading?0.7:1 }}>
          {loading ? "SIGNING IN..." : "SIGN IN"}
        </button>
      </div>
    </div>
  );
}

// ─── SIGN UP PAGE ─────────────────────────────────────────────────────────────
function SignUpPage({ onBack, onSuccess }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:"", email:"", password:"", wakeHour:7, sleepHour:23, categories:["work","gym","school","meal","personal","weekend"], avatar:null, avatarPreview:null });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setForm(f => ({ ...f, avatar:file, avatarPreview:ev.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const toggleCategory = (cat) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter(c=>c!==cat) : [...f.categories, cat]
    }));
  };

  const handleSignUp = async () => {
    if (!form.name || !form.email || !form.password) { setError("Please fill in all fields"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({ email:form.email, password:form.password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    let avatarUrl = null;
    if (form.avatar && data.user) {
      const ext = form.avatar.name.split(".").pop();
      const { data: uploadData } = await supabase.storage.from("avatars").upload(`${data.user.id}.${ext}`, form.avatar, { upsert:true });
      if (uploadData) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);
        avatarUrl = urlData.publicUrl;
      }
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        name: form.name,
        email: form.email,
        avatar_url: avatarUrl,
        wake_hour: form.wakeHour,
        sleep_hour: form.sleepHour,
        categories: form.categories,
      });
    }
    setLoading(false);
  };

  const inputStyle = { width:"100%", background:"#252525", border:"1px solid #3A3A3A", borderRadius:"6px", padding:"12px 14px", color:"#F8F5F0", fontSize:"14px", outline:"none", fontFamily:"'Jost',sans-serif", boxSizing:"border-box" };
  const labelStyle = { display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"5px", letterSpacing:"0.1em" };

  return (
    <div style={{ minHeight:"100vh", background:"#1A1A1A", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Jost',sans-serif", padding:"40px 20px" }}>
      <div style={{ width:"100%", maxWidth:"420px" }}>
        <button onClick={step===1?onBack:()=>setStep(s=>s-1)} style={{ background:"transparent", border:"none", color:"#7C7C7C", fontSize:"12px", cursor:"pointer", letterSpacing:"0.08em", marginBottom:"32px", padding:0 }}>← BACK</button>

        {/* Progress */}
        <div style={{ display:"flex", gap:"6px", marginBottom:"32px" }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ flex:1, height:"2px", background:step>=s?"#2D4A3E":"#3A3A3A", borderRadius:"2px", transition:"background 0.3s" }}/>
          ))}
        </div>

        {/* Step 1 — Basic info */}
        {step === 1 && (
          <>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"32px", fontWeight:300, color:"#F8F5F0", margin:"0 0 8px" }}>Create your account</h2>
            <p style={{ color:"#7C7C7C", fontSize:"13px", margin:"0 0 28px", fontWeight:300 }}>Start by setting up your profile</p>

            {error && <div style={{ background:"#3A1A1A", border:"1px solid #6A3A3A", borderRadius:"6px", padding:"10px 14px", fontSize:"12px", color:"#E8A0A0", marginBottom:"16px" }}>{error}</div>}

            {/* Avatar */}
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"24px" }}>
              <label style={{ cursor:"pointer", textAlign:"center" }}>
                <div style={{ width:"80px", height:"80px", borderRadius:"50%", background:"#252525", border:"2px dashed #3A3A3A", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", margin:"0 auto 8px" }}>
                  {form.avatarPreview ? <img src={form.avatarPreview} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ color:"#3A3A3A", fontSize:"24px" }}>+</span>}
                </div>
                <span style={{ fontSize:"10px", color:"#7C7C7C", letterSpacing:"0.08em" }}>ADD PHOTO</span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display:"none" }}/>
              </label>
            </div>

            <label style={labelStyle}>YOUR NAME</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Olivia Wilson" style={{...inputStyle, marginBottom:"16px"}}/>

            <label style={labelStyle}>EMAIL ADDRESS</label>
            <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} type="email" placeholder="your@email.com" style={{...inputStyle, marginBottom:"16px"}}/>

            <label style={labelStyle}>PASSWORD</label>
            <input value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} type="password" placeholder="Min. 6 characters" style={{...inputStyle, marginBottom:"24px"}}/>

            <button onClick={()=>{ if(!form.name||!form.email||!form.password){setError("Please fill in all fields");return;} if(form.password.length<6){setError("Password must be at least 6 characters");return;} setError(""); setStep(2); }} style={{ width:"100%", background:"#F8F5F0", border:"none", borderRadius:"8px", padding:"14px", color:"#1A1A1A", fontSize:"13px", fontWeight:500, cursor:"pointer", letterSpacing:"0.08em" }}>
              CONTINUE
            </button>
          </>
        )}

        {/* Step 2 — Schedule preferences */}
        {step === 2 && (
          <>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"32px", fontWeight:300, color:"#F8F5F0", margin:"0 0 8px" }}>Your daily rhythm</h2>
            <p style={{ color:"#7C7C7C", fontSize:"13px", margin:"0 0 28px", fontWeight:300 }}>When do you wake up and wind down?</p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"32px" }}>
              <div>
                <label style={labelStyle}>WAKE UP TIME</label>
                <select value={form.wakeHour} onChange={e=>setForm(f=>({...f,wakeHour:parseInt(e.target.value)}))} style={{...inputStyle}}>
                  {HOURS.map(h=><option key={h} value={h}>{fmtHLong(h)}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>SLEEP TIME</label>
                <select value={form.sleepHour} onChange={e=>setForm(f=>({...f,sleepHour:parseInt(e.target.value)}))} style={{...inputStyle}}>
                  {HOURS.map(h=><option key={h} value={h}>{fmtHLong(h)}</option>)}
                </select>
              </div>
            </div>

            <button onClick={()=>setStep(3)} style={{ width:"100%", background:"#F8F5F0", border:"none", borderRadius:"8px", padding:"14px", color:"#1A1A1A", fontSize:"13px", fontWeight:500, cursor:"pointer", letterSpacing:"0.08em" }}>
              CONTINUE
            </button>
          </>
        )}

        {/* Step 3 — Categories */}
        {step === 3 && (
          <>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"32px", fontWeight:300, color:"#F8F5F0", margin:"0 0 8px" }}>What's in your week?</h2>
            <p style={{ color:"#7C7C7C", fontSize:"13px", margin:"0 0 28px", fontWeight:300 }}>Select the categories that apply to you</p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"32px" }}>
              {ALL_CATEGORIES.map(cat => {
                const selected = form.categories.includes(cat);
                return (
                  <button key={cat} onClick={()=>toggleCategory(cat)} style={{ padding:"16px", background:selected?"#2D4A3E":"#252525", border:`1px solid ${selected?"#2D4A3E":"#3A3A3A"}`, borderRadius:"8px", cursor:"pointer", color:selected?"#F8F5F0":"#7C7C7C", fontSize:"13px", fontWeight:selected?500:400, letterSpacing:"0.05em", transition:"all 0.2s" }}>
                    {CATEGORIES[cat].label}
                  </button>
                );
              })}
            </div>

            {error && <div style={{ background:"#3A1A1A", border:"1px solid #6A3A3A", borderRadius:"6px", padding:"10px 14px", fontSize:"12px", color:"#E8A0A0", marginBottom:"16px" }}>{error}</div>}

            <button onClick={handleSignUp} disabled={loading} style={{ width:"100%", background:"#F8F5F0", border:"none", borderRadius:"8px", padding:"14px", color:"#1A1A1A", fontSize:"13px", fontWeight:500, cursor:"pointer", letterSpacing:"0.08em", opacity:loading?0.7:1 }}>
              {loading ? "CREATING ACCOUNT..." : "GET STARTED"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN CALENDAR APP ────────────────────────────────────────────────────────
function CalendarApp({ user, profile, onSignOut }) {
  const [blocks, setBlocks] = useState(defaultBlocks);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title:"", category:"work", startHour:9, endHour:10, recur:"none", reminder:0, color:"#2D4A3E", autoTitle:true });
  const [activeFilter, setActiveFilter] = useState(null);
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [tab, setTab] = useState("calendar");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [toast, setToast] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null), 3000); };

  useEffect(() => {
    if (form.autoTitle) {
      const base = CATEGORIES[form.category]?.label || "";
      setForm(f => ({ ...f, title:`${getTimeName(f.startHour)} ${base}` }));
    }
  }, [form.startHour, form.category, form.autoTitle]);

  const openAdd = (day, hour) => {
    setForm({ title:`${getTimeName(hour)} Work`, category:"work", startHour:hour, endHour:hour+1, recur:"none", reminder:0, color:"#2D4A3E", autoTitle:true });
    setModal({ mode:"add", day });
  };

  const openEdit = (block, e) => {
    e.stopPropagation();
    setForm({ title:block.title, category:block.category, startHour:block.startHour, endHour:block.endHour, recur:block.recur||"none", reminder:block.reminder||0, color:block.color||"#2D4A3E", autoTitle:false });
    setModal({ mode:"edit", day:block.day, blockId:block.id });
  };

  const saveBlock = () => {
    if (!form.title || form.endHour <= form.startHour) return;
    if (modal.mode === "add") setBlocks(prev => [...prev, { id:Date.now(), day:modal.day, ...form }]);
    else setBlocks(prev => prev.map(b => b.id === modal.blockId ? { ...b, ...form } : b));
    setModal(null);
  };

  const deleteBlock = (id, e) => { e.stopPropagation(); setBlocks(prev => prev.filter(b=>b.id!==id)); };

  const hexAlpha = (hex, a) => {
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  };

  const filteredBlocks = activeFilter ? blocks.filter(b=>b.category===activeFilter) : blocks;
  const activeCategories = profile?.categories || ALL_CATEGORIES;
  const stats = {};
  activeCategories.forEach(cat => { stats[cat] = blocks.filter(b=>b.category===cat).reduce((s,b)=>s+(b.endHour-b.startHour),0); });

  const firstName = profile?.name ? profile.name.split(" ")[0] : "there";

  return (
    <div style={{ minHeight:"100vh", background:"#F8F5F0", fontFamily:"'Jost',sans-serif", color:"#1A1A1A" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:#F8F5F0; }
        ::-webkit-scrollbar-thumb { background:#C4A882; border-radius:2px; }
        .block-item { transition:opacity 0.15s, transform 0.15s; }
        .block-item:hover { opacity:0.8; }
        .hour-cell:hover { background:rgba(0,0,0,0.03) !important; cursor:pointer; }
        .toast { animation:slideUp 0.3s ease; }
        .modal-bg { animation:fadeIn 0.2s ease; }
        .modal-box { animation:slideUp 0.25s ease; }
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
      `}</style>

      {toast && <div className="toast" style={{ position:"fixed", top:"20px", right:"20px", zIndex:999, background:"#2D4A3E", borderRadius:"8px", padding:"12px 20px", fontSize:"12px", color:"#F8F5F0", letterSpacing:"0.05em", boxShadow:"0 4px 20px rgba(0,0,0,0.15)" }}>{toast}</div>}

      {/* Header */}
      <div style={{ background:"#1A1A1A", padding:"16px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"20px", fontWeight:300, letterSpacing:"0.15em", color:"#F8F5F0", textTransform:"uppercase", margin:0 }}>LifeSync</h1>
          <p style={{ margin:"2px 0 0", fontSize:"11px", color:"#7C7C7C", letterSpacing:"0.08em" }}>Good {getTimeName(new Date().getHours()).toLowerCase()}, {firstName}</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <button onClick={()=>{ const ics="BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR"; const blob=new Blob([ics],{type:"text/calendar"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="lifesync.ics"; a.click(); showToast("Calendar exported"); }} style={{ background:"transparent", border:"1px solid #3A3A3A", borderRadius:"6px", padding:"7px 14px", color:"#C4A882", fontSize:"11px", cursor:"pointer", letterSpacing:"0.08em" }}>
            EXPORT
          </button>
          <div style={{ position:"relative" }}>
            <div onClick={()=>setShowProfileMenu(m=>!m)} style={{ width:"34px", height:"34px", borderRadius:"50%", background:"#2D4A3E", cursor:"pointer", overflow:"hidden", border:"2px solid #3A3A3A", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ color:"#F8F5F0", fontSize:"13px", fontWeight:500 }}>{firstName[0]?.toUpperCase()}</span>}
            </div>
            {showProfileMenu && (
              <div style={{ position:"absolute", top:"42px", right:0, background:"#252525", border:"1px solid #3A3A3A", borderRadius:"8px", padding:"8px", minWidth:"160px", zIndex:50 }}>
                <div style={{ padding:"8px 12px", fontSize:"12px", color:"#7C7C7C", borderBottom:"1px solid #3A3A3A", marginBottom:"6px" }}>{profile?.name || user.email}</div>
                <button onClick={onSignOut} style={{ width:"100%", background:"transparent", border:"none", padding:"8px 12px", color:"#E8A0A0", fontSize:"12px", cursor:"pointer", textAlign:"left", letterSpacing:"0.05em", borderRadius:"4px" }}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:"#F8F5F0", borderBottom:"1px solid #E8DDD0", padding:"0 28px", display:"flex" }}>
        {[["calendar","CALENDAR"],["ai","AI SUGGESTIONS"],["reminders","REMINDERS"]].map(([key,label]) => (
          <button key={key} onClick={()=>setTab(key)} style={{ padding:"13px 18px", fontSize:"11px", fontWeight:500, letterSpacing:"0.1em", color:tab===key?"#1A1A1A":"#7C7C7C", borderBottom:tab===key?"2px solid #2D4A3E":"2px solid transparent", marginBottom:"-1px", background:"transparent", border:"none", cursor:"pointer" }}>{label}</button>
        ))}
      </div>

      {/* CALENDAR */}
      {tab === "calendar" && (
        <>
          <div style={{ padding:"12px 28px", display:"flex", gap:"8px", overflowX:"auto", borderBottom:"1px solid #E8DDD0", background:"#FDFCFA" }}>
            {activeCategories.map(key => (
              <button key={key} onClick={()=>setActiveFilter(activeFilter===key?null:key)} style={{ background:activeFilter===key?"#1A1A1A":"transparent", border:`1px solid ${activeFilter===key?"#1A1A1A":"#D4C9BB"}`, borderRadius:"4px", padding:"5px 12px", cursor:"pointer", color:activeFilter===key?"#F8F5F0":"#7C7C7C", fontSize:"11px", fontWeight:500, letterSpacing:"0.08em", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:"5px" }}>
                {CATEGORIES[key].label.toUpperCase()}
                <span style={{ fontSize:"10px", opacity:0.6 }}>{stats[key]}h</span>
              </button>
            ))}
          </div>

          <div style={{ padding:"0 28px 40px", overflowX:"auto" }}>
            <div style={{ minWidth:"700px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"50px repeat(7,1fr)", marginTop:"14px" }}>
                <div/>
                {DAYS.map((d,i)=>(
                  <div key={d} style={{ textAlign:"center", padding:"7px 2px", fontSize:"11px", fontWeight:500, letterSpacing:"0.1em", color:i>=5?"#2D4A3E":"#7C7C7C" }}>{d}</div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"50px repeat(7,1fr)" }}>
                <div>
                  {HOURS.map(h=>(
                    <div key={h} style={{ height:"40px", display:"flex", alignItems:"flex-start", paddingTop:"4px", fontSize:"10px", color:"#C4A882", justifyContent:"flex-end", paddingRight:"8px", letterSpacing:"0.03em" }}>{fmtH(h)}</div>
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
                        <div key={block.id} className="block-item" onClick={(e)=>openEdit(block,e)} onMouseEnter={()=>setHoveredBlock(block.id)} onMouseLeave={()=>setHoveredBlock(null)} style={{ position:"absolute", top:`${top+1}px`, left:"2px", right:"2px", height:`${height}px`, background:hexAlpha(col,0.12), borderLeft:`3px solid ${col}`, borderRadius:"3px", padding:"4px 6px", cursor:"pointer", overflow:"hidden", zIndex:2 }}>
                          {height>28 && <div style={{ fontSize:"10px", fontWeight:500, color:col, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:"0.02em" }}>{block.title}</div>}
                          {height>46 && <div style={{ fontSize:"9px", color:col, opacity:0.65, marginTop:"1px" }}>{fmtH(block.startHour)}–{fmtH(block.endHour)}</div>}
                          {hoveredBlock===block.id && <button onClick={(e)=>deleteBlock(block.id,e)} style={{ position:"absolute", top:"3px", right:"3px", background:col, border:"none", color:"#fff", width:"14px", height:"14px", borderRadius:"2px", cursor:"pointer", fontSize:"10px", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* AI TAB */}
      {tab === "ai" && (
        <div style={{ padding:"32px", minHeight:"80vh" }}>
          <div style={{ maxWidth:"600px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"24px" }}>
              <div>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"26px", fontWeight:300, color:"#1A1A1A", marginBottom:"6px" }}>AI Suggestions</h2>
                <p style={{ fontSize:"13px", color:"#7C7C7C", fontWeight:300, lineHeight:1.6 }}>Claude analyses your schedule for gaps and missing habits.</p>
              </div>
              <button onClick={async()=>{ setAiLoading(true); setAiSuggestions([]); await new Promise(r=>setTimeout(r,1500)); setAiSuggestions([{ title:"Morning Deep Work", category:"work", startHour:9, endHour:11, day:0, reason:"Reserve your sharpest hours for focused, uninterrupted work.", color:"#2D4A3E" },{ title:"Afternoon Walk", category:"personal", startHour:13, endHour:14, day:2, reason:"A midday movement break resets focus and lowers stress.", color:"#7A9E7E" },{ title:"Evening Study", category:"school", startHour:19, endHour:21, day:1, reason:"A consistent study slot on Tuesday builds academic rhythm.", color:"#7C7C7C" },{ title:"Sunday Review", category:"personal", startHour:20, endHour:21, day:6, reason:"A weekly wind-down review sets you up for a strong Monday.", color:"#C4A882" }]); setAiLoading(false); }} disabled={aiLoading} style={{ background:"#1A1A1A", border:"none", borderRadius:"6px", padding:"10px 18px", color:"#F8F5F0", fontSize:"11px", cursor:aiLoading?"not-allowed":"pointer", letterSpacing:"0.1em", opacity:aiLoading?0.6:1 }}>
                {aiLoading?"ANALYSING...":"ANALYSE"}
              </button>
            </div>
            {!aiLoading && aiSuggestions.length===0 && <div style={{ background:"#FDFCFA", border:"1px solid #E8DDD0", borderRadius:"8px", padding:"40px", textAlign:"center" }}><p style={{ color:"#C4A882", fontSize:"13px", letterSpacing:"0.05em" }}>Click Analyse to get personalised recommendations</p></div>}
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {aiSuggestions.map((s,i)=>(
                <div key={i} style={{ background:"#FDFCFA", border:"1px solid #E8DDD0", borderLeft:`3px solid ${s.color||"#2D4A3E"}`, borderRadius:"6px", padding:"16px 18px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
                    <span style={{ fontWeight:500, fontSize:"14px", color:"#1A1A1A" }}>{s.title}</span>
                    <span style={{ fontSize:"11px", color:"#7C7C7C" }}>{DAYS[s.day]} · {fmtH(s.startHour)}–{fmtH(s.endHour)}</span>
                  </div>
                  <p style={{ margin:"0 0 12px", fontSize:"12px", color:"#7C7C7C", lineHeight:1.6, fontWeight:300 }}>{s.reason}</p>
                  <button onClick={()=>{ setBlocks(prev=>[...prev,{id:Date.now(),...s,recur:"weekly",reminder:15}]); setAiSuggestions(prev=>prev.filter(x=>x!==s)); showToast("Added to your schedule"); }} style={{ background:"transparent", border:`1px solid ${s.color||"#2D4A3E"}`, borderRadius:"4px", padding:"5px 14px", color:s.color||"#2D4A3E", fontSize:"11px", cursor:"pointer", letterSpacing:"0.06em" }}>ADD TO SCHEDULE</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REMINDERS TAB */}
      {tab === "reminders" && (
        <div style={{ padding:"32px", minHeight:"80vh" }}>
          <div style={{ maxWidth:"520px" }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"26px", fontWeight:300, color:"#1A1A1A", marginBottom:"6px" }}>Reminders</h2>
            <p style={{ fontSize:"13px", color:"#7C7C7C", fontWeight:300, marginBottom:"20px" }}>Notification timing for each scheduled block.</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {blocks.filter(b=>b.reminder>0).sort((a,b)=>a.day*100+a.startHour-(b.day*100+b.startHour)).map(block=>(
                <div key={block.id} style={{ background:"#FDFCFA", border:"1px solid #E8DDD0", borderLeft:`3px solid ${block.color||"#2D4A3E"}`, borderRadius:"6px", padding:"14px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:"13px", color:"#1A1A1A", marginBottom:"2px" }}>{block.title}</div>
                    <div style={{ fontSize:"11px", color:"#7C7C7C", letterSpacing:"0.03em" }}>{DAYS[block.day]} · {fmtH(block.startHour)}–{fmtH(block.endHour)}</div>
                  </div>
                  <div style={{ fontSize:"11px", color:"#C4A882", fontWeight:500 }}>{block.reminder} min before</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div className="modal-bg" onClick={()=>setModal(null)} style={{ position:"fixed", inset:0, background:"rgba(26,26,26,0.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ background:"#FDFCFA", border:"1px solid #E8DDD0", borderRadius:"12px", padding:"26px", width:"390px", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.12)" }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"20px", fontWeight:300, letterSpacing:"0.08em", margin:"0 0 20px", color:"#1A1A1A" }}>{modal.mode==="add"?`ADD TO ${DAYS[modal.day].toUpperCase()}`:"EDIT BLOCK"}</h2>

            <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"5px", fontWeight:500, letterSpacing:"0.1em" }}>TITLE</label>
            <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
              <input value={form.title} onChange={e=>setForm({...form,title:e.target.value,autoTitle:false})} style={{ flex:1, background:"#F8F5F0", border:"1px solid #E8DDD0", borderRadius:"6px", padding:"10px 12px", color:"#1A1A1A", fontSize:"13px", outline:"none", fontFamily:"'Jost',sans-serif" }}/>
              <button onClick={()=>setForm(f=>({...f,autoTitle:!f.autoTitle}))} title="Auto-name" style={{ background:form.autoTitle?"#1A1A1A":"transparent", border:"1px solid #E8DDD0", borderRadius:"6px", padding:"8px 10px", cursor:"pointer", fontSize:"10px", color:form.autoTitle?"#F8F5F0":"#7C7C7C", letterSpacing:"0.06em" }}>AUTO</button>
            </div>

            <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"7px", fontWeight:500, letterSpacing:"0.1em" }}>CATEGORY</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px", marginBottom:"14px" }}>
              {activeCategories.map(key=>(
                <button key={key} onClick={()=>setForm({...form,category:key})} style={{ padding:"7px 4px", background:form.category===key?"#1A1A1A":"transparent", border:`1px solid ${form.category===key?"#1A1A1A":"#E8DDD0"}`, borderRadius:"4px", cursor:"pointer", color:form.category===key?"#F8F5F0":"#7C7C7C", fontSize:"10px", letterSpacing:"0.06em" }}>{CATEGORIES[key].label.toUpperCase()}</button>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"14px" }}>
              {["startHour","endHour"].map(field=>(
                <div key={field}>
                  <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"5px", letterSpacing:"0.1em" }}>{field==="startHour"?"START":"END"}</label>
                  <select value={form[field]} onChange={e=>setForm(f=>({...f,[field]:parseInt(e.target.value)}))} style={{ width:"100%", background:"#F8F5F0", border:"1px solid #E8DDD0", borderRadius:"6px", padding:"9px 10px", color:"#1A1A1A", fontSize:"12px", outline:"none", cursor:"pointer", fontFamily:"'Jost',sans-serif" }}>
                    {HOURS.map(h=><option key={h} value={h}>{fmtHLong(h)}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"7px", fontWeight:500, letterSpacing:"0.1em" }}>EVENT COLOUR</label>
            <div style={{ display:"flex", gap:"7px", flexWrap:"wrap", marginBottom:"14px" }}>
              {EVENT_COLORS.map(c=>(
                <button key={c.value} onClick={()=>setForm({...form,color:c.value})} title={c.name} style={{ width:"26px", height:"26px", background:c.value, border:`2px solid ${form.color===c.value?"#1A1A1A":"transparent"}`, borderRadius:"50%", cursor:"pointer" }}/>
              ))}
            </div>

            <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"6px", letterSpacing:"0.1em" }}>REPEAT</label>
            <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"14px" }}>
              {RECUR_OPTIONS.map(r=>(
                <button key={r} onClick={()=>setForm({...form,recur:r})} style={{ padding:"5px 10px", background:form.recur===r?"#1A1A1A":"transparent", border:`1px solid ${form.recur===r?"#1A1A1A":"#E8DDD0"}`, borderRadius:"4px", cursor:"pointer", color:form.recur===r?"#F8F5F0":"#7C7C7C", fontSize:"10px", letterSpacing:"0.05em", textTransform:"capitalize" }}>{r}</button>
              ))}
            </div>

            <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"6px", letterSpacing:"0.1em" }}>REMINDER</label>
            <select value={form.reminder} onChange={e=>setForm({...form,reminder:parseInt(e.target.value)})} style={{ width:"100%", background:"#F8F5F0", border:"1px solid #E8DDD0", borderRadius:"6px", padding:"9px 12px", color:"#1A1A1A", fontSize:"12px", outline:"none", cursor:"pointer", marginBottom:"18px", fontFamily:"'Jost',sans-serif" }}>
              {[[0,"No reminder"],[5,"5 min"],[10,"10 min"],[15,"15 min"],[30,"30 min"],[60,"1 hour"]].map(([v,l])=><option key={v} value={v}>{l} before</option>)}
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
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState("landing"); // landing | login | signup
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setPage("landing");
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#1A1A1A", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#7C7C7C", fontSize:"12px", letterSpacing:"0.1em", fontFamily:"'Jost',sans-serif" }}>LOADING...</div>
    </div>
  );

  if (session) return <CalendarApp user={session.user} profile={profile} onSignOut={handleSignOut}/>;
  if (page === "login") return <LoginPage onBack={()=>setPage("landing")} onSuccess={()=>{}} />;
  if (page === "signup") return <SignUpPage onBack={()=>setPage("landing")} onSuccess={()=>{}} />;
  return <LandingPage onSignUp={()=>setPage("signup")} onLogin={()=>setPage("login")} />;
}
