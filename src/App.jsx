import { useState, useEffect } from "react";

const CATEGORIES = {
  work:     { label: "Work" },
  school:   { label: "School" },
  gym:      { label: "Gym" },
  meal:     { label: "Meal Prep" },
  personal: { label: "Personal" },
  weekend:  { label: "Weekend" },
};

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
const HOURS = Array.from({ length: 19 }, (_, i) => i + 5); // 5am to 11pm
const RECUR_OPTIONS = ["none", "daily", "weekly", "weekdays", "weekends"];

const fmtH = h => h === 12 ? "12pm" : h === 0 ? "12am" : h > 12 ? `${h-12}pm` : `${h}am`;
const fmtHLong = h => h === 0 ? "12:00 AM" : h === 12 ? "12:00 PM" : h > 12 ? `${h-12}:00 PM` : `${h}:00 AM`;

const getTimeName = (startHour) => {
  if (startHour >= 0 && startHour < 12) return "Morning";
  if (startHour >= 12 && startHour < 17) return "Afternoon";
  return "Evening";
};

const defaultBlocks = [
  { id:1,  day:0, startHour:9,  endHour:17, category:"work",     title:"Work Hours",      recur:"weekdays", reminder:30,  color:"#2D4A3E" },
  { id:2,  day:1, startHour:9,  endHour:17, category:"work",     title:"Work Hours",      recur:"weekdays", reminder:30,  color:"#2D4A3E" },
  { id:3,  day:2, startHour:9,  endHour:17, category:"work",     title:"Work Hours",      recur:"weekdays", reminder:30,  color:"#2D4A3E" },
  { id:4,  day:3, startHour:9,  endHour:17, category:"work",     title:"Work Hours",      recur:"weekdays", reminder:30,  color:"#2D4A3E" },
  { id:5,  day:4, startHour:9,  endHour:17, category:"work",     title:"Work Hours",      recur:"weekdays", reminder:30,  color:"#2D4A3E" },
  { id:6,  day:0, startHour:6,  endHour:7,  category:"gym",      title:"Morning Gym",     recur:"weekly",   reminder:15,  color:"#3A3A3A" },
  { id:7,  day:2, startHour:6,  endHour:7,  category:"gym",      title:"Morning Gym",     recur:"weekly",   reminder:15,  color:"#3A3A3A" },
  { id:8,  day:4, startHour:6,  endHour:7,  category:"gym",      title:"Morning Gym",     recur:"weekly",   reminder:15,  color:"#3A3A3A" },
  { id:9,  day:0, startHour:19, endHour:21, category:"school",   title:"Evening Study",   recur:"weekly",   reminder:10,  color:"#7C7C7C" },
  { id:10, day:2, startHour:19, endHour:21, category:"school",   title:"Evening Study",   recur:"weekly",   reminder:10,  color:"#7C7C7C" },
  { id:11, day:5, startHour:10, endHour:12, category:"meal",     title:"Morning Meal Prep",recur:"weekly",  reminder:20,  color:"#C4A882" },
  { id:12, day:5, startHour:14, endHour:22, category:"weekend",  title:"Afternoon Plans", recur:"none",     reminder:60,  color:"#7A9E7E" },
  { id:13, day:6, startHour:14, endHour:20, category:"weekend",  title:"Afternoon Plans", recur:"none",     reminder:60,  color:"#7A9E7E" },
  { id:14, day:1, startHour:19, endHour:21, category:"personal", title:"Evening Time",    recur:"weekly",   reminder:0,   color:"#B0BEC5" },
  { id:15, day:3, startHour:19, endHour:21, category:"personal", title:"Evening Time",    recur:"weekly",   reminder:0,   color:"#B0BEC5" },
];

const AI_SUGGESTIONS = [
  { title:"Morning Deep Work",   category:"work",     startHour:9,  endHour:11, day:0, reason:"Block your sharpest hours for focused, distraction-free work.", color:"#2D4A3E" },
  { title:"Afternoon Walk",      category:"personal", startHour:13, endHour:14, day:2, reason:"A midday movement break resets focus and reduces stress.", color:"#7A9E7E" },
  { title:"Morning Run",         category:"gym",      startHour:6,  endHour:7,  day:1, reason:"Tuesday morning cardio keeps your weekly movement balanced.", color:"#3A3A3A" },
  { title:"Evening Review",      category:"personal", startHour:20, endHour:21, day:6, reason:"A Sunday wind-down review sets you up for a strong Monday.", color:"#7C7C7C" },
];

function exportToGoogleCalendar(blocks) {
  const now = new Date();
  const weekStart = new Date(now);
  const diff = now.getDay() === 0 ? -6 : 1 - now.getDay();
  weekStart.setDate(now.getDate() + diff);
  weekStart.setHours(0,0,0,0);

  let ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//LifeSync//EN\r\nCALSCALE:GREGORIAN\r\n";
  blocks.forEach(block => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + block.day);
    const s = new Date(d); s.setHours(block.startHour,0,0);
    const e = new Date(d); e.setHours(block.endHour,0,0);
    const fmt = x => x.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
    let rrule = "";
    if (block.recur==="daily")    rrule="RRULE:FREQ=DAILY\r\n";
    if (block.recur==="weekly")   rrule="RRULE:FREQ=WEEKLY\r\n";
    if (block.recur==="weekdays") rrule="RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR\r\n";
    if (block.recur==="weekends") rrule="RRULE:FREQ=WEEKLY;BYDAY=SA,SU\r\n";
    let valarm = block.reminder > 0 ? `BEGIN:VALARM\r\nTRIGGER:-PT${block.reminder}M\r\nACTION:DISPLAY\r\nDESCRIPTION:${block.title}\r\nEND:VALARM\r\n` : "";
    ics += `BEGIN:VEVENT\r\nUID:${block.id}@lifesync\r\nDTSTART:${fmt(s)}\r\nDTEND:${fmt(e)}\r\nSUMMARY:${block.title}\r\nCATEGORIES:${CATEGORIES[block.category].label}\r\n${rrule}${valarm}END:VEVENT\r\n`;
  });
  ics += "END:VCALENDAR";
  return ics;
}

export default function LifePlanner() {
  const [blocks, setBlocks] = useState(defaultBlocks);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title:"", category:"work", startHour:9, endHour:10, recur:"none", reminder:0, color:"#2D4A3E", autoTitle:true });
  const [activeFilter, setActiveFilter] = useState(null);
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [tab, setTab] = useState("calendar");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Auto update title when time changes
  useEffect(() => {
    if (form.autoTitle) {
      const base = CATEGORIES[form.category]?.label || "";
      const timeName = getTimeName(form.startHour);
      setForm(f => ({ ...f, title: `${timeName} ${base}` }));
    }
  }, [form.startHour, form.category, form.autoTitle]);

  const openAdd = (day, hour) => {
    const base = "Work";
    const timeName = getTimeName(hour);
    setForm({ title:`${timeName} ${base}`, category:"work", startHour:hour, endHour:hour+1, recur:"none", reminder:0, color:"#2D4A3E", autoTitle:true });
    setModal({ mode:"add", day });
  };

  const openEdit = (block, e) => {
    e.stopPropagation();
    setForm({ title:block.title, category:block.category, startHour:block.startHour, endHour:block.endHour, recur:block.recur||"none", reminder:block.reminder||0, color:block.color||"#2D4A3E", autoTitle:false });
    setModal({ mode:"edit", day:block.day, blockId:block.id });
  };

  const saveBlock = () => {
    if (!form.title || form.endHour <= form.startHour) return;
    if (modal.mode === "add") {
      setBlocks(prev => [...prev, { id:Date.now(), day:modal.day, ...form }]);
    } else {
      setBlocks(prev => prev.map(b => b.id === modal.blockId ? { ...b, ...form } : b));
    }
    setModal(null);
  };

  const deleteBlock = (id, e) => { e.stopPropagation(); setBlocks(prev => prev.filter(b => b.id !== id)); };

  const addSuggestion = (s) => {
    setBlocks(prev => [...prev, { id:Date.now(), ...s, recur:"weekly", reminder:15 }]);
    setAiSuggestions(prev => prev.filter(x => x !== s));
    showToast("Block added to your schedule");
  };

  const runAI = async () => {
    setAiLoading(true); setAiSuggestions([]);
    try {
      const occupied = blocks.map(b => `${DAYS[b.day]} ${fmtH(b.startHour)}-${fmtH(b.endHour)}: ${b.title} (${b.category})`).join("\n");
      const prompt = `You are a minimalist productivity coach. The user has this weekly schedule:\n${occupied}\n\nAnalyse for gaps and suggest exactly 4 improvements as JSON array with fields: title (use format like "Morning Work" or "Evening Study" — time of day + activity, no emojis), category (one of: work/school/gym/meal/personal/weekend), day (0=Mon..6=Sun), startHour (int 5-22), endHour (int 6-23), reason (1 concise sentence), color (one of: #2D4A3E, #7A9E7E, #3A3A3A, #7C7C7C, #C4A882, #B0BEC5). Return ONLY the JSON array.`;
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{ role:"user", content:prompt }] })
      });
      const data = await response.json();
      const text = data.content?.map(c => c.text||"").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setAiSuggestions(parsed);
    } catch(e) {
      setAiSuggestions(AI_SUGGESTIONS);
    }
    setAiLoading(false);
  };

  const getStats = () => {
    const stats = {};
    Object.keys(CATEGORIES).forEach(cat => { stats[cat] = blocks.filter(b=>b.category===cat).reduce((s,b)=>s+(b.endHour-b.startHour),0); });
    return stats;
  };

  const stats = getStats();
  const filteredBlocks = activeFilter ? blocks.filter(b=>b.category===activeFilter) : blocks;
  const reminderBlocks = [...blocks].filter(b=>b.reminder>0).sort((a,b)=>a.day*100+a.startHour-(b.day*100+b.startHour));

  // Hex to rgba helper
  const hexAlpha = (hex, a) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  };

  return (
    <div style={{ minHeight:"100vh", background:"#F8F5F0", fontFamily:"'Cormorant Garamond','Georgia',serif", color:"#1A1A1A" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Jost:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:#F8F5F0; }
        ::-webkit-scrollbar-thumb { background:#C4A882; border-radius:2px; }
        .block-item { transition: opacity 0.15s, transform 0.15s; }
        .block-item:hover { opacity:0.85; transform:scaleX(0.98); }
        .hour-cell:hover { background:rgba(0,0,0,0.03) !important; cursor:pointer; }
        .filter-btn { transition:all 0.2s; border:none; cursor:pointer; font-family:'Jost',sans-serif; }
        .filter-btn:hover { opacity:0.8; }
        .tab-btn { transition:all 0.2s; background:transparent; border:none; cursor:pointer; font-family:'Jost',sans-serif; }
        .modal-bg { animation:fadeIn 0.2s ease; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal-box { animation:slideUp 0.25s ease; }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .ai-card { animation:slideUp 0.3s ease both; }
        .toast { animation:slideUp 0.3s ease; }
        input, select { font-family:'Jost',sans-serif; }
        button { font-family:'Jost',sans-serif; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{ position:"fixed", top:"20px", right:"20px", zIndex:999, background:"#2D4A3E", borderRadius:"10px", padding:"12px 20px", fontSize:"13px", color:"#F8F5F0", letterSpacing:"0.03em", boxShadow:"0 4px 20px rgba(0,0,0,0.15)" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background:"#1A1A1A", padding:"20px 32px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h1 style={{ fontSize:"22px", fontWeight:300, letterSpacing:"0.15em", color:"#F8F5F0", textTransform:"uppercase" }}>LifeSync</h1>
          <p style={{ fontSize:"11px", color:"#7C7C7C", letterSpacing:"0.1em", marginTop:"2px", fontFamily:"'Jost',sans-serif", fontWeight:300 }}>YOUR WEEKLY RHYTHM</p>
        </div>
        <button
          onClick={() => { const ics = exportToGoogleCalendar(blocks); const blob = new Blob([ics],{type:"text/calendar"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download="lifesync.ics"; a.click(); showToast("Calendar exported successfully"); }}
          style={{ background:"transparent", border:"1px solid #3A3A3A", borderRadius:"6px", padding:"8px 16px", color:"#C4A882", fontSize:"12px", fontWeight:400, cursor:"pointer", letterSpacing:"0.08em" }}
        >
          EXPORT CALENDAR
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background:"#F8F5F0", borderBottom:"1px solid #E8DDD0", padding:"0 32px", display:"flex", gap:"0" }}>
        {[["calendar","CALENDAR"],["ai","AI SUGGESTIONS"],["reminders","REMINDERS"]].map(([key,label]) => (
          <button key={key} className="tab-btn" onClick={()=>setTab(key)} style={{
            padding:"14px 20px", fontSize:"11px", fontWeight:500, letterSpacing:"0.1em",
            color: tab===key ? "#1A1A1A" : "#7C7C7C",
            borderBottom: tab===key ? "2px solid #2D4A3E" : "2px solid transparent",
            marginBottom:"-1px"
          }}>{label}</button>
        ))}
      </div>

      {/* CALENDAR TAB */}
      {tab === "calendar" && (
        <>
          {/* Filters */}
          <div style={{ padding:"14px 32px", display:"flex", gap:"8px", overflowX:"auto", borderBottom:"1px solid #E8DDD0", background:"#FDFCFA" }}>
            {Object.entries(CATEGORIES).map(([key,cat]) => (
              <button key={key} className="filter-btn" onClick={()=>setActiveFilter(activeFilter===key?null:key)} style={{
                background: activeFilter===key ? "#1A1A1A" : "transparent",
                border:`1px solid ${activeFilter===key ? "#1A1A1A" : "#D4C9BB"}`,
                borderRadius:"4px", padding:"6px 14px",
                color: activeFilter===key ? "#F8F5F0" : "#7C7C7C",
                fontSize:"11px", fontWeight:500, letterSpacing:"0.08em", whiteSpace:"nowrap",
                display:"flex", alignItems:"center", gap:"6px"
              }}>
                {cat.label.toUpperCase()}
                <span style={{ fontSize:"10px", opacity:0.7 }}>{stats[key]}h</span>
              </button>
            ))}
            <div style={{ marginLeft:"auto", fontSize:"11px", color:"#C4A882", display:"flex", alignItems:"center", whiteSpace:"nowrap", fontFamily:"'Jost',sans-serif", letterSpacing:"0.05em" }}>
              Click cell to add
            </div>
          </div>

          {/* Grid */}
          <div style={{ padding:"0 32px 40px", overflowX:"auto", background:"#F8F5F0" }}>
            <div style={{ minWidth:"700px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"52px repeat(7,1fr)", marginTop:"16px" }}>
                <div/>
                {DAYS.map((d,i) => (
                  <div key={d} style={{ textAlign:"center", padding:"8px 4px", fontSize:"11px", fontWeight:500, letterSpacing:"0.1em", color:i>=5?"#2D4A3E":"#7C7C7C", fontFamily:"'Jost',sans-serif" }}>{d}</div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"52px repeat(7,1fr)", position:"relative" }}>
                <div>
                  {HOURS.map(h => (
                    <div key={h} style={{ height:"40px", display:"flex", alignItems:"flex-start", paddingTop:"4px", fontSize:"10px", color:"#C4A882", justifyContent:"flex-end", paddingRight:"10px", fontFamily:"'Jost',sans-serif", letterSpacing:"0.03em" }}>
                      {fmtH(h)}
                    </div>
                  ))}
                </div>
                {DAYS.map((_,dayIndex) => (
                  <div key={dayIndex} style={{ position:"relative", borderLeft:"1px solid #EDE8E0" }}>
                    {HOURS.map(h => (
                      <div key={h} className="hour-cell" onClick={()=>openAdd(dayIndex,h)} style={{ height:"40px", borderBottom:`1px solid ${h%2===0?"#EDE8E0":"#F3EEE8"}`, background:"transparent" }}/>
                    ))}
                    {filteredBlocks.filter(b=>b.day===dayIndex).map(block => {
                      const col = block.color || "#2D4A3E";
                      const top = (block.startHour - 5)*40;
                      const height = (block.endHour - block.startHour)*40 - 2;
                      return (
                        <div key={block.id} className="block-item" onClick={(e)=>openEdit(block,e)}
                          onMouseEnter={()=>setHoveredBlock(block.id)} onMouseLeave={()=>setHoveredBlock(null)}
                          style={{
                            position:"absolute", top:`${top+1}px`, left:"2px", right:"2px", height:`${height}px`,
                            background: hexAlpha(col, 0.12),
                            borderLeft:`3px solid ${col}`,
                            borderRadius:"3px", padding:"4px 7px", cursor:"pointer", overflow:"hidden", zIndex:2,
                          }}>
                          {height > 30 && <div style={{ fontSize:"10px", fontWeight:500, color:col, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'Jost',sans-serif", letterSpacing:"0.03em" }}>{block.title}</div>}
                          {height > 50 && <div style={{ fontSize:"9px", color:col, opacity:0.7, marginTop:"1px", fontFamily:"'Jost',sans-serif" }}>{fmtH(block.startHour)} – {fmtH(block.endHour)}</div>}
                          {hoveredBlock===block.id && (
                            <button onClick={(e)=>deleteBlock(block.id,e)} style={{ position:"absolute", top:"3px", right:"3px", background:col, border:"none", color:"#fff", width:"14px", height:"14px", borderRadius:"2px", cursor:"pointer", fontSize:"10px", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>×</button>
                          )}
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
        <div style={{ padding:"32px", background:"#F8F5F0", minHeight:"80vh" }}>
          <div style={{ maxWidth:"640px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"24px" }}>
              <div>
                <h2 style={{ fontSize:"22px", fontWeight:300, letterSpacing:"0.1em", color:"#1A1A1A", marginBottom:"6px" }}>AI Suggestions</h2>
                <p style={{ fontSize:"13px", color:"#7C7C7C", fontFamily:"'Jost',sans-serif", fontWeight:300, lineHeight:1.6 }}>Claude analyses your schedule for imbalances and missing habits.</p>
              </div>
              <button onClick={runAI} disabled={aiLoading} style={{ background:"#1A1A1A", border:"none", borderRadius:"6px", padding:"10px 20px", color:"#F8F5F0", fontSize:"11px", fontWeight:500, cursor:aiLoading?"not-allowed":"pointer", letterSpacing:"0.1em", opacity:aiLoading?0.6:1 }}>
                {aiLoading ? "ANALYSING..." : "ANALYSE"}
              </button>
            </div>

            {!aiLoading && aiSuggestions.length === 0 && (
              <div style={{ background:"#FDFCFA", border:"1px solid #E8DDD0", borderRadius:"8px", padding:"40px", textAlign:"center" }}>
                <p style={{ color:"#C4A882", fontSize:"13px", fontFamily:"'Jost',sans-serif", letterSpacing:"0.05em" }}>Click Analyse to get personalised recommendations</p>
              </div>
            )}

            {aiLoading && (
              <div style={{ background:"#FDFCFA", border:"1px solid #E8DDD0", borderRadius:"8px", padding:"40px", textAlign:"center" }}>
                <p style={{ color:"#7C7C7C", fontSize:"13px", fontFamily:"'Jost',sans-serif", letterSpacing:"0.05em" }}>Analysing your weekly schedule...</p>
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {aiSuggestions.map((s,i) => {
                const col = s.color || "#2D4A3E";
                return (
                  <div key={i} className="ai-card" style={{ animationDelay:`${i*0.07}s`, background:"#FDFCFA", border:"1px solid #E8DDD0", borderLeft:`3px solid ${col}`, borderRadius:"6px", padding:"18px 20px", display:"flex", gap:"16px", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
                        <span style={{ fontWeight:500, color:"#1A1A1A", fontSize:"14px", letterSpacing:"0.03em" }}>{s.title}</span>
                        <span style={{ fontSize:"11px", color:"#7C7C7C", fontFamily:"'Jost',sans-serif" }}>{DAYS[s.day]} · {fmtH(s.startHour)}–{fmtH(s.endHour)}</span>
                      </div>
                      <p style={{ margin:"0 0 12px", fontSize:"12px", color:"#7C7C7C", lineHeight:1.6, fontFamily:"'Jost',sans-serif", fontWeight:300 }}>{s.reason}</p>
                      <button onClick={()=>addSuggestion(s)} style={{ background:"transparent", border:`1px solid ${col}`, borderRadius:"4px", padding:"5px 14px", color:col, fontSize:"11px", fontWeight:500, cursor:"pointer", letterSpacing:"0.06em" }}>
                        ADD TO SCHEDULE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* REMINDERS TAB */}
      {tab === "reminders" && (
        <div style={{ padding:"32px", background:"#F8F5F0", minHeight:"80vh" }}>
          <div style={{ maxWidth:"560px" }}>
            <h2 style={{ fontSize:"22px", fontWeight:300, letterSpacing:"0.1em", color:"#1A1A1A", marginBottom:"6px" }}>Reminders</h2>
            <p style={{ fontSize:"13px", color:"#7C7C7C", fontFamily:"'Jost',sans-serif", fontWeight:300, marginBottom:"20px" }}>Notification timing for each scheduled block.</p>

            <div style={{ background:"#FDF8F0", border:"1px solid #E8D5B0", borderRadius:"6px", padding:"12px 16px", marginBottom:"20px", fontSize:"12px", color:"#C4A882", fontFamily:"'Jost',sans-serif", letterSpacing:"0.03em" }}>
              Reminders are exported with your calendar file and trigger in Google Calendar automatically.
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {reminderBlocks.map(block => {
                const col = block.color || "#2D4A3E";
                return (
                  <div key={block.id} style={{ background:"#FDFCFA", border:"1px solid #E8DDD0", borderLeft:`3px solid ${col}`, borderRadius:"6px", padding:"14px 18px", display:"flex", alignItems:"center", gap:"14px" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:500, fontSize:"14px", color:"#1A1A1A", marginBottom:"3px", letterSpacing:"0.02em" }}>{block.title}</div>
                      <div style={{ fontSize:"11px", color:"#7C7C7C", fontFamily:"'Jost',sans-serif", letterSpacing:"0.04em" }}>{DAYS[block.day]} · {fmtH(block.startHour)}–{fmtH(block.endHour)} · {block.recur}</div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:"12px", fontWeight:500, color:"#C4A882", fontFamily:"'Jost',sans-serif" }}>{block.reminder} min before</div>
                      <button onClick={(e)=>{e.stopPropagation();openEdit(block,e)}} style={{ marginTop:"4px", background:"transparent", border:"1px solid #E8DDD0", borderRadius:"4px", padding:"3px 10px", color:"#7C7C7C", fontSize:"10px", cursor:"pointer", letterSpacing:"0.06em" }}>EDIT</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div className="modal-bg" onClick={()=>setModal(null)} style={{ position:"fixed", inset:0, background:"rgba(26,26,26,0.5)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ background:"#FDFCFA", border:"1px solid #E8DDD0", borderRadius:"12px", padding:"28px", width:"400px", boxShadow:"0 20px 60px rgba(0,0,0,0.15)", maxHeight:"90vh", overflowY:"auto" }}>
            <h2 style={{ fontSize:"18px", fontWeight:300, letterSpacing:"0.1em", margin:"0 0 20px", color:"#1A1A1A" }}>
              {modal.mode==="add" ? `ADD TO ${DAYS[modal.day].toUpperCase()}` : "EDIT BLOCK"}
            </h2>

            {/* Title */}
            <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"5px", fontWeight:500, letterSpacing:"0.1em", fontFamily:"'Jost',sans-serif" }}>TITLE</label>
            <div style={{ display:"flex", gap:"8px", marginBottom:"16px", alignItems:"center" }}>
              <input value={form.title} onChange={e=>setForm({...form, title:e.target.value, autoTitle:false})} placeholder="Event name" style={{ flex:1, background:"#F8F5F0", border:"1px solid #E8DDD0", borderRadius:"6px", padding:"10px 12px", color:"#1A1A1A", fontSize:"14px", outline:"none", letterSpacing:"0.02em" }}/>
              <button onClick={()=>setForm(f=>({...f,autoTitle:!f.autoTitle}))} title="Auto-name from time" style={{ background:form.autoTitle?"#1A1A1A":"transparent", border:"1px solid #E8DDD0", borderRadius:"6px", padding:"10px 10px", cursor:"pointer", fontSize:"11px", color:form.autoTitle?"#F8F5F0":"#7C7C7C", letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
                AUTO
              </button>
            </div>

            {/* Category */}
            <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"8px", fontWeight:500, letterSpacing:"0.1em", fontFamily:"'Jost',sans-serif" }}>CATEGORY</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px", marginBottom:"16px" }}>
              {Object.entries(CATEGORIES).map(([key,cat]) => (
                <button key={key} onClick={()=>setForm({...form,category:key})} style={{ padding:"8px 6px", background:form.category===key?"#1A1A1A":"transparent", border:`1px solid ${form.category===key?"#1A1A1A":"#E8DDD0"}`, borderRadius:"5px", cursor:"pointer", color:form.category===key?"#F8F5F0":"#7C7C7C", fontSize:"11px", fontWeight:500, letterSpacing:"0.06em" }}>
                  {cat.label.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Time */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"16px" }}>
              {["startHour","endHour"].map(field=>(
                <div key={field}>
                  <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"5px", fontWeight:500, letterSpacing:"0.1em", fontFamily:"'Jost',sans-serif" }}>{field==="startHour"?"START":"END"}</label>
                  <select value={form[field]} onChange={e=>{const val=parseInt(e.target.value); setForm(f=>({...f,[field]:val}));}} style={{ width:"100%", background:"#F8F5F0", border:"1px solid #E8DDD0", borderRadius:"6px", padding:"10px", color:"#1A1A1A", fontSize:"13px", outline:"none", cursor:"pointer" }}>
                    {HOURS.map(h=><option key={h} value={h}>{fmtHLong(h)}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Event Color */}
            <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"8px", fontWeight:500, letterSpacing:"0.1em", fontFamily:"'Jost',sans-serif" }}>EVENT COLOUR</label>
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"16px" }}>
              {EVENT_COLORS.map(c=>(
                <button key={c.value} onClick={()=>setForm({...form,color:c.value})} title={c.name} style={{ width:"28px", height:"28px", background:c.value, border:`2px solid ${form.color===c.value?"#1A1A1A":"transparent"}`, borderRadius:"50%", cursor:"pointer", outline:`1px solid ${c.value==="#E8DDD0"?"#D4C9BB":"transparent"}` }}/>
              ))}
            </div>

            {/* Recur */}
            <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"6px", fontWeight:500, letterSpacing:"0.1em", fontFamily:"'Jost',sans-serif" }}>REPEAT</label>
            <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"16px" }}>
              {RECUR_OPTIONS.map(r=>(
                <button key={r} onClick={()=>setForm({...form,recur:r})} style={{ padding:"5px 12px", background:form.recur===r?"#1A1A1A":"transparent", border:`1px solid ${form.recur===r?"#1A1A1A":"#E8DDD0"}`, borderRadius:"4px", cursor:"pointer", color:form.recur===r?"#F8F5F0":"#7C7C7C", fontSize:"11px", letterSpacing:"0.06em", textTransform:"capitalize" }}>{r}</button>
              ))}
            </div>

            {/* Reminder */}
            <label style={{ display:"block", fontSize:"10px", color:"#7C7C7C", marginBottom:"6px", fontWeight:500, letterSpacing:"0.1em", fontFamily:"'Jost',sans-serif" }}>REMINDER</label>
            <select value={form.reminder} onChange={e=>setForm({...form,reminder:parseInt(e.target.value)})} style={{ width:"100%", background:"#F8F5F0", border:"1px solid #E8DDD0", borderRadius:"6px", padding:"10px 12px", color:"#1A1A1A", fontSize:"13px", outline:"none", cursor:"pointer", marginBottom:"20px" }}>
              {[[0,"No reminder"],[5,"5 min before"],[10,"10 min before"],[15,"15 min before"],[30,"30 min before"],[60,"1 hour before"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>

            {form.endHour<=form.startHour && <div style={{ background:"#FDF0F0", border:"1px solid #E8C4C4", borderRadius:"6px", padding:"8px 12px", fontSize:"12px", color:"#A05050", marginBottom:"12px", fontFamily:"'Jost',sans-serif" }}>End time must be after start time</div>}

            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={()=>setModal(null)} style={{ flex:1, padding:"11px", background:"transparent", border:"1px solid #E8DDD0", borderRadius:"8px", color:"#7C7C7C", fontSize:"12px", cursor:"pointer", letterSpacing:"0.08em" }}>CANCEL</button>
              <button onClick={saveBlock} style={{ flex:2, padding:"11px", background:form.title&&form.endHour>form.startHour?"#1A1A1A":"#E8DDD0", border:"none", borderRadius:"8px", color:form.title&&form.endHour>form.startHour?"#F8F5F0":"#A0A0A0", fontSize:"12px", cursor:"pointer", fontWeight:500, letterSpacing:"0.08em" }}>
                {modal.mode==="add"?"ADD BLOCK":"SAVE CHANGES"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
