import { useState, useEffect, useCallback } from "react";

const CATEGORIES = {
  work:     { label: "Work",          color: "#3B82F6", bg: "#1e3a5f", icon: "💼", light: "#93c5fd" },
  school:   { label: "School",        color: "#8B5CF6", bg: "#3b1f6e", icon: "📚", light: "#c4b5fd" },
  gym:      { label: "Gym",           color: "#EF4444", bg: "#5f1d1d", icon: "💪", light: "#fca5a5" },
  meal:     { label: "Meal Prep",     color: "#F59E0B", bg: "#5f3d0a", icon: "🥗", light: "#fcd34d" },
  personal: { label: "Personal",      color: "#10B981", bg: "#0a3d2e", icon: "🌿", light: "#6ee7b7" },
  weekend:  { label: "Weekend Plans", color: "#EC4899", bg: "#5f1040", icon: "🎉", light: "#f9a8d4" },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
const RECUR_OPTIONS = ["none", "daily", "weekly", "weekdays", "weekends"];

const fmtH = h => h === 12 ? "12pm" : h > 12 ? `${h-12}pm` : `${h}am`;
const fmtHLong = h => h === 12 ? "12:00 PM" : h > 12 ? `${h-12}:00 PM` : `${h}:00 AM`;

const defaultBlocks = [
  { id:1,  day:0, startHour:9,  endHour:17, category:"work",     title:"Work Hours",       recur:"weekdays", reminder:30 },
  { id:2,  day:1, startHour:9,  endHour:17, category:"work",     title:"Work Hours",       recur:"weekdays", reminder:30 },
  { id:3,  day:2, startHour:9,  endHour:17, category:"work",     title:"Work Hours",       recur:"weekdays", reminder:30 },
  { id:4,  day:3, startHour:9,  endHour:17, category:"work",     title:"Work Hours",       recur:"weekdays", reminder:30 },
  { id:5,  day:4, startHour:9,  endHour:17, category:"work",     title:"Work Hours",       recur:"weekdays", reminder:30 },
  { id:6,  day:0, startHour:7,  endHour:8,  category:"gym",      title:"Morning Workout",  recur:"weekly",   reminder:15 },
  { id:7,  day:2, startHour:7,  endHour:8,  category:"gym",      title:"Morning Workout",  recur:"weekly",   reminder:15 },
  { id:8,  day:4, startHour:7,  endHour:8,  category:"gym",      title:"Morning Workout",  recur:"weekly",   reminder:15 },
  { id:9,  day:6, startHour:9,  endHour:10, category:"gym",      title:"Weekend Run",      recur:"weekly",   reminder:15 },
  { id:10, day:0, startHour:19, endHour:21, category:"school",   title:"Study Session",    recur:"weekly",   reminder:10 },
  { id:11, day:2, startHour:19, endHour:21, category:"school",   title:"Study Session",    recur:"weekly",   reminder:10 },
  { id:12, day:5, startHour:10, endHour:12, category:"meal",     title:"Meal Prep",        recur:"weekly",   reminder:20 },
  { id:13, day:5, startHour:14, endHour:22, category:"weekend",  title:"Weekend Plans",    recur:"none",     reminder:60 },
  { id:14, day:6, startHour:14, endHour:20, category:"weekend",  title:"Weekend Plans",    recur:"none",     reminder:60 },
  { id:15, day:1, startHour:19, endHour:21, category:"personal", title:"Personal Time",    recur:"weekly",   reminder:0  },
  { id:16, day:3, startHour:19, endHour:21, category:"personal", title:"Personal Time",    recur:"weekly",   reminder:0  },
];

const AI_SUGGESTIONS = [
  { title:"Deep Work Block",    category:"work",     startHour:9,  endHour:11, day:0, reason:"Your most productive hours are typically 9–11am. Reserve them for focused tasks." },
  { title:"Lunch Break",        category:"personal", startHour:12, endHour:13, day:0, reason:"A consistent lunch break reduces afternoon fatigue and improves focus." },
  { title:"HIIT Session",       category:"gym",      startHour:6,  endHour:7,  day:1, reason:"Early morning workouts on Tue boost energy for the full day." },
  { title:"Homework Block",     category:"school",   startHour:17, endHour:19, day:1, reason:"Right after work hours keeps academic momentum going." },
  { title:"Grocery Shopping",   category:"meal",     startHour:9,  endHour:10, day:5, reason:"Saturday morning shopping lets you prep meals fresh for the week." },
  { title:"Mindfulness / Walk", category:"personal", startHour:7,  endHour:8,  day:5, reason:"A slow Saturday morning prevents burnout — keep at least one peaceful slot." },
  { title:"Social / Fun Time",  category:"weekend",  startHour:16, endHour:20, day:6, reason:"Sunday evening plans help end the weekend on a high note." },
  { title:"Weekly Review",      category:"personal", startHour:18, endHour:19, day:6, reason:"A 1-hour review every Sunday aligns your goals for the coming week." },
];

function exportToGoogleCalendar(blocks) {
  // Build ICS file for Google Calendar import
  const now = new Date();
  const weekStart = new Date(now);
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekStart.setDate(now.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);

  let ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//LifeSync//EN\r\nCALSCALE:GREGORIAN\r\n";

  blocks.forEach(block => {
    const blockDate = new Date(weekStart);
    blockDate.setDate(weekStart.getDate() + block.day);

    const dtStart = new Date(blockDate);
    dtStart.setHours(block.startHour, 0, 0);
    const dtEnd = new Date(blockDate);
    dtEnd.setHours(block.endHour, 0, 0);

    const fmt = d => d.toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";

    let rrule = "";
    if (block.recur === "daily")    rrule = "RRULE:FREQ=DAILY\r\n";
    if (block.recur === "weekly")   rrule = "RRULE:FREQ=WEEKLY\r\n";
    if (block.recur === "weekdays") rrule = "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR\r\n";
    if (block.recur === "weekends") rrule = "RRULE:FREQ=WEEKLY;BYDAY=SA,SU\r\n";

    let valarm = "";
    if (block.reminder > 0) {
      valarm = `BEGIN:VALARM\r\nTRIGGER:-PT${block.reminder}M\r\nACTION:DISPLAY\r\nDESCRIPTION:${block.title}\r\nEND:VALARM\r\n`;
    }

    ics += `BEGIN:VEVENT\r\nUID:${block.id}@lifesync\r\nDTSTART:${fmt(dtStart)}\r\nDTEND:${fmt(dtEnd)}\r\nSUMMARY:${CATEGORIES[block.category].icon} ${block.title}\r\nCATEGORIES:${CATEGORIES[block.category].label}\r\n${rrule}${valarm}END:VEVENT\r\n`;
  });

  ics += "END:VCALENDAR";
  return ics;
}

function downloadICS(blocks) {
  const ics = exportToGoogleCalendar(blocks);
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lifesync-schedule.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export default function LifePlanner() {
  const [blocks, setBlocks] = useState(defaultBlocks);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title:"", category:"work", startHour:9, endHour:10, recur:"none", reminder:0 });
  const [activeFilter, setActiveFilter] = useState(null);
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [tab, setTab] = useState("calendar"); // calendar | ai | reminders
  const [notifications, setNotifications] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [exportToast, setExportToast] = useState(false);
  const [reminderNotif, setReminderNotif] = useState(null);

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Simulate reminder notifications every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const todayDay = (now.getDay() + 6) % 7; // convert Sun=0 to Mon=0

      blocks.forEach(block => {
        if (block.reminder > 0 && block.day === todayDay) {
          const reminderHour = block.startHour - Math.floor(block.reminder / 60);
          const reminderMin = block.startHour * 60 - block.reminder;
          const nowMin = currentHour * 60 + currentMin;
          if (Math.abs(nowMin - reminderMin) < 1) {
            const msg = `⏰ ${CATEGORIES[block.category].icon} "${block.title}" starts in ${block.reminder} min`;
            setReminderNotif(msg);
            setTimeout(() => setReminderNotif(null), 5000);
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("LifeSync Reminder", { body: msg });
            }
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [blocks]);

  const openAdd = (day, hour) => {
    setForm({ title:"", category:"work", startHour:hour, endHour:hour+1, recur:"none", reminder:0 });
    setModal({ mode:"add", day });
  };

  const openEdit = (block, e) => {
    e.stopPropagation();
    setForm({ title:block.title, category:block.category, startHour:block.startHour, endHour:block.endHour, recur:block.recur||"none", reminder:block.reminder||0 });
    setModal({ mode:"edit", day:block.day, blockId:block.id });
  };

  const saveBlock = () => {
    if (!form.title || form.endHour <= form.startHour) return;
    if (modal.mode === "add") {
      const newBlock = { id:Date.now(), day:modal.day, ...form };
      const expanded = expandRecurring(newBlock);
      setBlocks(prev => [...prev, ...expanded]);
    } else {
      setBlocks(prev => prev.map(b => b.id === modal.blockId ? { ...b, ...form } : b));
    }
    setModal(null);
  };

  const expandRecurring = (block) => {
    if (block.recur === "none" || block.recur === "weekly") return [block];
    if (block.recur === "daily") {
      return DAYS.map((_, i) => ({ ...block, id: block.id + i, day: i }));
    }
    if (block.recur === "weekdays") {
      return [0,1,2,3,4].map((i) => ({ ...block, id: block.id + i, day: i }));
    }
    if (block.recur === "weekends") {
      return [5,6].map((i) => ({ ...block, id: block.id + i, day: i }));
    }
    return [block];
  };

  const deleteBlock = (id, e) => {
    e.stopPropagation();
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const addSuggestion = (s) => {
    setBlocks(prev => [...prev, { id:Date.now(), ...s, recur:"weekly", reminder:15 }]);
    setAiSuggestions(prev => prev.filter(x => x !== s));
  };

  const runAI = async () => {
    setAiLoading(true);
    setAiSuggestions([]);
    // Call Claude API for personalised suggestions
    try {
      const occupied = blocks.map(b => `${DAYS[b.day]} ${fmtH(b.startHour)}-${fmtH(b.endHour)}: ${b.title} (${b.category})`).join("\n");
      const prompt = `You are a productivity coach. The user has this weekly schedule:\n${occupied}\n\nAnalyse for gaps, imbalances, or missing healthy habits. Suggest exactly 4 improvements as JSON array with fields: title, category (one of: work/school/gym/meal/personal/weekend), day (0=Mon..6=Sun), startHour (int 6-21), endHour (int 7-22), reason (1 sentence). Return ONLY the JSON array, no markdown.`;
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{ role:"user", content:prompt }]
        })
      });
      const data = await response.json();
      const text = data.content?.map(c => c.text||"").join("") || "";
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setAiSuggestions(parsed);
    } catch(e) {
      // Fallback to built-in suggestions if API fails
      const existing = new Set(blocks.map(b => `${b.day}-${b.startHour}`));
      const filtered = AI_SUGGESTIONS.filter(s => !existing.has(`${s.day}-${s.startHour}`)).slice(0,4);
      setAiSuggestions(filtered);
    }
    setAiLoading(false);
  };

  const getStats = () => {
    const stats = {};
    Object.keys(CATEGORIES).forEach(cat => {
      stats[cat] = blocks.filter(b => b.category===cat).reduce((s,b) => s+(b.endHour-b.startHour),0);
    });
    return stats;
  };

  const stats = getStats();
  const filteredBlocks = activeFilter ? blocks.filter(b => b.category===activeFilter) : blocks;
  const reminderBlocks = [...blocks].filter(b => b.reminder > 0).sort((a,b) => a.day*100+a.startHour - (b.day*100+b.startHour));

  return (
    <div style={{ minHeight:"100vh", background:"#080b14", fontFamily:"'DM Sans','Helvetica Neue',sans-serif", color:"#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Syne:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:#080b14; }
        ::-webkit-scrollbar-thumb { background:#1e293b; border-radius:2px; }
        .block-item { transition: filter 0.15s, box-shadow 0.15s; }
        .block-item:hover { filter:brightness(1.2); }
        .hour-cell:hover { background:rgba(255,255,255,0.04) !important; cursor:pointer; }
        .btn-ghost { transition:all 0.2s; }
        .btn-ghost:hover { transform:translateY(-1px); }
        .tab-btn { transition:all 0.2s ease; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .ai-card { animation: fadeUp 0.3s ease both; }
        .toast { animation: fadeUp 0.3s ease; }
        .modal-bg { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal-box { animation: fadeUp 0.25s ease; }
        select option { background:#1e293b; }
      `}</style>

      {/* Reminder Toast */}
      {reminderNotif && (
        <div className="toast" style={{ position:"fixed", top:"16px", right:"16px", zIndex:999, background:"#1e293b", border:"1px solid #334155", borderRadius:"14px", padding:"12px 18px", fontSize:"13px", color:"#e2e8f0", boxShadow:"0 8px 32px rgba(0,0,0,0.5)", maxWidth:"300px" }}>
          {reminderNotif}
        </div>
      )}

      {/* Export Toast */}
      {exportToast && (
        <div className="toast" style={{ position:"fixed", top:"16px", right:"16px", zIndex:999, background:"#065f46", border:"1px solid #10b981", borderRadius:"14px", padding:"12px 18px", fontSize:"13px", color:"#6ee7b7", boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
          ✅ .ics file downloaded! Import it in Google Calendar.
        </div>
      )}

      {/* Header */}
      <div style={{ padding:"24px 28px 0", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"linear-gradient(180deg,#0d1220,#080b14)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
          <div>
            <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:"24px", fontWeight:800, margin:0, color:"#fff", letterSpacing:"-0.5px" }}>
              LifeSync <span style={{ fontSize:"11px", background:"linear-gradient(90deg,#3b82f6,#8b5cf6)", borderRadius:"6px", padding:"2px 8px", fontWeight:600, verticalAlign:"middle", letterSpacing:"0.05em", fontFamily:"DM Sans" }}>PRO</span>
            </h1>
            <p style={{ margin:"3px 0 0", fontSize:"12px", color:"#475569" }}>Your weekly rhythm, organised.</p>
          </div>
          <button
            onClick={() => { downloadICS(blocks); setExportToast(true); setTimeout(()=>setExportToast(false),4000); }}
            style={{ display:"flex", alignItems:"center", gap:"7px", background:"#0f2744", border:"1px solid #3b82f640", borderRadius:"12px", padding:"9px 16px", color:"#93c5fd", fontSize:"13px", fontWeight:500, cursor:"pointer" }}
          >
            <span>📅</span> Export to Google Calendar
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:"4px" }}>
          {[["calendar","🗓 Calendar"],["ai","✨ AI Suggestions"],["reminders","🔔 Reminders"]].map(([key,label]) => (
            <button key={key} className="tab-btn" onClick={() => setTab(key)} style={{
              padding:"10px 18px", background:"transparent", border:"none", cursor:"pointer",
              fontSize:"13px", fontWeight:500,
              color: tab===key ? "#fff" : "#475569",
              borderBottom: tab===key ? "2px solid #3b82f6" : "2px solid transparent",
              marginBottom:"-1px"
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ===== CALENDAR TAB ===== */}
      {tab === "calendar" && (
        <>
          {/* Category filters */}
          <div style={{ padding:"14px 28px", display:"flex", gap:"8px", overflowX:"auto", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            {Object.entries(CATEGORIES).map(([key,cat]) => (
              <button key={key} className="btn-ghost" onClick={() => setActiveFilter(activeFilter===key?null:key)} style={{
                background: activeFilter===key ? cat.bg : "rgba(255,255,255,0.04)",
                border:`1px solid ${activeFilter===key ? cat.color+"60" : "rgba(255,255,255,0.07)"}`,
                borderRadius:"10px", padding:"8px 14px", cursor:"pointer",
                display:"flex", alignItems:"center", gap:"7px", whiteSpace:"nowrap",
                color: activeFilter===key ? cat.light : "#64748b"
              }}>
                <span style={{ fontSize:"13px" }}>{cat.icon}</span>
                <span style={{ fontSize:"12px", fontWeight:500 }}>{cat.label}</span>
                <span style={{ background:"rgba(255,255,255,0.08)", borderRadius:"5px", padding:"1px 6px", fontSize:"11px", fontWeight:600 }}>{stats[key]}h</span>
              </button>
            ))}
          </div>

          {/* Grid */}
          <div style={{ padding:"0 28px 32px", overflowX:"auto" }}>
            <div style={{ minWidth:"700px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"48px repeat(7,1fr)", marginTop:"14px" }}>
                <div/>
                {DAYS.map((d,i) => (
                  <div key={d} style={{ textAlign:"center", padding:"6px 2px", fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", color:i>=5?"#f9a8d4":"#475569", textTransform:"uppercase" }}>{d}</div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"48px repeat(7,1fr)", position:"relative" }}>
                <div>
                  {HOURS.map(h => (
                    <div key={h} style={{ height:"42px", display:"flex", alignItems:"flex-start", paddingTop:"4px", fontSize:"10px", color:"#2d3748", justifyContent:"flex-end", paddingRight:"8px" }}>
                      {fmtH(h)}
                    </div>
                  ))}
                </div>
                {DAYS.map((_,dayIndex) => (
                  <div key={dayIndex} style={{ position:"relative", borderLeft:"1px solid rgba(255,255,255,0.05)" }}>
                    {HOURS.map(h => (
                      <div key={h} className="hour-cell" onClick={() => openAdd(dayIndex,h)} style={{ height:"42px", borderBottom:"1px solid rgba(255,255,255,0.03)", background:h%2===0?"transparent":"rgba(255,255,255,0.01)" }}/>
                    ))}
                    {filteredBlocks.filter(b=>b.day===dayIndex).map(block => {
                      const cat = CATEGORIES[block.category];
                      const top = (block.startHour - 6)*42;
                      const height = (block.endHour - block.startHour)*42 - 2;
                      return (
                        <div key={block.id} className="block-item" onClick={(e)=>openEdit(block,e)}
                          onMouseEnter={()=>setHoveredBlock(block.id)} onMouseLeave={()=>setHoveredBlock(null)}
                          style={{
                            position:"absolute", top:`${top+1}px`, left:"2px", right:"2px", height:`${height}px`,
                            background:`linear-gradient(135deg,${cat.bg},${cat.color}22)`,
                            border:`1px solid ${cat.color}45`, borderLeft:`3px solid ${cat.color}`,
                            borderRadius:"7px", padding:"4px 6px", cursor:"pointer", overflow:"hidden", zIndex:2,
                            boxShadow: hoveredBlock===block.id ? `0 0 14px ${cat.color}30` : "none"
                          }}>
                          <div style={{ fontSize:"9px", marginBottom:"1px" }}>{cat.icon}</div>
                          {height > 34 && <div style={{ fontSize:"10px", fontWeight:600, color:cat.light, lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{block.title}</div>}
                          {height > 54 && <div style={{ fontSize:"9px", color:cat.color, marginTop:"2px" }}>{fmtH(block.startHour)}–{fmtH(block.endHour)}</div>}
                          {height > 70 && block.recur && block.recur!=="none" && <div style={{ fontSize:"8px", color:"#475569", marginTop:"2px" }}>🔁 {block.recur}</div>}
                          {hoveredBlock===block.id && (
                            <button onClick={(e)=>deleteBlock(block.id,e)} style={{ position:"absolute", top:"3px", right:"3px", background:"rgba(0,0,0,0.6)", border:"none", color:"#f87171", width:"15px", height:"15px", borderRadius:"3px", cursor:"pointer", fontSize:"10px", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
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

      {/* ===== AI TAB ===== */}
      {tab === "ai" && (
        <div style={{ padding:"28px" }}>
          <div style={{ maxWidth:"680px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"20px" }}>
              <div>
                <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:"20px", fontWeight:700, margin:"0 0 6px", color:"#fff" }}>✨ AI Schedule Suggestions</h2>
                <p style={{ margin:0, fontSize:"13px", color:"#475569", lineHeight:1.5 }}>Claude analyses your current schedule for gaps, imbalances, and missing healthy habits — then suggests improvements.</p>
              </div>
              <button onClick={runAI} disabled={aiLoading} style={{ background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", border:"none", borderRadius:"12px", padding:"11px 20px", color:"#fff", fontSize:"13px", fontWeight:600, cursor:aiLoading?"not-allowed":"pointer", whiteSpace:"nowrap", opacity:aiLoading?0.7:1 }}>
                {aiLoading ? "Analysing..." : "Analyse My Schedule"}
              </button>
            </div>

            {aiLoading && (
              <div style={{ background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:"16px", padding:"24px", textAlign:"center" }}>
                <div style={{ fontSize:"24px", marginBottom:"8px", animation:"pulse 1.5s infinite" }}>🤖</div>
                <p style={{ color:"#64748b", fontSize:"13px", margin:0 }}>Claude is analysing your weekly schedule...</p>
              </div>
            )}

            {!aiLoading && aiSuggestions.length === 0 && (
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"32px", textAlign:"center" }}>
                <div style={{ fontSize:"32px", marginBottom:"10px" }}>🧠</div>
                <p style={{ color:"#475569", fontSize:"14px", margin:0 }}>Click "Analyse My Schedule" to get personalised AI recommendations based on your current blocks.</p>
              </div>
            )}

            {!aiLoading && aiSuggestions.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                {aiSuggestions.map((s,i) => {
                  const cat = CATEGORIES[s.category] || CATEGORIES.personal;
                  return (
                    <div key={i} className="ai-card" style={{ animationDelay:`${i*0.08}s`, background:`linear-gradient(135deg,${cat.bg}80,rgba(255,255,255,0.03))`, border:`1px solid ${cat.color}30`, borderRadius:"16px", padding:"18px 20px", display:"flex", gap:"16px", alignItems:"flex-start" }}>
                      <div style={{ fontSize:"28px", flexShrink:0 }}>{cat.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
                          <span style={{ fontWeight:600, color:"#fff", fontSize:"14px" }}>{s.title}</span>
                          <span style={{ fontSize:"11px", background:`${cat.color}25`, color:cat.light, padding:"2px 8px", borderRadius:"5px" }}>{DAYS[s.day]} {fmtH(s.startHour)}–{fmtH(s.endHour)}</span>
                        </div>
                        <p style={{ margin:"0 0 12px", fontSize:"13px", color:"#64748b", lineHeight:1.5 }}>{s.reason}</p>
                        <button onClick={() => addSuggestion(s)} style={{ background:`${cat.color}20`, border:`1px solid ${cat.color}50`, borderRadius:"8px", padding:"6px 14px", color:cat.light, fontSize:"12px", fontWeight:500, cursor:"pointer" }}>
                          + Add to Schedule
                        </button>
                      </div>
                    </div>
                  );
                })}
                <p style={{ fontSize:"12px", color:"#334155", textAlign:"center", marginTop:"4px" }}>Added blocks appear as weekly recurring events.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== REMINDERS TAB ===== */}
      {tab === "reminders" && (
        <div style={{ padding:"28px" }}>
          <div style={{ maxWidth:"600px" }}>
            <div style={{ marginBottom:"20px" }}>
              <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:"20px", fontWeight:700, margin:"0 0 6px", color:"#fff" }}>🔔 Reminders</h2>
              <p style={{ margin:0, fontSize:"13px", color:"#475569" }}>Manage notification timing for each block. Reminders export to Google Calendar too.</p>
            </div>

            <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"12px", padding:"12px 16px", marginBottom:"20px", fontSize:"13px", color:"#fcd34d", display:"flex", gap:"10px", alignItems:"center" }}>
              <span>💡</span>
              <span>Reminders are baked into the exported .ics file — Google Calendar will notify you automatically.</span>
            </div>

            {reminderBlocks.length === 0 && (
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"32px", textAlign:"center" }}>
                <p style={{ color:"#475569", fontSize:"14px", margin:0 }}>No reminders set. Edit any block and set a reminder time.</p>
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {reminderBlocks.map(block => {
                const cat = CATEGORIES[block.category];
                return (
                  <div key={block.id} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"14px 18px", display:"flex", alignItems:"center", gap:"14px" }}>
                    <div style={{ width:"36px", height:"36px", background:cat.bg, borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>{cat.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:500, fontSize:"14px", color:"#e2e8f0", marginBottom:"2px" }}>{block.title}</div>
                      <div style={{ fontSize:"12px", color:"#475569" }}>{DAYS[block.day]} · {fmtH(block.startHour)}–{fmtH(block.endHour)} · <span style={{ color:block.recur&&block.recur!=="none"?"#64748b":"#334155" }}>🔁 {block.recur||"none"}</span></div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:"13px", fontWeight:600, color:"#f59e0b" }}>⏰ {block.reminder} min before</div>
                      <button onClick={(e)=>{e.stopPropagation();openEdit(block,e)}} style={{ marginTop:"4px", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"7px", padding:"3px 10px", color:"#64748b", fontSize:"11px", cursor:"pointer" }}>Edit</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-bg" onClick={()=>setModal(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ background:"#0f172a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"20px", padding:"26px", width:"380px", boxShadow:"0 30px 70px rgba(0,0,0,0.7)", maxHeight:"90vh", overflowY:"auto" }}>
            <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:"17px", fontWeight:700, margin:"0 0 18px", color:"#fff" }}>
              {modal.mode==="add" ? `Add to ${DAYS[modal.day]}` : "Edit Block"}
            </h2>

            {/* Title */}
            <label style={{ display:"block", fontSize:"11px", color:"#475569", marginBottom:"5px", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" }}>Title</label>
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Deep work, Leg day..." style={{ width:"100%", background:"#1e293b", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"10px 12px", color:"#e2e8f0", fontSize:"14px", outline:"none", marginBottom:"14px" }}/>

            {/* Category */}
            <label style={{ display:"block", fontSize:"11px", color:"#475569", marginBottom:"8px", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" }}>Category</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"7px", marginBottom:"14px" }}>
              {Object.entries(CATEGORIES).map(([key,cat]) => (
                <button key={key} onClick={()=>setForm({...form,category:key})} style={{ padding:"8px 4px", background:form.category===key?cat.bg:"rgba(255,255,255,0.04)", border:`1px solid ${form.category===key?cat.color:"rgba(255,255,255,0.07)"}`, borderRadius:"10px", cursor:"pointer", color:form.category===key?cat.light:"#475569", fontSize:"10px", fontWeight:500, display:"flex", flexDirection:"column", alignItems:"center", gap:"3px" }}>
                  <span style={{ fontSize:"15px" }}>{cat.icon}</span>{cat.label}
                </button>
              ))}
            </div>

            {/* Time */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"14px" }}>
              {["startHour","endHour"].map(field=>(
                <div key={field}>
                  <label style={{ display:"block", fontSize:"11px", color:"#475569", marginBottom:"5px", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" }}>{field==="startHour"?"Start":"End"}</label>
                  <select value={form[field]} onChange={e=>setForm({...form,[field]:parseInt(e.target.value)})} style={{ width:"100%", background:"#1e293b", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"10px 10px", color:"#e2e8f0", fontSize:"13px", outline:"none", cursor:"pointer" }}>
                    {HOURS.map(h=><option key={h} value={h}>{fmtHLong(h)}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Recurrence */}
            <label style={{ display:"block", fontSize:"11px", color:"#475569", marginBottom:"5px", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" }}>🔁 Repeat</label>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"14px" }}>
              {RECUR_OPTIONS.map(r=>(
                <button key={r} onClick={()=>setForm({...form,recur:r})} style={{ padding:"6px 12px", background:form.recur===r?"#1e3a5f":"rgba(255,255,255,0.04)", border:`1px solid ${form.recur===r?"#3b82f680":"rgba(255,255,255,0.07)"}`, borderRadius:"8px", cursor:"pointer", color:form.recur===r?"#93c5fd":"#475569", fontSize:"12px", fontWeight:500, textTransform:"capitalize" }}>{r}</button>
              ))}
            </div>

            {/* Reminder */}
            <label style={{ display:"block", fontSize:"11px", color:"#475569", marginBottom:"5px", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" }}>⏰ Reminder</label>
            <select value={form.reminder} onChange={e=>setForm({...form,reminder:parseInt(e.target.value)})} style={{ width:"100%", background:"#1e293b", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"10px 12px", color:"#e2e8f0", fontSize:"13px", outline:"none", cursor:"pointer", marginBottom:"18px" }}>
              {[[0,"No reminder"],[5,"5 min before"],[10,"10 min before"],[15,"15 min before"],[30,"30 min before"],[60,"1 hour before"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>

            {form.endHour<=form.startHour && <div style={{ background:"#450a0a", border:"1px solid #ef444440", borderRadius:"8px", padding:"8px 12px", fontSize:"12px", color:"#fca5a5", marginBottom:"12px" }}>End time must be after start time</div>}

            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={()=>setModal(null)} style={{ flex:1, padding:"11px", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", color:"#475569", fontSize:"13px", cursor:"pointer", fontWeight:500 }}>Cancel</button>
              <button onClick={saveBlock} style={{ flex:2, padding:"11px", background:form.title&&form.endHour>form.startHour?`linear-gradient(135deg,${CATEGORIES[form.category].color},${CATEGORIES[form.category].color}bb)`:"#1e293b", border:"none", borderRadius:"12px", color:form.title&&form.endHour>form.startHour?"#fff":"#334155", fontSize:"13px", cursor:"pointer", fontWeight:600 }}>
                {modal.mode==="add"?"Add Block":"Save Changes"}
              </button>
            </div>s
          </div>
        </div>
      )}
    </div>
  );
}