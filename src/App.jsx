import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BadgeIndianRupee, Calculator,
  CheckCircle2, ChevronDown, ChevronRight, Clock3, Gem, Info, Menu,
  RefreshCw, Scale, ShieldCheck, Sparkles, TrendingUp, X,
} from 'lucide-react';
import { DEFAULT_SELL_DEDUCTION, GST, fetchRates, goldRateForPurity, inr } from './lib/rates';

const GOLD_PURITY = { '24K': 0.999, '22K': 0.916, '20K': 0.833, '18K': 0.75, '14K': 0.585 };
const clamp = (n, min, max) => Math.min(Math.max(Number(n) || 0, min), max);
const pct = (n) => `${(Number(n) * 100).toFixed(2).replace(/\.00$/, '').replace(/0$/, '')}%`;

function Stat({ icon: Icon, label, value, note }) {
  return <div className="stat-card glass"><span className="stat-icon"><Icon size={18}/></span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></div>;
}

function RateCard({ title, purity, unit, base, deduction }) {
  const buy = base * (1 + GST);
  const sell = base * (1 - deduction);
  return <article className="rate-card glass">
    <div className="rate-head"><div><span>{title}</span><h3>{purity}</h3><small>{unit}</small></div><Gem size={20}/></div>
    <div className="market-line"><span>Market / Base</span><strong>{inr(base)}</strong></div>
    <div className="rate-actions">
      <div className="rate-box buy"><div><ArrowUpRight size={17}/><span>BUY</span></div><strong>{inr(buy)}</strong><small>3% GST included*</small></div>
      <div className="rate-box sell"><div><ArrowDownRight size={17}/><span>SELL</span></div><strong>{inr(sell)}</strong><small>{pct(deduction)} est. deduction</small></div>
    </div>
  </article>;
}

function Field({ label, children, hint }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function CalculatorPanel({ rates, deduction, sellDeduction, setSellDeduction }) {
  const [tool, setTool] = useState('value');
  const [metal, setMetal] = useState('gold');
  const [purity, setPurity] = useState('22K');
  const [weight, setWeight] = useState('10');
  const [making, setMaking] = useState('8');
  const [wastage, setWastage] = useState('0');
  const [oldPurity, setOldPurity] = useState('91.6');
  const [oldDeduction, setOldDeduction] = useState('2');
  const [percentPurity, setPercentPurity] = useState('91.6');

  const basePerGram = useMemo(() => {
    if (!rates) return 0;
    return metal === 'gold' ? goldRateForPurity(rates, purity) / 10 : rates.silver999PerKg / 1000;
  }, [rates, metal, purity]);

  const valueCalc = useMemo(() => {
    const g = clamp(weight, 0, 100000);
    const metalValue = basePerGram * g;
    return { metalValue, buy: metalValue * (1 + GST), sell: metalValue * (1 - deduction) };
  }, [weight, basePerGram, deduction]);

  const jewellery = useMemo(() => {
    const g = clamp(weight, 0, 100000);
    const metalValue = basePerGram * g;
    const wastageAmount = metalValue * clamp(wastage, 0, 100) / 100;
    const makingAmount = metalValue * clamp(making, 0, 100) / 100;
    const subtotal = metalValue + wastageAmount + makingAmount;
    const gst = subtotal * GST;
    return { metalValue, wastageAmount, makingAmount, subtotal, gst, total: subtotal + gst };
  }, [weight, basePerGram, wastage, making]);

  const oldGold = useMemo(() => {
    const g = clamp(weight, 0, 100000);
    const purityFactor = clamp(oldPurity, 0, 100) / 100;
    const pureEquivalent = g * purityFactor;
    const gross = pureEquivalent * ((rates?.gold999Per10g || 0) / 10);
    const cut = gross * clamp(oldDeduction, 0, 25) / 100;
    return { pureEquivalent, gross, cut, net: gross - cut };
  }, [weight, oldPurity, oldDeduction, rates]);

  const purityResult = useMemo(() => {
    const p = clamp(percentPurity, 0, 100);
    return { karat: p / 100 * 24, fineness: Math.round(p * 10) };
  }, [percentPurity]);

  return <div className="tool-shell glass">
    <div className="tool-tabs" role="tablist">
      {[['value','Gold / Silver Value'],['bill','Jewellery Bill'],['old','Old Gold'],['purity','Purity']].map(([id,label]) => <button key={id} className={tool===id?'active':''} onClick={()=>setTool(id)}>{label}</button>)}
    </div>

    {tool === 'purity' ? <div className="tool-grid purity-tool">
      <div className="tool-form"><Field label="Gold purity (%)"><input type="number" min="0" max="100" step="0.1" value={percentPurity} onChange={e=>setPercentPurity(e.target.value)}/></Field><p className="form-note"><Info size={15}/> Percentage se approximate karat aur fineness niklega.</p></div>
      <div className="result-panel"><span className="result-kicker">PURITY RESULT</span><strong className="result-big">{purityResult.karat.toFixed(2)}K</strong><div className="result-row"><span>Fineness</span><b>{purityResult.fineness}</b></div><div className="result-row"><span>Purity</span><b>{clamp(percentPurity,0,100).toFixed(1)}%</b></div></div>
    </div> : <div className="tool-grid">
      <div className="tool-form">
        {tool !== 'old' && <Field label="Metal"><div className="segmented full"><button className={metal==='gold'?'active':''} onClick={()=>setMetal('gold')}>Gold</button><button className={metal==='silver'?'active':''} onClick={()=>setMetal('silver')}>Silver</button></div></Field>}
        {tool !== 'old' && metal === 'gold' && <Field label="Purity"><select value={purity} onChange={e=>setPurity(e.target.value)}>{Object.keys(GOLD_PURITY).map(k=><option key={k}>{k}</option>)}</select></Field>}
        <Field label="Weight (grams)"><input type="number" inputMode="decimal" min="0" step="0.01" value={weight} onChange={e=>setWeight(e.target.value)}/></Field>
        {tool === 'value' && <Field label="Estimated sell deduction"><div className="range-field"><input type="range" min="0" max="5" step="0.25" value={sellDeduction} onChange={e=>setSellDeduction(e.target.value)}/><b>{pct(deduction)}</b></div></Field>}
        {tool === 'bill' && <><Field label="Making charges (%)"><input type="number" min="0" max="100" step="0.1" value={making} onChange={e=>setMaking(e.target.value)}/></Field><Field label="Wastage (%)"><input type="number" min="0" max="100" step="0.1" value={wastage} onChange={e=>setWastage(e.target.value)}/></Field></>}
        {tool === 'old' && <><Field label="Tested purity (%)"><input type="number" min="0" max="100" step="0.1" value={oldPurity} onChange={e=>setOldPurity(e.target.value)}/></Field><Field label="Buyer deduction (%)"><input type="number" min="0" max="25" step="0.1" value={oldDeduction} onChange={e=>setOldDeduction(e.target.value)}/></Field></>}
      </div>

      <div className="result-panel">
        <span className="result-kicker">{tool === 'bill' ? 'ESTIMATED JEWELLERY BILL' : tool === 'old' ? 'OLD GOLD ESTIMATE' : 'VALUE ESTIMATE'}</span>
        {tool === 'value' && <><strong className="result-big">{inr(valueCalc.buy)}</strong><small>Approx BUY incl. GST*</small><div className="result-row"><span>Metal value</span><b>{inr(valueCalc.metalValue)}</b></div><div className="result-row"><span>Approx SELL</span><b>{inr(valueCalc.sell)}</b></div></>}
        {tool === 'bill' && <><strong className="result-big">{inr(jewellery.total)}</strong><small>Estimated final payable</small><div className="result-row"><span>Metal value</span><b>{inr(jewellery.metalValue)}</b></div><div className="result-row"><span>Making</span><b>{inr(jewellery.makingAmount)}</b></div><div className="result-row"><span>Wastage</span><b>{inr(jewellery.wastageAmount)}</b></div><div className="result-row"><span>GST (3%)</span><b>{inr(jewellery.gst)}</b></div></>}
        {tool === 'old' && <><strong className="result-big">{inr(oldGold.net)}</strong><small>Approx amount after deduction</small><div className="result-row"><span>Pure gold equivalent</span><b>{oldGold.pureEquivalent.toFixed(3)} g</b></div><div className="result-row"><span>Gross value</span><b>{inr(oldGold.gross)}</b></div><div className="result-row"><span>Deduction</span><b>-{inr(oldGold.cut)}</b></div></>}
      </div>
    </div>}
  </div>;
}

const faqs = [
  ['RealRate ka BUY rate kya dikhata hai?', 'BUY estimate benchmark metal rate me 3% GST add karke dikhaya jata hai. Jewellery ki final billing me making charges, wastage aur retailer premium alag ho sakte hain.'],
  ['SELL rate exact payout hai?', 'Nahi. SELL ek transparent estimate hai. Actual payout purity test, melting/refining loss aur buyer ki policy par depend karta hai.'],
  ['22K gold ka rate kaise calculate hota hai?', '22K ko commonly 916 fineness maana jata hai. RealRate available 916 benchmark use karta hai; fallback me 24K benchmark ka purity-adjusted value use hota hai.'],
  ['Silver rate kis unit me hai?', 'Silver 999 rate per kilogram dikhaya jata hai. Calculator me weight grams me dalne par per-gram value automatically calculate hoti hai.'],
  ['Rate kab update hota hai?', 'Website available benchmark source ko refresh karti hai aur source status aur update time screen par clearly dikhati hai.'],
];

export default function App() {
  const [rates, setRates] = useState(null);
  const [metal, setMetal] = useState('gold');
  const [sellDeduction, setSellDeduction] = useState(DEFAULT_SELL_DEDUCTION * 100);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);

  const loadRates = useCallback(async () => { setRefreshing(true); try { setRates(await fetchRates()); } finally { setRefreshing(false); } }, []);
  useEffect(() => { loadRates(); }, [loadRates]);
  const deduction = clamp(sellDeduction, 0, 10) / 100;
  const updated = rates ? new Date(rates.updatedAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}) : 'Loading…';
  const sourceState = rates?.status === 'live' ? 'Live benchmark' : rates?.status === 'cached' ? 'Cached benchmark' : 'Saved benchmark';
  const heroBase = rates?.gold999Per10g || 0;
  const heroBuy = heroBase * (1 + GST);
  const heroSell = heroBase * (1 - deduction);

  return <div className="site-shell">
    <div className="glow glow-one"/><div className="glow glow-two"/>
    <header className="header glass">
      <a className="brand" href="#top" aria-label="RealRate home"><span className="brand-mark">R</span><span><b>RealRate</b><small>Gold & Silver</small></span></a>
      <nav className="desktop-nav"><a href="#rates">Rates</a><a href="#calculator">Calculators</a><a href="#learn">Learn</a><a href="#faq">FAQ</a></nav>
      <div className="header-actions"><button className="icon-btn refresh" onClick={loadRates} disabled={refreshing} aria-label="Refresh rates"><RefreshCw size={17} className={refreshing?'spin':''}/></button><a className="header-cta" href="#calculator">Calculate <ArrowRight size={16}/></a><button className="icon-btn menu" onClick={()=>setMobileOpen(v=>!v)}>{mobileOpen?<X/>:<Menu/>}</button></div>
    </header>
    {mobileOpen && <nav className="mobile-nav glass"><a href="#rates" onClick={()=>setMobileOpen(false)}>Rates</a><a href="#calculator" onClick={()=>setMobileOpen(false)}>Calculators</a><a href="#learn" onClick={()=>setMobileOpen(false)}>Learn</a><a href="#faq" onClick={()=>setMobileOpen(false)}>FAQ</a></nav>}

    <main id="top">
      <section className="hero section-pad">
        <div className="hero-copy">
          <div className="pill"><Sparkles size={14}/> Aaj ka gold rate • India</div>
          <h1>Aaj gold ka rate<br/><em>kya hai?</em></h1>
          <p>Today 24K, 22K aur 18K gold rate, gold selling price, GST-inclusive buying estimate aur jewellery calculations — sab ek premium dashboard me.</p>
          <div className="hero-buttons"><a className="btn primary" href="#rates">Today’s rates <ChevronRight size={18}/></a><a className="btn ghost" href="#calculator"><Calculator size={17}/> Open calculators</a></div>
          <div className="hero-trust"><span><Clock3 size={15}/>{updated}</span><span><ShieldCheck size={15}/>{sourceState}</span></div>
        </div>
        <div className="hero-card glass">
          <div className="hero-card-top"><div><span className="live"><i/> TODAY’S BENCHMARK</span><h2>24K Gold</h2><p>999 purity • per 10 grams</p></div><div className="gold-orb"><Gem/></div></div>
          <div className="hero-market"><span>MARKET / BASE</span><strong>{rates?inr(heroBase):'—'}</strong></div>
          <div className="hero-prices"><div><span>YOU BUY</span><small>3% GST included*</small><strong>{rates?inr(heroBuy):'—'}</strong></div><div><span>YOU SELL</span><small>{pct(deduction)} deduction estimate</small><strong>{rates?inr(heroSell):'—'}</strong></div></div>
          <div className="source-strip"><Info size={15}/><span>Source: {rates?.source || 'Loading benchmark…'} · Jewellery making/wastage extra ho sakta hai.</span></div>
        </div>
      </section>

      <section className="stats section-pad compact-section">
        <Stat icon={TrendingUp} label="Gold 24K" value={rates?inr(rates.gold999Per10g):'—'} note="per 10g benchmark"/>
        <Stat icon={Gem} label="Gold 22K" value={rates?inr(rates.gold916Per10g):'—'} note="916 fineness · per 10g"/>
        <Stat icon={Scale} label="Silver 999" value={rates?inr(rates.silver999PerKg):'—'} note="per kilogram benchmark"/>
      </section>

      <section className="section-pad search-intent-section" aria-labelledby="today-gold-heading">
        <div className="intent-copy">
          <span className="eyebrow">AAJ KA GOLD RATE</span>
          <h2 id="today-gold-heading">Aaj gold ka rate kya hai?</h2>
          <p>India ke current benchmark ke hisaab se 24K, 22K aur 18K gold ka rate niche diya gaya hai. Saath me estimated <strong>gold selling price</strong> bhi dekho, taaki kharid aur bechne ke rate ka farq clear rahe.</p>
        </div>
        <div className="intent-grid">
          <a className="intent-card glass" href="/24k-gold-rate/"><span>24K GOLD TODAY</span><strong>{rates?inr(rates.gold999Per10g):'—'}</strong><small>999 purity • per 10g</small><b>24K details <ChevronRight size={15}/></b></a>
          <a className="intent-card glass" href="/22k-gold-rate/"><span>22K / 916 GOLD TODAY</span><strong>{rates?inr(rates.gold916Per10g):'—'}</strong><small>916 purity • per 10g</small><b>22K details <ChevronRight size={15}/></b></a>
          <a className="intent-card sell-intent glass" href="/gold-selling-price-today/"><span>24K SELLING ESTIMATE</span><strong>{rates?inr(heroSell):'—'}</strong><small>{pct(deduction)} deduction estimate • per 10g</small><b>Selling price details <ChevronRight size={15}/></b></a>
        </div>
        <div className="intent-links">
          <a href="/18k-gold-rate/">18K gold rate today</a><a href="/silver-rate/">Silver rate today</a><a href="/old-gold-calculator/">Purana sona value</a><a href="/gold-calculator/">Gold calculator</a>
        </div>
      </section>

      <section id="rates" className="section-pad content-section">
        <div className="section-head"><div><span className="eyebrow">LIVE RATE BOARD</span><h2>Buy aur sell ka farq,<br/>ek nazar me.</h2><p>Benchmark ko confusing jewellery quotes se alag dekho.</p></div><div className="segmented"><button className={metal==='gold'?'active':''} onClick={()=>setMetal('gold')}>Gold</button><button className={metal==='silver'?'active':''} onClick={()=>setMetal('silver')}>Silver</button></div></div>
        {!rates ? <div className="loading glass">Latest rates load ho rahe hain…</div> : metal === 'gold' ? <div className="rate-grid"><RateCard title="GOLD" purity="24K" unit="999 • per 10g" base={rates.gold999Per10g} deduction={deduction}/><RateCard title="GOLD" purity="22K" unit="916 • per 10g" base={rates.gold916Per10g} deduction={deduction}/><RateCard title="GOLD" purity="18K" unit="750 • per 10g" base={rates.gold750Per10g} deduction={deduction}/></div> : <div className="rate-grid single"><RateCard title="SILVER" purity="999 Fine" unit="per kilogram" base={rates.silver999PerKg} deduction={deduction}/></div>}
        <p className="legal-note"><Info size={15}/>* BUY = benchmark + 3% GST. Final jewellery price me making charges, wastage aur retailer premium add ho sakte hain. SELL estimated hai.</p>
      </section>

      <section id="calculator" className="section-pad content-section">
        <div className="section-head"><div><span className="eyebrow">4-IN-1 SMART TOOLS</span><h2>Hisab jo jewellery shop me<br/>actually kaam aaye.</h2><p>Gold/silver value, jewellery bill, old gold aur purity — ek jagah.</p></div></div>
        <CalculatorPanel rates={rates} deduction={deduction} sellDeduction={sellDeduction} setSellDeduction={setSellDeduction}/>
      </section>

      <section id="learn" className="section-pad content-section learn-section">
        <div className="section-head"><div><span className="eyebrow">UNDERSTAND THE RATE</span><h2>Teen numbers. Teen meanings.</h2></div></div>
        <div className="learn-grid">
          <article className="learn-card glass"><span>01</span><div className="learn-icon"><TrendingUp/></div><h3>Market / Base</h3><p>Metal ka benchmark value, GST aur jewellery charges se pehle.</p></article>
          <article className="learn-card glass"><span>02</span><div className="learn-icon"><BadgeIndianRupee/></div><h3>BUY Estimate</h3><p>Benchmark ke saath 3% GST. Jewellery me making/wastage extra ho sakta hai.</p></article>
          <article className="learn-card glass"><span>03</span><div className="learn-icon"><ArrowDownRight/></div><h3>SELL Estimate</h3><p>Selected deduction ke baad transparent estimate. Actual purity test matter karta hai.</p></article>
        </div>
        <div className="promise glass"><div><span className="eyebrow">REALRATE PROMISE</span><h3>Rate dikhana hi nahi — rate samjhana.</h3><p>Source, GST aur assumptions ko hidden rakhne ke bajay screen par clear rakha gaya hai.</p></div><div className="checks"><span><CheckCircle2/>Clear benchmark</span><span><CheckCircle2/>Transparent GST</span><span><CheckCircle2/>Adjustable sell deduction</span><span><CheckCircle2/>Mobile-first calculations</span></div></div>
      </section>

      <section id="faq" className="section-pad content-section faq-section">
        <div className="section-head"><div><span className="eyebrow">COMMON QUESTIONS</span><h2>Gold rate ko simple rakho.</h2></div></div>
        <div className="faq-list">{faqs.map(([q,a],i)=><button key={q} className={`faq-item glass ${faqOpen===i?'open':''}`} onClick={()=>setFaqOpen(faqOpen===i?-1:i)}><span className="faq-q">{q}<ChevronDown size={18}/></span><span className="faq-a">{a}</span></button>)}</div>
      </section>

      <section className="section-pad cta-section"><div className="cta-box glass"><div><span className="eyebrow">READY TO CALCULATE?</span><h2>Weight dalo. Value samjho.</h2><p>Free calculator. No login. No hidden formula.</p></div><a className="btn primary" href="#calculator">Open calculator <ArrowRight size={18}/></a></div></section>
    </main>

    <footer className="footer section-pad"><div className="footer-brand"><a className="brand" href="#top"><span className="brand-mark">R</span><span><b>RealRate</b><small>Gold & Silver</small></span></a><p>Aaj ka gold rate, selling price aur jewellery calculations — India ke liye simple aur transparent.</p></div><div className="footer-links"><div><b>Today rates</b><a href="/24k-gold-rate/">24K gold rate today</a><a href="/22k-gold-rate/">22K / 916 gold rate today</a><a href="/18k-gold-rate/">18K gold rate today</a><a href="/silver-rate/">Silver rate today</a><a href="/gold-selling-price-today/">Gold selling price today</a></div><div><b>Calculators</b><a href="/gold-calculator/">Gold calculator</a><a href="/jewellery-bill-calculator/">Jewellery bill calculator</a><a href="/old-gold-calculator/">Old gold calculator</a><a href="/gold-purity-calculator/">Gold purity calculator</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} RealRate</span><span>For informational estimates only · Verify final trade price locally.</span></div></footer>
  </div>;
}
