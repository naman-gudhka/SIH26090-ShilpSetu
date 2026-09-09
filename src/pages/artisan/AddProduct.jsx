import { useNavigate } from 'react-router-dom';
import { Camera, Mic, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function AddProduct() {
  const navigate = useNavigate();
  const { t, isHindi } = useLanguage();

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'var(--space-6)' }}>
      <div style={{ maxWidth:480, width:'100%', textAlign:'center' }}>
        <h1 style={{ fontSize:'var(--text-2xl)', fontWeight:'var(--weight-bold)', color:'var(--color-text)', marginBottom:'var(--space-2)' }}>
          {t('artisan.addNewProduct')}
        </h1>
        <p style={{ fontSize:'var(--text-base)', color:'var(--color-text-muted)', marginBottom:'var(--space-8)', lineHeight:1.6 }}>
          {isHindi
            ? 'पहले अपने शिल्प की फ़ोटो लें, फिर अपनी कहानी बताएं — AI बाकी काम करेगा।'
            : 'First take a photo of your craft, then tell us your story — AI does the rest.'}
        </p>

        {/* Sequential flow steps preview */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--space-3)', marginBottom:'var(--space-8)' }}>
          {[
            { icon: Camera, label: isHindi ? 'फ़ोटो' : 'Photo', color: 'var(--color-primary)' },
            { icon: null,   label: '→',     color: 'var(--color-text-muted)' },
            { icon: Mic,    label: isHindi ? 'कहानी' : 'Your Story', color: 'var(--color-secondary)' },
            { icon: null,   label: '→',     color: 'var(--color-text-muted)' },
            { icon: null,   label: isHindi ? 'AI ✨' : 'AI ✨', color: 'var(--color-primary)' },
          ].map((item, idx) => (
            <div key={idx} style={{ display:'flex', alignItems:'center', gap: 'var(--space-1)', flexDirection:'column' }}>
              {item.icon && (
                <div style={{ width:40, height:40, borderRadius:'50%', background:item.color+'18', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:4 }}>
                  <item.icon size={20} color={item.color} />
                </div>
              )}
              <span style={{ fontSize:item.icon ? 'var(--text-xs)' : 'var(--text-sm)', color:item.color, fontWeight: item.icon ? 600 : 400 }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Single primary CTA */}
        <button
          onClick={() => navigate('/artisan/products/photo')}
          style={{
            width: '100%',
            background: 'var(--color-primary)',
            border: 'none',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-3)',
            color: '#fff',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-semibold)',
            boxShadow: '0 6px 20px rgba(15,118,110,0.3)',
            transition: 'all var(--transition-base)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--color-primary-dark)'; e.currentTarget.style.transform='translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--color-primary)'; e.currentTarget.style.transform='translateY(0)'; }}
        >
          <Camera size={22} />
          {isHindi ? 'फ़ोटो से शुरू करें' : 'Start with Photo'} <ArrowRight size={18} />
        </button>

        <p style={{ marginTop:'var(--space-6)', fontSize:'var(--text-sm)', color:'var(--color-text-muted)' }}>
          {t('artisan.productFeaturesBadges')}
        </p>
      </div>
    </div>
  );
}

