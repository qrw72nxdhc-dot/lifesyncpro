import { useState, useEffect } from "react";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DAYS_FULL = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
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
  {key:"activities",   label:"Activities",           color:"#9B8EA8"},
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

// Get the real date for a weekday index this week
const getDateForDay = (dayIndex) => {
  const today = new Date();
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const diff = dayIndex - todayIndex;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d;
};

const getTodayIndex = () => {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
};

function useIsMobile() {
  const [isMobile,setIsMobile] = useState(window.innerWidth < 768);
  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[]);
  return isMobile;
}

// ── ONBOARDING ─────────────────────────────────────────────────────────────────
function SetupPage({onComplete}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name:"", income:"", period:"monthly", payDay:"25",
    groceries:"", transport:"", health:"", shopping:"", savings:"", activities:"",
    debits:[], workDays:["Mon","Tue","Wed","Thu","Fri"], wakeHour:"7", sleepHour:"22",
  });
  const [newDebit, setNewDebit] = useState({name:"",amount:"",day:"1",budgetCat:"bills"});
  const [addingDebit, setAddingDebit] = useState(false);
  const isMobile = useIsMobile();

  const upd = (key, val) => setData(d => ({...d, [key]: val}));

  const totalSteps = 8;

  const addDebit = () => {
    if(!newDebit.name || !newDebit.amount) return;
    const cat = BUDGET_CATEGORIES.find(c=>c.key===newDebit.budgetCat);
    setData(d=>({...d, debits:[...d.debits, {id:Date.now(),...newDebit, amount:parseFloat(newDebit.amount), color:cat?.color||"#6E7A8A"}]}));
    setNewDebit({name:"",amount:"",day:"1",budgetCat:"bills"});
    setAddingDebit(false);
  };

  const removeDebit = (id) => setData(d=>({...d, debits:d.debits.filter(x=>x.id!==id)}));

  const handleComplete = () => {
    const inc = parseFloat(data.income)||0;
    const spend = {
      groceries: parseFloat(data.groceries)||0,
      transport: parseFloat(data.transport)||0,
      health: parseFloat(data.health)||0,
      shopping: parseFloat(data.shopping)||0,
      activities: parseFloat(data.activities)||0,
    };
    const debitTotal = data.debits.reduce((s,d)=>s+d.amount,0);
    const savingsAmt = parseFloat(data.savings)||0;
    const totalCommitted = Object.values(spend).reduce((a,b)=>a+b,0) + debitTotal + savingsAmt;

    // Build allocations as percentages
    const allocations = {};
    BUDGET_CATEGORIES.forEach(cat => {
      const amt = cat.key==="savings" ? savingsAmt :
                  cat.key==="bills" ? debitTotal :
                  spend[cat.key]||0;
      allocations[cat.key] = inc > 0 ? Math.round((amt/inc)*100) : 0;
    });

    // Generate suggested weekly schedule from onboarding data
    const suggestedBlocks = [];
    let id = 1;

    // Work blocks — Mon–Fri, 9–17
    data.workDays.forEach(dayLabel => {
      const dayIndex = DAYS.indexOf(dayLabel);
      if(dayIndex >= 0) {
        suggestedBlocks.push({id:id++,day:dayIndex,startHour:9,endHour:17,category:"work",title:"Work",recur:"weekdays",reminder:0,color:"#2D4A3E",hasCost:false,cost:0,budgetCat:""});
      }
    });

    // Gym if health spend > 0
    if(parseFloat(data.health)>0) {
      suggestedBlocks.push({id:id++,day:0,startHour:6,endHour:7,category:"gym",title:"Morning Gym",recur:"weekly",reminder:15,color:"#3A3A3A",hasCost:true,cost:parseFloat(data.health)/4,budgetCat:"health"});
      suggestedBlocks.push({id:id++,day:2,startHour:6,endHour:7,category:"gym",title:"Morning Gym",recur:"weekly",reminder:15,color:"#3A3A3A",hasCost:false,cost:0,budgetCat:""});
    }

    // Groceries block Saturday
    if(parseFloat(data.groceries)>0) {
      suggestedBlocks.push({id:id++,day:5,startHour:9,endHour:11,category:"meal",title:"Grocery Run",recur:"weekly",reminder:15,color:"#C4A882",hasCost:true,cost:parseFloat(data.groceries),budgetCat:"groceries"});
    }

    // Activities if present
    if(parseFloat(data.activities)>0) {
      suggestedBlocks.push({id:id++,day:6,startHour:10,endHour:13,category:"weekend",title:"Weekend Activity",recur:"weekly",reminder:30,color:"#9B8EA8",hasCost:true,cost:parseFloat(data.activities),budgetCat:"activities"});
    }

    onComplete({...data, income:inc, allocations, suggestedBlocks, totalCommitted});
  };

  const containerStyle = {minHeight:"100vh",background:"#1A1A1A",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Jost',sans-serif",padding:"24px 20px"};
  const wrapStyle = {width:"100%",maxWidth:"460px"};
  const h2Style = {fontFamily:"'Cormorant Garamond',serif",fontWeight:300,color:"#F8F5F0",margin:"0 0 8px"};
  const subStyle = {color:"#7C7C7C",fontSize:"13px",margin:"0 0 36px",fontWeight:300,lineHeight:1.7};
  const labelStyle = {display:"block",fontSize:"10px",color:"#7C7C7C",marginBottom:"8px",letterSpacing:"0.12em"};
  const inputStyle = {width:"100%",background:"transparent",border:"none",borderBottom:"1px solid #3A3A3A",padding:"10px 0",color:"#F8F5F0",fontSize:"26px",outline:"none",fontFamily:"'Cormorant Garamond',serif",fontWeight:300,marginBottom:"32px"};
  const nextBtn = (disabled, onClick, label="CONTINUE") => (
    <button onClick={onClick} disabled={disabled} style={{background:!disabled?"#F8F5F0":"#2A2A2A",border:"none",borderRadius:"6px",padding:"14px",color:!disabled?"#1A1A1A":"#3A3A3A",fontSize:"12px",fontWeight:500,cursor:!disabled?"pointer":"not-allowed",letterSpacing:"0.1em",width:"100%",fontFamily:"'Jost',sans-serif",transition:"all 0.2s"}}>{label}</button>
  );

  const inpStyleSmall = {background:"#252525",border:"1px solid #3A3A3A",borderRadius:"6px",padding:"10px 12px",color:"#F8F5F0",fontSize:"13px",outline:"none",fontFamily:"'Jost',sans-serif",width:"100%",boxSizing:"border-box"};
  const selStyle = {...inpStyleSmall};

  return (
    <div style={containerStyle}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Jost:wght@300;400;500;600&display=swap');*{box-sizing:border-box;} input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}`}</style>
      <div style={wrapStyle}>

        {/* Progress bar */}
        {step > 0 && (
          <div style={{marginBottom:"36px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
              <button onClick={()=>setStep(s=>s-1)} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"11px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif",padding:0}}>← BACK</button>
              <span style={{color:"#7C7C7C",fontSize:"11px",letterSpacing:"0.08em"}}>{step} / {totalSteps}</span>
            </div>
            <div style={{height:"2px",background:"#2A2A2A",borderRadius:"2px",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(step/totalSteps)*100}%`,background:"#7A9E7E",borderRadius:"2px",transition:"width 0.4s"}}/>
            </div>
          </div>
        )}

        {/* STEP 0 — Welcome */}
        {step===0&&(
          <div>
            <p style={{color:"#7C7C7C",fontSize:"11px",letterSpacing:"0.15em",marginBottom:"12px"}}>WELCOME TO</p>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"54px",fontWeight:300,color:"#F8F5F0",margin:"0 0 6px",lineHeight:1,letterSpacing:"0.04em"}}>LifeSync</h1>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",fontStyle:"italic",color:"#7C7C7C",margin:"0 0 52px",fontWeight:300}}>Your life, intelligently organised.</p>
            <p style={{color:"#5A5A5A",fontSize:"12px",margin:"0 0 32px",lineHeight:1.8,letterSpacing:"0.04em"}}>We'll ask you a few questions to personalise your calendar and budget. It takes about 2 minutes.</p>
            <button onClick={()=>setStep(1)} style={{background:"#F8F5F0",border:"none",borderRadius:"6px",padding:"16px",color:"#1A1A1A",fontSize:"12px",fontWeight:500,cursor:"pointer",letterSpacing:"0.1em",width:"100%",fontFamily:"'Jost',sans-serif"}}>LET'S GET STARTED</button>
          </div>
        )}

        {/* STEP 1 — Name */}
        {step===1&&(
          <div>
            <h2 style={{...h2Style,fontSize:"36px"}}>What's your name?</h2>
            <p style={subStyle}>This is how LifeSync will greet you.</p>
            <label style={labelStyle}>YOUR NAME</label>
            <input value={data.name} onChange={e=>upd("name",e.target.value)} placeholder="e.g. Olivia" onKeyDown={e=>e.key==="Enter"&&data.name&&setStep(2)}
              style={inputStyle}/>
            {nextBtn(!data.name,()=>setStep(2))}
          </div>
        )}

        {/* STEP 2 — Income */}
        {step===2&&(
          <div>
            <h2 style={{...h2Style,fontSize:"34px"}}>Hi, {data.name}.</h2>
            <p style={subStyle}>What's your monthly take-home income after tax?</p>
            <label style={labelStyle}>MONTHLY INCOME (ZAR)</label>
            <div style={{display:"flex",alignItems:"center",borderBottom:"1px solid #3A3A3A",marginBottom:"24px",paddingBottom:"10px"}}>
              <span style={{color:"#7C7C7C",fontSize:"26px",fontFamily:"'Cormorant Garamond',serif",marginRight:"8px"}}>R</span>
              <input value={data.income} onChange={e=>upd("income",e.target.value.replace(/[^0-9.]/g,""))} placeholder="0" type="number"
                style={{flex:1,background:"transparent",border:"none",color:"#F8F5F0",fontSize:"36px",outline:"none",fontFamily:"'Cormorant Garamond',serif",fontWeight:300}}/>
            </div>
            <label style={labelStyle}>WHAT DAY DO YOU GET PAID?</label>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"32px"}}>
              {["1","15","25","28","Last day"].map(d=>(
                <button key={d} onClick={()=>upd("payDay",d)} style={{padding:"10px 16px",background:data.payDay===d?"#2D4A3E":"transparent",border:`1px solid ${data.payDay===d?"#2D4A3E":"#3A3A3A"}`,borderRadius:"6px",color:data.payDay===d?"#F8F5F0":"#7C7C7C",fontSize:"12px",cursor:"pointer",letterSpacing:"0.05em",fontFamily:"'Jost',sans-serif",transition:"all 0.2s"}}>{d}</button>
              ))}
            </div>
            {nextBtn(!data.income,()=>setStep(3))}
          </div>
        )}

        {/* STEP 3 — Work days */}
        {step===3&&(
          <div>
            <h2 style={{...h2Style,fontSize:"32px"}}>When do you work?</h2>
            <p style={subStyle}>We'll block these days out in your calendar automatically.</p>
            <label style={labelStyle}>YOUR WORK DAYS</label>
            <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
              {DAYS.map(d=>{
                const sel = data.workDays.includes(d);
                return (
                  <button key={d} onClick={()=>upd("workDays",sel?data.workDays.filter(x=>x!==d):[...data.workDays,d])}
                    style={{flex:1,padding:"12px 4px",background:sel?"#2D4A3E":"transparent",border:`1px solid ${sel?"#2D4A3E":"#3A3A3A"}`,borderRadius:"6px",color:sel?"#F8F5F0":"#7C7C7C",fontSize:"11px",cursor:"pointer",fontFamily:"'Jost',sans-serif",transition:"all 0.2s"}}>{d}</button>
                );
              })}
            </div>
            <label style={{...labelStyle,marginTop:"24px"}}>WHAT TIME DO YOU USUALLY START?</label>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"32px"}}>
              {["7","8","9","10"].map(h=>(
                <button key={h} onClick={()=>upd("workStart",h)} style={{flex:1,padding:"10px",background:data.workStart===h?"#2D4A3E":"transparent",border:`1px solid ${data.workStart===h?"#2D4A3E":"#3A3A3A"}`,borderRadius:"6px",color:data.workStart===h?"#F8F5F0":"#7C7C7C",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif",transition:"all 0.2s"}}>{fmtH(parseInt(h))}</button>
              ))}
            </div>
            {nextBtn(false,()=>setStep(4))}
          </div>
        )}

        {/* STEP 4 — Daily rhythm */}
        {step===4&&(
          <div>
            <h2 style={{...h2Style,fontSize:"32px"}}>Your daily rhythm.</h2>
            <p style={subStyle}>This helps LifeSync suggest the best times for activities.</p>
            <label style={labelStyle}>WHAT TIME DO YOU USUALLY WAKE UP?</label>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"28px"}}>
              {["5","6","7","8","9"].map(h=>(
                <button key={h} onClick={()=>upd("wakeHour",h)} style={{flex:1,padding:"10px",background:data.wakeHour===h?"#2D4A3E":"transparent",border:`1px solid ${data.wakeHour===h?"#2D4A3E":"#3A3A3A"}`,borderRadius:"6px",color:data.wakeHour===h?"#F8F5F0":"#7C7C7C",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif",transition:"all 0.2s"}}>{fmtH(parseInt(h))}</button>
              ))}
            </div>
            <label style={labelStyle}>WHAT TIME DO YOU USUALLY SLEEP?</label>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"32px"}}>
              {["21","22","23","0"].map(h=>(
                <button key={h} onClick={()=>upd("sleepHour",h)} style={{flex:1,padding:"10px",background:data.sleepHour===h?"#2D4A3E":"transparent",border:`1px solid ${data.sleepHour===h?"#2D4A3E":"#3A3A3A"}`,borderRadius:"6px",color:data.sleepHour===h?"#F8F5F0":"#7C7C7C",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif",transition:"all 0.2s"}}>{fmtH(parseInt(h))}</button>
              ))}
            </div>
            {nextBtn(false,()=>setStep(5))}
          </div>
        )}

        {/* STEP 5 — Spending */}
        {step===5&&(
          <div>
            <h2 style={{...h2Style,fontSize:"32px"}}>Your monthly spending.</h2>
            <p style={subStyle}>Estimates are fine — you can always adjust these later.</p>
            <div style={{display:"flex",flexDirection:"column",gap:"20px",marginBottom:"32px"}}>
              {[
                {key:"groceries",q:"How much do you spend on food & groceries on average?",icon:"🛒",ph:"e.g. 2000"},
                {key:"transport",q:"How much do you spend on transport? (fuel, Uber, etc.)",icon:"🚗",ph:"e.g. 1500"},
                {key:"health",q:"How much do you spend on gym or health per month?",icon:"💪",ph:"e.g. 500"},
                {key:"shopping",q:"How much do you spend on shopping & clothing?",icon:"🛍",ph:"e.g. 800"},
                {key:"activities",q:"How much do you spend on activities & going out?",icon:"🎉",ph:"e.g. 600"},
                {key:"savings",q:"How much do you want to save each month?",icon:"💰",ph:"e.g. 1000"},
              ].map(item=>(
                <div key={item.key}>
                  <label style={{...labelStyle,display:"flex",alignItems:"center",gap:"6px"}}><span>{item.icon}</span>{item.q}</label>
                  <div style={{display:"flex",alignItems:"center",borderBottom:"1px solid #3A3A3A",paddingBottom:"8px"}}>
                    <span style={{color:"#7C7C7C",fontSize:"18px",fontFamily:"'Cormorant Garamond',serif",marginRight:"6px"}}>R</span>
                    <input value={data[item.key]} onChange={e=>upd(item.key,e.target.value.replace(/[^0-9.]/g,""))} placeholder={item.ph} type="number"
                      style={{flex:1,background:"transparent",border:"none",color:"#F8F5F0",fontSize:"22px",outline:"none",fontFamily:"'Cormorant Garamond',serif",fontWeight:300}}/>
                  </div>
                  {data[item.key]&&parseFloat(data.income)>0&&(
                    <div style={{fontSize:"10px",color:"#7C7C7C",marginTop:"4px",letterSpacing:"0.04em"}}>
                      {Math.round((parseFloat(data[item.key])/parseFloat(data.income))*100)}% of your income
                    </div>
                  )}
                </div>
              ))}
            </div>
            {nextBtn(false,()=>setStep(6))}
          </div>
        )}

        {/* STEP 6 — Debit orders */}
        {step===6&&(
          <div>
            <h2 style={{...h2Style,fontSize:"32px"}}>Your debit orders.</h2>
            <p style={subStyle}>Add all your recurring monthly payments — subscriptions, insurance, rent, loans, etc.</p>

            {data.debits.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"16px"}}>
                {data.debits.map(d=>{
                  const cat=BUDGET_CATEGORIES.find(c=>c.key===d.budgetCat);
                  return (
                    <div key={d.id} style={{background:"#252525",border:"1px solid #3A3A3A",borderLeft:`3px solid ${d.color||"#6E7A8A"}`,borderRadius:"6px",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{color:"#F8F5F0",fontSize:"13px",fontWeight:500}}>{d.name}</div>
                        <div style={{color:"#7C7C7C",fontSize:"11px",marginTop:"2px"}}>Day {d.day} · {cat?.label}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",color:"#F8F5F0"}}>{fmtCurrency(d.amount)}</span>
                        <button onClick={()=>removeDebit(d.id)} style={{background:"transparent",border:"none",color:"#E8A0A0",fontSize:"16px",cursor:"pointer"}}>×</button>
                      </div>
                    </div>
                  );
                })}
                <div style={{borderTop:"1px solid #3A3A3A",paddingTop:"10px",display:"flex",justifyContent:"space-between",fontSize:"12px",color:"#7C7C7C"}}>
                  <span>Total monthly debits</span>
                  <span style={{color:"#F8F5F0",fontFamily:"'Cormorant Garamond',serif",fontSize:"16px"}}>{fmtCurrency(data.debits.reduce((s,d)=>s+d.amount,0))}</span>
                </div>
              </div>
            )}

            {addingDebit?(
              <div style={{background:"#252525",border:"1px solid #3A3A3A",borderRadius:"8px",padding:"16px",marginBottom:"16px"}}>
                <div style={{marginBottom:"12px"}}>
                  <label style={labelStyle}>DEBIT ORDER NAME</label>
                  <input value={newDebit.name} onChange={e=>setNewDebit(f=>({...f,name:e.target.value}))} placeholder="e.g. Netflix, Car Insurance" style={inpStyleSmall}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}}>
                  <div>
                    <label style={labelStyle}>AMOUNT (R)</label>
                    <input value={newDebit.amount} onChange={e=>setNewDebit(f=>({...f,amount:e.target.value}))} placeholder="0.00" type="number" style={inpStyleSmall}/>
                  </div>
                  <div>
                    <label style={labelStyle}>DEBIT DAY OF MONTH</label>
                    <input value={newDebit.day} onChange={e=>setNewDebit(f=>({...f,day:e.target.value}))} placeholder="e.g. 1, 15, 25" type="number" min="1" max="31" style={inpStyleSmall}/>
                  </div>
                </div>
                <div style={{marginBottom:"14px"}}>
                  <label style={labelStyle}>CATEGORY</label>
                  <select value={newDebit.budgetCat} onChange={e=>setNewDebit(f=>({...f,budgetCat:e.target.value}))} style={selStyle}>
                    {BUDGET_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",gap:"8px"}}>
                  <button onClick={()=>setAddingDebit(false)} style={{flex:1,padding:"10px",background:"transparent",border:"1px solid #3A3A3A",borderRadius:"6px",color:"#7C7C7C",fontSize:"11px",cursor:"pointer",fontFamily:"'Jost',sans-serif",letterSpacing:"0.06em"}}>CANCEL</button>
                  <button onClick={addDebit} disabled={!newDebit.name||!newDebit.amount} style={{flex:2,padding:"10px",background:newDebit.name&&newDebit.amount?"#2D4A3E":"#2A2A2A",border:"none",borderRadius:"6px",color:newDebit.name&&newDebit.amount?"#F8F5F0":"#3A3A3A",fontSize:"11px",cursor:"pointer",fontFamily:"'Jost',sans-serif",fontWeight:500,letterSpacing:"0.06em"}}>ADD DEBIT ORDER</button>
                </div>
              </div>
            ):(
              <button onClick={()=>setAddingDebit(true)} style={{width:"100%",padding:"13px",background:"transparent",border:"1px dashed #3A3A3A",borderRadius:"6px",color:"#7C7C7C",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif",letterSpacing:"0.08em",marginBottom:"20px",transition:"all 0.2s"}}>+ ADD DEBIT ORDER</button>
            )}

            {nextBtn(false,()=>setStep(7),data.debits.length===0?"SKIP — NO DEBITS":"CONTINUE")}
          </div>
        )}

        {/* STEP 7 — Review */}
        {step===7&&(
          <div>
            <h2 style={{...h2Style,fontSize:"32px"}}>Almost done, {data.name}.</h2>
            <p style={subStyle}>Here's a summary of what we've set up for you.</p>

            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"32px"}}>
              {[
                {label:"Monthly income",value:fmtCurrency(data.income)},
                {label:"Pay day",value:`Day ${data.payDay} of each month`},
                {label:"Work days",value:data.workDays.join(", ")||"Not set"},
                {label:"Wake / Sleep",value:`${fmtH(parseInt(data.wakeHour))} – ${fmtH(parseInt(data.sleepHour))}`},
                {label:"Groceries budget",value:data.groceries?fmtCurrency(data.groceries):"Not set"},
                {label:"Transport budget",value:data.transport?fmtCurrency(data.transport):"Not set"},
                {label:"Health budget",value:data.health?fmtCurrency(data.health):"Not set"},
                {label:"Savings goal",value:data.savings?fmtCurrency(data.savings):"Not set"},
                {label:"Debit orders",value:`${data.debits.length} added (${fmtCurrency(data.debits.reduce((s,d)=>s+d.amount,0))}/mo)`},
              ].map(row=>(
                <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #2A2A2A"}}>
                  <span style={{fontSize:"12px",color:"#7C7C7C",letterSpacing:"0.04em"}}>{row.label}</span>
                  <span style={{fontSize:"13px",color:"#F8F5F0",fontFamily:"'Cormorant Garamond',serif"}}>{row.value}</span>
                </div>
              ))}
            </div>

            <button onClick={handleComplete} style={{background:"#F8F5F0",border:"none",borderRadius:"6px",padding:"16px",color:"#1A1A1A",fontSize:"12px",fontWeight:500,cursor:"pointer",letterSpacing:"0.1em",width:"100%",fontFamily:"'Jost',sans-serif"}}>LAUNCH MY LIFESYNC →</button>
          </div>
        )}

        {/* STEP 8 — Loading */}
        {step===8&&(
          <div style={{textAlign:"center",padding:"40px 0"}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"28px",color:"#F8F5F0",marginBottom:"12px"}}>Setting up your LifeSync...</div>
            <p style={{color:"#7C7C7C",fontSize:"13px"}}>Building your personalised schedule</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── localStorage helpers ───────────────────────────────────────────────────────
const LS = {
  get: (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
  clear: () => { try { ["ls_setup","ls_userData","ls_blocks","ls_debits","ls_banner"].forEach(k=>localStorage.removeItem(k)); } catch {} },
};

// ── MAIN APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [setup,setSetup] = useState(()=>LS.get("ls_setup", false));
  const [userData,setUserData] = useState(()=>LS.get("ls_userData", null));
  const [blocks,setBlocks] = useState(()=>LS.get("ls_blocks", []));
  const [debits,setDebits] = useState(()=>LS.get("ls_debits", []));
  const [tab,setTab] = useState("calendar");
  const [calView,setCalView] = useState("week");
  const [activeDay,setActiveDay] = useState(getTodayIndex());
  const [activeMonth,setActiveMonth] = useState({year:new Date().getFullYear(),month:new Date().getMonth()});
  const [modal,setModal] = useState(null);
  const [debitModal,setDebitModal] = useState(false);
  const [form,setForm] = useState({});
  const [debitForm,setDebitForm] = useState({name:"",amount:"",day:"1",budgetCat:"bills"});
  const [hoveredBlock,setHoveredBlock] = useState(null);
  const [toast,setToast] = useState(null);
  const [aiLoading,setAiLoading] = useState(false);
  const [aiAdvice,setAiAdvice] = useState(null);
  const [showSuggestedBanner,setShowSuggestedBanner] = useState(()=>LS.get("ls_banner", false));
  const [showResetConfirm,setShowResetConfirm] = useState(false);
  const isMobile = useIsMobile();

  // Save to localStorage whenever key state changes
  useEffect(()=>{ LS.set("ls_setup", setup); },[setup]);
  useEffect(()=>{ LS.set("ls_userData", userData); },[userData]);
  useEffect(()=>{ LS.set("ls_blocks", blocks); },[blocks]);
  useEffect(()=>{ LS.set("ls_debits", debits); },[debits]);
  useEffect(()=>{ LS.set("ls_banner", showSuggestedBanner); },[showSuggestedBanner]);

  const showToast = msg => {setToast(msg);setTimeout(()=>setToast(null),3000);};

  const resetApp = () => { LS.clear(); setSetup(false); setUserData(null); setBlocks([]); setDebits([]); setShowSuggestedBanner(false); setShowResetConfirm(false); };

  useEffect(()=>{
    if(form.autoTitle&&form.category&&form.startHour!==undefined){
      const base=CAL_CATEGORIES[form.category]?.label||"";
      setForm(f=>({...f,title:`${getTimeName(f.startHour)} ${base}`}));
    }
  },[form.startHour,form.category,form.autoTitle]);

  if(!setup) return (
    <SetupPage onComplete={d=>{
      setUserData(d);
      setBlocks(d.suggestedBlocks||[]);
      setDebits(d.debits||[]);
      setShowSuggestedBanner(true);
      setSetup(true);
    }}/>
  );

  const {name,income,period,allocations} = userData;

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
    showToast(modal.mode==="add"?"Event added ✓":"Event updated ✓");
  };

  const inputStyle={width:"100%",background:"#F8F5F0",border:"1px solid #E8DDD0",borderRadius:"6px",padding:"10px 12px",color:"#1A1A1A",fontSize:"13px",outline:"none",fontFamily:"'Jost',sans-serif",boxSizing:"border-box"};
  const labelStyle={display:"block",fontSize:"10px",color:"#7C7C7C",marginBottom:"5px",fontWeight:500,letterSpacing:"0.1em"};

  // Format date for display
  const fmtDate = (dayIndex) => {
    const d = getDateForDay(dayIndex);
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  };

  const isToday = (dayIndex) => dayIndex === getTodayIndex();

  // ── TIME GRID ──
  const TimeGrid = ({days}) => (
    <div style={{display:"flex",flex:1,overflowY:"auto",overflowX:days.length>1?"auto":"hidden"}}>
      <div style={{width:"44px",flexShrink:0,paddingTop:"28px"}}>
        {HOURS.map(h=>(
          <div key={h} style={{height:"52px",display:"flex",alignItems:"flex-start",paddingTop:"3px",paddingRight:"6px",justifyContent:"flex-end",fontSize:"9px",color:"#C4A882"}}>{fmtH(h)}</div>
        ))}
      </div>
      <div style={{display:"flex",flex:1,minWidth:days.length>1?`${days.length*90}px`:"100%"}}>
        {days.map((dayIndex)=>(
          <div key={dayIndex} style={{flex:1,borderLeft:"1px solid #EDE8E0",position:"relative",minWidth:days.length>1?"90px":"100%"}}>
            {/* Current time indicator */}
            {isToday(dayIndex)&&(()=>{
              const now=new Date();
              const pct=(now.getHours()-5+(now.getMinutes()/60));
              if(pct>=0&&pct<=19){
                return <div style={{position:"absolute",top:`${pct*52+28}px`,left:0,right:0,height:"2px",background:"#E8A0A0",zIndex:10,display:"flex",alignItems:"center"}}>
                  <div style={{width:"8px",height:"8px",background:"#E8A0A0",borderRadius:"50%",marginLeft:"-4px"}}/>
                </div>;
              }
            })()}
            <div style={{height:"28px",background:"#FDFCFA"}}/>
            {HOURS.map(h=>(
              <div key={h} onClick={()=>openAdd(dayIndex,h)} style={{height:"52px",borderBottom:`1px solid ${h%2===0?"#EDE8E0":"#F5F0EA"}`,cursor:"pointer",transition:"background 0.1s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.02)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}/>
            ))}
            {getDayBlocks(dayIndex).map(block=>{
              const col=block.color||"#2D4A3E";
              const top=(block.startHour-5)*52+28;
              const height=(block.endHour-block.startHour)*52-2;
              return (
                <div key={block.id} onClick={e=>openEdit(block,e)} onMouseEnter={()=>setHoveredBlock(block.id)} onMouseLeave={()=>setHoveredBlock(null)}
                  style={{position:"absolute",top:`${top}px`,left:"2px",right:"2px",height:`${height}px`,background:hexAlpha(col,0.13),borderLeft:`3px solid ${col}`,borderRadius:"4px",padding:"4px 7px",cursor:"pointer",overflow:"hidden",zIndex:2}}>
                  {height>24&&<div style={{fontSize:"10px",fontWeight:500,color:col,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.3}}>{block.title}</div>}
                  {height>42&&<div style={{fontSize:"9px",color:col,opacity:0.7,marginTop:"1px"}}>{fmtH(block.startHour)}–{fmtH(block.endHour)}</div>}
                  {height>58&&block.hasCost&&block.cost>0&&<div style={{fontSize:"9px",color:col,opacity:0.7}}>{fmtShort(block.cost)}</div>}
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
  const DayView = () => (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 156px)",overflow:"hidden"}}>
      <div style={{padding:"10px 16px 8px",background:"#FDFCFA",borderBottom:"1px solid #E8DDD0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>setActiveDay(d=>Math.max(0,d-1))} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"22px",cursor:"pointer",padding:"4px 10px"}}>‹</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#1A1A1A",fontWeight:300}}>{DAYS_FULL[activeDay]}</div>
          <div style={{fontSize:"11px",color:isToday(activeDay)?"#7A9E7E":"#7C7C7C",marginTop:"1px"}}>{fmtDate(activeDay)}{isToday(activeDay)?" · Today":""}</div>
          {getDayCost(activeDay)>0&&<div style={{fontSize:"10px",color:"#C4A882",marginTop:"2px"}}>{fmtShort(getDayCost(activeDay))} budgeted</div>}
        </div>
        <button onClick={()=>setActiveDay(d=>Math.min(6,d+1))} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"22px",cursor:"pointer",padding:"4px 10px"}}>›</button>
      </div>
      <TimeGrid days={[activeDay]}/>
    </div>
  );

  // ── WEEK VIEW ──
  const WeekView = () => (
    <div style={{display:"flex",flexDirection:"column",height:isMobile?"calc(100vh - 156px)":"calc(100vh - 140px)",overflow:"hidden"}}>
      <div style={{background:"#FDFCFA",borderBottom:"1px solid #E8DDD0",display:"flex",paddingLeft:"44px",overflowX:"auto",flexShrink:0}}>
        {DAYS.map((d,i)=>{
          const cost=getDayCost(i);
          const today=isToday(i);
          return (
            <div key={d} onClick={()=>{setActiveDay(i);if(isMobile)setCalView("day");}} style={{flex:1,minWidth:"76px",padding:"7px 4px",textAlign:"center",cursor:"pointer",borderBottom:today?"2px solid #2D4A3E":"2px solid transparent"}}>
              <div style={{fontSize:"9px",fontWeight:500,letterSpacing:"0.1em",color:i>=5?"#2D4A3E":"#7C7C7C"}}>{d}</div>
              <div style={{fontSize:"11px",color:today?"#2D4A3E":"#A0A0A0",marginTop:"2px",fontWeight:today?600:400}}>{fmtDate(i).split(" ")[0]}</div>
              {cost>0&&<div style={{fontSize:"9px",color:"#C4A882",marginTop:"1px"}}>{fmtShort(cost)}</div>}
            </div>
          );
        })}
      </div>
      <TimeGrid days={[0,1,2,3,4,5,6]}/>
    </div>
  );

  // ── MONTH VIEW ──
  const MonthView = () => {
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
      <div style={{display:"flex",flexDirection:"column",background:"#F8F5F0",overflowY:"auto",height:isMobile?"calc(100vh - 156px)":"auto"}}>
        <div style={{padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#FDFCFA",borderBottom:"1px solid #E8DDD0"}}>
          <button onClick={()=>setActiveMonth(m=>{const d=new Date(m.year,m.month-1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"22px",cursor:"pointer",padding:"4px 10px"}}>‹</button>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#1A1A1A",fontWeight:300}}>{MONTHS[month]} {year}</div>
          <button onClick={()=>setActiveMonth(m=>{const d=new Date(m.year,m.month+1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"22px",cursor:"pointer",padding:"4px 10px"}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#FDFCFA",borderBottom:"1px solid #E8DDD0"}}>
          {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d=>(
            <div key={d} style={{textAlign:"center",padding:"8px 0",fontSize:"10px",fontWeight:500,letterSpacing:"0.08em",color:"#7C7C7C"}}>{d}</div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"1px",background:"#E8DDD0",padding:"1px"}}>
          {cells.map((date,idx)=>{
            const weekdayIndex=date?(new Date(year,month,date).getDay()+6)%7:null;
            const dayBlocks=date?blocks.filter(b=>b.day===weekdayIndex):[];
            const dayCost=dayBlocks.filter(b=>b.hasCost&&b.cost>0).reduce((s,b)=>s+b.cost,0);
            const isT=isCurrentMonth&&date===today.getDate();
            return (
              <div key={idx} onClick={()=>{if(date){setActiveDay(weekdayIndex);setCalView("day");}}} style={{background:"#FDFCFA",minHeight:"68px",padding:"5px",cursor:date?"pointer":"default",opacity:date?1:0.3}}
                onMouseEnter={e=>{if(date)e.currentTarget.style.background="#F3EEE8";}}
                onMouseLeave={e=>{e.currentTarget.style.background="#FDFCFA";}}>
                {date&&(
                  <>
                    <div style={{width:"22px",height:"22px",borderRadius:"50%",background:isT?"#2D4A3E":"transparent",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"3px"}}>
                      <span style={{fontSize:"11px",fontWeight:isT?500:400,color:isT?"#F8F5F0":weekdayIndex>=5?"#2D4A3E":"#1A1A1A"}}>{date}</span>
                    </div>
                    {dayBlocks.slice(0,2).map(block=>(
                      <div key={block.id} style={{background:hexAlpha(block.color||"#2D4A3E",0.15),borderLeft:`2px solid ${block.color||"#2D4A3E"}`,borderRadius:"2px",padding:"1px 4px",marginBottom:"2px",overflow:"hidden"}}>
                        <div style={{fontSize:"9px",color:block.color||"#2D4A3E",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{block.title}</div>
                      </div>
                    ))}
                    {dayBlocks.length>2&&<div style={{fontSize:"9px",color:"#7C7C7C"}}>+{dayBlocks.length-2} more</div>}
                    {dayCost>0&&<div style={{fontSize:"9px",color:"#C4A882"}}>{fmtShort(dayCost)}</div>}
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
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
      `}</style>

      {toast&&<div className="toast" style={{position:"fixed",top:"16px",left:"50%",transform:"translateX(-50%)",zIndex:9999,background:"#2D4A3E",borderRadius:"8px",padding:"11px 20px",fontSize:"12px",color:"#F8F5F0",letterSpacing:"0.05em",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",whiteSpace:"nowrap"}}>{toast}</div>}

      {/* Reset confirm modal */}
      {showResetConfirm&&(
        <div className="modal-bg" onClick={()=>setShowResetConfirm(false)} style={{position:"fixed",inset:0,background:"rgba(26,26,26,0.7)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"20px"}}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{background:"#FDFCFA",borderRadius:"14px",padding:"28px",maxWidth:"320px",width:"100%",textAlign:"center",boxShadow:"0 24px 60px rgba(0,0,0,0.2)"}}>
            <div style={{fontSize:"28px",marginBottom:"12px"}}>⚠️</div>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",fontWeight:300,color:"#1A1A1A",marginBottom:"8px"}}>Reset LifeSync?</h3>
            <p style={{fontSize:"13px",color:"#7C7C7C",lineHeight:1.6,marginBottom:"24px"}}>This will delete all your events, budget, and settings permanently.</p>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>setShowResetConfirm(false)} style={{flex:1,padding:"12px",background:"transparent",border:"1px solid #E8DDD0",borderRadius:"8px",color:"#7C7C7C",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif",letterSpacing:"0.06em"}}>CANCEL</button>
              <button onClick={resetApp} style={{flex:1,padding:"12px",background:"#E8A0A0",border:"none",borderRadius:"8px",color:"#fff",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif",fontWeight:500,letterSpacing:"0.06em"}}>RESET ALL</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{background:"#1A1A1A",padding:isMobile?"12px 14px":"16px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px"}}>
        <div style={{flexShrink:0}}>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?"17px":"20px",fontWeight:300,letterSpacing:"0.15em",color:"#F8F5F0",textTransform:"uppercase",cursor:"pointer"}} onClick={()=>setShowResetConfirm(true)} title="Tap to reset">LifeSync</h1>
          <p style={{fontSize:"9px",color:"#7C7C7C",letterSpacing:"0.06em",marginTop:"1px"}}>Good {getTimeName(new Date().getHours()).toLowerCase()}, {name.split(" ")[0]} · <span style={{cursor:"pointer",color:"#4A4A4A"}} onClick={()=>setShowResetConfirm(true)}>reset</span></p>
        </div>

        {tab==="calendar"&&(
          <div style={{display:"flex",background:"#252525",borderRadius:"6px",padding:"2px",gap:"1px"}}>
            {["day","week","month"].map(v=>(
              <button key={v} onClick={()=>setCalView(v)} style={{padding:isMobile?"5px 8px":"5px 12px",background:calView===v?"#F8F5F0":"transparent",border:"none",borderRadius:"4px",color:calView===v?"#1A1A1A":"#7C7C7C",fontSize:"10px",cursor:"pointer",letterSpacing:"0.06em",fontFamily:"'Jost',sans-serif",transition:"all 0.2s",fontWeight:calView===v?500:400}}>{v.toUpperCase()}</button>
            ))}
          </div>
        )}

        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:"9px",color:"#5A5A5A",letterSpacing:"0.04em"}}>Remaining</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?"15px":"18px",color:totalRemaining>0?"#7A9E7E":"#E8A0A0"}}>{fmtShort(totalRemaining)}</div>
        </div>
      </div>

      {/* Tabs */}
      {isMobile?(
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#1A1A1A",borderTop:"1px solid #252525",display:"flex",zIndex:50,paddingBottom:"env(safe-area-inset-bottom)"}}>
          {[["calendar","📅","Calendar"],["budget","💰","Budget"],["debits","🔄","Debits"],["ai","✨","AI"]].map(([key,icon,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{flex:1,padding:"11px 4px 9px",background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",fontFamily:"'Jost',sans-serif"}}>
              <span style={{fontSize:"16px"}}>{icon}</span>
              <span style={{fontSize:"9px",letterSpacing:"0.06em",color:tab===key?"#7A9E7E":"#4A4A4A",fontWeight:tab===key?500:400}}>{label.toUpperCase()}</span>
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

      {/* FAB */}
      {isMobile&&tab==="calendar"&&(
        <button onClick={()=>openAdd(activeDay,9)} style={{position:"fixed",right:"16px",bottom:"74px",width:"50px",height:"50px",background:"#2D4A3E",border:"none",borderRadius:"50%",color:"#F8F5F0",fontSize:"24px",cursor:"pointer",zIndex:40,boxShadow:"0 4px 16px rgba(45,74,62,0.4)",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      )}

      <div style={{paddingBottom:isMobile?"80px":"0"}}>

        {/* Suggested banner */}
        {showSuggestedBanner&&tab==="calendar"&&blocks.length>0&&(
          <div style={{background:"#2D4A3E",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px"}}>
            <p style={{fontSize:"12px",color:"#F8F5F0",margin:0,letterSpacing:"0.03em"}}>✨ We've added a suggested schedule based on your answers. Tap any event to edit or delete it.</p>
            <button onClick={()=>setShowSuggestedBanner(false)} style={{background:"transparent",border:"none",color:"#7A9E7E",fontSize:"18px",cursor:"pointer",flexShrink:0}}>×</button>
          </div>
        )}

        {/* Empty state */}
        {tab==="calendar"&&blocks.length===0&&(
          <div style={{textAlign:"center",padding:"60px 24px"}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"28px",color:"#C4A882",marginBottom:"10px",fontWeight:300}}>Your week is wide open.</div>
            <p style={{fontSize:"13px",color:"#A0A0A0",marginBottom:"24px",lineHeight:1.7}}>Tap any time slot in the calendar to add your first event,{isMobile?" or tap the + button below.":""}</p>
            <button onClick={()=>openAdd(getTodayIndex(),9)} style={{background:"#1A1A1A",border:"none",borderRadius:"6px",padding:"12px 24px",color:"#F8F5F0",fontSize:"12px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>+ ADD YOUR FIRST EVENT</button>
          </div>
        )}

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
                {calView==="month"?<MonthView/>:(
                  <>
                    <div style={{background:"#FDFCFA",borderBottom:"1px solid #E8DDD0",display:"flex",paddingLeft:"44px",paddingRight:"28px"}}>
                      {DAYS.map((d,i)=>{
                        const cost=getDayCost(i);
                        const today=isToday(i);
                        return (
                          <div key={d} style={{flex:1,padding:"8px 4px",textAlign:"center",borderBottom:today?"2px solid #2D4A3E":"2px solid transparent"}}>
                            <div style={{fontSize:"10px",fontWeight:500,letterSpacing:"0.1em",color:i>=5?"#2D4A3E":"#7C7C7C"}}>{d}</div>
                            <div style={{fontSize:"11px",color:today?"#2D4A3E":"#A0A0A0",marginTop:"2px",fontWeight:today?600:400}}>{fmtDate(i)}</div>
                            {cost>0&&<div style={{fontSize:"9px",color:"#C4A882",marginTop:"1px"}}>{fmtShort(cost)}</div>}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{padding:"0 28px 40px",overflowX:"auto"}}>
                      <div style={{minWidth:"700px",display:"flex"}}>
                        <div style={{width:"44px",flexShrink:0,paddingTop:"4px"}}>
                          {HOURS.map(h=><div key={h} style={{height:"40px",display:"flex",alignItems:"flex-start",paddingTop:"3px",paddingRight:"6px",justifyContent:"flex-end",fontSize:"10px",color:"#C4A882"}}>{fmtH(h)}</div>)}
                        </div>
                        <div style={{display:"flex",flex:1}}>
                          {DAYS.map((_,dayIndex)=>(
                            <div key={dayIndex} style={{flex:1,borderLeft:"1px solid #EDE8E0",position:"relative"}}>
                              {isToday(dayIndex)&&(()=>{
                                const now=new Date();
                                const pct=(now.getHours()-5+(now.getMinutes()/60));
                                if(pct>=0&&pct<=19)return <div style={{position:"absolute",top:`${pct*40}px`,left:0,right:0,height:"2px",background:"#E8A0A0",zIndex:10,display:"flex",alignItems:"center"}}><div style={{width:"7px",height:"7px",background:"#E8A0A0",borderRadius:"50%",marginLeft:"-3px"}}/></div>;
                              })()}
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
                                    {height>24&&<div style={{fontSize:"10px",fontWeight:500,color:col,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{block.title}</div>}
                                    {height>40&&<div style={{fontSize:"9px",color:col,opacity:0.7}}>{fmtH(block.startHour)}–{fmtH(block.endHour)}</div>}
                                    {height>56&&block.hasCost&&block.cost>0&&<div style={{fontSize:"9px",color:col,opacity:0.7}}>{fmtShort(block.cost)}</div>}
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
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:card.color}}>{card.value}</div>
                    <div style={{fontSize:"9px",color:"#7C7C7C",marginTop:"3px"}}>{period||"monthly"}</div>
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
                  const allocated=income*((allocations?.[cat.key]||0)/100);
                  const spent=spentByCategory[cat.key]||0;
                  const pct=allocated>0?Math.min(100,(spent/allocated)*100):0;
                  const over=spent>allocated&&allocated>0;
                  if(allocated===0&&spent===0)return null;
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
                  <p style={{fontSize:"12px",color:"#7C7C7C"}}>Monthly total: <span style={{color:"#1A1A1A",fontWeight:500}}>{fmtCurrency(debitTotal)}</span></p>
                </div>
                <button onClick={()=>setDebitModal(true)} style={{background:"#1A1A1A",border:"none",borderRadius:"6px",padding:"10px 16px",color:"#F8F5F0",fontSize:"11px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>+ ADD</button>
              </div>
              {debits.length===0&&(
                <div style={{textAlign:"center",padding:"40px 20px",background:"#FDFCFA",border:"1px solid #E8DDD0",borderRadius:"8px"}}>
                  <p style={{color:"#C4A882",fontSize:"13px",letterSpacing:"0.05em",marginBottom:"12px"}}>No debit orders yet</p>
                  <button onClick={()=>setDebitModal(true)} style={{background:"#1A1A1A",border:"none",borderRadius:"6px",padding:"10px 20px",color:"#F8F5F0",fontSize:"11px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>+ ADD DEBIT ORDER</button>
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
                {debits.map(d=>{
                  const cat=BUDGET_CATEGORIES.find(c=>c.key===d.budgetCat);
                  return (
                    <div key={d.id} className="card" style={{background:"#FDFCFA",border:"1px solid #E8DDD0",borderLeft:`3px solid ${d.color||"#6E7A8A"}`,borderRadius:"8px",padding:"13px 15px",display:"flex",alignItems:"center",gap:"12px"}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:500,fontSize:"13px",color:"#1A1A1A",marginBottom:"2px"}}>{d.name}</div>
                        <div style={{fontSize:"11px",color:"#7C7C7C"}}>Day {d.day} of month · {cat?.label||d.budgetCat}</div>
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
                    const summary=BUDGET_CATEGORIES.map(cat=>`${cat.label}: R${Math.round(income*(allocations?.[cat.key]||0)/100)} allocated`).join(", ");
                    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`You are a smart personal finance advisor for a South African user. Income: R${income}/month. Budget: ${summary}. Debit orders: R${debitTotal}/month. Give 4 specific actionable money-saving tips as JSON array with: tip, detail (1 sentence), category (key from: groceries/transport/health/shopping/savings/activities/bills/insurance), saving (ZAR number). Return ONLY JSON array.`}]})});
                    const data=await res.json();
                    const text=data.content?.map(c=>c.text||"").join("")||"";
                    setAiAdvice(JSON.parse(text.trim()));
                  }catch(e){
                    setAiAdvice([
                      {tip:"Review your subscriptions",detail:"Cancel services you haven't used in the last 30 days — it adds up fast.",category:"bills",saving:300},
                      {tip:"Meal prep on Sundays",detail:"Cooking at home instead of ordering out can cut food spend by up to 40%.",category:"groceries",saving:800},
                      {tip:"Annual insurance review",detail:"Getting competing quotes annually saves an average of 15-20% on premiums.",category:"insurance",saving:200},
                      {tip:"Automate your savings",detail:"Moving your savings on payday prevents lifestyle creep.",category:"savings",saving:500},
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
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"19px",fontWeight:300,margin:"0 0 4px",color:"#1A1A1A"}}>{modal.mode==="add"?`ADD EVENT`:"EDIT EVENT"}</h2>
            <p style={{fontSize:"11px",color:"#7C7C7C",margin:"0 0 16px",letterSpacing:"0.04em"}}>{DAYS_FULL[modal.day]} · {fmtDate(modal.day)}</p>

            <label style={labelStyle}>TITLE</label>
            <div style={{display:"flex",gap:"8px",marginBottom:"13px"}}>
              <input value={form.title||""} onChange={e=>setForm({...form,title:e.target.value,autoTitle:false})} style={{...inputStyle,flex:1}}/>
              <button onClick={()=>setForm(f=>({...f,autoTitle:!f.autoTitle}))} style={{background:form.autoTitle?"#1A1A1A":"transparent",border:"1px solid #E8DDD0",borderRadius:"6px",padding:"8px 10px",cursor:"pointer",fontSize:"10px",color:form.autoTitle?"#F8F5F0":"#7C7C7C",letterSpacing:"0.06em",fontFamily:"'Jost',sans-serif"}}>AUTO</button>
            </div>

            <label style={labelStyle}>CATEGORY</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"4px",marginBottom:"13px"}}>
              {Object.entries(CAL_CATEGORIES).map(([key,cat])=>(
                <button key={key} onClick={()=>setForm({...form,category:key})} style={{padding:"7px 2px",background:form.category===key?"#1A1A1A":"transparent",border:`1px solid ${form.category===key?"#1A1A1A":"#E8DDD0"}`,borderRadius:"4px",cursor:"pointer",color:form.category===key?"#F8F5F0":"#7C7C7C",fontSize:"9px",letterSpacing:"0.04em",fontFamily:"'Jost',sans-serif"}}>{cat.label.toUpperCase()}</button>
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
              {RECUR_OPTIONS.map(r=><button key={r} onClick={()=>setForm({...form,recur:r})} style={{padding:"5px 9px",background:form.recur===r?"#1A1A1A":"transparent",border:`1px solid ${form.recur===r?"#1A1A1A":"#E8DDD0"}`,borderRadius:"4px",cursor:"pointer",color:form.recur===r?"#F8F5F0":"#7C7C7C",fontSize:"10px",textTransform:"capitalize",fontFamily:"'Jost',sans-serif"}}>{r}</button>)}
            </div>

            <label style={labelStyle}>REMINDER</label>
            <select value={form.reminder||0} onChange={e=>setForm({...form,reminder:parseInt(e.target.value)})} style={{...inputStyle,marginBottom:"16px"}}>
              {[[0,"No reminder"],[5,"5 min before"],[10,"10 min before"],[15,"15 min before"],[30,"30 min before"],[60,"1 hour before"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>

            {form.endHour<=form.startHour&&<div style={{background:"#FDF0F0",border:"1px solid #E8C4C4",borderRadius:"6px",padding:"8px 12px",fontSize:"11px",color:"#A05050",marginBottom:"10px"}}>End time must be after start time</div>}
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>setModal(null)} style={{flex:1,padding:"12px",background:"transparent",border:"1px solid #E8DDD0",borderRadius:"8px",color:"#7C7C7C",fontSize:"11px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>CANCEL</button>
              <button onClick={saveBlock} style={{flex:2,padding:"12px",background:form.title&&form.endHour>form.startHour?"#1A1A1A":"#E8DDD0",border:"none",borderRadius:"8px",color:form.title&&form.endHour>form.startHour?"#F8F5F0":"#A0A0A0",fontSize:"11px",cursor:"pointer",fontWeight:500,letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>{modal.mode==="add"?"ADD EVENT":"SAVE CHANGES"}</button>
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
              <div><label style={labelStyle}>DEBIT DAY</label><input value={debitForm.day} onChange={e=>setDebitForm(f=>({...f,day:e.target.value}))} type="number" min="1" max="31" style={inputStyle}/></div>
            </div>
            <label style={labelStyle}>CATEGORY</label>
            <select value={debitForm.budgetCat} onChange={e=>setDebitForm(f=>({...f,budgetCat:e.target.value}))} style={{...inputStyle,marginBottom:"18px"}}>
              {BUDGET_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>setDebitModal(false)} style={{flex:1,padding:"12px",background:"transparent",border:"1px solid #E8DDD0",borderRadius:"8px",color:"#7C7C7C",fontSize:"11px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>CANCEL</button>
              <button onClick={()=>{if(!debitForm.name||!debitForm.amount)return;const cat=BUDGET_CATEGORIES.find(c=>c.key===debitForm.budgetCat);setDebits(prev=>[...prev,{id:Date.now(),...debitForm,amount:parseFloat(debitForm.amount),color:cat?.color||"#6E7A8A"}]);setDebitModal(false);showToast("Debit order added ✓");}} style={{flex:2,padding:"12px",background:"#1A1A1A",border:"none",borderRadius:"8px",color:"#F8F5F0",fontSize:"11px",cursor:"pointer",fontWeight:500,letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>ADD DEBIT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
