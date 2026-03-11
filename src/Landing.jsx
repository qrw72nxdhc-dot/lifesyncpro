import { useEffect, useRef } from "react";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');

  .ls-land * { box-sizing: border-box; margin: 0; padding: 0; }

  .ls-land {
    background: #0F0F0F;
    color: #F8F5F0;
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }

  /* NAV */
  .ls-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    padding: 20px 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: border-color 0.4s, background 0.4s;
    border-bottom: 1px solid transparent;
  }
  .ls-nav.scrolled {
    background: rgba(15,15,15,0.92);
    backdrop-filter: blur(12px);
    border-bottom-color: rgba(255,255,255,0.07);
  }
  .ls-nav-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 300;
    letter-spacing: 0.2em;
    color: #F8F5F0;
    text-decoration: none;
    text-transform: uppercase;
  }
  .ls-nav-right { display: flex; align-items: center; gap: 32px; }
  .ls-nav-link {
    font-size: 11px;
    letter-spacing: 0.12em;
    color: #7C7C7C;
    text-decoration: none;
    transition: color 0.2s;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Jost', sans-serif;
  }
  .ls-nav-link:hover { color: #F8F5F0; }
  .ls-nav-cta {
    padding: 9px 22px;
    background: #F8F5F0;
    color: #0F0F0F;
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-decoration: none;
    border-radius: 4px;
    transition: opacity 0.2s;
    border: none;
    cursor: pointer;
  }
  .ls-nav-cta:hover { opacity: 0.85; }

  /* HERO */
  .ls-hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 120px 24px 80px;
    position: relative;
  }
  .ls-hero::after {
    content: '';
    position: absolute;
    top: 20%; left: 50%;
    transform: translateX(-50%);
    width: 600px; height: 600px;
    background: radial-gradient(ellipse, rgba(45,74,62,0.18) 0%, transparent 70%);
    pointer-events: none;
  }
  .ls-eyebrow {
    font-size: 10px;
    letter-spacing: 0.25em;
    color: #7A9E7E;
    margin-bottom: 28px;
    opacity: 0;
    animation: lsFadeUp 0.8s ease 0.2s forwards;
  }
  .ls-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(64px, 10vw, 130px);
    font-weight: 300;
    line-height: 0.92;
    color: #F8F5F0;
    margin-bottom: 32px;
    opacity: 0;
    animation: lsFadeUp 0.9s ease 0.4s forwards;
  }
  .ls-hero-title em { font-style: italic; color: #C4A882; }
  .ls-hero-sub {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(16px, 2.5vw, 22px);
    font-style: italic;
    color: #7C7C7C;
    font-weight: 300;
    max-width: 480px;
    line-height: 1.6;
    margin-bottom: 52px;
    opacity: 0;
    animation: lsFadeUp 0.9s ease 0.6s forwards;
  }
  .ls-hero-actions {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    opacity: 0;
    animation: lsFadeUp 0.9s ease 0.8s forwards;
  }
  .ls-btn-primary {
    padding: 15px 36px;
    background: #F8F5F0;
    color: #0F0F0F;
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-decoration: none;
    border-radius: 4px;
    transition: opacity 0.2s, transform 0.2s;
    border: none;
    cursor: pointer;
    display: inline-block;
  }
  .ls-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
  .ls-btn-ghost {
    padding: 15px 36px;
    background: transparent;
    color: #7C7C7C;
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-decoration: none;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 4px;
    transition: color 0.2s, border-color 0.2s, transform 0.2s;
    cursor: pointer;
  }
  .ls-btn-ghost:hover { color: #F8F5F0; border-color: rgba(255,255,255,0.25); transform: translateY(-1px); }
  .ls-hero-note {
    margin-top: 20px;
    font-size: 11px;
    color: #5A5A5A;
    letter-spacing: 0.06em;
    opacity: 0;
    animation: lsFadeUp 0.9s ease 1s forwards;
  }
  .ls-scroll-hint {
    position: absolute;
    bottom: 36px; left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    opacity: 0;
    animation: lsFadeUp 1s ease 1.4s forwards;
  }
  .ls-scroll-hint span { font-size: 9px; letter-spacing: 0.2em; color: #5A5A5A; }
  .ls-scroll-line {
    width: 1px; height: 40px;
    background: linear-gradient(to bottom, #5A5A5A, transparent);
    animation: lsScrollPulse 2s ease-in-out infinite;
  }

  /* PREVIEW */
  .ls-preview-section { padding: 0 24px 100px; display: flex; justify-content: center; }
  .ls-preview-frame {
    width: 100%; max-width: 900px;
    background: #1A1A1A;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 60px 120px rgba(0,0,0,0.6);
    opacity: 0; transform: translateY(40px);
    transition: opacity 0.9s ease, transform 0.9s ease;
  }
  .ls-preview-frame.ls-visible { opacity: 1; transform: translateY(0); }
  .ls-preview-bar {
    background: #141414;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .ls-preview-dot { width: 10px; height: 10px; border-radius: 50%; }
  .ls-preview-inner { display: grid; grid-template-columns: 1fr 1fr; min-height: 320px; }
  .ls-preview-cal { border-right: 1px solid rgba(255,255,255,0.07); padding: 20px; }
  .ls-preview-cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .ls-preview-cal-title { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 300; color: #F8F5F0; }
  .ls-preview-days { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; margin-bottom: 8px; }
  .ls-preview-day-label { font-size: 8px; letter-spacing: 0.1em; color: #5A5A5A; text-align: center; padding: 4px 0; }
  .ls-preview-day { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #7C7C7C; border-radius: 4px; position: relative; }
  .ls-preview-day.today { background: #2D4A3E; color: #F8F5F0; font-weight: 500; }
  .ls-preview-day.has-event::after { content: ''; position: absolute; bottom: 2px; width: 3px; height: 3px; background: #7A9E7E; border-radius: 50%; }
  .ls-preview-event { background: rgba(122,158,126,0.15); border-left: 2px solid #7A9E7E; border-radius: 3px; padding: 4px 8px; margin-bottom: 4px; font-size: 10px; color: #7A9E7E; }
  .ls-preview-budget { padding: 20px; }
  .ls-preview-budget-title { font-size: 9px; letter-spacing: 0.14em; color: #5A5A5A; margin-bottom: 14px; }
  .ls-preview-stat { margin-bottom: 12px; }
  .ls-preview-stat-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
  .ls-preview-stat-label { font-size: 10px; color: #7C7C7C; }
  .ls-preview-stat-val { font-family: 'Cormorant Garamond', serif; font-size: 13px; color: #F8F5F0; }
  .ls-preview-bar-bg { height: 3px; background: rgba(255,255,255,0.07); border-radius: 2px; overflow: hidden; }
  .ls-preview-bar-fill { height: 100%; border-radius: 2px; }

  /* FEATURES */
  .ls-features { padding: 100px 24px; max-width: 1100px; margin: 0 auto; }
  .ls-section-eyebrow { font-size: 10px; letter-spacing: 0.25em; color: #7A9E7E; margin-bottom: 20px; text-align: center; }
  .ls-section-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(36px,5vw,56px); font-weight: 300; text-align: center; line-height: 1.1; margin-bottom: 72px; color: #F8F5F0; }
  .ls-section-title em { font-style: italic; color: #C4A882; }
  .ls-features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; overflow: hidden; }
  .ls-feature-card { background: #141414; padding: 40px 32px; transition: background 0.3s, opacity 0.6s ease, transform 0.6s ease; opacity: 0; transform: translateY(20px); }
  .ls-feature-card.ls-visible { opacity: 1; transform: translateY(0); }
  .ls-feature-card:hover { background: #1A1A1A; }
  .ls-feature-icon { width: 36px; height: 36px; background: rgba(45,74,62,0.3); border: 1px solid rgba(122,158,126,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 16px; }
  .ls-feature-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 300; color: #F8F5F0; margin-bottom: 10px; line-height: 1.2; }
  .ls-feature-desc { font-size: 13px; color: #7C7C7C; line-height: 1.7; font-weight: 300; }

  /* STATS */
  .ls-stats { padding: 80px 24px; border-top: 1px solid rgba(255,255,255,0.07); border-bottom: 1px solid rgba(255,255,255,0.07); }
  .ls-stats-inner { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; overflow: hidden; }
  .ls-stat-card { background: #141414; padding: 40px 32px; text-align: center; }
  .ls-stat-number { font-family: 'Cormorant Garamond', serif; font-size: 52px; font-weight: 300; color: #F8F5F0; line-height: 1; margin-bottom: 8px; }
  .ls-stat-number span { color: #7A9E7E; }
  .ls-stat-label { font-size: 11px; letter-spacing: 0.1em; color: #7C7C7C; }

  /* HOW */
  .ls-how { padding: 100px 24px; max-width: 800px; margin: 0 auto; }
  .ls-step { display: grid; grid-template-columns: 60px 1fr; gap: 24px; padding: 36px 0; border-bottom: 1px solid rgba(255,255,255,0.07); opacity: 0; transform: translateX(-20px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .ls-step.ls-visible { opacity: 1; transform: translateX(0); }
  .ls-step:first-of-type { border-top: 1px solid rgba(255,255,255,0.07); }
  .ls-step-num { font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 300; color: rgba(255,255,255,0.12); line-height: 1; padding-top: 4px; }
  .ls-step-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 300; color: #F8F5F0; margin-bottom: 8px; }
  .ls-step-desc { font-size: 13px; color: #7C7C7C; line-height: 1.8; }

  /* BANKS */
  .ls-banks { padding: 80px 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.07); }
  .ls-banks-label { font-size: 10px; letter-spacing: 0.2em; color: #5A5A5A; margin-bottom: 36px; }
  .ls-banks-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .ls-bank-pill { padding: 10px 20px; background: #141414; border: 1px solid rgba(255,255,255,0.12); border-radius: 100px; font-size: 12px; color: #7C7C7C; letter-spacing: 0.06em; transition: color 0.2s, border-color 0.2s; }
  .ls-bank-pill:hover { color: #F8F5F0; border-color: rgba(255,255,255,0.2); }

  /* CTA */
  .ls-cta { padding: 120px 24px; text-align: center; position: relative; overflow: hidden; }
  .ls-cta::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 800px; height: 400px; background: radial-gradient(ellipse, rgba(45,74,62,0.15) 0%, transparent 70%); pointer-events: none; }
  .ls-cta-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(44px,7vw,80px); font-weight: 300; line-height: 1.05; margin-bottom: 24px; color: #F8F5F0; }
  .ls-cta-title em { font-style: italic; color: #C4A882; }
  .ls-cta-sub { font-size: 14px; color: #7C7C7C; margin-bottom: 48px; font-weight: 300; }
  .ls-cta-note { margin-top: 20px; font-size: 11px; color: #5A5A5A; }

  /* FOOTER */
  .ls-footer { border-top: 1px solid rgba(255,255,255,0.07); padding: 32px 48px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
  .ls-footer-logo { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 300; letter-spacing: 0.15em; color: #7C7C7C; text-transform: uppercase; }
  .ls-footer-note { font-size: 11px; color: #5A5A5A; }

  /* ANIMATIONS */
  @keyframes lsFadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes lsScrollPulse { 0%,100% { opacity: 0.3; } 50% { opacity: 0.8; } }

  /* MOBILE */
  @media (max-width: 768px) {
    .ls-nav { padding: 16px 20px; }
    .ls-nav-right .ls-nav-link { display: none; }
    .ls-features-grid { grid-template-columns: 1fr; }
    .ls-stats-inner { grid-template-columns: 1fr; }
    .ls-preview-inner { grid-template-columns: 1fr; }
    .ls-preview-budget { display: none; }
    .ls-footer { padding: 24px 20px; flex-direction: column; text-align: center; }
    .ls-step { grid-template-columns: 40px 1fr; gap: 16px; }
    .ls-step-num { font-size: 32px; }
  }
`;

export default function Landing() {
  const navRef = useRef(null);
  const previewRef = useRef(null);
  const featureRefs = useRef([]);
  const stepRefs = useRef([]);

  useEffect(() => {
    // Nav scroll
    const handleScroll = () => {
      if (navRef.current) navRef.current.classList.toggle("ls-scrolled", window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll);

    // Intersection observer for reveals
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("ls-visible"); observer.unobserve(e.target); } });
    }, { threshold: 0.15 });

    if (previewRef.current) observer.observe(previewRef.current);
    featureRefs.current.forEach(el => el && observer.observe(el));
    stepRefs.current.forEach(el => el && observer.observe(el));

    return () => { window.removeEventListener("scroll", handleScroll); observer.disconnect(); };
  }, []);

  const goToApp = () => window.location.href = "/app";
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const features = [
    { icon: "📅", title: "Smart Calendar", desc: "Day, week and month views with recurring events that actually repeat. Add costs to any event and watch your budget update in real time." },
    { icon: "💰", title: "Live Budget Tracking", desc: "Set your income and spending targets once. LifeSync tracks every rand across groceries, transport, health, savings and more — automatically." },
    { icon: "📊", title: "Monthly Summaries", desc: "See how your estimated spending compares to what you actually spent, month by month. Spot patterns and cut where it counts." },
    { icon: "🏦", title: "Bank Statement Import", desc: "Upload your PDF, CSV or Excel statement from any South African bank and your spending is categorised automatically. No manual entry." },
    { icon: "✨", title: "AI Money Advice", desc: "Claude analyses your actual spending and gives you four personalised tips every month — with real rand amounts you could save." },
    { icon: "☁️", title: "Syncs Everywhere", desc: "Sign in once and your data lives on every device. Phone, tablet, laptop — always in sync, always up to date." },
  ];

  const steps = [
    { num: "01", title: "Create your account", desc: "Sign up with email or Google. Free to start — no credit card, no subscription. Your data is encrypted and only you can see it." },
    { num: "02", title: "Tell us about your life", desc: "Answer 8 quick questions about your income, work schedule and spending. LifeSync builds your personalised calendar and budget in seconds." },
    { num: "03", title: "Import your bank statement", desc: "Upload a PDF, CSV or Excel export from any SA bank. We automatically read your transactions and fill in your actual spending." },
    { num: "04", title: "Live your life, stay in sync", desc: "Add events, mark expenses as spent, and watch your monthly picture come together. Check your AI tips every month to save more." },
  ];

  return (
    <div className="ls-land">
      <style>{style}</style>

      {/* NAV */}
      <nav className="ls-nav" ref={navRef}>
        <span className="ls-nav-logo">LifeSync</span>
        <div className="ls-nav-right">
          <button className="ls-nav-link" onClick={() => scrollTo("ls-features")}>FEATURES</button>
          <button className="ls-nav-link" onClick={() => scrollTo("ls-how")}>HOW IT WORKS</button>
          <button className="ls-nav-cta" onClick={goToApp}>GET STARTED FREE</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="ls-hero">
        <p className="ls-eyebrow">BUILT FOR SOUTH AFRICA</p>
        <h1 className="ls-hero-title">Your life,<br/><em>intelligently</em><br/>organised.</h1>
        <p className="ls-hero-sub">One app that syncs your calendar and budget — so your time and money always work together.</p>
        <div className="ls-hero-actions">
          <button className="ls-btn-primary" onClick={goToApp}>GET STARTED FREE</button>
          <button className="ls-btn-ghost" onClick={() => scrollTo("ls-features")}>SEE FEATURES</button>
        </div>
        <p className="ls-hero-note">Free to use · Works on any device · No credit card needed</p>
        <div className="ls-scroll-hint">
          <div className="ls-scroll-line"/>
          <span>SCROLL</span>
        </div>
      </section>

      {/* APP PREVIEW */}
      <section className="ls-preview-section">
        <div className="ls-preview-frame" ref={previewRef}>
          <div className="ls-preview-bar">
            <div className="ls-preview-dot" style={{background:"#FF5F57"}}/>
            <div className="ls-preview-dot" style={{background:"#FFBD2E"}}/>
            <div className="ls-preview-dot" style={{background:"#28C840"}}/>
            <div style={{flex:1,marginLeft:"8px",background:"rgba(255,255,255,0.05)",borderRadius:"4px",height:"20px",maxWidth:"240px",display:"flex",alignItems:"center",padding:"0 10px"}}>
              <span style={{fontSize:"9px",color:"#5A5A5A",letterSpacing:"0.05em"}}>lifesyncpro-ubgb.vercel.app</span>
            </div>
          </div>
          <div className="ls-preview-inner">
            <div className="ls-preview-cal">
              <div className="ls-preview-cal-header">
                <span className="ls-preview-cal-title">March 2026</span>
                <span style={{fontSize:"9px",letterSpacing:"0.1em",color:"#5A5A5A"}}>WEEK ›</span>
              </div>
              <div className="ls-preview-days">
                {["MO","TU","WE","TH","FR","SA","SU"].map(d=><div key={d} className="ls-preview-day-label">{d}</div>)}
                {[["2",false],["3",false],["4",true],["5",false],["6",true],["7",true],["8",false],
                  ["9",false],["10",false,"today"],["11",false],["12",false],["13",true],["14",true],["15",false]].map(([n,ev,cls])=>(
                  <div key={n} className={`ls-preview-day${ev?" has-event":""}${cls?" today":""}`}>{n}</div>
                ))}
              </div>
              <div style={{marginTop:"16px"}}>
                <div className="ls-preview-event">↻ Work · 9am – 5pm</div>
                <div className="ls-preview-event" style={{borderColor:"#C4A882",color:"#C4A882",background:"rgba(196,168,130,0.1)"}}>Grocery Run · R500</div>
                <div className="ls-preview-event" style={{borderColor:"#9B8EA8",color:"#9B8EA8",background:"rgba(155,142,168,0.1)"}}>Weekend Activity · R200</div>
              </div>
            </div>
            <div className="ls-preview-budget">
              <div className="ls-preview-budget-title">MARCH BUDGET</div>
              <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}>
                {[["INCOME","R25k","#F8F5F0"],["REMAINING","R9.2k","#7A9E7E"]].map(([l,v,c])=>(
                  <div key={l} style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:"6px",padding:"12px",border:"1px solid rgba(255,255,255,0.06)"}}>
                    <div style={{fontSize:"8px",letterSpacing:"0.1em",color:"#5A5A5A",marginBottom:"4px"}}>{l}</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",color:c}}>{v}</div>
                  </div>
                ))}
              </div>
              {[["Food & Groceries","R1.8k / R2k",90,"#7A9E7E"],["Transport","R900 / R1.5k",60,"#C4A882"],["Activities","R600 / R800",75,"#9B8EA8"],["Shopping","R1.4k / R1k",100,"#E8A0A0"]].map(([l,v,w,c])=>(
                <div key={l} className="ls-preview-stat">
                  <div className="ls-preview-stat-row">
                    <span className="ls-preview-stat-label">{l}</span>
                    <span className="ls-preview-stat-val">{v}</span>
                  </div>
                  <div className="ls-preview-bar-bg"><div className="ls-preview-bar-fill" style={{width:`${w}%`,background:c}}/></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="ls-features" id="ls-features">
        <p className="ls-section-eyebrow">WHAT YOU GET</p>
        <h2 className="ls-section-title">Everything in one place,<br/><em>nothing you don't need.</em></h2>
        <div className="ls-features-grid">
          {features.map((f, i) => (
            <div key={f.title} className="ls-feature-card" ref={el => featureRefs.current[i] = el} style={{transitionDelay:`${i*0.08}s`}}>
              <div className="ls-feature-icon">{f.icon}</div>
              <h3 className="ls-feature-title">{f.title}</h3>
              <p className="ls-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="ls-stats">
        <div className="ls-stats-inner">
          {[["5+","SA BANKS SUPPORTED"],["R0","TO GET STARTED"],["2min","TO SET UP"]].map(([n,l])=>(
            <div key={l} className="ls-stat-card">
              <div className="ls-stat-number"><span>{n}</span></div>
              <div className="ls-stat-label">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="ls-how" id="ls-how">
        <p className="ls-section-eyebrow">HOW IT WORKS</p>
        <h2 className="ls-section-title" style={{textAlign:"left",marginBottom:"48px"}}>Up and running<br/><em>in minutes.</em></h2>
        {steps.map((s, i) => (
          <div key={s.num} className="ls-step" ref={el => stepRefs.current[i] = el} style={{transitionDelay:`${i*0.1}s`}}>
            <div className="ls-step-num">{s.num}</div>
            <div>
              <h3 className="ls-step-title">{s.title}</h3>
              <p className="ls-step-desc">{s.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* BANKS */}
      <section className="ls-banks">
        <p className="ls-banks-label">WORKS WITH YOUR BANK</p>
        <div className="ls-banks-row">
          {["Discovery Bank","FNB","Nedbank","Absa","Standard Bank","Capitec","Investec","+ any CSV export"].map(b=>(
            <div key={b} className="ls-bank-pill">{b}</div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="ls-cta">
        <h2 className="ls-cta-title">Ready to take<br/><em>control?</em></h2>
        <p className="ls-cta-sub">Join South Africans who've stopped guessing where their money goes.</p>
        <div style={{display:"flex",justifyContent:"center"}}>
          <button className="ls-btn-primary" onClick={goToApp} style={{fontSize:"12px",padding:"16px 40px"}}>GET STARTED FREE</button>
        </div>
        <p className="ls-cta-note">No credit card · Works on all devices · Sign in with Google</p>
      </section>

      {/* FOOTER */}
      <footer className="ls-footer">
        <div className="ls-footer-logo">LifeSync</div>
        <div className="ls-footer-note">Built for South Africa · © 2026</div>
      </footer>
    </div>
  );
}
