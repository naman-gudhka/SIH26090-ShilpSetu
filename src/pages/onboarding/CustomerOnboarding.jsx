import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LanguageSelector } from '../../components/shared/LanguageSelector.jsx';
import { STATES } from '../../data/mockData.js';

const inp = {
  padding:'0.75rem 1rem', borderRadius:10, border:'1.5px solid var(--color-border)',
  background:'var(--color-surface)', fontSize:'1rem', color:'var(--color-text)',
  minHeight:48, width:'100%', boxSizing:'border-box',
};

const INTERESTS = ['Paintings & Art','Textiles & Fabric','Pottery & Ceramics','Jewellery','Home Decor','Woodcraft','Metalwork','Embroidery','Accessories','Organic & Natural'];

export function CustomerOnboarding() {
  const navigate = useNavigate();
  const { currentUser, selectRole } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: currentUser?.displayName || '',
    city: '',
    state: '',
    interests: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = f => e => {
    setForm(p=>({...p,[f]:e.target.value}));
    if (error) setError('');
  };

  const toggleInterest = i => {
    setForm(p=>({ ...p, interests: p.interests.includes(i)?p.interests.filter(x=>x!==i):[...p.interests,i] }));
  };

  const finish = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(t('custOnboarding.errNameRequired'));
      return;
    }
    if (!form.city.trim()) {
      setError(t('custOnboarding.errCityRequired'));
      return;
    }
    if (!form.state) {
      setError(t('custOnboarding.errStateRequired'));
      return;
    }
    setLoading(true);
    try {
      await selectRole('buyer');
      localStorage.setItem('shilpsetu_buyer_profile', JSON.stringify(form));
      navigate('/buyer');
    } catch {
      navigate('/buyer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight:'100dvh', background:'var(--color-bg)', display:'flex', flexDirection:'column', alignItems:'center', padding:'2rem 1.25rem', boxSizing:'border-box' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', maxWidth:480, marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <img src="/icons/icon-192.png" alt="ShilpSetu" width={36} height={36} style={{ borderRadius:10 }} />
          <span style={{ fontSize:'1.125rem', fontWeight:800, color:'var(--color-primary)' }}>ShilpSetu</span>
        </div>
        <LanguageSelector compact />
      </div>

      <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:16, boxShadow:'0 4px 24px rgba(15,118,110,0.08)', padding:'2rem 1.75rem', width:'100%', maxWidth:480 }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--color-text)', marginBottom:6 }}>{t('custOnboarding.title')}</h1>
        <p style={{ fontSize:'0.9rem', color:'var(--color-text-muted)', marginBottom:24 }}>{t('custOnboarding.subtitle')}</p>

        <form onSubmit={finish} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label htmlFor="co-name" style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--color-text)' }}>
              {t('custOnboarding.yourName')} <span style={{ color:'var(--color-error)' }}>*</span>
            </label>
            <input id="co-name" type="text" value={form.name} onChange={set('name')} placeholder={t('custOnboarding.namePlaceholder')} style={inp} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label htmlFor="co-city" style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--color-text)' }}>
                {t('custOnboarding.city')} <span style={{ color:'var(--color-error)' }}>*</span>
              </label>
              <input id="co-city" type="text" value={form.city} onChange={set('city')} placeholder={t('custOnboarding.cityPlaceholder')} style={inp} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label htmlFor="co-state" style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--color-text)' }}>
                {t('custOnboarding.state')} <span style={{ color:'var(--color-error)' }}>*</span>
              </label>
              <select id="co-state" value={form.state} onChange={set('state')} style={{ ...inp, appearance:'none' }}>
                <option value="">{t('custOnboarding.selectState')}</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <p style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--color-text)', margin:0 }}>{t('custOnboarding.interests')}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {INTERESTS.map(i => {
                const sel = form.interests.includes(i);
                return (
                  <button key={i} type="button" onClick={() => toggleInterest(i)} aria-pressed={sel}
                    style={{ padding:'6px 14px', borderRadius:99, border:`1.5px solid ${sel?'var(--color-primary)':'var(--color-border)'}`, background:sel?'var(--color-primary-light)':'transparent', color:sel?'var(--color-primary)':'var(--color-text-muted)', fontWeight:sel?700:500, fontSize:'0.8rem', cursor:'pointer', minHeight:34 }}>
                    {i}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div role="alert" style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'0.75rem 1rem', fontSize:'0.875rem', color:'#B91C1C' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:'0.875rem', background:'var(--color-primary)', color:'#fff', border:'none', borderRadius:12, fontSize:'1rem', fontWeight:700, cursor:loading?'not-allowed':'pointer', minHeight:52, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:loading?0.7:1, marginTop:8 }}>
            {loading ? <><Loader2 size={18} style={{ animation:'spin 0.8s linear infinite' }}/> {t('custOnboarding.settingUp')}</> : t('custOnboarding.startExploring')}
          </button>
        </form>
      </div>
    </main>
  );
}
