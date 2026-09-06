import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';

const TEAL = ['#0F766E','#2DD4BF','#0F766E','#2DD4BF','#0F766E','#2DD4BF','#0F766E'];
const TERRA = ['#C2542E','#F4A27A','#C2542E','#F4A27A','#C2542E','#F4A27A','#C2542E'];

function Dots() {
  return (
    <div aria-hidden="true" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, marginBottom:28 }}>
      {[TEAL, TERRA].map((row, ri) => (
        <div key={ri} style={{ display:'flex', gap:8 }}>
          {row.map((c, i) => (
            <div key={i} style={{
              width:10, height:10, borderRadius: i%2===0?'50%':3,
              background:c, opacity:0.7, transform: i%2===0?'rotate(0)':'rotate(45deg)',
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Welcome() {
  const navigate = useNavigate();
  const { language, changeLanguage, t } = useLanguage();

  return (
    <main style={{
      minHeight:'100dvh', background:'var(--color-bg)',
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'space-between', padding:'2rem 1.5rem 1.5rem', boxSizing:'border-box',
    }}>
      {/* Logo */}
      <header style={{ display:'flex', alignItems:'center', gap:12 }}>
        <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="ShilpSetu" width={56} height={56} style={{ borderRadius: 16 }} />
        <span style={{ fontSize:'1.75rem', fontWeight:800, color:'var(--color-primary)', letterSpacing:'-0.5px' }}>
          ShilpSetu
        </span>
      </header>

      {/* Hero */}
      <section style={{ textAlign:'center', maxWidth:420 }}>
        <h1 style={{
          fontSize:'clamp(2.2rem,8vw,3rem)', fontWeight:800, color:'var(--color-text)',
          lineHeight:1.15, marginBottom:'1rem', letterSpacing:'-1px',
        }}>
          {t('welcome.headline')}
        </h1>
        <p style={{ fontSize:'1.05rem', color:'var(--color-text-muted)', lineHeight:1.6, marginBottom:'1.75rem' }}>
          {t('welcome.subheading')}
        </p>
        <Dots />
      </section>

      {/* CTAs */}
      <section style={{ display:'flex', flexDirection:'column', gap:12, width:'100%', maxWidth:420 }}>
        <button onClick={() => navigate('/signup')} style={{
          width:'100%', padding:'1rem', background:'var(--color-primary)', color:'#fff',
          border:'none', borderRadius:12, fontSize:'1rem', fontWeight:700, cursor:'pointer', minHeight:52,
        }}>
          {t('welcome.getStarted')}
        </button>
        <button onClick={() => navigate('/login')} style={{
          width:'100%', padding:'1rem', background:'transparent', color:'var(--color-primary)',
          border:'2px solid var(--color-primary)', borderRadius:12, fontSize:'1rem', fontWeight:600,
          cursor:'pointer', minHeight:52,
        }}>
          {t('welcome.hasAccount')}
        </button>
      </section>

      {/* Bottom */}
      <section style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, width:'100%', maxWidth:420 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.875rem', color:'var(--color-text-muted)' }}>
          <span>{t('welcome.selectLanguage')}</span>
          {['en','hi'].map(lang => (
            <button key={lang} onClick={() => changeLanguage(lang)}
              aria-pressed={language===lang}
              style={{
                padding:'3px 12px', borderRadius:6, minHeight:32,
                border: language===lang ? 'none' : '1px solid var(--color-border)',
                background: language===lang ? 'var(--color-primary)' : 'transparent',
                color: language===lang ? '#fff' : 'var(--color-text-muted)',
                fontWeight: language===lang ? 700 : 400, cursor:'pointer', fontSize:'0.875rem',
              }}
            >
              {lang === 'en' ? 'EN' : 'हिंदी'}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:20, flexWrap:'wrap' }}>
          {[
            ['🏺', t('welcome.artisansCount')],
            ['🌏', t('welcome.statesCount')],
            ['✨', t('welcome.aiPowered')],
          ].map(([icon, label]) => (
            <span key={label} style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.78rem', color:'var(--color-text-muted)', fontWeight:600 }}>
              <span>{icon}</span><span>{label}</span>
            </span>
          ))}
        </div>
        <p style={{ fontSize:'0.78rem', color:'var(--color-text-muted)' }}>{t('welcome.footer')}</p>
      </section>
    </main>
  );
}
