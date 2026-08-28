import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { inr } from '../lib/rates';

export default function RateCard({ metal, label, unit, base, buy, sell, accent = 'gold', sellDeduction }) {
  return (
    <article className={`glass rate-card compact-rate-card ${accent}`}>
      <div className="compact-top">
        <div>
          <span className="metal-label">{metal}</span>
          <h3>{label}</h3>
        </div>
        <div className="market-mini">
          <small>MARKET / BASE</small>
          <strong>{inr(base)}</strong>
          <span>{unit}</span>
        </div>
      </div>

      <div className="buy-sell-dashboard">
        <div className="price-action buy-action">
          <div className="action-label">
            <span className="action-icon"><ArrowUpRight size={18}/></span>
            <div><b>BUY</b><small>Aap kharidoge</small></div>
          </div>
          <strong>{inr(buy)}</strong>
          <span className="price-note">3% GST included*</span>
        </div>

        <div className="price-action sell-action">
          <div className="action-label">
            <span className="action-icon"><ArrowDownRight size={18}/></span>
            <div><b>SELL</b><small>Aap bechoge</small></div>
          </div>
          <strong>{inr(sell)}</strong>
          <span className="price-note">{sellDeduction}% deduction estimate</span>
        </div>
      </div>
    </article>
  );
}
