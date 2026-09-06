import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, Loader2 } from 'lucide-react';
import { pricingSuggestionService } from '../../services/pricingSuggestionService.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function PricingAssistant() {
  const navigate = useNavigate();
  const { t, isHindi } = useLanguage();

  const [catalogData] = useState(() => {
    try {
      const stored = sessionStorage.getItem('ss_catalog');
      return stored ? JSON.parse(stored) : { craft: 'Kutch Embroidery', title: 'Handcrafted Item' };
    } catch {
      return { craft: 'Kutch Embroidery', title: 'Handcrafted Item' };
    }
  });

  const [pricingInfo, setPricingInfo] = useState({
    min: 1500,
    max: 2800,
    recommended: 2200,
    explanation: 'Based on craft type, materials, and regional benchmark data.',
  });
  const [price, setPrice] = useState(2200);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchPricing() {
      try {
        const res = await pricingSuggestionService.suggestPrice(catalogData);
        if (isMounted && res.success) {
          const minVal = res.suggestedMin || 1500;
          const maxVal = res.suggestedMax || 2800;
          const rec = res.recommended || 2200;
          setPricingInfo({
            min: minVal,
            max: maxVal,
            recommended: rec,
            explanation: res.explanation || 'Market range estimate for similar handmade crafts.',
          });
          setPrice(rec);
        }
      } catch {
        // Keep default estimates
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPricing();
    return () => { isMounted = false; };
  }, [catalogData]);

  const { min, max, recommended } = pricingInfo;

  const proceed = () => {
    if (!price || Number(price) <= 0) {
      setError(isHindi ? 'कृपया ₹0 से अधिक का मान्य मूल्य दर्ज करें।' : 'Please enter a valid price greater than ₹0.');
      return;
    }
    sessionStorage.setItem('ss_price', price);
    navigate('/artisan/products/preview');
  };

  const zone = price < min ? 'low' : price > max ? 'high' : 'good';
  const zoneCfg = {
    low:  { color:'var(--color-warning)', label: t('artisan.lowRange'), tip: t('artisan.lowTip') },
    good: { color:'var(--color-success)', label: t('artisan.fairRange'), tip: t('artisan.fairTip') },
    high: { color:'var(--color-error)',   label: t('artisan.highRange'), tip: t('artisan.highTip') },
  };
  const { color, label, tip } = zoneCfg[zone];

  // Range bar percentage
  const rangeWidth = max - min || 1000;
  const pct = Math.max(0, Math.min(100, ((price - min) / rangeWidth) * 100));

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-bg)', paddingBottom:100 }}>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'var(--space-6) var(--space-5)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', marginBottom:'var(--space-2)' }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--color-primary-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <TrendingUp size={24} color="var(--color-primary)" />
          </div>
          <div>
            <h1 style={{ fontSize:'var(--text-2xl)', fontWeight:'var(--weight-bold)', color:'var(--color-text)', marginBottom:2 }}>
              {t('artisan.pricingAssistant')}
            </h1>
            <p style={{ fontSize:'var(--text-sm)', color:'var(--color-text-muted)' }}>
              {t('artisan.pricingSubtitle')}
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'0.75rem 1rem', fontSize:'0.875rem', color:'#B91C1C', marginTop:'var(--space-3)' }}>
            {error}
          </div>
        )}

        {/* AI Price Range Card */}
        <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-xl)', padding:'var(--space-6)', marginBottom:'var(--space-6)', marginTop:'var(--space-4)' }}>
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--space-8)', gap:8, color:'var(--color-text-muted)' }}>
              <Loader2 size={20} style={{ animation:'spin 0.8s linear infinite' }} />
              <span>{isHindi ? 'सुझाए गए मूल्य की गणना हो रही है…' : 'Calculating recommended price range…'}</span>
            </div>
          ) : (
            <>
              <p style={{ fontSize:'var(--text-sm)', color:'var(--color-text-muted)', fontWeight:'var(--weight-medium)', marginBottom:'var(--space-4)' }}>
                {t('artisan.demoMarketRange')} {catalogData.craft || (isHindi ? 'हस्तशिल्प' : 'Handicrafts')}
              </p>

              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'var(--space-2)' }}>
                <span style={{ fontSize:'var(--text-sm)', color:'var(--color-text-muted)' }}>₹{min.toLocaleString('en-IN')} <span style={{ fontSize:'var(--text-xs)' }}>({isHindi ? 'कम' : 'low'})</span></span>
                <span style={{ fontSize:'var(--text-sm)', color:'var(--color-primary)', fontWeight:'var(--weight-semibold)' }}>₹{recommended.toLocaleString('en-IN')} <span style={{ fontSize:'var(--text-xs)' }}>({isHindi ? 'सुझाया गया' : 'recommended'})</span></span>
                <span style={{ fontSize:'var(--text-sm)', color:'var(--color-text-muted)' }}>₹{max.toLocaleString('en-IN')} <span style={{ fontSize:'var(--text-xs)' }}>({isHindi ? 'अधिक' : 'high'})</span></span>
              </div>

              {/* Range bar with price indicator */}
              <div style={{ position:'relative', marginBottom:'var(--space-5)' }}>
                <div style={{ height:10, background:'linear-gradient(to right,#FEF3C7,var(--color-primary-light),var(--color-primary))', borderRadius:99 }} />
                <div style={{ position:'absolute', top:-4, left:`${pct}%`, transform:'translateX(-50%)', transition:'left 0.2s' }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'var(--color-primary)', border:'3px solid #fff', boxShadow:'0 2px 6px rgba(0,0,0,0.2)' }} />
                </div>
              </div>

              {/* Price input */}
              <div style={{ textAlign:'center' }}>
                <label htmlFor="price-input" style={{ fontSize:'var(--text-sm)', color:'var(--color-text-muted)', display:'block', marginBottom:'var(--space-2)' }}>
                  {t('artisan.yourPrice')}
                </label>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'var(--space-2)', border:`2px solid ${color}`, borderRadius:'var(--radius-lg)', padding:'var(--space-2) var(--space-4)', background:'var(--color-bg)' }}>
                  <span style={{ fontSize:'var(--text-xl)', fontWeight:'var(--weight-bold)', color }}>₹</span>
                  <input id="price-input" type="number" value={price} onChange={e => { setError(''); setPrice(Number(e.target.value)); }} min={0}
                    style={{ border:'none', background:'transparent', fontSize:'var(--text-3xl)', fontWeight:'var(--weight-bold)', color, width:140, textAlign:'center', outline:'none' }} />
                </div>
              </div>

              {/* Range slider */}
              <div style={{ marginTop:'var(--space-4)' }}>
                <input type="range" min={Math.max(100, Math.round(min * 0.5))} max={Math.round(max * 1.5)} value={price} onChange={e => { setError(''); setPrice(Number(e.target.value)); }}
                  style={{ width:'100%', accentColor:'var(--color-primary)', height:6 }} />
              </div>
            </>
          )}
        </div>

        {/* Zone indicator */}
        <div style={{ background:'var(--color-surface)', border:`1.5px solid ${color}`, borderRadius:'var(--radius-lg)', padding:'var(--space-4)', marginBottom:'var(--space-5)' }}>
          <p style={{ fontSize:'var(--text-base)', fontWeight:'var(--weight-semibold)', color, marginBottom:4 }}>{label}</p>
          <p style={{ fontSize:'var(--text-sm)', color:'var(--color-text-muted)', lineHeight:1.5 }}>{tip}</p>
        </div>

        {/* Quick set buttons */}
        <div style={{ display:'flex', gap:'var(--space-2)', marginBottom:'var(--space-6)', flexWrap:'wrap' }}>
          {[[t('artisan.setMin'), min],[t('artisan.setRec'), recommended],[t('artisan.setMax'), max]].map(([lbl, val]) => (
            <button key={lbl} onClick={() => { setError(''); setPrice(val); }}
              style={{ flex:1, minWidth:120, padding:'var(--space-2) var(--space-3)', background:price===val?'var(--color-primary-light)':'var(--color-surface)', border:`1.5px solid ${price===val?'var(--color-primary)':'var(--color-border)'}`, borderRadius:'var(--radius-md)', cursor:'pointer', fontSize:'var(--text-xs)', fontWeight:'var(--weight-medium)', color:price===val?'var(--color-primary)':'var(--color-text-muted)' }}>
              {lbl}<br/>
              <span style={{ fontSize:'var(--text-sm)', fontWeight:'var(--weight-bold)' }}>₹{Number(val).toLocaleString('en-IN')}</span>
            </button>
          ))}
        </div>

        <button onClick={proceed}
          style={{ width:'100%', padding:'var(--space-4)', background:'var(--color-primary)', color:'#fff', border:'none', borderRadius:'var(--radius-lg)', fontSize:'var(--text-base)', fontWeight:'var(--weight-semibold)', cursor:'pointer', minHeight:52, display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--space-2)' }}>
          {t('artisan.previewListing')} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
