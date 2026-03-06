import { useState, useEffect, useRef } from "react";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DAYS_FULL = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const HOURS = Array.from({length:19},(_,i)=>i+5);

const BUDGET_CATEGORIES = [
  {key:"groceries",    label:"Food & Groceries",    color:"#7A9E7E"},
  {key:"transport",    label:"Transport",            color:"#C4A882"},
  {key:"entertainment",label:"Entertainment",        color:"#9B8EA8"},
  {key:"health",       label:"Gym & Health",         color:"#2D4A3E"},
  {key:"shopping",     label:"Shopping",             color:"#A8786E"},
  {key:"savings",      label:"Savings",              color:"#3A3A3A"},
  {key:"bills",        label:"Bills & Debit Orders", color:"#6E7A8A"},
  {key:"insurance",    label:"Insurance",            color:"#8A7A5A"},
];

const CAL_CATEGORIES = {
  work:    {label:"Work",      color:"#2D4A3E"},
  school:  {label:"School",    color:"#7C7C7C"},
  gym:     {label:"Gym",       color:"#3A3A3A"},
  meal:    {label:"Meal Prep", color:"#C4A882"},
  personal:{label:"Personal",  color:"#7A9E7E"},
  weekend: {label:"Weekend",   color:"#9B8EA8"},
  expense: {label:"Expense",   color:"#A8786E"},
};

const EVENT_COLORS = ["#2D4A3E","#7A9E7E","#3A3A3A","#7C7C7C","#C4A882","#9B8EA8","#A8786E","#6E7A8A"];
const RECUR_OPTIONS = ["none","daily","weekly","weekdays","weekends","monthly"];

const fmtH = h => h===0?"12am":h===12?"12pm":h>12?`${h-12}pm`:`${h}am`;
const fmtHLong = h => h===0?"12:00 AM":h===12?"12:00 PM":h>12?`${h-12}:00 PM`:`${h}:00 AM`;
const getTimeName = h => h<12?"Morning":h<17?"Afternoon":"Evening";
const fmtCurrency = n => `R ${Number(n).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtShort = n => n>=1000?`R${(n/1000).toFixed(1)}k`:`R${Math.round(n)}`;

const defaultBlocks = [
  {id:1,day:0,startHour:9,endHour:17,category:"work",title:"Morning Work",recur:"weekdays",reminder:30,color:"#2D4A3E",hasCost:false,cost:0,budgetCat:""},
  {id:2,day:1,startHour:9,endHour:17,category:"work",title:"Morning Work",recur:"weekdays",reminder:30,color:"#2D4A3E",hasCost:false,cost:0,budgetCat:""},
  {id:3,day:2,startHour:9,endHour:17,category:"work",title:"Morning Work",recur:"weekdays",reminder:30,color:"#2D4A3E",hasCost:false,cost:0,budgetCat:""},
  {id:4,day:3,startHour:9,endHour:17,category:"work",title:"Morning Work",recur:"weekdays",reminder:30,color:"#2D4A3E",hasCost:false,cost:0,budgetCat:""},
  {id:5,day:4,startHour:9,endHour:17,category:"work",title:"Morning Work",recur:"weekdays",reminder:30,color:"#2D4A3E",hasCost:false,cost:0,budgetCat:""},
  {id:6,day:0,startHour:6,endHour:7,category:"gym",title:"Morning Gym",recur:"weekly",reminder:15,color:"#3A3A3A",hasCost:true,cost:250,budgetCat:"health"},
  {id:7,day:2,startHour:19,endHour:21,category:"school",title:"Evening Study",recur:"weekly",reminder:10,color:"#7C7C7C",hasCost:false,cost:0,budgetCat:""},
  {id:8,day:5,startHour:10,endHour:12,category:"meal",title:"Morning Meal Prep",recur:"weekly",reminder:20,color:"#C4A882",hasCost:true,cost:800,budgetCat:"groceries"},
  {id:9,day:5,startHour:14,endHour:20,category:"weekend",title:"Afternoon Plans",recur:"none",reminder:60,color:"#9B8EA8",hasCost:true,cost:300,budgetCat:"entertainment"},
];

const defaultDebits = [
  {id:1,name:"Netflix",amount:199,day:1,budgetCat:"entertainment",color:"#9B8EA8"},
  {id:2,name:"Gym Membership",amount:499,day:5,budgetCat:"health",color:"#2D4A3E"},
  {id:3,name:"Car Insurance",amount:1200,day:25,budgetCat:"insurance",color:"#8A7A5A"},
  {id:4,name:"Phone Contract",amount:699,day:28,budgetCat:"bills",color:"#6E7A8A"},
];

function useIsMobile() {
  const [isMobile,setIsMobile] = useState(window.innerWidth<768);
  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[]);
  return isMobile;
}

// ── SETUP ──────────────────────────────────────────────────────────────────────
function SetupPage({onComplete}) {
  const [step,setStep]=useState(1);
  const [name,setName]=useState("");
  const [income,setIncome]=useState("");
  const [period,setPeriod]=useState("monthly");
  const [allocations,setAllocations]=useState({groceries:15,transport:10,entertainment:8,health:5,shopping:10,savings:20,bills:15,insurance:7});
  const total=Object.values(allocations).reduce((a,b)=>a+b,0);
  const remaining=100-total;

  const handleComplete=()=>{
    const inc=parseFloat(income)||0;
    onComplete({name,income:inc,period,allocations,debits:defaultDebits});
  };

  return (
    <div style={{minHeight:"100vh",background:"#1A1A1A",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Jost',sans-serif",padding:"24px 20px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Jost:wght@300;400;500;600&display=swap');*{box-sizing:border-box;}`}</style>
      <div style={{width:"100%",maxWidth:"440px"}}>
        <div style={{display:"flex",gap:"6px",marginBottom:"40px"}}>
          {[1,2,3].map(s=><div key={s} style={{flex:1,height:"2px",background:step>=s?"#7A9E7E":"#2A2A2A",borderRadius:"2px",transition:"background 0.4s"}}/>)}
        </div>
        {step===1&&(
          <div>
            <p style={{color:"#7C7C7C",fontSize:"11px",letterSpacing:"0.15em",marginBottom:"10px"}}>WELCOME TO</p>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"50px",fontWeight:300,color:"#F8F5F0",margin:"0 0 6px",lineHeight:1}}>LifeSync</h1>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"17px",fontStyle:"italic",color:"#7C7C7C",margin:"0 0 44px",fontWeight:300}}>Your life, intelligently organised.</p>
            <label style={{display:"block",fontSize:"10px",color:"#7C7C7C",marginBottom:"8px",letterSpacing:"0.12em"}}>WHAT SHOULD WE CALL YOU?</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" onKeyDown={e=>e.key==="Enter"&&name&&setStep(2)}
              style={{width:"100%",background:"transparent",border:"none",borderBottom:"1px solid #3A3A3A",padding:"12px 0",color:"#F8F5F0",fontSize:"22px",outline:"none",fontFamily:"'Cormorant Garamond',serif",marginBottom:"40px"}}/>
            <button onClick={()=>name&&setStep(2)} style={{background:name?"#F8F5F0":"#2A2A2A",border:"none",borderRadius:"6px",padding:"14px",color:name?"#1A1A1A":"#3A3A3A",fontSize:"12px",fontWeight:500,cursor:name?"pointer":"not-allowed",letterSpacing:"0.1em",width:"100%"}}>CONTINUE</button>
          </div>
        )}
        {step===2&&(
          <div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"34px",fontWeight:300,color:"#F8F5F0",margin:"0 0 8px"}}>Hello, {name}.</h2>
            <p style={{color:"#7C7C7C",fontSize:"13px",margin:"0 0 32px",fontWeight:300,lineHeight:1.7}}>Set up your budget so LifeSync can guide your spending.</p>
            <label style={{display:"block",fontSize:"10px",color:"#7C7C7C",marginBottom:"8px",letterSpacing:"0.12em"}}>YOUR INCOME (ZAR)</label>
            <div style={{display:"flex",alignItems:"center",borderBottom:"1px solid #3A3A3A",marginBottom:"28px",paddingBottom:"12px"}}>
              <span style={{color:"#7C7C7C",fontSize:"22px",fontFamily:"'Cormorant Garamond',serif",marginRight:"8px"}}>R</span>
              <input value={income} onChange={e=>setIncome(e.target.value.replace(/[^0-9.]/g,""))} placeholder="0.00" type="number"
                style={{flex:1,background:"transparent",border:"none",color:"#F8F5F0",fontSize:"32px",outline:"none",fontFamily:"'Cormorant Garamond',serif",fontWeight:300}}/>
            </div>
            <label style={{display:"block",fontSize:"10px",color:"#7C7C7C",marginBottom:"12px",letterSpacing:"0.12em"}}>BUDGET PERIOD</label>
            <div style={{display:"flex",gap:"8px",marginBottom:"32px"}}>
              {["monthly","weekly"].map(p=>(
                <button key={p} onClick={()=>setPeriod(p)} style={{flex:1,padding:"12px",background:period===p?"#2D4A3E":"transparent",border:`1px solid ${period===p?"#2D4A3E":"#3A3A3A"}`,borderRadius:"6px",color:period===p?"#F8F5F0":"#7C7C7C",fontSize:"12px",cursor:"pointer",letterSpacing:"0.08em"}}>{p.toUpperCase()}</button>
              ))}
            </div>
            <button onClick={()=>income&&setStep(3)} style={{background:income?"#F8F5F0":"#2A2A2A",border:"none",borderRadius:"6px",padding:"14px",color:income?"#1A1A1A":"#3A3A3A",fontSize:"12px",fontWeight:500,cursor:income?"pointer":"not-allowed",letterSpacing:"0.1em",width:"100%"}}>CONTINUE</button>
          </div>
        )}
        {step===3&&(
          <div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"30px",fontWeight:300,color:"#F8F5F0",margin:"0 0 6px"}}>Allocate your budget</h2>
            <p style={{color:"#7C7C7C",fontSize:"12px",margin:"0 0 6px"}}>Income: <span style={{color:"#7A9E7E"}}>{fmtCurrency(income)}</span> {period}</p>
            <p style={{color:Math.abs(remaining)<1?"#7A9E7E":remaining<0?"#E8A0A0":"#C4A882",fontSize:"11px",margin:"0 0 18px"}}>
              {Math.abs(remaining)<1?"Perfectly balanced":remaining>0?`${remaining}% unallocated`:`${Math.abs(remaining)}% over`}
            </p>
            <div style={{height:"5px",background:"#2A2A2A",borderRadius:"3px",overflow:"hidden",marginBottom:"18px",display:"flex"}}>
              {BUDGET_CATEGORIES.map(cat=><div key={cat.key} style={{width:`${allocations[cat.key]}%`,background:cat.color,transition:"width 0.3s"}}/>)}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"28px",maxHeight:"48vh",overflowY:"auto",paddingRight:"4px"}}>
              {BUDGET_CATEGORIES.map(cat=>{
                const amt=((parseFloat(income)||0)*allocations[cat.key]/100);
                return (
                  <div key={cat.key} style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <div style={{width:"7px",height:"7px",background:cat.color,borderRadius:"50%",flexShrink:0}}/>
                    <span style={{flex:1,fontSize:"12px",color:"#C4C4C4"}}>{cat.label}</span>
                    <span style={{fontSize:"10px",color:"#7C7C7C",width:"52px",textAlign:"right"}}>{fmtShort(amt)}</span>
                    <input type="range" min="0" max="50" value={allocations[cat.key]} onChange={e=>setAllocations(p=>({...p,[cat.key]:parseInt(e.target.value)}))} style={{width:"70px",accentColor:cat.color,cursor:"pointer"}}/>
                    <span style={{fontSize:"10px",color:"#7C7C7C",width:"26px"}}>{allocations[cat.key]}%</span>
                  </div>
                );
              })}
            </div>
            <button onClick={handleComplete} style={{background:"#F8F5F0",border:"none",borderRadius:"6px",padding:"14px",color:"#1A1A1A",fontSize:"12px",fontWeight:500,cursor:"pointer",letterSpacing:"0.1em",width:"100%"}}>START LIFESYNC</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [setup,setSetup]=useState(false);
  const [userData,setUserData]=useState(null);
  const [blocks,setBlocks]=useState(defaultBlocks);
  const [debits,setDebits]=useState(defaultDebits);
  const [tab,setTab]=useState("calendar");
  const [calView,setCalView]=useState("week"); // day | week | month
  const [activeDay,setActiveDay]=useState(new Date().getDay()===0?6:new Date().getDay()-1);
  const [activeMonth,setActiveMonth]=useState({year:new Date().getFullYear(),month:new Date().getMonth()});
  const [modal,setModal]=useState(null);
  const [debitModal,setDebitModal]=useState(false);
  const [form,setForm]=useState({});
  const [debitForm,setDebitForm]=useState({name:"",amount:"",day:1,budgetCat:"bills"});
  const [hoveredBlock,setHoveredBlock]=useState(null);
  const [toast,setToast]=useState(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiAdvice,setAiAdvice]=useState(null);
  const isMobile=useIsMobile();

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),3000);};

  useEffect(()=>{
    if(form.autoTitle&&form.category&&form.startHour!==undefined){
      const base=CAL_CATEGORIES[form.category]?.label||"";
      setForm(f=>({...f,title:`${getTimeName(f.startHour)} ${base}`}));
    }
  },[form.startHour,form.category,form.autoTitle]);

  if(!setup) return <SetupPage onComplete={d=>{setUserData(d);setSetup(true);}}/>;

  const {name,income,period,allocations}=userData;

  const spentByCategory={};
  BUDGET_CATEGORIES.forEach(cat=>{spentByCategory[cat.key]=0;});
  blocks.forEach(b=>{if(b.hasCost&&b.budgetCat&&b.cost)spentByCategory[b.budgetCat]=(spentByCategory[b.budgetCat]||0)+b.cost;});
  debits.forEach(d=>{if(d.budgetCat)spentByCategory[d.budgetCat]=(spentByCategory[d.budgetCat]||0)+d.amount;});
  const totalSpent=Object.values(spentByCategory).reduce((a,b)=>a+b,0);
  const totalRemaining=income-totalSpent;
  const debitTotal=debits.reduce((s,d)=>s+d.amount,0);

  const hexAlpha=(hex,a)=>{
    if(!hex||hex.length<7)return`rgba(0,0,0,${a})`;
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return`rgba(${r},${g},${b},${a})`;
  };

  const getDayBlocks=day=>blocks.filter(b=>b.day===day);
  const getDayCost=day=>getDayBlocks(day).filter(b=>b.hasCost&&b.cost>0).reduce((s,b)=>s+b.cost,0);

  const openAdd=(day,hour)=>{
    setForm({title:`${getTimeName(hour)} Personal`,category:"personal",startHour:hour,endHour:hour+1,recur:"none",reminder:0,color:"#7A9E7E",autoTitle:true,hasCost:false,cost:"",budgetCat:"groceries"});
    setModal({mode:"add",day});
  };

  const openEdit=(block,e)=>{
    e.stopPropagation();
    setForm({...block,cost:block.cost||"",autoTitle:false});
    setModal({mode:"edit",day:block.day,blockId:block.id});
  };

  const saveBlock=()=>{
    if(!form.title||form.endHour<=form.startHour)return;
    const block={...form,cost:form.hasCost?parseFloat(form.cost)||0:0};
    if(modal.mode==="add")setBlocks(prev=>[...prev,{id:Date.now(),day:modal.day,...block}]);
    else setBlocks(prev=>prev.map(b=>b.id===modal.blockId?{...b,...block}:b));
    setModal(null);
    showToast(modal.mode==="add"?"Block added":"Block updated");
  };

  const inputStyle={width:"100%",background:"#F8F5F0",border:"1px solid #E8DDD0",borderRadius:"6px",padding:"10px 12px",color:"#1A1A1A",fontSize:"13px",outline:"none",fontFamily:"'Jost',sans-serif",boxSizing:"border-box"};
  const labelStyle={display:"block",fontSize:"10px",color:"#7C7C7C",marginBottom:"5px",fontWeight:500,letterSpacing:"0.1em"};

  // ── TIME GRID (shared for day and week) ──
  const TimeGrid=({days})=>(
    <div style={{display:"flex",flex:1,overflowY:"auto",overflowX:days.length>1?"auto":"hidden"}}>
      {/* Hour labels */}
      <div style={{width:"44px",flexShrink:0}}>
        <div style={{height:"20px"}}/>
        {HOURS.map(h=>(
          <div key={h} style={{height:"52px",display:"flex",alignItems:"flex-start",paddingTop:"3px",paddingRight:"6px",justifyContent:"flex-end",fontSize:"9px",color:"#C4A882",letterSpacing:"0.02em"}}>{fmtH(h)}</div>
        ))}
      </div>
      {/* Day columns */}
      <div style={{display:"flex",flex:1,minWidth:days.length>1?`${days.length*90}px`:"100%"}}>
        {days.map((dayIndex)=>(
          <div key={dayIndex} style={{flex:1,borderLeft:"1px solid #EDE8E0",position:"relative",minWidth:days.length>1?"90px":"100%"}}>
            {HOURS.map(h=>(
              <div key={h} onClick={()=>openAdd(dayIndex,h)} style={{height:"52px",borderBottom:`1px solid ${h%2===0?"#EDE8E0":"#F5F0EA"}`,cursor:"pointer",transition:"background 0.1s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.02)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}/>
            ))}
            {/* Events */}
            {getDayBlocks(dayIndex).map(block=>{
              const col=block.color||"#2D4A3E";
              const top=(block.startHour-5)*52;
              const height=(block.endHour-block.startHour)*52-2;
              return (
                <div key={block.id} onClick={e=>openEdit(block,e)} onMouseEnter={()=>setHoveredBlock(block.id)} onMouseLeave={()=>setHoveredBlock(null)}
                  style={{position:"absolute",top:`${top+20}px`,left:"2px",right:"2px",height:`${height}px`,background:hexAlpha(col,0.13),borderLeft:`3px solid ${col}`,borderRadius:"4px",padding:"4px 7px",cursor:"pointer",overflow:"hidden",zIndex:2,transition:"opacity 0.15s"}}>
                  {height>24&&<div style={{fontSize:"10px",fontWeight:500,color:col,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.3}}>{block.title}</div>}
                  {height>42&&<div style={{fontSize:"9px",color:col,opacity:0.7,marginTop:"1px"}}>{fmtH(block.startHour)}–{fmtH(block.endHour)}</div>}
                  {height>58&&block.hasCost&&block.cost>0&&<div style={{fontSize:"9px",color:col,opacity:0.7}}>R{block.cost}</div>}
                  {hoveredBlock===block.id&&<button onClick={e=>{e.stopPropagation();setBlocks(prev=>prev.filter(b=>b.id!==block.id));}} style={{position:"absolute",top:"3px",right:"3px",background:col,border:"none",color:"#fff",width:"15px",height:"15px",borderRadius:"3px",cursor:"pointer",fontSize:"11px",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  // ── DAY VIEW ──
  const DayView=()=>(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 160px)",overflow:"hidden"}}>
      {/* Day header */}
      <div style={{padding:"10px 16px 8px",background:"#FDFCFA",borderBottom:"1px solid #E8DDD0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>setActiveDay(d=>Math.max(0,d-1))} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"20px",cursor:"pointer",padding:"4px 10px"}}>‹</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#1A1A1A",fontWeight:300}}>{DAYS_FULL[activeDay]}</div>
          {getDayCost(activeDay)>0&&<div style={{fontSize:"11px",color:"#C4A882",marginTop:"2px"}}>{fmtShort(getDayCost(activeDay))} scheduled</div>}
        </div>
        <button onClick={()=>setActiveDay(d=>Math.min(6,d+1))} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"20px",cursor:"pointer",padding:"4px 10px"}}>›</button>
      </div>
      <TimeGrid days={[activeDay]}/>
    </div>
  );

  // ── WEEK VIEW ──
  const WeekView=()=>(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 160px)",overflow:"hidden"}}>
      {/* Week day headers */}
      <div style={{background:"#FDFCFA",borderBottom:"1px solid #E8DDD0",display:"flex",paddingLeft:"44px",overflowX:"auto"}}>
        {DAYS.map((d,i)=>{
          const cost=getDayCost(i);
          const isToday=i===activeDay;
          return (
            <div key={d} onClick={()=>{setActiveDay(i);setCalView("day");}} style={{flex:1,minWidth:"90px",padding:"8px 4px",textAlign:"center",cursor:"pointer",borderBottom:isToday?"2px solid #2D4A3E":"2px solid transparent",transition:"all 0.2s"}}>
              <div style={{fontSize:"10px",fontWeight:500,letterSpacing:"0.1em",color:i>=5?"#2D4A3E":"#7C7C7C"}}>{d}</div>
              {cost>0&&<div style={{fontSize:"9px",color:"#C4A882",marginTop:"2px"}}>{fmtShort(cost)}</div>}
            </div>
          );
        })}
      </div>
      <TimeGrid days={[0,1,2,3,4,5,6]}/>
    </div>
  );

  // ── MONTH VIEW ──
  const MonthView=()=>{
    const {year,month}=activeMonth;
    const firstDay=new Date(year,month,1).getDay();
    const offset=firstDay===0?6:firstDay-1;
    const daysInMonth=new Date(year,month+1,0).getDate();
    const cells=[];
    for(let i=0;i<offset;i++)cells.push(null);
    for(let d=1;d<=daysInMonth;d++)cells.push(d);
    while(cells.length%7!==0)cells.push(null);

    const today=new Date();
    const isCurrentMonth=today.getFullYear()===year&&today.getMonth()===month;

    return (
      <div style={{display:"flex",flexDirection:"column",background:"#F8F5F0"}}>
        {/* Month nav */}
        <div style={{padding:"12px 16px 8px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#FDFCFA",borderBottom:"1px solid #E8DDD0"}}>
          <button onClick={()=>setActiveMonth(m=>{const d=new Date(m.year,m.month-1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"22px",cursor:"pointer",padding:"4px 10px"}}>‹</button>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#1A1A1A",fontWeight:300}}>{MONTHS[month]} {year}</div>
          <button onClick={()=>setActiveMonth(m=>{const d=new Date(m.year,m.month+1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"22px",cursor:"pointer",padding:"4px 10px"}}>›</button>
        </div>

        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#FDFCFA",borderBottom:"1px solid #E8DDD0",padding:"0 8px"}}>
          {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d=>(
            <div key={d} style={{textAlign:"center",padding:"8px 0",fontSize:"10px",fontWeight:500,letterSpacing:"0.08em",color:"#7C7C7C"}}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"1px",background:"#E8DDD0",padding:"1px"}}>
          {cells.map((date,idx)=>{
            // map date to weekday index (0=Mon..6=Sun)
            const weekdayIndex = date ? (new Date(year,month,date).getDay()+6)%7 : null;
            const dayBlocks = date ? blocks.filter(b=>b.day===weekdayIndex) : [];
            const dayCost = dayBlocks.filter(b=>b.hasCost&&b.cost>0).reduce((s,b)=>s+b.cost,0);
            const isToday = isCurrentMonth&&date===today.getDate();
            return (
              <div key={idx} onClick={()=>{if(date){setActiveDay(weekdayIndex);setCalView("day");}}} style={{background:"#FDFCFA",minHeight:"72px",padding:"6px 5px",cursor:date?"pointer":"default",opacity:date?1:0.3,transition:"background 0.15s"}}
                onMouseEnter={e=>{if(date)e.currentTarget.style.background="#F3EEE8";}}
                onMouseLeave={e=>{e.currentTarget.style.background="#FDFCFA";}}>
                {date&&(
                  <>
                    <div style={{width:"22px",height:"22px",borderRadius:"50%",background:isToday?"#2D4A3E":"transparent",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"4px"}}>
                      <span style={{fontSize:"11px",fontWeight:isToday?500:400,color:isToday?"#F8F5F0":"#1A1A1A"}}>{date}</span>
                    </div>
                    {dayBlocks.slice(0,2).map(block=>(
                      <div key={block.id} style={{background:hexAlpha(block.color||"#2D4A3E",0.15),borderLeft:`2px solid ${block.color||"#2D4A3E"}`,borderRadius:"2px",padding:"1px 4px",marginBottom:"2px",overflow:"hidden"}}>
                        <div style={{fontSize:"9px",color:block.color||"#2D4A3E",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{block.title}</div>
                      </div>
                    ))}
                    {dayBlocks.length>2&&<div style={{fontSize:"9px",color:"#7C7C7C",marginTop:"1px"}}>+{dayBlocks.length-2} more</div>}
                    {dayCost>0&&<div style={{fontSize:"9px",color:"#C4A882",marginTop:"2px"}}>{fmtShort(dayCost)}</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{minHeight:"100vh",background:"#F8F5F0",fontFamily:"'Jost',sans-serif",color:"#1A1A1A"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Jost:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-track{background:#F8F5F0;}
        ::-webkit-scrollbar-thumb{background:#C4A882;border-radius:2px;}
        .modal-bg{animation:fadeIn 0.2s ease;}
        .modal-box{animation:slideUp 0.25s ease;}
        .card{animation:slideUp 0.3s ease both;}
        .toast{animation:slideUp 0.3s ease;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;outline:none;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;cursor:pointer;}
      `}</style>

      {toast&&<div className="toast" style={{position:"fixed",top:"16px",right:"16px",zIndex:9999,background:"#2D4A3E",borderRadius:"8px",padding:"12px 18px",fontSize:"12px",color:"#F8F5F0",letterSpacing:"0.05em",boxShadow:"0 4px 20px rgba(0,0,0,0.15)"}}>{toast}</div>}

      {/* Header */}
      <div style={{background:"#1A1A1A",padding:isMobile?"13px 16px":"16px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?"18px":"20px",fontWeight:300,letterSpacing:"0.15em",color:"#F8F5F0",textTransform:"uppercase"}}>LifeSync</h1>
          <p style={{fontSize:"10px",color:"#7C7C7C",letterSpacing:"0.06em",marginTop:"1px"}}>Good {getTimeName(new Date().getHours()).toLowerCase()}, {name.split(" ")[0]}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          {/* Calendar view switcher — only on calendar tab */}
          {tab==="calendar"&&(
            <div style={{display:"flex",background:"#2A2A2A",borderRadius:"6px",padding:"2px",gap:"2px"}}>
              {["day","week","month"].map(v=>(
                <button key={v} onClick={()=>setCalView(v)} style={{padding:"5px 10px",background:calView===v?"#F8F5F0":"transparent",border:"none",borderRadius:"4px",color:calView===v?"#1A1A1A":"#7C7C7C",fontSize:"10px",cursor:"pointer",letterSpacing:"0.06em",fontFamily:"'Jost',sans-serif",transition:"all 0.2s",fontWeight:calView===v?500:400}}>{v.toUpperCase()}</button>
              ))}
            </div>
          )}
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"9px",color:"#7C7C7C"}}>Remaining</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",color:totalRemaining>0?"#7A9E7E":"#E8A0A0"}}>{fmtShort(totalRemaining)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {isMobile?(
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#1A1A1A",borderTop:"1px solid #2A2A2A",display:"flex",zIndex:50,paddingBottom:"env(safe-area-inset-bottom)"}}>
          {[["calendar","📅","Calendar"],["budget","💰","Budget"],["debits","🔄","Debits"],["ai","✨","AI"]].map(([key,icon,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{flex:1,padding:"11px 4px 9px",background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",fontFamily:"'Jost',sans-serif"}}>
              <span style={{fontSize:"17px"}}>{icon}</span>
              <span style={{fontSize:"9px",letterSpacing:"0.08em",color:tab===key?"#7A9E7E":"#5A5A5A",fontWeight:tab===key?500:400}}>{label.toUpperCase()}</span>
            </button>
          ))}
        </div>
      ):(
        <div style={{background:"#F8F5F0",borderBottom:"1px solid #E8DDD0",padding:"0 28px",display:"flex"}}>
          {[["calendar","CALENDAR"],["budget","BUDGET"],["debits","DEBIT ORDERS"],["ai","AI ADVICE"]].map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{padding:"13px 16px",fontSize:"11px",fontWeight:500,letterSpacing:"0.1em",color:tab===key?"#1A1A1A":"#7C7C7C",borderBottom:tab===key?"2px solid #2D4A3E":"2px solid transparent",marginBottom:"-1px",background:"transparent",border:"none",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>{label}</button>
          ))}
        </div>
      )}

      {/* Add event FAB on mobile calendar */}
      {isMobile&&tab==="calendar"&&(
        <button onClick={()=>openAdd(activeDay,9)} style={{position:"fixed",right:"16px",bottom:"76px",width:"52px",height:"52px",background:"#2D4A3E",border:"none",borderRadius:"50%",color:"#F8F5F0",fontSize:"24px",cursor:"pointer",zIndex:40,boxShadow:"0 4px 16px rgba(45,74,62,0.4)",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>+</button>
      )}

      <div style={{paddingBottom:isMobile?"80px":"0"}}>

        {/* CALENDAR */}
        {tab==="calendar"&&(
          <>
            {isMobile?(
              <>
                {calView==="day"&&<DayView/>}
                {calView==="week"&&<WeekView/>}
                {calView==="month"&&<MonthView/>}
              </>
            ):(
              <>
                <div style={{padding:"10px 28px",display:"flex",gap:"8px",overflowX:"auto",borderBottom:"1px solid #E8DDD0",background:"#FDFCFA",alignItems:"center"}}>
                  {Object.entries(CAL_CATEGORIES).map(([key,cat])=>(
                    <button key={key} style={{background:"transparent",border:"1px solid #D4C9BB",borderRadius:"4px",padding:"5px 10px",cursor:"pointer",color:"#7C7C7C",fontSize:"10px",letterSpacing:"0.08em",whiteSpace:"nowrap",fontFamily:"'Jost',sans-serif"}}>{cat.label.toUpperCase()}</button>
                  ))}
                  <div style={{marginLeft:"auto",fontSize:"10px",color:"#C4A882",whiteSpace:"nowrap"}}>Click cell to add</div>
                </div>
                {/* Desktop week view always */}
                <div style={{padding:"0 28px 40px",overflowX:"auto"}}>
                  <div style={{minWidth:"700px"}}>
                    <div style={{display:"grid",gridTemplateColumns:"50px repeat(7,1fr)",marginTop:"14px"}}>
                      <div/>
                      {DAYS.map((d,i)=>(
                        <div key={d} style={{textAlign:"center",padding:"6px 2px"}}>
                          <div style={{fontSize:"11px",fontWeight:500,letterSpacing:"0.1em",color:i>=5?"#2D4A3E":"#7C7C7C"}}>{d}</div>
                          {getDayCost(i)>0&&<div style={{fontSize:"9px",color:"#C4A882",marginTop:"2px"}}>{fmtShort(getDayCost(i))}</div>}
                        </div>
                      ))}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"50px repeat(7,1fr)"}}>
                      <div>{HOURS.map(h=><div key={h} style={{height:"40px",display:"flex",alignItems:"flex-start",paddingTop:"4px",fontSize:"10px",color:"#C4A882",justifyContent:"flex-end",paddingRight:"8px"}}>{fmtH(h)}</div>)}</div>
                      {DAYS.map((_,dayIndex)=>(
                        <div key={dayIndex} style={{position:"relative",borderLeft:"1px solid #EDE8E0"}}>
                          {HOURS.map(h=>(
                            <div key={h} onClick={()=>openAdd(dayIndex,h)} style={{height:"40px",borderBottom:`1px solid ${h%2===0?"#EDE8E0":"#F3EEE8"}`,cursor:"pointer"}}
                              onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.02)"}
                              onMouseLeave={e=>e.currentTarget.style.background="transparent"}/>
                          ))}
                          {blocks.filter(b=>b.day===dayIndex).map(block=>{
                            const col=block.color||"#2D4A3E";
                            const top=(block.startHour-5)*40;
                            const height=(block.endHour-block.startHour)*40-2;
                            return (
                              <div key={block.id} onClick={e=>openEdit(block,e)} onMouseEnter={()=>setHoveredBlock(block.id)} onMouseLeave={()=>setHoveredBlock(null)}
                                style={{position:"absolute",top:`${top}px`,left:"2px",right:"2px",height:`${height}px`,background:hexAlpha(col,0.12),borderLeft:`3px solid ${col}`,borderRadius:"3px",padding:"4px 6px",cursor:"pointer",overflow:"hidden",zIndex:2}}>
                                {height>28&&<div style={{fontSize:"10px",fontWeight:500,color:col,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{block.title}</div>}
                                {height>46&&block.hasCost&&block.cost>0&&<div style={{fontSize:"9px",color:col,opacity:0.75}}>R{block.cost}</div>}
                                {hoveredBlock===block.id&&<button onClick={e=>{e.stopPropagation();setBlocks(prev=>prev.filter(b=>b.id!==block.id));}} style={{position:"absolute",top:"3px",right:"3px",background:col,border:"none",color:"#fff",width:"14px",height:"14px",borderRadius:"2px",cursor:"pointer",fontSize:"10px",lineHeight:1}}>×</button>}
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
          </>
        )}

        {/* BUDGET */}
        {tab==="budget"&&(
          <div style={{padding:isMobile?"16px":"28px"}}>
            <div style={{maxWidth:"680px"}}>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr",gap:"10px",marginBottom:"20px"}}>
                {[{label:"Income",value:fmtShort(income),color:"#F8F5F0",bg:"#1A1A1A"},{label:"Committed",value:fmtShort(totalSpent),color:"#F8F5F0",bg:"#3A3A3A"},{label:"Remaining",value:fmtShort(totalRemaining),color:totalRemaining>=0?"#7A9E7E":"#E8A0A0",bg:"#FDFCFA"}].map(card=>(
                  <div key={card.label} style={{background:card.bg,border:"1px solid #E8DDD0",borderRadius:"10px",padding:"14px"}}>
                    <div style={{fontSize:"9px",color:"#7C7C7C",letterSpacing:"0.1em",marginBottom:"5px"}}>{card.label.toUpperCase()}</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:card.color,fontWeight:400}}>{card.value}</div>
                    <div style={{fontSize:"9px",color:"#7C7C7C",marginTop:"3px"}}>{period}</div>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:"20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                  <span style={{fontSize:"10px",color:"#7C7C7C",letterSpacing:"0.08em"}}>BUDGET USED</span>
                  <span style={{fontSize:"10px",color:"#7C7C7C"}}>{income>0?Math.round((totalSpent/income)*100):0}%</span>
                </div>
                <div style={{height:"6px",background:"#E8DDD0",borderRadius:"3px",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.min(100,income>0?(totalSpent/income)*100:0)}%`,background:totalSpent/income>0.9?"#E8A0A0":"#2D4A3E",borderRadius:"3px",transition:"width 0.5s"}}/>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
                {BUDGET_CATEGORIES.map(cat=>{
                  const allocated=income*((allocations[cat.key]||0)/100);
                  const spent=spentByCategory[cat.key]||0;
                  const pct=allocated>0?Math.min(100,(spent/allocated)*100):0;
                  const over=spent>allocated;
                  return (
                    <div key={cat.key} className="card" style={{background:"#FDFCFA",border:"1px solid #E8DDD0",borderRadius:"8px",padding:"12px 14px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"7px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                          <div style={{width:"7px",height:"7px",background:cat.color,borderRadius:"50%"}}/>
                          <span style={{fontSize:"12px",color:"#1A1A1A"}}>{cat.label}</span>
                        </div>
                        <div>
                          <span style={{fontSize:"12px",color:over?"#E8A0A0":"#1A1A1A",fontWeight:over?500:400}}>{fmtShort(spent)}</span>
                          <span style={{fontSize:"10px",color:"#7C7C7C"}}> / {fmtShort(allocated)}</span>
                        </div>
                      </div>
                      <div style={{height:"4px",background:"#E8DDD0",borderRadius:"2px",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:over?"#E8A0A0":cat.color,borderRadius:"2px",transition:"width 0.4s"}}/>
                      </div>
                      {over&&<div style={{fontSize:"10px",color:"#E8A0A0",marginTop:"4px"}}>Over by {fmtShort(spent-allocated)}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* DEBITS */}
        {tab==="debits"&&(
          <div style={{padding:isMobile?"16px":"28px"}}>
            <div style={{maxWidth:"560px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"18px"}}>
                <div>
                  <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"24px",fontWeight:300,color:"#1A1A1A",marginBottom:"3px"}}>Debit Orders</h2>
                  <p style={{fontSize:"12px",color:"#7C7C7C"}}>Monthly: <span style={{color:"#1A1A1A",fontWeight:500}}>{fmtCurrency(debitTotal)}</span></p>
                </div>
                <button onClick={()=>setDebitModal(true)} style={{background:"#1A1A1A",border:"none",borderRadius:"6px",padding:"10px 16px",color:"#F8F5F0",fontSize:"11px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>+ ADD</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
                {debits.map(d=>{
                  const cat=BUDGET_CATEGORIES.find(c=>c.key===d.budgetCat);
                  return (
                    <div key={d.id} className="card" style={{background:"#FDFCFA",border:"1px solid #E8DDD0",borderLeft:`3px solid ${d.color}`,borderRadius:"8px",padding:"13px 15px",display:"flex",alignItems:"center",gap:"12px"}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:500,fontSize:"13px",color:"#1A1A1A",marginBottom:"2px"}}>{d.name}</div>
                        <div style={{fontSize:"10px",color:"#7C7C7C"}}>Day {d.day} · {cat?.label||d.budgetCat}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"17px",color:"#1A1A1A"}}>{fmtCurrency(d.amount)}</div>
                        <button onClick={()=>setDebits(prev=>prev.filter(x=>x.id!==d.id))} style={{fontSize:"10px",color:"#E8A0A0",background:"transparent",border:"none",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>REMOVE</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* AI */}
        {tab==="ai"&&(
          <div style={{padding:isMobile?"16px":"28px"}}>
            <div style={{maxWidth:"600px"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"18px",gap:"12px"}}>
                <div>
                  <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"24px",fontWeight:300,color:"#1A1A1A",marginBottom:"5px"}}>AI Budget Advice</h2>
                  <p style={{fontSize:"12px",color:"#7C7C7C",fontWeight:300,lineHeight:1.6}}>Claude analyses your spending and gives personalised money-saving tips.</p>
                </div>
                <button onClick={async()=>{
                  setAiLoading(true);setAiAdvice(null);
                  try{
                    const summary=BUDGET_CATEGORIES.map(cat=>`${cat.label}: spent R${spentByCategory[cat.key]||0} of R${Math.round(income*(allocations[cat.key]||0)/100)}`).join(", ");
                    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`You are a smart personal finance advisor for a South African user. Income: R${income} ${period}. Spending: ${summary}. Debit orders: R${debitTotal}. Give 4 specific actionable money-saving tips as a JSON array with fields: tip, detail (1 sentence), category (budget category key from: groceries/transport/entertainment/health/shopping/savings/bills/insurance), saving (number in ZAR). Return ONLY the JSON array, no markdown.`}]})});
                    const data=await res.json();
                    const text=data.content?.map(c=>c.text||"").join("")||"";
                    setAiAdvice(JSON.parse(text.trim()));
                  }catch(e){
                    setAiAdvice([
                      {tip:"Review streaming services",detail:"Audit your subscriptions — most people pay for 2-3 they rarely use.",category:"entertainment",saving:300},
                      {tip:"Meal prep on Sundays",detail:"Cooking at home can cut your food spend by up to 40%.",category:"groceries",saving:800},
                      {tip:"Annual insurance review",detail:"Getting competing quotes annually saves an average of 15-20% on premiums.",category:"insurance",saving:200},
                      {tip:"Automate your savings",detail:"Moving savings to a separate account on payday prevents lifestyle creep.",category:"savings",saving:500},
                    ]);
                  }
                  setAiLoading(false);
                }} disabled={aiLoading} style={{background:"#1A1A1A",border:"none",borderRadius:"6px",padding:"10px 14px",color:"#F8F5F0",fontSize:"11px",cursor:aiLoading?"not-allowed":"pointer",letterSpacing:"0.1em",opacity:aiLoading?0.6:1,flexShrink:0,fontFamily:"'Jost',sans-serif"}}>
                  {aiLoading?"ANALYSING...":"ANALYSE"}
                </button>
              </div>
              {!aiAdvice&&!aiLoading&&<div style={{background:"#FDFCFA",border:"1px solid #E8DDD0",borderRadius:"8px",padding:"36px",textAlign:"center"}}><p style={{color:"#C4A882",fontSize:"13px",letterSpacing:"0.05em"}}>Tap Analyse for personalised advice</p></div>}
              {aiLoading&&<div style={{background:"#FDFCFA",border:"1px solid #E8DDD0",borderRadius:"8px",padding:"36px",textAlign:"center"}}><p style={{color:"#7C7C7C",fontSize:"13px"}}>Analysing your spending...</p></div>}
              {aiAdvice&&(
                <>
                  <div style={{background:"#1A1A1A",borderRadius:"8px",padding:"13px 16px",marginBottom:"12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:"11px",color:"#7C7C7C"}}>Potential monthly savings</span>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#7A9E7E"}}>{fmtShort(aiAdvice.reduce((s,a)=>s+(a.saving||0),0))}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
                    {aiAdvice.map((a,i)=>{
                      const cat=BUDGET_CATEGORIES.find(c=>c.key===a.category);
                      return (
                        <div key={i} className="card" style={{animationDelay:`${i*0.08}s`,background:"#FDFCFA",border:"1px solid #E8DDD0",borderLeft:`3px solid ${cat?.color||"#2D4A3E"}`,borderRadius:"6px",padding:"13px 15px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"}}>
                            <span style={{fontWeight:500,fontSize:"13px",color:"#1A1A1A"}}>{a.tip}</span>
                            <span style={{fontSize:"11px",color:"#7A9E7E",fontWeight:500,flexShrink:0,marginLeft:"8px"}}>Save {fmtShort(a.saving||0)}/mo</span>
                          </div>
                          <p style={{margin:0,fontSize:"12px",color:"#7C7C7C",lineHeight:1.6,fontWeight:300}}>{a.detail}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* EVENT MODAL */}
      {modal&&(
        <div className="modal-bg" onClick={()=>setModal(null)} style={{position:"fixed",inset:0,background:"rgba(26,26,26,0.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",zIndex:100,padding:isMobile?"0":"20px"}}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{background:"#FDFCFA",border:"1px solid #E8DDD0",borderRadius:isMobile?"14px 14px 0 0":"14px",padding:"22px",width:"100%",maxWidth:isMobile?"100%":"420px",maxHeight:isMobile?"92vh":"90vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.12)"}}>
            {isMobile&&<div style={{width:"36px",height:"4px",background:"#E8DDD0",borderRadius:"2px",margin:"0 auto 18px"}}/>}
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"19px",fontWeight:300,margin:"0 0 16px",color:"#1A1A1A"}}>{modal.mode==="add"?`ADD TO ${DAYS[modal.day].toUpperCase()}`:"EDIT BLOCK"}</h2>

            <label style={labelStyle}>TITLE</label>
            <div style={{display:"flex",gap:"8px",marginBottom:"13px"}}>
              <input value={form.title||""} onChange={e=>setForm({...form,title:e.target.value,autoTitle:false})} style={{...inputStyle,flex:1}}/>
              <button onClick={()=>setForm(f=>({...f,autoTitle:!f.autoTitle}))} style={{background:form.autoTitle?"#1A1A1A":"transparent",border:"1px solid #E8DDD0",borderRadius:"6px",padding:"8px 10px",cursor:"pointer",fontSize:"10px",color:form.autoTitle?"#F8F5F0":"#7C7C7C",letterSpacing:"0.06em",fontFamily:"'Jost',sans-serif"}}>AUTO</button>
            </div>

            <label style={labelStyle}>CATEGORY</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"4px",marginBottom:"13px"}}>
              {Object.entries(CAL_CATEGORIES).map(([key,cat])=>(
                <button key={key} onClick={()=>setForm({...form,category:key})} style={{padding:"6px 2px",background:form.category===key?"#1A1A1A":"transparent",border:`1px solid ${form.category===key?"#1A1A1A":"#E8DDD0"}`,borderRadius:"4px",cursor:"pointer",color:form.category===key?"#F8F5F0":"#7C7C7C",fontSize:"9px",letterSpacing:"0.04em",fontFamily:"'Jost',sans-serif"}}>{cat.label.toUpperCase()}</button>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"13px"}}>
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
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"13px"}}>
              {EVENT_COLORS.map(c=><button key={c} onClick={()=>setForm({...form,color:c})} style={{width:"24px",height:"24px",background:c,border:`2px solid ${form.color===c?"#1A1A1A":"transparent"}`,borderRadius:"50%",cursor:"pointer"}}/>)}
            </div>

            <div style={{background:"#F3EEE8",border:"1px solid #E8DDD0",borderRadius:"8px",padding:"12px",marginBottom:"13px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:form.hasCost?"10px":"0"}}>
                <span style={{fontSize:"11px",color:"#7C7C7C",letterSpacing:"0.08em"}}>HAS A COST?</span>
                <button onClick={()=>setForm(f=>({...f,hasCost:!f.hasCost}))} style={{width:"36px",height:"20px",background:form.hasCost?"#2D4A3E":"#D4C9BB",borderRadius:"10px",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
                  <div style={{position:"absolute",top:"2px",left:form.hasCost?"18px":"2px",width:"16px",height:"16px",background:"#fff",borderRadius:"50%",transition:"left 0.2s"}}/>
                </button>
              </div>
              {form.hasCost&&(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                    <div><label style={labelStyle}>AMOUNT (R)</label><input value={form.cost||""} onChange={e=>setForm({...form,cost:e.target.value})} placeholder="0.00" type="number" style={inputStyle}/></div>
                    <div><label style={labelStyle}>BUDGET CATEGORY</label><select value={form.budgetCat||"groceries"} onChange={e=>setForm({...form,budgetCat:e.target.value})} style={inputStyle}>{BUDGET_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
                  </div>
                  {form.cost&&parseFloat(form.cost)>0&&(
                    <div style={{marginTop:"8px",fontSize:"11px",color:totalRemaining-parseFloat(form.cost||0)>=0?"#7A9E7E":"#E8A0A0"}}>After this: {fmtCurrency(totalRemaining-parseFloat(form.cost||0))} remaining</div>
                  )}
                </>
              )}
            </div>

            <label style={labelStyle}>REPEAT</label>
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"13px"}}>
              {RECUR_OPTIONS.map(r=><button key={r} onClick={()=>setForm({...form,recur:r})} style={{padding:"5px 9px",background:form.recur===r?"#1A1A1A":"transparent",border:`1px solid ${form.recur===r?"#1A1A1A":"#E8DDD0"}`,borderRadius:"4px",cursor:"pointer",color:form.recur===r?"#F8F5F0":"#7C7C7C",fontSize:"10px",letterSpacing:"0.05em",textTransform:"capitalize",fontFamily:"'Jost',sans-serif"}}>{r}</button>)}
            </div>

            <label style={labelStyle}>REMINDER</label>
            <select value={form.reminder||0} onChange={e=>setForm({...form,reminder:parseInt(e.target.value)})} style={{...inputStyle,marginBottom:"16px"}}>
              {[[0,"No reminder"],[5,"5 min before"],[10,"10 min before"],[15,"15 min before"],[30,"30 min before"],[60,"1 hour before"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>

            {form.endHour<=form.startHour&&<div style={{background:"#FDF0F0",border:"1px solid #E8C4C4",borderRadius:"6px",padding:"8px 12px",fontSize:"11px",color:"#A05050",marginBottom:"10px"}}>End time must be after start time</div>}
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>setModal(null)} style={{flex:1,padding:"12px",background:"transparent",border:"1px solid #E8DDD0",borderRadius:"8px",color:"#7C7C7C",fontSize:"11px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>CANCEL</button>
              <button onClick={saveBlock} style={{flex:2,padding:"12px",background:form.title&&form.endHour>form.startHour?"#1A1A1A":"#E8DDD0",border:"none",borderRadius:"8px",color:form.title&&form.endHour>form.startHour?"#F8F5F0":"#A0A0A0",fontSize:"11px",cursor:"pointer",fontWeight:500,letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>{modal.mode==="add"?"ADD BLOCK":"SAVE CHANGES"}</button>
            </div>
          </div>
        </div>
      )}

      {/* DEBIT MODAL */}
      {debitModal&&(
        <div className="modal-bg" onClick={()=>setDebitModal(false)} style={{position:"fixed",inset:0,background:"rgba(26,26,26,0.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",zIndex:100,padding:isMobile?"0":"20px"}}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{background:"#FDFCFA",border:"1px solid #E8DDD0",borderRadius:isMobile?"14px 14px 0 0":"14px",padding:"22px",width:"100%",maxWidth:"380px",boxShadow:"0 24px 60px rgba(0,0,0,0.12)"}}>
            {isMobile&&<div style={{width:"36px",height:"4px",background:"#E8DDD0",borderRadius:"2px",margin:"0 auto 18px"}}/>}
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"19px",fontWeight:300,margin:"0 0 16px",color:"#1A1A1A"}}>ADD DEBIT ORDER</h2>
            <label style={labelStyle}>NAME</label>
            <input value={debitForm.name} onChange={e=>setDebitForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Netflix" style={{...inputStyle,marginBottom:"13px"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"13px"}}>
              <div><label style={labelStyle}>AMOUNT (R)</label><input value={debitForm.amount} onChange={e=>setDebitForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" type="number" style={inputStyle}/></div>
              <div><label style={labelStyle}>DEBIT DAY</label><input value={debitForm.day} onChange={e=>setDebitForm(f=>({...f,day:parseInt(e.target.value)||1}))} type="number" min="1" max="31" style={inputStyle}/></div>
            </div>
            <label style={labelStyle}>CATEGORY</label>
            <select value={debitForm.budgetCat} onChange={e=>setDebitForm(f=>({...f,budgetCat:e.target.value}))} style={{...inputStyle,marginBottom:"18px"}}>
              {BUDGET_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>setDebitModal(false)} style={{flex:1,padding:"12px",background:"transparent",border:"1px solid #E8DDD0",borderRadius:"8px",color:"#7C7C7C",fontSize:"11px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>CANCEL</button>
              <button onClick={()=>{if(!debitForm.name||!debitForm.amount)return;const cat=BUDGET_CATEGORIES.find(c=>c.key===debitForm.budgetCat);setDebits(prev=>[...prev,{id:Date.now(),...debitForm,amount:parseFloat(debitForm.amount),color:cat?.color||"#6E7A8A"}]);setDebitModal(false);showToast("Debit order added");}} style={{flex:2,padding:"12px",background:"#1A1A1A",border:"none",borderRadius:"8px",color:"#F8F5F0",fontSize:"11px",cursor:"pointer",fontWeight:500,letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>ADD DEBIT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
