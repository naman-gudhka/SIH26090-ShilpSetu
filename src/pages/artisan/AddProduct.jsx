import { useNavigate } from 'react-router-dom';
import { Camera, Mic } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function AddProduct() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'var(--space-6)' }}>
      <div style={{ maxWidth:480, width:'100%', textAlign:'center' }}>
        <h1 style={{ fontSize:'var(--text-2xl)', fontWeight:'var(--weight-bold)', color:'var(--color-text)', marginBottom:'var(--space-2)' }}>
          {t('artisan.addNewProduct')}
        </h1>
        <p style={{ fontSize:'var(--text-base)', color:'var(--color-text-muted)', marginBottom:'var(--space-8)', lineHeight:1.6 }}>
          {t('artisan.howToDescribe')}
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
          <button onClick={() => navigate('/artisan/products/photo')} style={{
            background:'var(--color-surface)', border:'2px solid var(--color-primary)',
            borderRadius:'var(--radius-xl)', padding:'var(--space-8) var(--space-5)',
            cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'var(--space-4)',
            transition:'all var(--transition-base)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--color-primary-light)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='var(--color-surface)'; e.currentTarget.style.transform='translateY(0)'; }}
          >
            <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--color-primary-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Camera size={36} color="var(--color-primary)" />
            </div>
            <div>
              <p style={{ fontSize:'var(--text-lg)', fontWeight:'var(--weight-semibold)', color:'var(--color-primary)', marginBottom:4 }}>
                {t('artisan.usePhotos')}
              </p>
              <p style={{ fontSize:'var(--text-sm)', color:'var(--color-text-muted)', lineHeight:1.5 }}>
                {t('artisan.usePhotosDesc')}
              </p>
            </div>
          </button>

          <button onClick={() => navigate('/artisan/products/voice')} style={{
            background:'var(--color-surface)', border:'2px solid var(--color-secondary)',
            borderRadius:'var(--radius-xl)', padding:'var(--space-8) var(--space-5)',
            cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'var(--space-4)',
            transition:'all var(--transition-base)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--color-secondary-light)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='var(--color-surface)'; e.currentTarget.style.transform='translateY(0)'; }}
          >
            <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--color-secondary-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Mic size={36} color="var(--color-secondary)" />
            </div>
            <div>
              <p style={{ fontSize:'var(--text-lg)', fontWeight:'var(--weight-semibold)', color:'var(--color-secondary)', marginBottom:4 }}>
                {t('artisan.useVoice')}
              </p>
              <p style={{ fontSize:'var(--text-sm)', color:'var(--color-text-muted)', lineHeight:1.5 }}>
                {t('artisan.useVoiceDesc')}
              </p>
            </div>
          </button>
        </div>

        <p style={{ marginTop:'var(--space-6)', fontSize:'var(--text-sm)', color:'var(--color-text-muted)' }}>
          {t('artisan.productFeaturesBadges')}
        </p>
      </div>
    </div>
  );
}
