import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPA_URL = "https://xyvjnqufsnffosqigbup.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dmpucXVmc25mZm9zcWlnYnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDQ3ODYsImV4cCI6MjA4ODI4MDc4Nn0.reDgQw2sJvvodtR3AK7QB3H1aVi_bZJXNRh9RgEqlPE";
const supabase = createClient(SUPA_URL, SUPA_KEY);

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DAYS_FULL=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const HOURS=Array.from({length:19},(_,i)=>i+5);
const BUDGET_CATEGORIES=[
  {key:"groceries",label:"Food & Groceries",color:"#7A9E7E"},
  {key:"transport",label:"Transport",color:"#C4A882"},
  {key:"entertainment",label:"Entertainment",color:"#9B8EA8"},
  {key:"health",label:"Gym & Health",color:"#2D4A3E"},
  {key:"shopping",label:"Shopping",color:"#A8786E"},
  {key:"savings",label:"Savings",color:"#3A3A3A"},
  {key:"bills",label:"Bills & Debit Orders",color:"#6E7A8A"},
  {key:"insurance",label:"Insurance",color:"#8A7A5A"},
  {key:"activities",label:"Activities",color:"#9B8EA8"},
];
const CAL_CATEGORIES={
  work:{label:"Work",color:"#2D4A3E"},school:{label:"School",color:"#7C7C7C"},
  gym:{label:"Gym",color:"#3A3A3A"},meal:{label:"Meal Prep",color:"#C4A882"},
  personal:{label:"Personal",color:"#7A9E7E"},weekend:{label:"Weekend",color:"#9B8EA8"},
  expense:{label:"Expense",color:"#A8786E"},
};
const EVENT_COLORS=["#2D4A3E","#7A9E7E","#3A3A3A","#7C7C7C","#C4A882","#9B8EA8","#A8786E","#6E7A8A"];
const RECUR_OPTIONS=["none","daily","weekly","weekdays","weekends","monthly"];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const fmtH=h=>h===0?"12am":h===12?"12pm":h>12?`${h-12}pm`:`${h}am`;
const fmtHLong=h=>h===0?"12:00 AM":h===12?"12:00 PM":h>12?`${h-12}:00 PM`:`${h}:00 AM`;
const getTimeName=h=>h<12?"Morning":h<17?"Afternoon":"Evening";
const fmtCurrency=n=>`R ${Number(n).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtShort=n=>n>=1000?`R${(n/1000).toFixed(1)}k`:`R${Math.round(n)}`;
const toDateStr=d=>d.toISOString().slice(0,10);
const todayStr=()=>toDateStr(new Date());
const parseDate=s=>new Date(s+"T00:00:00");
const isPast=s=>s<todayStr();
const isToday=s=>s===todayStr();
const fmtDisplayDate=s=>{const d=parseDate(s);return`${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;};
const fmtFullDate=s=>{const d=parseDate(s);return`${DAYS_FULL[(d.getDay()+6)%7]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;};

const getWeekStart=(offsetWeeks=0)=>{
  const d=new Date();const day=(d.getDay()+6)%7;
  d.setDate(d.getDate()-day+offsetWeeks*7);d.setHours(0,0,0,0);return d;
};
const getWeekDates=(offsetWeeks=0)=>{
  const start=getWeekStart(offsetWeeks);
  return Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return toDateStr(d);});
};

// ── RECURRING EVENT EXPANSION ─────────────────────────────────────────────────
// Base events are stored once. We expand them virtually for display across weeks.
// Each base event has: date (origin), recur, and optional exceptions (array of dates where it was individually edited/deleted)
const expandRecurring=(baseBlocks,weekDates)=>{
  const result=[];
  weekDates.forEach(dateStr=>{
    const d=parseDate(dateStr);
    const dow=(d.getDay()+6)%7; // 0=Mon..6=Sun
    baseBlocks.forEach(block=>{
      // Check if this date is an exception (individually edited occurrence)
      const exceptions=block.exceptions||[];
      if(exceptions.includes(dateStr)){
        // If there's a specific override for this date, find it
        const override=block.overrides?.[dateStr];
        if(override)result.push({...block,...override,date:dateStr,_baseId:block.id,_isOverride:true});
        // else it was deleted for this date, skip
        return;
      }
      const originDate=parseDate(block.date);
      if(block.recur==="none"||!block.recur){
        if(block.date===dateStr)result.push({...block,_baseId:block.id});
        return;
      }
      if(block.recur==="daily"){
        if(dateStr>=block.date)result.push({...block,date:dateStr,_baseId:block.id,_isRecurring:true});
        return;
      }
      if(block.recur==="weekly"){
        const originDow=(originDate.getDay()+6)%7;
        if(dow===originDow&&dateStr>=block.date)result.push({...block,date:dateStr,_baseId:block.id,_isRecurring:true});
        return;
      }
      if(block.recur==="weekdays"){
        if(dow<=4&&dateStr>=block.date)result.push({...block,date:dateStr,_baseId:block.id,_isRecurring:true});
        return;
      }
      if(block.recur==="weekends"){
        if(dow>=5&&dateStr>=block.date)result.push({...block,date:dateStr,_baseId:block.id,_isRecurring:true});
        return;
      }
      if(block.recur==="monthly"){
        if(d.getDate()===originDate.getDate()&&dateStr>=block.date)result.push({...block,date:dateStr,_baseId:block.id,_isRecurring:true});
        return;
      }
    });
  });
  return result;
};

// Get all expanded events for a whole month
const getMonthEvents=(baseBlocks,year,month)=>{
  const daysInMonth=new Date(year,month+1,0).getDate();
  const dates=Array.from({length:daysInMonth},(_,i)=>toDateStr(new Date(year,month,i+1)));
  return expandRecurring(baseBlocks,dates);
};

const LS={
  get:(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
};

function useIsMobile(){
  const[m,setM]=useState(window.innerWidth<768);
  useEffect(()=>{const fn=()=>setM(window.innerWidth<768);window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);
  return m;
}

// ── AUTH PAGE ─────────────────────────────────────────────────────────────────
function AuthPage({onAuth}){
  const[mode,setMode]=useState("login");
  const[email,setEmail]=useState("");const[password,setPassword]=useState("");
  const[loading,setLoading]=useState(false);const[error,setError]=useState("");

  const handle=async()=>{
    setLoading(true);setError("");
    try{
      let res;
      if(mode==="signup"){
        res=await supabase.auth.signUp({email,password});
        if(res.error)throw res.error;
        if(res.data.user&&!res.data.session){setError("Check your email to confirm your account, then sign in.");setLoading(false);return;}
      }else{res=await supabase.auth.signInWithPassword({email,password});if(res.error)throw res.error;}
      onAuth(res.data.user);
    }catch(e){setError(e.message||"Something went wrong");}
    setLoading(false);
  };

  const handleGoogle=async()=>{setLoading(true);await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}});};

  return(
    <div style={{minHeight:"100vh",background:"#1A1A1A",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 20px",fontFamily:"'Jost',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Jost:wght@300;400;500;600&display=swap');*{box-sizing:border-box;}input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}`}</style>
      <div style={{width:"100%",maxWidth:"400px"}}>
        <div style={{marginBottom:"40px"}}>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"48px",fontWeight:300,color:"#F8F5F0",letterSpacing:"0.04em",lineHeight:1,marginBottom:"6px"}}>LifeSync</h1>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",fontStyle:"italic",color:"#7C7C7C",fontWeight:300}}>Your life, intelligently organised.</p>
        </div>
        <div style={{display:"flex",background:"#252525",borderRadius:"8px",padding:"3px",marginBottom:"28px"}}>
          {[["login","Sign In"],["signup","Create Account"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"10px",background:mode===m?"#F8F5F0":"transparent",border:"none",borderRadius:"6px",color:mode===m?"#1A1A1A":"#7C7C7C",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif",fontWeight:mode===m?500:400,letterSpacing:"0.06em"}}>{l}</button>
          ))}
        </div>
        <button onClick={handleGoogle} disabled={loading} style={{width:"100%",padding:"13px",background:"transparent",border:"1px solid #3A3A3A",borderRadius:"8px",color:"#F8F5F0",fontSize:"13px",cursor:"pointer",fontFamily:"'Jost',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",marginBottom:"20px"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor="#7A9E7E"} onMouseLeave={e=>e.currentTarget.style.borderColor="#3A3A3A"}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px"}}>
          <div style={{flex:1,height:"1px",background:"#2A2A2A"}}/><span style={{fontSize:"11px",color:"#4A4A4A",letterSpacing:"0.08em"}}>OR</span><div style={{flex:1,height:"1px",background:"#2A2A2A"}}/>
        </div>
        <div style={{marginBottom:"14px"}}>
          <label style={{display:"block",fontSize:"10px",color:"#7C7C7C",marginBottom:"6px",letterSpacing:"0.1em"}}>EMAIL</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" onKeyDown={e=>e.key==="Enter"&&handle()}
            style={{width:"100%",background:"#252525",border:"1px solid #3A3A3A",borderRadius:"6px",padding:"11px 13px",color:"#F8F5F0",fontSize:"14px",outline:"none",fontFamily:"'Jost',sans-serif"}}/>
        </div>
        <div style={{marginBottom:"20px"}}>
          <label style={{display:"block",fontSize:"10px",color:"#7C7C7C",marginBottom:"6px",letterSpacing:"0.1em"}}>PASSWORD</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handle()}
            style={{width:"100%",background:"#252525",border:"1px solid #3A3A3A",borderRadius:"6px",padding:"11px 13px",color:"#F8F5F0",fontSize:"14px",outline:"none",fontFamily:"'Jost',sans-serif"}}/>
        </div>
        {error&&<div style={{background:"rgba(232,160,160,0.1)",border:"1px solid rgba(232,160,160,0.3)",borderRadius:"6px",padding:"10px 13px",fontSize:"12px",color:"#E8A0A0",marginBottom:"14px",lineHeight:1.5}}>{error}</div>}
        <button onClick={handle} disabled={loading||!email||!password} style={{width:"100%",padding:"14px",background:email&&password?"#F8F5F0":"#2A2A2A",border:"none",borderRadius:"8px",color:email&&password?"#1A1A1A":"#3A3A3A",fontSize:"12px",fontWeight:500,cursor:email&&password?"pointer":"not-allowed",letterSpacing:"0.1em",fontFamily:"'Jost',sans-serif"}}>
          {loading?"LOADING...":(mode==="login"?"SIGN IN":"CREATE ACCOUNT")}
        </button>
      </div>
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
function SetupPage({onComplete,user}){
  const[step,setStep]=useState(0);
  const[data,setData]=useState({name:user?.email?.split("@")[0]||"",income:"",period:"monthly",payDay:"25",groceries:"",transport:"",health:"",shopping:"",savings:"",activities:"",debits:[],workDays:["Mon","Tue","Wed","Thu","Fri"],wakeHour:"7",sleepHour:"22",workStart:"9"});
  const[newDebit,setNewDebit]=useState({name:"",amount:"",day:"1",budgetCat:"bills"});
  const[addingDebit,setAddingDebit]=useState(false);
  const upd=(k,v)=>setData(d=>({...d,[k]:v}));
  const totalSteps=8;

  const addDebit=()=>{
    if(!newDebit.name||!newDebit.amount)return;
    const cat=BUDGET_CATEGORIES.find(c=>c.key===newDebit.budgetCat);
    setData(d=>({...d,debits:[...d.debits,{id:Date.now(),...newDebit,amount:parseFloat(newDebit.amount),color:cat?.color||"#6E7A8A"}]}));
    setNewDebit({name:"",amount:"",day:"1",budgetCat:"bills"});setAddingDebit(false);
  };

  const handleComplete=()=>{
    const inc=parseFloat(data.income)||0;
    const isMonthly=data.period!=="weekly";
    const weeklyAmt=k=>{const r=parseFloat(data[k])||0;return isMonthly?r/4:r;};
    const monthlyAmt=k=>{const r=parseFloat(data[k])||0;return isMonthly?r:r*4;};
    const spend={groceries:monthlyAmt("groceries"),transport:monthlyAmt("transport"),health:monthlyAmt("health"),shopping:monthlyAmt("shopping"),activities:monthlyAmt("activities")};
    const debitTotal=data.debits.reduce((s,d)=>s+d.amount,0);
    const savingsAmt=monthlyAmt("savings");
    const allocations={};
    BUDGET_CATEGORIES.forEach(cat=>{
      const amt=cat.key==="savings"?savingsAmt:cat.key==="bills"?debitTotal:spend[cat.key]||0;
      allocations[cat.key]=inc>0?Math.round((amt/inc)*100):0;
    });
    const suggestedBlocks=[];let id=1;
    const weekDates=getWeekDates(0);
    data.workDays.forEach(dayLabel=>{
      const di=DAYS.indexOf(dayLabel);
      if(di>=0&&weekDates[di])suggestedBlocks.push({id:id++,date:weekDates[di],startHour:parseInt(data.workStart)||9,endHour:17,category:"work",title:"Work",recur:"weekdays",color:"#2D4A3E",hasCost:false,cost:0,budgetCat:"",spent:false,spentAmount:0,exceptions:{},overrides:{}});
    });
    if(parseFloat(data.health)>0){
      suggestedBlocks.push({id:id++,date:weekDates[0],startHour:6,endHour:7,category:"gym",title:"Morning Gym",recur:"weekly",color:"#3A3A3A",hasCost:true,cost:weeklyAmt("health"),budgetCat:"health",spent:false,spentAmount:0,exceptions:[],overrides:{}});
      suggestedBlocks.push({id:id++,date:weekDates[2],startHour:6,endHour:7,category:"gym",title:"Morning Gym",recur:"weekly",color:"#3A3A3A",hasCost:false,cost:0,budgetCat:"",spent:false,spentAmount:0,exceptions:[],overrides:{}});
    }
    if(parseFloat(data.groceries)>0)suggestedBlocks.push({id:id++,date:weekDates[5],startHour:9,endHour:11,category:"meal",title:"Grocery Run",recur:"weekly",color:"#C4A882",hasCost:true,cost:weeklyAmt("groceries"),budgetCat:"groceries",spent:false,spentAmount:0,exceptions:[],overrides:{}});
    if(parseFloat(data.activities)>0)suggestedBlocks.push({id:id++,date:weekDates[6],startHour:10,endHour:13,category:"weekend",title:"Weekend Activity",recur:"weekly",color:"#9B8EA8",hasCost:true,cost:weeklyAmt("activities"),budgetCat:"activities",spent:false,spentAmount:0,exceptions:[],overrides:{}});
    onComplete({...data,income:inc,period:isMonthly?"monthly":"weekly",allocations,suggestedBlocks});
  };

  const cs={minHeight:"100vh",background:"#1A1A1A",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Jost',sans-serif",padding:"24px 20px"};
  const h2s={fontFamily:"'Cormorant Garamond',serif",fontWeight:300,color:"#F8F5F0",margin:"0 0 8px"};
  const subs={color:"#7C7C7C",fontSize:"13px",margin:"0 0 28px",fontWeight:300,lineHeight:1.7};
  const ls={display:"block",fontSize:"10px",color:"#7C7C7C",marginBottom:"8px",letterSpacing:"0.12em"};
  const bigInput={width:"100%",background:"transparent",border:"none",borderBottom:"1px solid #3A3A3A",padding:"10px 0",color:"#F8F5F0",fontSize:"28px",outline:"none",fontFamily:"'Cormorant Garamond',serif",fontWeight:300,marginBottom:"28px"};
  const smInput={background:"#252525",border:"1px solid #3A3A3A",borderRadius:"6px",padding:"10px 12px",color:"#F8F5F0",fontSize:"13px",outline:"none",fontFamily:"'Jost',sans-serif",width:"100%"};
  const pill=(active,onClick,label)=><button onClick={onClick} style={{padding:"10px 14px",background:active?"#2D4A3E":"transparent",border:`1px solid ${active?"#2D4A3E":"#3A3A3A"}`,borderRadius:"6px",color:active?"#F8F5F0":"#7C7C7C",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif",transition:"all 0.2s"}}>{label}</button>;
  const nextBtn=(dis,fn,label="CONTINUE")=><button onClick={fn} disabled={dis} style={{background:!dis?"#F8F5F0":"#2A2A2A",border:"none",borderRadius:"6px",padding:"14px",color:!dis?"#1A1A1A":"#3A3A3A",fontSize:"12px",fontWeight:500,cursor:!dis?"pointer":"not-allowed",letterSpacing:"0.1em",width:"100%",fontFamily:"'Jost',sans-serif"}}>{label}</button>;

  return(
    <div style={cs}>
      <div style={{width:"100%",maxWidth:"460px"}}>
        {step>0&&(
          <div style={{marginBottom:"32px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
              <button onClick={()=>setStep(s=>s-1)} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"11px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif",padding:0}}>← BACK</button>
              <span style={{color:"#7C7C7C",fontSize:"11px",letterSpacing:"0.08em"}}>{step} / {totalSteps}</span>
            </div>
            <div style={{height:"2px",background:"#2A2A2A",borderRadius:"2px",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(step/totalSteps)*100}%`,background:"#7A9E7E",transition:"width 0.4s"}}/>
            </div>
          </div>
        )}
        {step===0&&<div>
          <p style={{color:"#7C7C7C",fontSize:"11px",letterSpacing:"0.15em",marginBottom:"10px"}}>WELCOME TO</p>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"52px",fontWeight:300,color:"#F8F5F0",margin:"0 0 6px",lineHeight:1}}>LifeSync</h1>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"17px",fontStyle:"italic",color:"#7C7C7C",margin:"0 0 44px",fontWeight:300}}>Your life, intelligently organised.</p>
          <p style={{color:"#5A5A5A",fontSize:"12px",margin:"0 0 32px",lineHeight:1.8}}>We'll ask you a few questions to personalise your calendar and budget. About 2 minutes.</p>
          <button onClick={()=>setStep(1)} style={{background:"#F8F5F0",border:"none",borderRadius:"6px",padding:"16px",color:"#1A1A1A",fontSize:"12px",fontWeight:500,cursor:"pointer",letterSpacing:"0.1em",width:"100%",fontFamily:"'Jost',sans-serif"}}>LET'S GET STARTED</button>
        </div>}
        {step===1&&<div>
          <h2 style={{...h2s,fontSize:"36px"}}>What's your name?</h2>
          <p style={subs}>This is how LifeSync will greet you.</p>
          <label style={ls}>YOUR NAME</label>
          <input value={data.name} onChange={e=>upd("name",e.target.value)} placeholder="e.g. Olivia" onKeyDown={e=>e.key==="Enter"&&data.name&&setStep(2)} style={bigInput}/>
          {nextBtn(!data.name,()=>setStep(2))}
        </div>}
        {step===2&&<div>
          <h2 style={{...h2s,fontSize:"34px"}}>Hi, {data.name}.</h2>
          <p style={subs}>What's your monthly take-home income after tax?</p>
          <label style={ls}>MONTHLY INCOME (ZAR)</label>
          <div style={{display:"flex",alignItems:"center",borderBottom:"1px solid #3A3A3A",marginBottom:"24px",paddingBottom:"8px"}}>
            <span style={{color:"#7C7C7C",fontSize:"26px",fontFamily:"'Cormorant Garamond',serif",marginRight:"8px"}}>R</span>
            <input value={data.income} onChange={e=>upd("income",e.target.value.replace(/[^0-9.]/g,""))} placeholder="0" type="number"
              style={{flex:1,background:"transparent",border:"none",color:"#F8F5F0",fontSize:"36px",outline:"none",fontFamily:"'Cormorant Garamond',serif",fontWeight:300}}/>
          </div>
          <label style={ls}>WHAT DAY DO YOU GET PAID?</label>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"28px"}}>
            {["1","15","25","28","Last day"].map(d=>pill(data.payDay===d,()=>upd("payDay",d),d))}
          </div>
          {nextBtn(!data.income,()=>setStep(3))}
        </div>}
        {step===3&&<div>
          <h2 style={{...h2s,fontSize:"32px"}}>When do you work?</h2>
          <p style={subs}>We'll block these days in your calendar automatically.</p>
          <label style={ls}>WORK DAYS</label>
          <div style={{display:"flex",gap:"6px",marginBottom:"24px"}}>
            {DAYS.map(d=>{const sel=data.workDays.includes(d);return<button key={d} onClick={()=>upd("workDays",sel?data.workDays.filter(x=>x!==d):[...data.workDays,d])} style={{flex:1,padding:"10px 4px",background:sel?"#2D4A3E":"transparent",border:`1px solid ${sel?"#2D4A3E":"#3A3A3A"}`,borderRadius:"6px",color:sel?"#F8F5F0":"#7C7C7C",fontSize:"11px",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>{d}</button>;})}
          </div>
          <label style={ls}>USUAL START TIME</label>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"28px"}}>
            {["7","8","9","10"].map(h=>pill(data.workStart===h,()=>upd("workStart",h),fmtH(parseInt(h))))}
          </div>
          {data.workDays.length===0&&<p style={{fontSize:"11px",color:"#E8A0A0",marginBottom:"12px"}}>Please select at least one work day, or choose none if you don't have set work days.</p>}
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>upd("workDays",[])||setStep(4)} style={{flex:1,padding:"14px",background:"transparent",border:"1px solid #3A3A3A",borderRadius:"6px",color:"#7C7C7C",fontSize:"11px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>I DON'T HAVE SET WORK DAYS</button>
            {nextBtn(!data.workStart,()=>setStep(4))}
          </div>
        </div>}
        {step===4&&<div>
          <h2 style={{...h2s,fontSize:"32px"}}>Your daily rhythm.</h2>
          <p style={subs}>Helps LifeSync suggest the best times for your activities.</p>
          <label style={ls}>WAKE UP TIME <span style={{color:"#E8A0A0"}}>*</span></label>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"24px"}}>
            {["5","6","7","8","9"].map(h=>pill(data.wakeHour===h,()=>upd("wakeHour",h),fmtH(parseInt(h))))}
          </div>
          <label style={ls}>SLEEP TIME <span style={{color:"#E8A0A0"}}>*</span></label>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"28px"}}>
            {["21","22","23","0"].map(h=>pill(data.sleepHour===h,()=>upd("sleepHour",h),fmtH(parseInt(h))))}
          </div>
          {nextBtn(!data.wakeHour||!data.sleepHour,()=>setStep(5))}
        </div>}
        {step===5&&<div>
          <h2 style={{...h2s,fontSize:"32px"}}>Your spending.</h2>
          <p style={subs}>Estimates are fine — adjust anytime in Settings.</p>
          <div style={{marginBottom:"22px"}}>
            <label style={ls}>ARE THESE AMOUNTS PER WEEK OR PER MONTH?</label>
            <div style={{display:"flex",background:"#252525",borderRadius:"8px",padding:"3px",gap:"2px"}}>
              {[["monthly","Monthly total"],["weekly","Weekly total"]].map(([val,label])=>(
                <button key={val} onClick={()=>upd("period",val)} style={{flex:1,padding:"10px",background:data.period===val?"#F8F5F0":"transparent",border:"none",borderRadius:"6px",color:data.period===val?"#1A1A1A":"#7C7C7C",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif",fontWeight:data.period===val?500:400,transition:"all 0.2s"}}>{label}</button>
              ))}
            </div>
            <p style={{fontSize:"11px",color:"#7C7C7C",marginTop:"7px",lineHeight:1.6}}>{data.period==="monthly"?"💡 Monthly amounts are split across 4 weeks on your calendar.":"💡 Weekly amounts are used as-is every week."}</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"16px",marginBottom:"28px"}}>
            {[{key:"groceries",q:"Food & groceries",icon:"🛒",ph:"e.g. 2000"},{key:"transport",q:"Transport (fuel, Uber)",icon:"🚗",ph:"e.g. 1500"},{key:"health",q:"Gym or health",icon:"💪",ph:"e.g. 500"},{key:"shopping",q:"Shopping & clothing",icon:"🛍",ph:"e.g. 800"},{key:"activities",q:"Activities & going out",icon:"🎉",ph:"e.g. 600"},{key:"savings",q:"Savings goal",icon:"💰",ph:"e.g. 1000"}].map(item=>(
              <div key={item.key}>
                <label style={{...ls,display:"flex",alignItems:"center",gap:"6px"}}><span>{item.icon}</span>{item.q}</label>
                <div style={{display:"flex",alignItems:"center",borderBottom:"1px solid #3A3A3A",paddingBottom:"6px"}}>
                  <span style={{color:"#7C7C7C",fontSize:"18px",fontFamily:"'Cormorant Garamond',serif",marginRight:"6px"}}>R</span>
                  <input value={data[item.key]} onChange={e=>upd(item.key,e.target.value.replace(/[^0-9.]/g,""))} placeholder={item.ph} type="number"
                    style={{flex:1,background:"transparent",border:"none",color:"#F8F5F0",fontSize:"22px",outline:"none",fontFamily:"'Cormorant Garamond',serif",fontWeight:300}}/>
                </div>
                {data[item.key]&&(
                  <div style={{fontSize:"10px",color:"#7C7C7C",marginTop:"3px",display:"flex",gap:"12px"}}>
                    {parseFloat(data.income)>0&&<span>{Math.round((parseFloat(data[item.key])/(data.period==="weekly"?parseFloat(data.income)/4:parseFloat(data.income)))*100)}% of {data.period==="weekly"?"weekly":"monthly"} income</span>}
                    {data.period==="monthly"&&["activities","groceries","health","shopping"].includes(item.key)&&<span style={{color:"#C4A882"}}>≈ {fmtShort(parseFloat(data[item.key])/4)}/week</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
          {nextBtn(
            !data.groceries&&!data.transport&&!data.health&&!data.shopping&&!data.activities&&!data.savings,
            ()=>setStep(6),
            "CONTINUE"
          )}
          {(!data.groceries&&!data.transport&&!data.health&&!data.shopping&&!data.activities&&!data.savings)&&
            <p style={{fontSize:"11px",color:"#E8A0A0",marginTop:"8px",textAlign:"center"}}>Please fill in at least one spending amount to continue.</p>
          }
        </div>}
        {step===6&&<div>
          <h2 style={{...h2s,fontSize:"32px"}}>Your debit orders.</h2>
          <p style={subs}>Add all recurring monthly payments — subscriptions, insurance, rent, loans.</p>
          {data.debits.length>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"14px"}}>
              {data.debits.map(d=>{const cat=BUDGET_CATEGORIES.find(c=>c.key===d.budgetCat);return(
                <div key={d.id} style={{background:"#252525",border:"1px solid #3A3A3A",borderLeft:`3px solid ${d.color||"#6E7A8A"}`,borderRadius:"6px",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div><div style={{color:"#F8F5F0",fontSize:"13px",fontWeight:500}}>{d.name}</div><div style={{color:"#7C7C7C",fontSize:"11px",marginTop:"2px"}}>Day {d.day} · {cat?.label}</div></div>
                  <div style={{display:"flex",alignItems:"center",gap:"12px"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",color:"#F8F5F0"}}>{fmtCurrency(d.amount)}</span><button onClick={()=>setData(d2=>({...d2,debits:d2.debits.filter(x=>x.id!==d.id)}))} style={{background:"transparent",border:"none",color:"#E8A0A0",fontSize:"16px",cursor:"pointer"}}>×</button></div>
                </div>
              );})}
              <div style={{borderTop:"1px solid #3A3A3A",paddingTop:"10px",display:"flex",justifyContent:"space-between",fontSize:"12px",color:"#7C7C7C"}}>
                <span>Total monthly debits</span><span style={{color:"#F8F5F0",fontFamily:"'Cormorant Garamond',serif",fontSize:"16px"}}>{fmtCurrency(data.debits.reduce((s,d)=>s+d.amount,0))}</span>
              </div>
            </div>
          )}
          {addingDebit?(
            <div style={{background:"#252525",border:"1px solid #3A3A3A",borderRadius:"8px",padding:"16px",marginBottom:"14px"}}>
              <div style={{marginBottom:"10px"}}><label style={ls}>NAME</label><input value={newDebit.name} onChange={e=>setNewDebit(f=>({...f,name:e.target.value}))} placeholder="e.g. Netflix" style={smInput}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
                <div><label style={ls}>AMOUNT (R)</label><input value={newDebit.amount} onChange={e=>setNewDebit(f=>({...f,amount:e.target.value}))} type="number" style={smInput}/></div>
                <div><label style={ls}>DEBIT DAY</label><input value={newDebit.day} onChange={e=>setNewDebit(f=>({...f,day:e.target.value}))} type="number" min="1" max="31" style={smInput}/></div>
              </div>
              <div style={{marginBottom:"12px"}}><label style={ls}>CATEGORY</label><select value={newDebit.budgetCat} onChange={e=>setNewDebit(f=>({...f,budgetCat:e.target.value}))} style={smInput}>{BUDGET_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>setAddingDebit(false)} style={{flex:1,padding:"10px",background:"transparent",border:"1px solid #3A3A3A",borderRadius:"6px",color:"#7C7C7C",fontSize:"11px",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>CANCEL</button>
                <button onClick={addDebit} disabled={!newDebit.name||!newDebit.amount} style={{flex:2,padding:"10px",background:newDebit.name&&newDebit.amount?"#2D4A3E":"#252525",border:"none",borderRadius:"6px",color:newDebit.name&&newDebit.amount?"#F8F5F0":"#3A3A3A",fontSize:"11px",cursor:"pointer",fontFamily:"'Jost',sans-serif",fontWeight:500}}>ADD DEBIT ORDER</button>
              </div>
            </div>
          ):(
            <button onClick={()=>setAddingDebit(true)} style={{width:"100%",padding:"13px",background:"transparent",border:"1px dashed #3A3A3A",borderRadius:"6px",color:"#7C7C7C",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif",letterSpacing:"0.08em",marginBottom:"18px"}}>+ ADD DEBIT ORDER</button>
          )}
          {nextBtn(false,()=>setStep(7),data.debits.length===0?"SKIP — NO DEBITS":"CONTINUE")}
        </div>}
        {step===7&&<div>
          <h2 style={{...h2s,fontSize:"32px"}}>Almost done, {data.name}.</h2>
          <p style={subs}>Here's your summary. Everything can be edited in Settings later.</p>
          <div style={{display:"flex",flexDirection:"column",gap:"0",marginBottom:"28px",border:"1px solid #2A2A2A",borderRadius:"8px",overflow:"hidden"}}>
            {[["Monthly income",fmtCurrency(data.income)],["Pay day",`Day ${data.payDay}`],["Work days",data.workDays.join(", ")||"None"],["Spending amounts",data.period==="monthly"?"Monthly":"Weekly"],["Groceries",data.groceries?`${fmtShort(parseFloat(data.groceries))}${data.period==="monthly"?" (≈"+fmtShort(parseFloat(data.groceries)/4)+"/wk)":""}`:"Not set"],["Activities",data.activities?`${fmtShort(parseFloat(data.activities))}${data.period==="monthly"?" (≈"+fmtShort(parseFloat(data.activities)/4)+"/wk)":""}`:"Not set"],["Savings goal",data.savings?fmtShort(parseFloat(data.savings)):"Not set"],["Debit orders",`${data.debits.length} (${fmtCurrency(data.debits.reduce((s,d)=>s+d.amount,0))}/mo)`]].map(([l,v],i)=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 14px",background:i%2===0?"#1E1E1E":"#252525"}}>
                <span style={{fontSize:"12px",color:"#7C7C7C"}}>{l}</span>
                <span style={{fontSize:"13px",color:"#F8F5F0",fontFamily:"'Cormorant Garamond',serif"}}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={handleComplete} style={{background:"#F8F5F0",border:"none",borderRadius:"6px",padding:"16px",color:"#1A1A1A",fontSize:"12px",fontWeight:500,cursor:"pointer",letterSpacing:"0.1em",width:"100%",fontFamily:"'Jost',sans-serif"}}>LAUNCH MY LIFESYNC →</button>
        </div>}
      </div>
    </div>
  );
}

// ── SETTINGS PAGE ─────────────────────────────────────────────────────────────
function SettingsPage({userData,setUserData,debits,setDebits,onSignOut,onClose}){
  const[form,setForm]=useState({...userData,income:String(userData.income||""),groceries:String(userData.groceries||""),transport:String(userData.transport||""),health:String(userData.health||""),shopping:String(userData.shopping||""),savings:String(userData.savings||""),activities:String(userData.activities||"")});
  const[newDebit,setNewDebit]=useState({name:"",amount:"",day:"1",budgetCat:"bills"});
  const[addingDebit,setAddingDebit]=useState(false);const[saved,setSaved]=useState(false);
  const isMobile=useIsMobile();
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const smInput={width:"100%",background:"#F8F5F0",border:"1px solid #E8DDD0",borderRadius:"6px",padding:"10px 12px",color:"#1A1A1A",fontSize:"13px",outline:"none",fontFamily:"'Jost',sans-serif",boxSizing:"border-box"};
  const ls={display:"block",fontSize:"10px",color:"#7C7C7C",marginBottom:"5px",fontWeight:500,letterSpacing:"0.1em"};
  const section=title=><div style={{fontSize:"10px",color:"#7C7C7C",letterSpacing:"0.12em",fontWeight:500,padding:"16px 0 10px",borderBottom:"1px solid #E8DDD0",marginBottom:"14px"}}>{title}</div>;

  const save=()=>{
    const inc=parseFloat(form.income)||0;
    const isMonthly=(form.period||"monthly")!=="weekly";
    const monthlyAmt=k=>{const r=parseFloat(form[k])||0;return isMonthly?r:r*4;};
    const debitTotal=debits.reduce((s,d)=>s+d.amount,0);
    const savingsAmt=monthlyAmt("savings");
    const allocations={};
    BUDGET_CATEGORIES.forEach(cat=>{
      const spend={groceries:monthlyAmt("groceries"),transport:monthlyAmt("transport"),health:monthlyAmt("health"),shopping:monthlyAmt("shopping"),activities:monthlyAmt("activities")};
      const amt=cat.key==="savings"?savingsAmt:cat.key==="bills"?debitTotal:spend[cat.key]||0;
      allocations[cat.key]=inc>0?Math.round((amt/inc)*100):0;
    });
    setUserData(prev=>({...prev,...form,income:inc,allocations}));
    setSaved(true);setTimeout(()=>setSaved(false),2000);
  };

  const addDebit=()=>{
    if(!newDebit.name||!newDebit.amount)return;
    const cat=BUDGET_CATEGORIES.find(c=>c.key===newDebit.budgetCat);
    setDebits(prev=>[...prev,{id:Date.now(),...newDebit,amount:parseFloat(newDebit.amount),color:cat?.color||"#6E7A8A"}]);
    setNewDebit({name:"",amount:"",day:"1",budgetCat:"bills"});setAddingDebit(false);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"#F8F5F0",zIndex:200,overflowY:"auto",fontFamily:"'Jost',sans-serif"}}>
      <div style={{background:"#1A1A1A",padding:isMobile?"13px 16px":"16px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",fontWeight:300,color:"#F8F5F0",letterSpacing:"0.1em"}}>Settings</h2>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"22px",cursor:"pointer",padding:"4px 8px"}}>×</button>
      </div>
      <div style={{maxWidth:"560px",margin:"0 auto",padding:isMobile?"20px 16px":"28px"}}>
        {section("PERSONAL")}
        <div style={{marginBottom:"14px"}}><label style={ls}>YOUR NAME</label><input value={form.name||""} onChange={e=>upd("name",e.target.value)} style={smInput}/></div>
        {section("INCOME & PAY")}
        <div style={{marginBottom:"14px"}}><label style={ls}>MONTHLY INCOME (R)</label><input value={form.income||""} onChange={e=>upd("income",e.target.value.replace(/[^0-9.]/g,""))} type="number" style={smInput}/></div>
        <div style={{marginBottom:"14px"}}>
          <label style={ls}>PAY DAY</label>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {["1","15","25","28","Last day"].map(d=><button key={d} onClick={()=>upd("payDay",d)} style={{padding:"8px 14px",background:form.payDay===d?"#1A1A1A":"transparent",border:`1px solid ${form.payDay===d?"#1A1A1A":"#E8DDD0"}`,borderRadius:"6px",color:form.payDay===d?"#F8F5F0":"#7C7C7C",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>{d}</button>)}
          </div>
        </div>
        <div style={{marginBottom:"14px"}}>
          <label style={ls}>SPENDING AMOUNTS ARE PER</label>
          <div style={{display:"flex",background:"#F3EEE8",borderRadius:"8px",padding:"3px",gap:"2px"}}>
            {[["monthly","Month"],["weekly","Week"]].map(([val,label])=>(
              <button key={val} onClick={()=>upd("period",val)} style={{flex:1,padding:"9px",background:(form.period||"monthly")===val?"#1A1A1A":"transparent",border:"none",borderRadius:"6px",color:(form.period||"monthly")===val?"#F8F5F0":"#7C7C7C",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif",fontWeight:(form.period||"monthly")===val?500:400}}>{label}</button>
            ))}
          </div>
        </div>
        {section("WORK SCHEDULE")}
        <div style={{marginBottom:"14px"}}>
          <label style={ls}>WORK DAYS</label>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {DAYS.map(d=>{const sel=(form.workDays||[]).includes(d);return<button key={d} onClick={()=>upd("workDays",sel?(form.workDays||[]).filter(x=>x!==d):[...(form.workDays||[]),d])} style={{padding:"8px 12px",background:sel?"#1A1A1A":"transparent",border:`1px solid ${sel?"#1A1A1A":"#E8DDD0"}`,borderRadius:"6px",color:sel?"#F8F5F0":"#7C7C7C",fontSize:"11px",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>{d}</button>;})}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
          <div><label style={ls}>WAKE TIME</label><select value={form.wakeHour||"7"} onChange={e=>upd("wakeHour",e.target.value)} style={smInput}>{["5","6","7","8","9","10"].map(h=><option key={h} value={h}>{fmtH(parseInt(h))}</option>)}</select></div>
          <div><label style={ls}>SLEEP TIME</label><select value={form.sleepHour||"22"} onChange={e=>upd("sleepHour",e.target.value)} style={smInput}>{["20","21","22","23","0"].map(h=><option key={h} value={h}>{fmtH(parseInt(h))}</option>)}</select></div>
        </div>
        {section("MONTHLY BUDGET")}
        <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"14px"}}>
          {[{key:"groceries",label:"Food & Groceries",icon:"🛒"},{key:"transport",label:"Transport",icon:"🚗"},{key:"health",label:"Gym & Health",icon:"💪"},{key:"shopping",label:"Shopping",icon:"🛍"},{key:"activities",label:"Activities",icon:"🎉"},{key:"savings",label:"Savings Goal",icon:"💰"}].map(item=>(
            <div key={item.key} style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <span style={{fontSize:"16px",width:"24px"}}>{item.icon}</span>
              <span style={{flex:1,fontSize:"13px",color:"#1A1A1A"}}>{item.label}</span>
              <div style={{display:"flex",alignItems:"center",gap:"6px",width:"130px"}}>
                <span style={{color:"#7C7C7C",fontSize:"13px"}}>R</span>
                <input value={form[item.key]||""} onChange={e=>upd(item.key,e.target.value.replace(/[^0-9.]/g,""))} type="number" placeholder="0" style={{...smInput,width:"100px",textAlign:"right"}}/>
              </div>
            </div>
          ))}
        </div>
        {section("DEBIT ORDERS")}
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"12px"}}>
          {debits.map(d=>{const cat=BUDGET_CATEGORIES.find(c=>c.key===d.budgetCat);return(
            <div key={d.id} style={{background:"#FDFCFA",border:"1px solid #E8DDD0",borderLeft:`3px solid ${d.color||"#6E7A8A"}`,borderRadius:"6px",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><div style={{fontWeight:500,fontSize:"13px",color:"#1A1A1A"}}>{d.name}</div><div style={{fontSize:"11px",color:"#7C7C7C",marginTop:"2px"}}>Day {d.day} · {cat?.label}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",color:"#1A1A1A"}}>{fmtCurrency(d.amount)}</span><button onClick={()=>setDebits(prev=>prev.filter(x=>x.id!==d.id))} style={{background:"transparent",border:"none",color:"#E8A0A0",fontSize:"16px",cursor:"pointer"}}>×</button></div>
            </div>
          );})}
        </div>
        {addingDebit?(
          <div style={{background:"#FDFCFA",border:"1px solid #E8DDD0",borderRadius:"8px",padding:"14px",marginBottom:"12px"}}>
            <div style={{marginBottom:"10px"}}><label style={ls}>NAME</label><input value={newDebit.name} onChange={e=>setNewDebit(f=>({...f,name:e.target.value}))} placeholder="e.g. Netflix" style={smInput}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
              <div><label style={ls}>AMOUNT (R)</label><input value={newDebit.amount} onChange={e=>setNewDebit(f=>({...f,amount:e.target.value}))} type="number" style={smInput}/></div>
              <div><label style={ls}>DEBIT DAY</label><input value={newDebit.day} onChange={e=>setNewDebit(f=>({...f,day:e.target.value}))} type="number" min="1" max="31" style={smInput}/></div>
            </div>
            <div style={{marginBottom:"12px"}}><label style={ls}>CATEGORY</label><select value={newDebit.budgetCat} onChange={e=>setNewDebit(f=>({...f,budgetCat:e.target.value}))} style={smInput}>{BUDGET_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>setAddingDebit(false)} style={{flex:1,padding:"10px",background:"transparent",border:"1px solid #E8DDD0",borderRadius:"6px",color:"#7C7C7C",fontSize:"11px",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>CANCEL</button>
              <button onClick={addDebit} style={{flex:2,padding:"10px",background:"#1A1A1A",border:"none",borderRadius:"6px",color:"#F8F5F0",fontSize:"11px",cursor:"pointer",fontFamily:"'Jost',sans-serif",fontWeight:500}}>ADD</button>
            </div>
          </div>
        ):(
          <button onClick={()=>setAddingDebit(true)} style={{width:"100%",padding:"11px",background:"transparent",border:"1px dashed #D4C9BB",borderRadius:"6px",color:"#7C7C7C",fontSize:"11px",cursor:"pointer",fontFamily:"'Jost',sans-serif",letterSpacing:"0.06em",marginBottom:"24px"}}>+ ADD DEBIT ORDER</button>
        )}
        <button onClick={save} style={{width:"100%",padding:"14px",background:saved?"#2D4A3E":"#1A1A1A",border:"none",borderRadius:"8px",color:"#F8F5F0",fontSize:"12px",fontWeight:500,cursor:"pointer",letterSpacing:"0.1em",fontFamily:"'Jost',sans-serif",marginBottom:"12px",transition:"background 0.3s"}}>
          {saved?"✓ SAVED":"SAVE CHANGES"}
        </button>
        <button onClick={onSignOut} style={{width:"100%",padding:"14px",background:"transparent",border:"1px solid #E8DDD0",borderRadius:"8px",color:"#E8A0A0",fontSize:"12px",cursor:"pointer",letterSpacing:"0.1em",fontFamily:"'Jost',sans-serif"}}>SIGN OUT</button>
      </div>
    </div>
  );
}

// ── MONTHLY SUMMARY ───────────────────────────────────────────────────────────
function MonthlySummary({baseBlocks,debits,userData,isMobile}){
  const now=new Date();
  const[viewYear,setViewYear]=useState(now.getFullYear());
  const[viewMonth,setViewMonth]=useState(now.getMonth());
  const[compareMode,setCompareMode]=useState(false);
  const[compareYear,setCompareYear]=useState(now.getMonth()===0?now.getFullYear()-1:now.getFullYear());
  const[compareMonth,setCompareMonth]=useState(now.getMonth()===0?11:now.getMonth()-1);

  const income=userData?.income||0;
  const allocations=userData?.allocations||{};

  const calcMonthData=(year,month)=>{
    const events=getMonthEvents(baseBlocks,year,month);
    const estimated={};const actual={};
    BUDGET_CATEGORIES.forEach(c=>{estimated[c.key]=0;actual[c.key]=0;});
    events.forEach(e=>{
      if(e.hasCost&&e.budgetCat&&e.cost){
        estimated[e.budgetCat]=(estimated[e.budgetCat]||0)+e.cost;
        if(e.spent&&e.spentAmount)actual[e.budgetCat]=(actual[e.budgetCat]||0)+e.spentAmount;
        else if(e.spent)actual[e.budgetCat]=(actual[e.budgetCat]||0)+e.cost;
      }
    });
    debits.forEach(d=>{if(d.budgetCat){estimated[d.budgetCat]=(estimated[d.budgetCat]||0)+d.amount;actual[d.budgetCat]=(actual[d.budgetCat]||0)+d.amount;}});
    const totalEst=Object.values(estimated).reduce((a,b)=>a+b,0);
    const totalAct=Object.values(actual).reduce((a,b)=>a+b,0);
    return{estimated,actual,totalEst,totalAct};
  };

  const main=calcMonthData(viewYear,viewMonth);
  const comp=compareMode?calcMonthData(compareYear,compareMonth):null;

  const navMonth=(dir)=>{
    const d=new Date(viewYear,viewMonth+dir);
    setViewYear(d.getFullYear());setViewMonth(d.getMonth());
  };
  const navCompare=(dir)=>{
    const d=new Date(compareYear,compareMonth+dir);
    setCompareYear(d.getFullYear());setCompareMonth(d.getMonth());
  };

  const trend=(curr,prev)=>{
    if(!prev||prev===0)return null;
    const pct=Math.round(((curr-prev)/prev)*100);
    if(Math.abs(pct)<3)return{icon:"→",color:"#7C7C7C",label:"similar"};
    return pct>0?{icon:"↑",color:"#E8A0A0",label:`+${pct}%`}:{icon:"↓",color:"#7A9E7E",label:`${pct}%`};
  };

  return(
    <div style={{padding:isMobile?"16px":"28px",maxWidth:"700px"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"10px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <button onClick={()=>navMonth(-1)} style={{background:"transparent",border:"1px solid #E8DDD0",borderRadius:"6px",padding:"6px 12px",fontSize:"16px",cursor:"pointer",color:"#7C7C7C"}}>‹</button>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",fontWeight:300,color:"#1A1A1A",margin:0}}>{MONTHS[viewMonth]} {viewYear}</h2>
          <button onClick={()=>navMonth(1)} style={{background:"transparent",border:"1px solid #E8DDD0",borderRadius:"6px",padding:"6px 12px",fontSize:"16px",cursor:"pointer",color:"#7C7C7C"}}>›</button>
        </div>
        <button onClick={()=>setCompareMode(c=>!c)} style={{padding:"8px 16px",background:compareMode?"#1A1A1A":"transparent",border:`1px solid ${compareMode?"#1A1A1A":"#E8DDD0"}`,borderRadius:"6px",color:compareMode?"#F8F5F0":"#7C7C7C",fontSize:"11px",cursor:"pointer",fontFamily:"'Jost',sans-serif",letterSpacing:"0.06em"}}>
          {compareMode?"HIDE COMPARISON":"COMPARE MONTHS"}
        </button>
      </div>

      {/* Compare month picker */}
      {compareMode&&(
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"18px",padding:"12px 16px",background:"#F3EEE8",borderRadius:"8px",border:"1px solid #E8DDD0"}}>
          <span style={{fontSize:"11px",color:"#7C7C7C",letterSpacing:"0.06em"}}>COMPARING WITH</span>
          <button onClick={()=>navCompare(-1)} style={{background:"transparent",border:"none",fontSize:"16px",cursor:"pointer",color:"#7C7C7C"}}>‹</button>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",color:"#1A1A1A"}}>{MONTHS[compareMonth]} {compareYear}</span>
          <button onClick={()=>navCompare(1)} style={{background:"transparent",border:"none",fontSize:"16px",cursor:"pointer",color:"#7C7C7C"}}>›</button>
        </div>
      )}

      {/* Totals row */}
      <div style={{display:"grid",gridTemplateColumns:compareMode?"1fr 1fr 1fr":"1fr 1fr 1fr",gap:"10px",marginBottom:"20px"}}>
        {[
          {label:"Budget",value:fmtShort(income),sub:"monthly income",color:"#F8F5F0",bg:"#1A1A1A"},
          {label:"Estimated",value:fmtShort(main.totalEst),sub:"planned spend",color:"#F8F5F0",bg:"#3A3A3A"},
          {label:"Actual",value:fmtShort(main.totalAct),sub:"marked as spent",color:main.totalAct>income?"#E8A0A0":"#7A9E7E",bg:"#FDFCFA"},
        ].map(card=>(
          <div key={card.label} style={{background:card.bg,border:"1px solid #E8DDD0",borderRadius:"10px",padding:"13px"}}>
            <div style={{fontSize:"9px",color:"#7C7C7C",letterSpacing:"0.1em",marginBottom:"4px"}}>{card.label.toUpperCase()}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"19px",color:card.color}}>{card.value}</div>
            <div style={{fontSize:"9px",color:"#5A5A5A",marginTop:"3px"}}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {BUDGET_CATEGORIES.map(cat=>{
          const budgeted=income*((allocations[cat.key]||0)/100);
          const est=main.estimated[cat.key]||0;
          const act=main.actual[cat.key]||0;
          if(budgeted===0&&est===0&&act===0)return null;
          const compEst=comp?(comp.estimated[cat.key]||0):null;
          const compAct=comp?(comp.actual[cat.key]||0):null;
          const t=comp?trend(act,compAct):null;
          const pctUsed=budgeted>0?Math.min(100,(est/budgeted)*100):0;
          const over=est>budgeted&&budgeted>0;
          return(
            <div key={cat.key} style={{background:"#FDFCFA",border:"1px solid #E8DDD0",borderRadius:"8px",padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"6px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <div style={{width:"7px",height:"7px",background:cat.color,borderRadius:"50%"}}/>
                  <span style={{fontSize:"12px",color:"#1A1A1A",fontWeight:500}}>{cat.label}</span>
                  {t&&<span style={{fontSize:"10px",color:t.color,fontWeight:500}}>{t.icon} {t.label}</span>}
                </div>
                <div style={{textAlign:"right"}}>
                  {budgeted>0&&<span style={{fontSize:"10px",color:"#A0A0A0"}}>of {fmtShort(budgeted)} · </span>}
                  <span style={{fontSize:"12px",color:over?"#E8A0A0":"#1A1A1A"}}>{fmtShort(est)} est</span>
                  {act>0&&<span style={{fontSize:"11px",color:"#7A9E7E"}}> · {fmtShort(act)} spent</span>}
                </div>
              </div>
              {budgeted>0&&(
                <div style={{height:"4px",background:"#E8DDD0",borderRadius:"2px",overflow:"hidden",position:"relative"}}>
                  <div style={{height:"100%",width:`${pctUsed}%`,background:over?"#E8A0A0":cat.color,borderRadius:"2px",transition:"width 0.4s"}}/>
                  {act>0&&budgeted>0&&<div style={{position:"absolute",top:0,left:0,height:"100%",width:`${Math.min(100,(act/budgeted)*100)}%`,background:act>budgeted?"#E8A0A0":"#7A9E7E",opacity:0.5,borderRadius:"2px"}}/>}
                </div>
              )}
              {/* Compare row */}
              {comp&&(compEst>0||compAct>0)&&(
                <div style={{marginTop:"6px",fontSize:"10px",color:"#A0A0A0",display:"flex",gap:"12px"}}>
                  <span>{MONTHS_SHORT[compareMonth]}: {fmtShort(compEst)} est</span>
                  {compAct>0&&<span style={{color:"#7A9E7E"}}>{fmtShort(compAct)} spent</span>}
                  {t&&act>0&&compAct>0&&<span style={{color:t.color}}>diff: {act>=compAct?"+":""}{fmtShort(act-compAct)}</span>}
                </div>
              )}
              {over&&<div style={{fontSize:"10px",color:"#E8A0A0",marginTop:"4px"}}>Over budget by {fmtShort(est-budgeted)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const[authUser,setAuthUser]=useState(null);
  const[authLoading,setAuthLoading]=useState(true);
  const[setup,setSetup]=useState(false);
  const[userData,setUserData]=useState(null);
  const[baseBlocks,setBaseBlocks]=useState([]); // master list of base events
  const[debits,setDebits]=useState([]);
  const[tab,setTab]=useState("calendar");
  const[calView,setCalView]=useState("week");
  const[weekOffset,setWeekOffset]=useState(0);
  const[activeDate,setActiveDate]=useState(todayStr());
  const[activeMonth,setActiveMonth]=useState({year:new Date().getFullYear(),month:new Date().getMonth()});
  const[modal,setModal]=useState(null); // {mode, date, baseId, isRecurring}
  const[recurModal,setRecurModal]=useState(null); // ask: just this / all future
  const[pendingSave,setPendingSave]=useState(null);
  const[form,setForm]=useState({});
  const[hoveredBlock,setHoveredBlock]=useState(null);
  const[toast,setToast]=useState(null);
  const[aiLoading,setAiLoading]=useState(false);
  const[aiAdvice,setAiAdvice]=useState(null);
  const[showSettings,setShowSettings]=useState(false);
  const[showSuggestedBanner,setShowSuggestedBanner]=useState(false);
  const[syncing,setSyncing]=useState(false);
  const isMobile=useIsMobile();

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),3000);};

  // ── Auth listener ──
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setAuthUser(session?.user||null);setAuthLoading(false);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{setAuthUser(session?.user||null);});
    return()=>subscription.unsubscribe();
  },[]);

  // ── Load data — RETURNING USER FIX ──
  useEffect(()=>{
    if(authLoading)return;
    if(!authUser){
      // Not logged in — check localStorage
      const ud=LS.get("ls_userData",null);
      if(ud){setUserData(ud);setBaseBlocks(LS.get("ls_blocks",[]));setDebits(LS.get("ls_debits",[]));setSetup(true);}
      return;
    }
    // Logged in — load from Supabase with a timeout fallback
    let didFinish=false;
    const fallbackTimer=setTimeout(()=>{
      if(!didFinish){
        // Supabase is slow — fall back to localStorage so app doesn't get stuck
        const ud=LS.get("ls_userData",null);
        if(ud){setUserData(ud);setBaseBlocks(LS.get("ls_blocks",[]));setDebits(LS.get("ls_debits",[]));setSetup(true);}
        setSyncing(false);
      }
    },6000);

    (async()=>{
      try{
        setSyncing(true);
        const{data:profile,error:profileErr}=await supabase.from("profiles").select("*").eq("id",authUser.id).single();
        if(profile?.data){
          setUserData(profile.data);
          setDebits(profile.debits||[]);
          setSetup(true);
        } else {
          // New user — check localStorage for data to migrate
          const ud=LS.get("ls_userData",null);
          if(ud){setUserData(ud);setDebits(LS.get("ls_debits",[]));setSetup(true);}
          // else setup stays false → onboarding shows
        }
        const{data:events}=await supabase.from("events").select("*").eq("user_id",authUser.id);
        if(events&&events.length>0)setBaseBlocks(events.map(e=>e.data));
        else{const lb=LS.get("ls_blocks",[]);if(lb.length>0)setBaseBlocks(lb);}
      }catch(err){
        // Network error — fall back to localStorage
        const ud=LS.get("ls_userData",null);
        if(ud){setUserData(ud);setBaseBlocks(LS.get("ls_blocks",[]));setDebits(LS.get("ls_debits",[]));setSetup(true);}
      }finally{
        didFinish=true;
        clearTimeout(fallbackTimer);
        setSyncing(false);
      }
    })();
    return()=>clearTimeout(fallbackTimer);
  },[authUser,authLoading]);

  // ── Persist ──
  useEffect(()=>{if(userData)LS.set("ls_userData",userData);},[userData]);
  useEffect(()=>{LS.set("ls_blocks",baseBlocks);},[baseBlocks]);
  useEffect(()=>{LS.set("ls_debits",debits);},[debits]);

  useEffect(()=>{
    if(!authUser||!userData)return;
    const t=setTimeout(async()=>{await supabase.from("profiles").upsert({id:authUser.id,data:userData,debits,updated_at:new Date().toISOString()});},1500);
    return()=>clearTimeout(t);
  },[userData,debits,authUser]);

  useEffect(()=>{
    if(!authUser)return;
    const t=setTimeout(async()=>{
      await supabase.from("events").delete().eq("user_id",authUser.id);
      if(baseBlocks.length>0)await supabase.from("events").insert(baseBlocks.map(b=>({user_id:authUser.id,data:b,event_date:b.date})));
    },1500);
    return()=>clearTimeout(t);
  },[baseBlocks,authUser]);

  useEffect(()=>{if(tab==="ai"&&!aiAdvice&&!aiLoading&&userData)runAI();},[tab]);

  useEffect(()=>{
    if(form.autoTitle&&form.category&&form.startHour!==undefined){
      const base=CAL_CATEGORIES[form.category]?.label||"";
      setForm(f=>({...f,title:`${getTimeName(f.startHour)} ${base}`}));
    }
  },[form.startHour,form.category,form.autoTitle]);

  // ── Recur modal decision ──
  useEffect(()=>{
    if(!recurModal||!pendingSave)return;
    if(recurModal.decision==="this"){
      // Add exception + override for this date only
      setBaseBlocks(prev=>prev.map(b=>b.id===pendingSave.baseId?{
        ...b,
        exceptions:[...(b.exceptions||[]),pendingSave.date],
        overrides:{...(b.overrides||{}),[pendingSave.date]:{...pendingSave.form,cost:pendingSave.form.hasCost?parseFloat(pendingSave.form.cost)||0:0}}
      }:b));
      setModal(null);setRecurModal(null);setPendingSave(null);
      showToast("This occurrence updated ✓");
    } else if(recurModal.decision==="future"){
      // Update the base event itself (affects all future)
      setBaseBlocks(prev=>prev.map(b=>b.id===pendingSave.baseId?{...b,...pendingSave.form,cost:pendingSave.form.hasCost?parseFloat(pendingSave.form.cost)||0:0}:b));
      setModal(null);setRecurModal(null);setPendingSave(null);
      showToast("All future occurrences updated ✓");
    }
  },[recurModal]);

  const signOut=async()=>{
    await supabase.auth.signOut();
    ["ls_userData","ls_blocks","ls_debits"].forEach(k=>localStorage.removeItem(k));
    setAuthUser(null);setSetup(false);setUserData(null);setBaseBlocks([]);setDebits([]);setShowSettings(false);
  };

  const runAI=async()=>{
    setAiLoading(true);setAiAdvice(null);
    try{
      const inc=userData?.income||0;const alloc=userData?.allocations||{};
      const summary=BUDGET_CATEGORIES.map(c=>`${c.label}: R${Math.round(inc*(alloc[c.key]||0)/100)} allocated`).join(", ");
      const debitTotal=debits.reduce((s,d)=>s+d.amount,0);
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Personal finance advisor for South African user. Income: R${inc}/month. Budget: ${summary}. Debit orders: R${debitTotal}/month. Give 4 specific actionable money-saving tips as JSON array with: tip (short title), detail (1 sentence), category (key: groceries/transport/health/shopping/savings/activities/bills/insurance), saving (ZAR number). Return ONLY valid JSON array.`}]})});
      const data=await res.json();
      const text=data.content?.map(c=>c.text||"").join("")||"";
      setAiAdvice(JSON.parse(text.trim()));
    }catch{
      setAiAdvice([{tip:"Review your subscriptions",detail:"Cancel services you haven't used in 30 days.",category:"bills",saving:300},{tip:"Meal prep on Sundays",detail:"Cooking at home cuts food spend by up to 40%.",category:"groceries",saving:800},{tip:"Annual insurance review",detail:"Competing quotes save 15–20% on average.",category:"insurance",saving:200},{tip:"Automate savings on payday",detail:"Moving savings immediately prevents lifestyle creep.",category:"savings",saving:500}]);
    }
    setAiLoading(false);
  };

  if(authLoading)return(
    <div style={{minHeight:"100vh",background:"#1A1A1A",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Jost',sans-serif",gap:"16px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Jost:wght@300;400;500;600&display=swap');@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}.dot{animation:pulse 1.4s infinite}.dot:nth-child(2){animation-delay:0.2s}.dot:nth-child(3){animation-delay:0.4s}`}</style>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"32px",fontWeight:300,color:"#F8F5F0",letterSpacing:"0.1em"}}>LifeSync</div>
      <div style={{display:"flex",gap:"6px"}}>
        {[0,1,2].map(i=><div key={i} className="dot" style={{width:"6px",height:"6px",background:"#7A9E7E",borderRadius:"50%"}}/>)}
      </div>
    </div>
  );
  if(!authUser)return <AuthPage onAuth={u=>setAuthUser(u)}/>;
  if(!setup)return <SetupPage user={authUser} onComplete={d=>{setUserData(d);setBaseBlocks(d.suggestedBlocks||[]);setDebits(d.debits||[]);setShowSuggestedBanner(true);setSetup(true);}}/>;

  const{name="",income=0,allocations={}}=userData||{};
  const weekDates=getWeekDates(weekOffset);

  // Expand recurring events for current view
  const visibleBlocks=expandRecurring(baseBlocks,weekDates);

  // Budget totals use the current month's expanded events
  const currMonthEvents=getMonthEvents(baseBlocks,new Date().getFullYear(),new Date().getMonth());
  const spentByCategory={};BUDGET_CATEGORIES.forEach(c=>{spentByCategory[c.key]=0;});
  currMonthEvents.forEach(b=>{if(b.hasCost&&b.budgetCat&&b.cost)spentByCategory[b.budgetCat]=(spentByCategory[b.budgetCat]||0)+b.cost;});
  debits.forEach(d=>{if(d.budgetCat)spentByCategory[d.budgetCat]=(spentByCategory[d.budgetCat]||0)+d.amount;});
  const totalSpent=Object.values(spentByCategory).reduce((a,b)=>a+b,0);
  const totalRemaining=income-totalSpent;
  const debitTotal=debits.reduce((s,d)=>s+d.amount,0);

  const hexAlpha=(hex,a)=>{if(!hex||hex.length<7)return`rgba(0,0,0,${a})`;const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),bv=parseInt(hex.slice(5,7),16);return`rgba(${r},${g},${bv},${a})`;};
  const getBlocksForDate=date=>visibleBlocks.filter(b=>b.date===date);
  const getDateCost=date=>getBlocksForDate(date).filter(b=>b.hasCost&&b.cost>0).reduce((s,b)=>s+b.cost,0);

  const openAdd=(date,hour)=>{
    if(isPast(date))return;
    setForm({title:`${getTimeName(hour)} Personal`,category:"personal",startHour:hour,endHour:hour+1,recur:"none",color:"#7A9E7E",autoTitle:true,hasCost:false,cost:"",budgetCat:"groceries",spent:false,spentAmount:""});
    setModal({mode:"add",date});
  };

  const openEdit=(block,e)=>{
    e.stopPropagation();
    setForm({...block,cost:block.cost||"",spentAmount:block.spentAmount||"",autoTitle:false});
    setModal({mode:"edit",date:block.date,baseId:block._baseId||block.id,isRecurring:block._isRecurring||false});
  };

  const saveBlock=()=>{
    if(!form.title||form.endHour<=form.startHour)return;
    if(modal.mode==="add"){
      const newBlock={id:Date.now(),date:modal.date,...form,cost:form.hasCost?parseFloat(form.cost)||0:0,spentAmount:form.spent?parseFloat(form.spentAmount)||0:0,exceptions:[],overrides:{}};
      setBaseBlocks(prev=>[...prev,newBlock]);
      setModal(null);showToast("Event added ✓");
    } else {
      // Editing — if recurring, ask what to update
      if(modal.isRecurring){
        setPendingSave({baseId:modal.baseId,date:modal.date,form});
        setRecurModal({decision:null});
      } else {
        setBaseBlocks(prev=>prev.map(b=>b.id===modal.baseId?{...b,...form,cost:form.hasCost?parseFloat(form.cost)||0:0,spentAmount:form.spent?parseFloat(form.spentAmount)||0:0}:b));
        setModal(null);showToast("Event updated ✓");
      }
    }
  };

  const deleteBlock=(block)=>{
    if(block._isRecurring){
      // Just hide this one occurrence
      setBaseBlocks(prev=>prev.map(b=>b.id===block._baseId?{...b,exceptions:[...(b.exceptions||[]),block.date]}:b));
      showToast("Occurrence removed ✓");
    } else {
      setBaseBlocks(prev=>prev.filter(b=>b.id!==(block._baseId||block.id)));
      showToast("Event deleted ✓");
    }
    setModal(null);
  };

  const inputStyle={width:"100%",background:"#F8F5F0",border:"1px solid #E8DDD0",borderRadius:"6px",padding:"10px 12px",color:"#1A1A1A",fontSize:"13px",outline:"none",fontFamily:"'Jost',sans-serif",boxSizing:"border-box"};
  const labelStyle={display:"block",fontSize:"10px",color:"#7C7C7C",marginBottom:"5px",fontWeight:500,letterSpacing:"0.1em"};

  // ── TIME GRID ──
  const TimeGrid=({dates})=>(
    <div style={{display:"flex",flex:1,overflowY:"auto",overflowX:dates.length>1?"auto":"hidden"}}>
      <div style={{width:"44px",flexShrink:0,paddingTop:"4px"}}>
        {HOURS.map(h=><div key={h} style={{height:"52px",display:"flex",alignItems:"flex-start",paddingTop:"3px",paddingRight:"6px",justifyContent:"flex-end",fontSize:"9px",color:"#C4A882"}}>{fmtH(h)}</div>)}
      </div>
      <div style={{display:"flex",flex:1,minWidth:dates.length>1?`${dates.length*90}px`:"100%"}}>
        {dates.map(dateStr=>{
          const past=isPast(dateStr);
          return(
            <div key={dateStr} style={{flex:1,borderLeft:"1px solid #EDE8E0",position:"relative",minWidth:dates.length>1?"90px":"100%"}}>
              {isToday(dateStr)&&(()=>{const now=new Date(),pct=(now.getHours()-5+(now.getMinutes()/60));if(pct>=0&&pct<=19)return<div style={{position:"absolute",top:`${pct*52}px`,left:0,right:0,height:"2px",background:"#E8A0A0",zIndex:10,display:"flex",alignItems:"center"}}><div style={{width:"8px",height:"8px",background:"#E8A0A0",borderRadius:"50%",marginLeft:"-4px"}}/></div>;})()}
              {HOURS.map(h=>(
                <div key={h} onClick={()=>!past&&openAdd(dateStr,h)} style={{height:"52px",borderBottom:`1px solid ${h%2===0?"#EDE8E0":"#F5F0EA"}`,cursor:past?"default":"pointer",background:past?"rgba(0,0,0,0.01)":"transparent"}}
                  onMouseEnter={e=>{if(!past)e.currentTarget.style.background="rgba(0,0,0,0.02)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background=past?"rgba(0,0,0,0.01)":"transparent";}}/>
              ))}
              {getBlocksForDate(dateStr).map(block=>{
                const col=block.color||"#2D4A3E";
                const top=(block.startHour-5)*52;const height=(block.endHour-block.startHour)*52-2;
                return(
                  <div key={`${block._baseId||block.id}-${dateStr}`} onClick={e=>openEdit(block,e)} onMouseEnter={()=>setHoveredBlock(`${block._baseId||block.id}-${dateStr}`)} onMouseLeave={()=>setHoveredBlock(null)}
                    style={{position:"absolute",top:`${top}px`,left:"2px",right:"2px",height:`${height}px`,background:hexAlpha(col,past?0.06:0.13),borderLeft:`3px solid ${col}`,borderRadius:"4px",padding:"4px 7px",cursor:"pointer",overflow:"hidden",zIndex:2,opacity:past?0.45:1}}>
                    {height>24&&<div style={{fontSize:"10px",fontWeight:500,color:col,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{block.spent?"✓ ":""}{block._isRecurring?"↻ ":""}{block.title}</div>}
                    {height>42&&<div style={{fontSize:"9px",color:col,opacity:0.7}}>{fmtH(block.startHour)}–{fmtH(block.endHour)}</div>}
                    {height>58&&block.hasCost&&block.cost>0&&<div style={{fontSize:"9px",color:col,opacity:0.7}}>{fmtShort(block.cost)}</div>}
                    {hoveredBlock===`${block._baseId||block.id}-${dateStr}`&&<button onClick={e=>{e.stopPropagation();deleteBlock(block);}} style={{position:"absolute",top:"3px",right:"3px",background:col,border:"none",color:"#fff",width:"15px",height:"15px",borderRadius:"3px",cursor:"pointer",fontSize:"11px",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );

  const DayView=()=>(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 150px)",overflow:"hidden"}}>
      <div style={{padding:"10px 16px 8px",background:"#FDFCFA",borderBottom:"1px solid #E8DDD0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>{const d=new Date(activeDate);d.setDate(d.getDate()-1);setActiveDate(toDateStr(d));}} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"22px",cursor:"pointer",padding:"4px 10px"}}>‹</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:isPast(activeDate)?"#A0A0A0":"#1A1A1A",fontWeight:300}}>{fmtFullDate(activeDate).split(",")[0]}</div>
          <div style={{fontSize:"11px",color:isToday(activeDate)?"#7A9E7E":isPast(activeDate)?"#A0A0A0":"#7C7C7C",marginTop:"1px"}}>{fmtDisplayDate(activeDate)}{isToday(activeDate)?" · Today":isPast(activeDate)?" · Past":""}</div>
          {getDateCost(activeDate)>0&&<div style={{fontSize:"10px",color:"#C4A882",marginTop:"2px"}}>{fmtShort(getDateCost(activeDate))} budgeted</div>}
        </div>
        <button onClick={()=>{const d=new Date(activeDate);d.setDate(d.getDate()+1);setActiveDate(toDateStr(d));}} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"22px",cursor:"pointer",padding:"4px 10px"}}>›</button>
      </div>
      <TimeGrid dates={[activeDate]}/>
    </div>
  );

  const WeekView=()=>(
    <div style={{display:"flex",flexDirection:"column",height:isMobile?"calc(100vh - 150px)":"calc(100vh - 134px)",overflow:"hidden"}}>
      <div style={{background:"#FDFCFA",borderBottom:"1px solid #E8DDD0",display:"flex",paddingLeft:"44px",overflowX:"auto",flexShrink:0}}>
        {weekDates.map((dateStr,i)=>{
          const cost=getDateCost(dateStr);const tod=isToday(dateStr);const past=isPast(dateStr);
          return(
            <div key={dateStr} onClick={()=>{setActiveDate(dateStr);if(isMobile)setCalView("day");}} style={{flex:1,minWidth:"76px",padding:"7px 4px",textAlign:"center",cursor:"pointer",borderBottom:tod?"2px solid #2D4A3E":"2px solid transparent",opacity:past?0.6:1}}>
              <div style={{fontSize:"9px",fontWeight:500,letterSpacing:"0.1em",color:i>=5?"#2D4A3E":"#7C7C7C"}}>{DAYS[i]}</div>
              <div style={{fontSize:"12px",color:tod?"#2D4A3E":past?"#A0A0A0":"#1A1A1A",marginTop:"2px",fontWeight:tod?600:400}}>{fmtDisplayDate(dateStr).split(" ")[0]}</div>
              <div style={{fontSize:"9px",color:"#A0A0A0"}}>{MONTHS_SHORT[parseDate(dateStr).getMonth()]}</div>
              {cost>0&&<div style={{fontSize:"9px",color:"#C4A882",marginTop:"1px"}}>{fmtShort(cost)}</div>}
            </div>
          );
        })}
      </div>
      <TimeGrid dates={weekDates}/>
    </div>
  );

  const MonthView=()=>{
    const{year,month}=activeMonth;
    const firstDay=new Date(year,month,1).getDay();
    const offset=(firstDay+6)%7;
    const daysInMonth=new Date(year,month+1,0).getDate();
    const cells=[];
    for(let i=0;i<offset;i++)cells.push(null);
    for(let d=1;d<=daysInMonth;d++)cells.push(d);
    while(cells.length%7!==0)cells.push(null);
    const monthDates=cells.map(d=>d?toDateStr(new Date(year,month,d)):null);
    const monthExpanded=expandRecurring(baseBlocks,monthDates.filter(Boolean));
    return(
      <div style={{display:"flex",flexDirection:"column",background:"#F8F5F0",overflowY:"auto",height:isMobile?"calc(100vh - 150px)":"auto"}}>
        <div style={{padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#FDFCFA",borderBottom:"1px solid #E8DDD0"}}>
          <button onClick={()=>setActiveMonth(m=>{const d=new Date(m.year,m.month-1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"22px",cursor:"pointer",padding:"4px 10px"}}>‹</button>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#1A1A1A",fontWeight:300}}>{MONTHS[month]} {year}</div>
          <button onClick={()=>setActiveMonth(m=>{const d=new Date(m.year,m.month+1);return{year:d.getFullYear(),month:d.getMonth()};})} style={{background:"transparent",border:"none",color:"#7C7C7C",fontSize:"22px",cursor:"pointer",padding:"4px 10px"}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#FDFCFA",borderBottom:"1px solid #E8DDD0"}}>
          {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d=><div key={d} style={{textAlign:"center",padding:"8px 0",fontSize:"10px",fontWeight:500,color:"#7C7C7C"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"1px",background:"#E8DDD0",padding:"1px"}}>
          {cells.map((date,idx)=>{
            const dateStr=date?toDateStr(new Date(year,month,date)):null;
            const dayBlocks=dateStr?monthExpanded.filter(b=>b.date===dateStr):[];
            const dayCost=dayBlocks.filter(b=>b.hasCost&&b.cost>0).reduce((s,b)=>s+b.cost,0);
            const isT=dateStr===todayStr();const past=dateStr?isPast(dateStr):false;
            return(
              <div key={idx} onClick={()=>{if(dateStr){setActiveDate(dateStr);setCalView("day");}}} style={{background:"#FDFCFA",minHeight:"68px",padding:"5px",cursor:date?"pointer":"default",opacity:date?1:0.3}}
                onMouseEnter={e=>{if(date)e.currentTarget.style.background="#F3EEE8";}}
                onMouseLeave={e=>{e.currentTarget.style.background="#FDFCFA";}}>
                {date&&<>
                  <div style={{width:"22px",height:"22px",borderRadius:"50%",background:isT?"#2D4A3E":"transparent",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"3px"}}>
                    <span style={{fontSize:"11px",fontWeight:isT?500:400,color:isT?"#F8F5F0":past?"#A0A0A0":"#1A1A1A"}}>{date}</span>
                  </div>
                  {dayBlocks.slice(0,2).map(block=>(
                    <div key={`${block._baseId||block.id}-${dateStr}`} style={{background:hexAlpha(block.color||"#2D4A3E",past?0.07:0.15),borderLeft:`2px solid ${block.color||"#2D4A3E"}`,borderRadius:"2px",padding:"1px 4px",marginBottom:"2px",overflow:"hidden",opacity:past?0.6:1}}>
                      <div style={{fontSize:"9px",color:block.color||"#2D4A3E",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{block.title}</div>
                    </div>
                  ))}
                  {dayBlocks.length>2&&<div style={{fontSize:"9px",color:"#7C7C7C"}}>+{dayBlocks.length-2}</div>}
                  {dayCost>0&&<div style={{fontSize:"9px",color:"#C4A882"}}>{fmtShort(dayCost)}</div>}
                </>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const TABS=isMobile?[["calendar","📅","Cal"],["budget","💰","Budget"],["summary","📊","Summary"],["ai","✨","AI"]]:
    [["calendar","CALENDAR"],["budget","BUDGET"],["summary","SUMMARY"],["debits","DEBITS"],["ai","AI ADVICE"]];

  return(
    <div style={{minHeight:"100vh",background:"#F8F5F0",fontFamily:"'Jost',sans-serif",color:"#1A1A1A"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Jost:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;height:3px;}::-webkit-scrollbar-track{background:#F8F5F0;}::-webkit-scrollbar-thumb{background:#C4A882;border-radius:2px;}
        .modal-bg{animation:fadeIn 0.2s ease;}.modal-box{animation:slideUp 0.25s ease;}.card{animation:slideUp 0.3s ease both;}.toast{animation:slideUp 0.3s ease;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
      `}</style>

      {showSettings&&<SettingsPage userData={userData} setUserData={setUserData} debits={debits} setDebits={setDebits} onSignOut={signOut} onClose={()=>setShowSettings(false)}/>}

      {/* Recur decision modal */}
      {recurModal&&recurModal.decision===null&&(
        <div className="modal-bg" style={{position:"fixed",inset:0,background:"rgba(26,26,26,0.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:"20px"}}>
          <div className="modal-box" style={{background:"#FDFCFA",borderRadius:"14px",padding:"28px",maxWidth:"340px",width:"100%",textAlign:"center",boxShadow:"0 24px 60px rgba(0,0,0,0.2)"}}>
            <div style={{fontSize:"24px",marginBottom:"12px"}}>↻</div>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",fontWeight:300,color:"#1A1A1A",marginBottom:"8px"}}>Recurring event</h3>
            <p style={{fontSize:"13px",color:"#7C7C7C",marginBottom:"24px",lineHeight:1.6}}>This event repeats. Which occurrences would you like to update?</p>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              <button onClick={()=>setRecurModal({decision:"this"})} style={{padding:"13px",background:"#1A1A1A",border:"none",borderRadius:"8px",color:"#F8F5F0",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif",fontWeight:500,letterSpacing:"0.06em"}}>JUST THIS OCCURRENCE</button>
              <button onClick={()=>setRecurModal({decision:"future"})} style={{padding:"13px",background:"transparent",border:"1px solid #1A1A1A",borderRadius:"8px",color:"#1A1A1A",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif",letterSpacing:"0.06em"}}>ALL FUTURE OCCURRENCES</button>
              <button onClick={()=>{setRecurModal(null);setPendingSave(null);}} style={{padding:"10px",background:"transparent",border:"none",color:"#A0A0A0",fontSize:"12px",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div className="toast" style={{position:"fixed",top:"16px",left:"50%",transform:"translateX(-50%)",zIndex:9999,background:"#2D4A3E",borderRadius:"8px",padding:"11px 20px",fontSize:"12px",color:"#F8F5F0",letterSpacing:"0.05em",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",whiteSpace:"nowrap"}}>{toast}</div>}

      {/* Header */}
      <div style={{background:"#1A1A1A",padding:isMobile?"12px 14px":"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"8px"}}>
        <div style={{flexShrink:0}}>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?"17px":"19px",fontWeight:300,letterSpacing:"0.15em",color:"#F8F5F0",textTransform:"uppercase"}}>LifeSync</h1>
          <p style={{fontSize:"9px",color:"#7C7C7C",marginTop:"1px"}}>Good {getTimeName(new Date().getHours()).toLowerCase()}, {(name||"").split(" ")[0]}</p>
        </div>
        {tab==="calendar"&&(
          <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
            {calView==="week"&&(
              <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
                <button onClick={()=>setWeekOffset(w=>w-1)} style={{background:"#252525",border:"none",borderRadius:"4px",color:"#7C7C7C",fontSize:"14px",cursor:"pointer",padding:"5px 8px"}}>‹</button>
                <button onClick={()=>setWeekOffset(0)} style={{background:weekOffset===0?"#2D4A3E":"#252525",border:"none",borderRadius:"4px",color:weekOffset===0?"#F8F5F0":"#7C7C7C",fontSize:"9px",cursor:"pointer",padding:"5px 8px",letterSpacing:"0.06em",fontFamily:"'Jost',sans-serif"}}>NOW</button>
                <button onClick={()=>setWeekOffset(w=>w+1)} style={{background:"#252525",border:"none",borderRadius:"4px",color:"#7C7C7C",fontSize:"14px",cursor:"pointer",padding:"5px 8px"}}>›</button>
              </div>
            )}
            <div style={{display:"flex",background:"#252525",borderRadius:"6px",padding:"2px",gap:"1px"}}>
              {["day","week","month"].map(v=><button key={v} onClick={()=>setCalView(v)} style={{padding:isMobile?"5px 7px":"5px 10px",background:calView===v?"#F8F5F0":"transparent",border:"none",borderRadius:"4px",color:calView===v?"#1A1A1A":"#7C7C7C",fontSize:"10px",cursor:"pointer",letterSpacing:"0.06em",fontFamily:"'Jost',sans-serif",fontWeight:calView===v?500:400}}>{v.toUpperCase()}</button>)}
            </div>
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
          {syncing&&<div style={{fontSize:"9px",color:"#7C7C7C"}}>syncing...</div>}
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"9px",color:"#5A5A5A"}}>Remaining</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?"14px":"17px",color:totalRemaining>0?"#7A9E7E":"#E8A0A0"}}>{fmtShort(totalRemaining)}</div>
          </div>
          <button onClick={()=>setShowSettings(true)} style={{background:"#252525",border:"none",borderRadius:"50%",width:"32px",height:"32px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C7C7C" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      {isMobile?(
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#1A1A1A",borderTop:"1px solid #252525",display:"flex",zIndex:50,paddingBottom:"env(safe-area-inset-bottom)"}}>
          {TABS.map(([key,icon,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{flex:1,padding:"11px 4px 9px",background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",fontFamily:"'Jost',sans-serif"}}>
              <span style={{fontSize:"16px"}}>{icon}</span>
              <span style={{fontSize:"9px",letterSpacing:"0.06em",color:tab===key?"#7A9E7E":"#4A4A4A",fontWeight:tab===key?500:400}}>{label.toUpperCase()}</span>
            </button>
          ))}
        </div>
      ):(
        <div style={{background:"#F8F5F0",borderBottom:"1px solid #E8DDD0",padding:"0 28px",display:"flex"}}>
          {TABS.map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{padding:"13px 16px",fontSize:"11px",fontWeight:500,letterSpacing:"0.1em",color:tab===key?"#1A1A1A":"#7C7C7C",borderBottom:tab===key?"2px solid #2D4A3E":"2px solid transparent",marginBottom:"-1px",background:"transparent",border:"none",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>{label}</button>
          ))}
        </div>
      )}

      {isMobile&&tab==="calendar"&&(
        <button onClick={()=>openAdd(activeDate,9)} style={{position:"fixed",right:"16px",bottom:"74px",width:"50px",height:"50px",background:"#2D4A3E",border:"none",borderRadius:"50%",color:"#F8F5F0",fontSize:"24px",cursor:"pointer",zIndex:40,boxShadow:"0 4px 16px rgba(45,74,62,0.4)",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      )}

      <div style={{paddingBottom:isMobile?"80px":"0"}}>
        {showSuggestedBanner&&tab==="calendar"&&(
          <div style={{background:"#2D4A3E",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px"}}>
            <p style={{fontSize:"12px",color:"#F8F5F0",margin:0}}>✨ Suggested schedule added based on your answers. Recurring events show with ↻. Tap to edit.</p>
            <button onClick={()=>setShowSuggestedBanner(false)} style={{background:"transparent",border:"none",color:"#7A9E7E",fontSize:"18px",cursor:"pointer",flexShrink:0}}>×</button>
          </div>
        )}

        {/* CALENDAR */}
        {tab==="calendar"&&(
          isMobile?(
            <>{calView==="day"&&<DayView/>}{calView==="week"&&<WeekView/>}{calView==="month"&&<MonthView/>}</>
          ):(
            calView==="month"?<MonthView/>:(
              <>
                <div style={{background:"#FDFCFA",borderBottom:"1px solid #E8DDD0",display:"flex",paddingLeft:"72px",paddingRight:"28px"}}>
                  {weekDates.map((dateStr,i)=>{
                    const cost=getDateCost(dateStr);const tod=isToday(dateStr);const past=isPast(dateStr);
                    return(
                      <div key={dateStr} style={{flex:1,padding:"8px 4px",textAlign:"center",borderBottom:tod?"2px solid #2D4A3E":"2px solid transparent",opacity:past?0.6:1}}>
                        <div style={{fontSize:"10px",fontWeight:500,letterSpacing:"0.1em",color:i>=5?"#2D4A3E":"#7C7C7C"}}>{DAYS[i]}</div>
                        <div style={{fontSize:"12px",color:tod?"#2D4A3E":past?"#A0A0A0":"#1A1A1A",marginTop:"2px",fontWeight:tod?600:400}}>{fmtDisplayDate(dateStr)}</div>
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
                      {weekDates.map((dateStr)=>{
                        const past=isPast(dateStr);
                        return(
                          <div key={dateStr} style={{flex:1,borderLeft:"1px solid #EDE8E0",position:"relative"}}>
                            {isToday(dateStr)&&(()=>{const now=new Date(),pct=(now.getHours()-5+(now.getMinutes()/60));if(pct>=0&&pct<=19)return<div style={{position:"absolute",top:`${pct*40}px`,left:0,right:0,height:"2px",background:"#E8A0A0",zIndex:10,display:"flex",alignItems:"center"}}><div style={{width:"7px",height:"7px",background:"#E8A0A0",borderRadius:"50%",marginLeft:"-3px"}}/></div>;})()}
                            {HOURS.map(h=>(
                              <div key={h} onClick={()=>!past&&openAdd(dateStr,h)} style={{height:"40px",borderBottom:`1px solid ${h%2===0?"#EDE8E0":"#F3EEE8"}`,cursor:past?"default":"pointer",background:past?"rgba(0,0,0,0.01)":"transparent"}}
                                onMouseEnter={e=>{if(!past)e.currentTarget.style.background="rgba(0,0,0,0.02)";}}
                                onMouseLeave={e=>{e.currentTarget.style.background=past?"rgba(0,0,0,0.01)":"transparent";}}/>
                            ))}
                            {getBlocksForDate(dateStr).map(block=>{
                              const col=block.color||"#2D4A3E";const top=(block.startHour-5)*40;const height=(block.endHour-block.startHour)*40-2;
                              return(
                                <div key={`${block._baseId||block.id}-${dateStr}`} onClick={e=>openEdit(block,e)} onMouseEnter={()=>setHoveredBlock(`${block._baseId||block.id}-${dateStr}`)} onMouseLeave={()=>setHoveredBlock(null)}
                                  style={{position:"absolute",top:`${top}px`,left:"2px",right:"2px",height:`${height}px`,background:hexAlpha(col,past?0.06:0.12),borderLeft:`3px solid ${col}`,borderRadius:"3px",padding:"4px 6px",cursor:"pointer",overflow:"hidden",zIndex:2,opacity:past?0.5:1}}>
                                  {height>24&&<div style={{fontSize:"10px",fontWeight:500,color:col,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{block.spent?"✓ ":""}{block._isRecurring?"↻ ":""}{block.title}</div>}
                                  {height>40&&<div style={{fontSize:"9px",color:col,opacity:0.7}}>{fmtH(block.startHour)}–{fmtH(block.endHour)}</div>}
                                  {hoveredBlock===`${block._baseId||block.id}-${dateStr}`&&<button onClick={e=>{e.stopPropagation();deleteBlock(block);}} style={{position:"absolute",top:"3px",right:"3px",background:col,border:"none",color:"#fff",width:"14px",height:"14px",borderRadius:"2px",cursor:"pointer",fontSize:"10px",lineHeight:1}}>×</button>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )
          )
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
                    <div style={{fontSize:"9px",color:"#7C7C7C",marginTop:"3px"}}>{userData?.period||"monthly"}</div>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:"20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><span style={{fontSize:"10px",color:"#7C7C7C",letterSpacing:"0.08em"}}>BUDGET USED THIS MONTH</span><span style={{fontSize:"10px",color:"#7C7C7C"}}>{income>0?Math.round((totalSpent/income)*100):0}%</span></div>
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
                  return(
                    <div key={cat.key} className="card" style={{background:"#FDFCFA",border:"1px solid #E8DDD0",borderRadius:"8px",padding:"12px 14px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"7px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px"}}><div style={{width:"7px",height:"7px",background:cat.color,borderRadius:"50%"}}/><span style={{fontSize:"12px",color:"#1A1A1A"}}>{cat.label}</span></div>
                        <div><span style={{fontSize:"12px",color:over?"#E8A0A0":"#1A1A1A",fontWeight:over?500:400}}>{fmtShort(spent)}</span><span style={{fontSize:"10px",color:"#7C7C7C"}}> / {fmtShort(allocated)}</span></div>
                      </div>
                      <div style={{height:"4px",background:"#E8DDD0",borderRadius:"2px",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:over?"#E8A0A0":cat.color,borderRadius:"2px",transition:"width 0.4s"}}/>
                      </div>
                      {over&&<div style={{fontSize:"10px",color:"#E8A0A0",marginTop:"4px"}}>Over by {fmtShort(spent-allocated)}</div>}
                    </div>
                  );
                })}
              </div>
              <button onClick={()=>setShowSettings(true)} style={{marginTop:"16px",padding:"11px",background:"transparent",border:"1px solid #E8DDD0",borderRadius:"8px",color:"#7C7C7C",fontSize:"11px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif",width:"100%"}}>EDIT BUDGET IN SETTINGS</button>
            </div>
          </div>
        )}

        {/* SUMMARY */}
        {tab==="summary"&&<MonthlySummary baseBlocks={baseBlocks} debits={debits} userData={userData} isMobile={isMobile}/>}

        {/* DEBITS — desktop only tab */}
        {tab==="debits"&&!isMobile&&(
          <div style={{padding:"28px"}}>
            <div style={{maxWidth:"560px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"18px"}}>
                <div><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"24px",fontWeight:300,color:"#1A1A1A",marginBottom:"3px"}}>Debit Orders</h2><p style={{fontSize:"12px",color:"#7C7C7C"}}>Monthly total: <span style={{color:"#1A1A1A",fontWeight:500}}>{fmtCurrency(debitTotal)}</span></p></div>
                <button onClick={()=>setShowSettings(true)} style={{background:"#1A1A1A",border:"none",borderRadius:"6px",padding:"10px 16px",color:"#F8F5F0",fontSize:"11px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>MANAGE</button>
              </div>
              {debits.length===0&&<div style={{textAlign:"center",padding:"40px 20px",background:"#FDFCFA",border:"1px solid #E8DDD0",borderRadius:"8px"}}><p style={{color:"#C4A882",fontSize:"13px",marginBottom:"12px"}}>No debit orders yet</p><button onClick={()=>setShowSettings(true)} style={{background:"#1A1A1A",border:"none",borderRadius:"6px",padding:"10px 20px",color:"#F8F5F0",fontSize:"11px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>+ ADD IN SETTINGS</button></div>}
              <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
                {debits.map(d=>{const cat=BUDGET_CATEGORIES.find(c=>c.key===d.budgetCat);return(
                  <div key={d.id} className="card" style={{background:"#FDFCFA",border:"1px solid #E8DDD0",borderLeft:`3px solid ${d.color||"#6E7A8A"}`,borderRadius:"8px",padding:"13px 15px",display:"flex",alignItems:"center",gap:"12px"}}>
                    <div style={{flex:1}}><div style={{fontWeight:500,fontSize:"13px",color:"#1A1A1A",marginBottom:"2px"}}>{d.name}</div><div style={{fontSize:"11px",color:"#7C7C7C"}}>Day {d.day} · {cat?.label}</div></div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"17px",color:"#1A1A1A"}}>{fmtCurrency(d.amount)}</div>
                  </div>
                );})}
              </div>
            </div>
          </div>
        )}

        {/* AI */}
        {tab==="ai"&&(
          <div style={{padding:isMobile?"16px":"28px"}}>
            <div style={{maxWidth:"600px"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"18px",gap:"12px"}}>
                <div><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"24px",fontWeight:300,color:"#1A1A1A",marginBottom:"5px"}}>AI Budget Advice</h2><p style={{fontSize:"12px",color:"#7C7C7C",fontWeight:300,lineHeight:1.6}}>Claude analyses your spending and gives personalised tips.</p></div>
                <button onClick={runAI} disabled={aiLoading} style={{background:"#1A1A1A",border:"none",borderRadius:"6px",padding:"10px 14px",color:"#F8F5F0",fontSize:"11px",cursor:aiLoading?"not-allowed":"pointer",letterSpacing:"0.1em",opacity:aiLoading?0.6:1,flexShrink:0,fontFamily:"'Jost',sans-serif"}}>{aiLoading?"ANALYSING...":"REFRESH"}</button>
              </div>
              {aiLoading&&<div style={{background:"#FDFCFA",border:"1px solid #E8DDD0",borderRadius:"8px",padding:"36px",textAlign:"center"}}><p style={{color:"#7C7C7C",fontSize:"13px"}}>Analysing your spending...</p></div>}
              {aiAdvice&&(
                <>
                  <div style={{background:"#1A1A1A",borderRadius:"8px",padding:"13px 16px",marginBottom:"12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:"11px",color:"#7C7C7C"}}>Potential monthly savings</span>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:"#7A9E7E"}}>{fmtShort(aiAdvice.reduce((s,a)=>s+(a.saving||0),0))}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
                    {aiAdvice.map((a,i)=>{const cat=BUDGET_CATEGORIES.find(c=>c.key===a.category);return(
                      <div key={i} className="card" style={{animationDelay:`${i*0.08}s`,background:"#FDFCFA",border:"1px solid #E8DDD0",borderLeft:`3px solid ${cat?.color||"#2D4A3E"}`,borderRadius:"6px",padding:"13px 15px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"}}>
                          <span style={{fontWeight:500,fontSize:"13px",color:"#1A1A1A"}}>{a.tip}</span>
                          <span style={{fontSize:"11px",color:"#7A9E7E",fontWeight:500,flexShrink:0,marginLeft:"8px"}}>Save {fmtShort(a.saving||0)}/mo</span>
                        </div>
                        <p style={{margin:0,fontSize:"12px",color:"#7C7C7C",lineHeight:1.6,fontWeight:300}}>{a.detail}</p>
                      </div>
                    );})}
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
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"19px",fontWeight:300,margin:"0 0 3px",color:"#1A1A1A"}}>{modal.mode==="add"?"ADD EVENT":"EDIT EVENT"}</h2>
            <p style={{fontSize:"11px",color:"#7C7C7C",margin:"0 0 16px"}}>{fmtFullDate(modal.date)}{modal.isRecurring?" · ↻ Recurring":""}</p>

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
                <div key={field}><label style={labelStyle}>{field==="startHour"?"START":"END"}</label>
                  <select value={form[field]} onChange={e=>setForm(f=>({...f,[field]:parseInt(e.target.value)}))} style={inputStyle}>
                    {HOURS.map(h=><option key={h} value={h}>{fmtHLong(h)}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <label style={labelStyle}>COLOUR</label>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"13px"}}>
              {EVENT_COLORS.map(c=><button key={c} onClick={()=>setForm({...form,color:c})} style={{width:"24px",height:"24px",background:c,border:`2px solid ${form.color===c?"#1A1A1A":"transparent"}`,borderRadius:"50%",cursor:"pointer"}}/>)}
            </div>

            {modal.mode==="add"&&(
              <>
                <label style={labelStyle}>REPEAT</label>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"13px"}}>
                  {RECUR_OPTIONS.map(r=><button key={r} onClick={()=>setForm({...form,recur:r})} style={{padding:"5px 9px",background:form.recur===r?"#1A1A1A":"transparent",border:`1px solid ${form.recur===r?"#1A1A1A":"#E8DDD0"}`,borderRadius:"4px",cursor:"pointer",color:form.recur===r?"#F8F5F0":"#7C7C7C",fontSize:"10px",textTransform:"capitalize",fontFamily:"'Jost',sans-serif"}}>{r}</button>)}
                </div>
              </>
            )}

            <div style={{background:"#F3EEE8",border:"1px solid #E8DDD0",borderRadius:"8px",padding:"12px",marginBottom:"13px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:form.hasCost?"10px":"0"}}>
                <span style={{fontSize:"11px",color:"#7C7C7C",letterSpacing:"0.08em"}}>HAS A COST?</span>
                <button onClick={()=>setForm(f=>({...f,hasCost:!f.hasCost}))} style={{width:"36px",height:"20px",background:form.hasCost?"#2D4A3E":"#D4C9BB",borderRadius:"10px",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
                  <div style={{position:"absolute",top:"2px",left:form.hasCost?"18px":"2px",width:"16px",height:"16px",background:"#fff",borderRadius:"50%",transition:"left 0.2s"}}/>
                </button>
              </div>
              {form.hasCost&&(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
                    <div><label style={labelStyle}>ESTIMATED (R)</label><input value={form.cost||""} onChange={e=>setForm({...form,cost:e.target.value})} placeholder="0.00" type="number" style={inputStyle}/></div>
                    <div><label style={labelStyle}>CATEGORY</label><select value={form.budgetCat||"groceries"} onChange={e=>setForm({...form,budgetCat:e.target.value})} style={inputStyle}>{BUDGET_CATEGORIES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
                  </div>
                  <div style={{borderTop:"1px solid #E8DDD0",paddingTop:"10px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:form.spent?"8px":"0"}}>
                      <span style={{fontSize:"11px",color:"#7C7C7C",letterSpacing:"0.06em"}}>MARK AS SPENT</span>
                      <button onClick={()=>setForm(f=>({...f,spent:!f.spent}))} style={{width:"36px",height:"20px",background:form.spent?"#7A9E7E":"#D4C9BB",borderRadius:"10px",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
                        <div style={{position:"absolute",top:"2px",left:form.spent?"18px":"2px",width:"16px",height:"16px",background:"#fff",borderRadius:"50%",transition:"left 0.2s"}}/>
                      </button>
                    </div>
                    {form.spent&&<div><label style={labelStyle}>ACTUAL AMOUNT (R)</label><input value={form.spentAmount||""} onChange={e=>setForm({...form,spentAmount:e.target.value})} placeholder="0.00" type="number" style={inputStyle}/></div>}
                  </div>
                  {form.cost&&parseFloat(form.cost)>0&&<div style={{marginTop:"8px",fontSize:"11px",color:totalRemaining-parseFloat(form.cost||0)>=0?"#7A9E7E":"#E8A0A0"}}>After this: {fmtCurrency(totalRemaining-parseFloat(form.cost||0))} remaining</div>}
                </>
              )}
            </div>

            {form.endHour<=form.startHour&&<div style={{background:"#FDF0F0",border:"1px solid #E8C4C4",borderRadius:"6px",padding:"8px 12px",fontSize:"11px",color:"#A05050",marginBottom:"10px"}}>End time must be after start time</div>}
            <div style={{display:"flex",gap:"8px"}}>
              {modal.mode==="edit"&&<button onClick={()=>{const block=visibleBlocks.find(b=>(b._baseId||b.id)===modal.baseId&&b.date===modal.date);if(block)deleteBlock(block);}} style={{padding:"12px",background:"transparent",border:"1px solid #E8C4C4",borderRadius:"8px",color:"#E8A0A0",fontSize:"11px",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>DELETE</button>}
              <button onClick={()=>setModal(null)} style={{flex:1,padding:"12px",background:"transparent",border:"1px solid #E8DDD0",borderRadius:"8px",color:"#7C7C7C",fontSize:"11px",cursor:"pointer",letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>CANCEL</button>
              <button onClick={saveBlock} style={{flex:2,padding:"12px",background:form.title&&form.endHour>form.startHour?"#1A1A1A":"#E8DDD0",border:"none",borderRadius:"8px",color:form.title&&form.endHour>form.startHour?"#F8F5F0":"#A0A0A0",fontSize:"11px",cursor:"pointer",fontWeight:500,letterSpacing:"0.08em",fontFamily:"'Jost',sans-serif"}}>{modal.mode==="add"?"ADD EVENT":"SAVE"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
