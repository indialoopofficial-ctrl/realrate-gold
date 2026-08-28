import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calculator, ChevronRight, Clock3, Gem, Info, Menu, RefreshCw,
  ShieldCheck, Sparkles, X,
} from 'lucide-react';
import RateCard from './components/RateCard.jsx';
import {
  DEFAULT_SELL_DEDUCTION, GST, fetchRates, goldRateForPurity, inr,
} from './lib/rates';

const percentage = (value) => `${(value * 100).toFixed(1).replace('.0', '')}%`;

export default function App() {
  const [rates, setRates] = useState(null);
  const [metal, setMetal] = useState('gold');
  const [purity, setPurity] = useState('22K');
  const [weight, setWeight] = useState('10');
  const [sellDeduction, setSellDeduction] = useState(DEFAULT_SELL_DEDUCTION * 100);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadRates = useCallback(async () => {
    setRefreshing(true);
    try {
      setRates(await fetchRates());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadRates(); }, [loadRates]);

  const deduction = Math.min(Math.max(Number(sellDeduction) || 0, 0), 10) / 100;

  const goldRows = useMemo(() => {
    if (!rates) return [];
    return ['24K', '22K', '18K'].map((label) => {
      const base = goldRateForPurity(rates, label);
      return { label, base, buy: base * (1 + GST), sell: base * (1 - deduction) };
    });
  }, [rates, deduction]);

  const calc = useMemo(() => {
    if (!rates) return null;
    const grams = Math.min(Math.max(Number(weight) || 0, 0), 100000);
    const basePerGram = metal === 'gold'
      ? goldRateForPurity(rates, purity) / 10
      : rates.silver999PerKg / 1000;
    return {
      base: basePerGram * grams,
      buy: basePerGram * grams * (1 + GST),
      sell: basePerGram * grams * (1 - deduction),
    };
  }, [rates, metal, purity, weight, deduction]);

  const updated = rates
    ? new Date(rates.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Loading…';

  const sourceState = rates?.status === 'live' ? 'Live benchmark' : rates?.status === 'cached' ? 'Cached benchmark' : 'Saved benchmark';
  const heroBase = rates?.gold999Per10g || 0;
  const heroBuy = heroBase * (1 + GST);
  const heroSell = heroBase * (1 - deduction);

  return (
    <div className="app-shell">
      <div className="aurora a1"/><div className="aurora a2"/><div className="aurora a3"/>

      <header className="topbar glass">
        <a className="brand" href="#top"><span className="brand-mark">R</span><span>RealRate</span></a>
        <nav className="desktop-nav">
          <a href="#rates">Rates</a><a href="#calculator">Calculator</a><a href="#explain">How it works</a>
        </nav>
        <div className="header-actions">
          <button className="refresh-btn" onClick={loadRates} disabled={refreshing} aria-label="Refresh rates"><RefreshCw size={17} className={refreshing ? 'spin' : ''}/></button>
          <button className="menu-btn" onClick={() => setMobileOpen(v => !v)} aria-label="Open menu">{mobileOpen ? <X/> : <Menu/>}</button>
        </div>
      </header>

      {mobileOpen && <div className="mobile-menu glass">
        <a href="#rates" onClick={() => setMobileOpen(false)}>Rates</a>
        <a href="#calculator" onClick={() => setMobileOpen(false)}>Calculator</a>
        <a href="#explain" onClick={() => setMobileOpen(false)}>How it works</a>
      </div>}

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="pill"><Sparkles size={15}/> India’s clearer precious-metal rate experience</div>
            <h1>Gold ka <span>real rate</span>,<br/>without the confusion.</h1>
            <p>Benchmark rate, 3% GST ke baad BUY rate, aur realistic SELL estimate — ek hi screen par simple language me.</p>
            <div className="hero-actions">
              <a className="primary" href="#rates">Today’s rates <ChevronRight size={18}/></a>
              <a className="secondary" href="#calculator">Calculate value</a>
            </div>
            <div className="trust-row">
              <span><Clock3 size={15}/> {updated}</span>
              <span><ShieldCheck size={15}/> {sourceState}: {rates?.source || 'Loading…'}</span>
            </div>
          </div>

          <div className="hero-visual glass hero-rate-panel">
            <div className="hero-rate-head">
              <div><span className="live-dot"><i/> TODAY'S RATE</span><h3>24K Gold</h3><p>999 purity • per 10 grams</p></div>
              <div className="hero-gold-orb"><Gem size={25}/></div>
            </div>
            <div className="hero-market"><span>MARKET / BASE</span><strong>{rates ? inr(heroBase) : '—'}</strong></div>
            <div className="hero-buy-sell">
              <div className="hero-price hero-buy"><span>YOU BUY</span><small>Aap kharidoge</small><strong>{rates ? inr(heroBuy) : '—'}</strong><em>3% GST included*</em></div>
              <div className="hero-price hero-sell"><span>YOU SELL</span><small>Aap bechoge</small><strong>{rates ? inr(heroSell) : '—'}</strong><em>{percentage(deduction)} deduction estimate</em></div>
            </div>
            <div className="hero-answer"><Info size={15}/><span>BUY aur SELL ek rate nahi hote. Jewellery purchase me making/wastage extra ho sakte hain.</span></div>
          </div>
        </section>

        <section id="rates" className="section">
          <div className="section-head">
            <div><span className="eyebrow">TODAY’S CLEAR VIEW</span><h2>Buy kya hai. Sell kya hai. Clear.</h2></div>
            <div className="segmented"><button className={metal === 'gold' ? 'active' : ''} onClick={() => setMetal('gold')}>Gold</button><button className={metal === 'silver' ? 'active' : ''} onClick={() => setMetal('silver')}>Silver</button></div>
          </div>
          {!rates ? <div className="glass loading">Loading latest rates…</div> : metal === 'gold' ? (
            <div className="cards-grid">{goldRows.map(r => <RateCard key={r.label} metal="GOLD" label={r.label} unit="per 10g" base={r.base} buy={r.buy} sell={r.sell} sellDeduction={percentage(deduction)}/>)}</div>
          ) : (
            <div className="cards-grid one"><RateCard metal="SILVER" label="999 Fine" unit="per kg" base={rates.silver999PerKg} buy={rates.silver999PerKg * (1 + GST)} sell={rates.silver999PerKg * (1 - deduction)} accent="silver" sellDeduction={percentage(deduction)}/></div>
          )}
          <p className="rate-note"><Info size={15}/> *BUY rate shown here is benchmark + 3% GST only. Final jewellery bill can also include making charges, wastage and retailer premium. SELL is an estimate; actual payout depends on purity test and buyer policy.</p>
        </section>

        <section id="calculator" className="section calculator-wrap">
          <div className="section-head"><div><span className="eyebrow">SMART CALCULATOR</span><h2>Kitna pay karoge? Kitna milega?</h2></div></div>
          <div className="calculator glass">
            <div className="calc-controls">
              <label>Metal<div className="segmented full"><button className={metal === 'gold' ? 'active' : ''} onClick={() => setMetal('gold')}>Gold</button><button className={metal === 'silver' ? 'active' : ''} onClick={() => setMetal('silver')}>Silver</button></div></label>
              {metal === 'gold' && <label>Purity<select value={purity} onChange={e => setPurity(e.target.value)}><option>24K</option><option>22K</option><option>18K</option></select></label>}
              <label>Weight (grams)<input inputMode="decimal" type="number" min="0" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} placeholder="10"/></label>
              <label>Estimated sell deduction<div className="deduction-control"><input type="range" min="0" max="5" step="0.25" value={sellDeduction} onChange={e => setSellDeduction(e.target.value)}/><b>{percentage(deduction)}</b></div></label>
              <small className="control-help">Jeweller/refiner deduction universal nahi hota. Is slider ko actual offer ke hisaab se adjust kar sakte ho.</small>
            </div>
            <div className="calc-result">
              <div className="result-icon"><Calculator/></div>
              <span>Benchmark metal value</span><h4>{inr(calc?.base || 0)}</h4>
              <div className="divider"/>
              <span>Approx BUY incl. 3% GST*</span><h3>{inr(calc?.buy || 0)}</h3>
              <div className="divider"/>
              <span>Approx SELL value</span><h4>{inr(calc?.sell || 0)}</h4>
            </div>
          </div>
        </section>

        <section id="explain" className="section explain">
          <div className="section-head"><div><span className="eyebrow">NO MORE CONFUSION</span><h2>3 numbers. 3 different meanings.</h2></div></div>
          <div className="explain-grid">
            <div className="glass explain-card"><span>01</span><h3>Market / Base Rate</h3><p>IBJA-style benchmark metal value before GST, making charges and retailer premiums.</p></div>
            <div className="glass explain-card"><span>02</span><h3>BUY Rate</h3><p>Benchmark + 3% GST. Jewellery bills can still add making, wastage and local premiums.</p></div>
            <div className="glass explain-card"><span>03</span><h3>SELL Estimate</h3><p>A transparent estimate after your chosen deduction. Final payout depends on tested purity and buyer policy.</p></div>
          </div>
        </section>
        <section id="popular-pages" className="section explain">
          <div className="section-head"><div><span className="eyebrow">EXPLORE REALRATE</span><h2>Popular gold & silver tools</h2></div></div>
          <div className="explain-grid">
            <a className="glass explain-card" href="/24k-gold-rate/"><span>24K</span><h3>24K Gold Rate</h3><p>999 purity benchmark, GST buy estimate and sell estimate.</p></a>
            <a className="glass explain-card" href="/22k-gold-rate/"><span>22K</span><h3>22K Gold Rate</h3><p>916 purity rate with clear buy and sell values.</p></a>
            <a className="glass explain-card" href="/18k-gold-rate/"><span>18K</span><h3>18K Gold Rate</h3><p>750 purity benchmark and transparent pricing.</p></a>
            <a className="glass explain-card" href="/silver-rate/"><span>999</span><h3>Silver Rate</h3><p>Fine silver benchmark per kilogram.</p></a>
            <a className="glass explain-card" href="/gold-calculator/"><span>CALC</span><h3>Gold Calculator</h3><p>Calculate value by purity, weight, GST and deduction.</p></a>
          </div>
        </section>
      </main>

      <footer>
        <div><div className="brand"><span className="brand-mark">R</span><span>RealRate</span></div><p>Built to make gold & silver pricing easier to understand.</p></div>
        <a href="https://www.ibjarates.com/" target="_blank" rel="noreferrer">Benchmark source: IBJA ↗</a>
      </footer>
    </div>
  );
}
