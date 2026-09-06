import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LanguageSelector } from '../../components/shared/LanguageSelector.jsx';

export function VerifyEmail() {
  const { t } = useLanguage();

  return (
    <main style={{ minHeight:'100dvh', background:'var(--color-bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem', boxSizing:'border-box' }}>
      <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:16, boxShadow:'0 4px 24px rgba(15,118,110,0.08)', padding:'2.25rem 1.75rem', width:'100%', maxWidth:400, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <LanguageSelector compact />
        </div>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'#F0FDFA', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
          <MailCheck size={48} color="var(--color-primary)" strokeWidth={1.75} />
        </div>
        <h1 style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--color-text)', marginBottom:12 }}>{t('auth.verifyEmailTitle')}</h1>
        <p style={{ fontSize:'0.9rem', color:'var(--color-text-muted)', lineHeight:1.6, marginBottom:28, maxWidth:320 }}>
          {t('auth.verifyEmailSubtitle')}
        </p>
        <Link to="/login" style={{ fontSize:'0.875rem', color:'var(--color-primary)', fontWeight:600, textDecoration:'none' }}>{t('auth.backToSignIn')}</Link>
      </div>
    </main>
  );
}
