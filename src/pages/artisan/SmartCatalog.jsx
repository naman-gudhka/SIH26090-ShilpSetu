import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { mockAIGeneratedCatalog, CRAFTS, CATEGORIES } from '../../data/mockData.js';
import { catalogGenerationService } from '../../services/catalogGenerationService.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const inp = {
  width:'100%', padding:'0.75rem 1rem', borderRadius:'var(--radius-md)',
  border:'1.5px solid var(--color-border)', background:'var(--color-bg)',
  fontSize:'var(--text-base)', color:'var(--color-text)', boxSizing:'border-box',
};
const lab = { fontSize:'var(--text-sm)', fontWeight:'var(--weight-semibold)', color:'var(--color-text)', marginBottom:6, display:'block' };

function getInitialCatalog() {
  try {
    const raw = sessionStorage.getItem('ss_catalog_generated');
    if (raw) {
      const cat = JSON.parse(raw);
      return {
        title: cat.productName || cat.title || '',
        titleHindi: cat.productNameHindi || cat.titleHindi || '',
        description: cat.description || '',
        descriptionHindi: cat.descriptionHindi || '',
        craft: cat.craft || 'Kutch Embroidery',
        category: cat.category || 'Accessories',
        materials: Array.isArray(cat.materials) ? cat.materials.join(', ') : (cat.materials || ''),
        dimensions: cat.dimensions || '',
        weight: cat.weight || '',
        colors: Array.isArray(cat.colors) ? cat.colors.join(', ') : (cat.colors || ''),
      };
    }
  } catch {
    // Fallback below
  }
  return {
    title: mockAIGeneratedCatalog.productName,
    titleHindi: mockAIGeneratedCatalog.productNameHindi,
    description: mockAIGeneratedCatalog.description,
    descriptionHindi: mockAIGeneratedCatalog.descriptionHindi,
    craft: mockAIGeneratedCatalog.craft,
    category: mockAIGeneratedCatalog.category,
    materials: mockAIGeneratedCatalog.materials.join(', '),
    dimensions: mockAIGeneratedCatalog.dimensions,
    weight: mockAIGeneratedCatalog.weight,
    colors: mockAIGeneratedCatalog.colors.join(', '),
  };
}

export function SmartCatalog() {
  const navigate = useNavigate();
  const { t, isHindi } = useLanguage();
  const [form, setForm] = useState(getInitialCatalog);
  const [error, setError] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  const set = f => e => {
    if (error) setError('');
    setForm(p => ({ ...p, [f]: e.target.value }));
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError('');
    try {
      const res = await catalogGenerationService.generateCatalog({
        craft: form.craft,
        category: form.category,
      });
      if (res?.catalog) {
        const cat = res.catalog;
        setForm({
          title: cat.productName || form.title,
          titleHindi: cat.productNameHindi || form.titleHindi,
          description: cat.description || form.description,
          descriptionHindi: cat.descriptionHindi || form.descriptionHindi,
          craft: cat.craft || form.craft,
          category: cat.category || form.category,
          materials: Array.isArray(cat.materials) ? cat.materials.join(', ') : form.materials,
          dimensions: cat.dimensions || form.dimensions,
          weight: cat.weight || form.weight,
          colors: Array.isArray(cat.colors) ? cat.colors.join(', ') : form.colors,
        });
      }
    } catch {
      setError(isHindi ? 'AI सुझाव रिफ्रेश नहीं हो सके। आप मैन्युअल रूप से संपादन जारी रख सकते हैं।' : 'Could not refresh AI suggestions. You can continue editing manually.');
    } finally {
      setRegenerating(false);
    }
  };

  const proceed = () => {
    if (!form.title.trim()) {
      setError(isHindi ? 'कृपया उत्पाद का नाम दर्ज करें।' : 'Please provide a product title in English.');
      return;
    }
    sessionStorage.setItem('ss_catalog', JSON.stringify(form));
    navigate('/artisan/products/pricing');
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-bg)', paddingBottom:100 }}>
      {/* Banner */}
      <div style={{ background:'var(--color-primary-light)', borderBottom:'1px solid var(--color-border-teal)', padding:'var(--space-3) var(--space-5)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'var(--space-2)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)' }}>
          <Sparkles size={16} color="var(--color-primary)" />
          <p style={{ fontSize:'var(--text-sm)', color:'var(--color-primary)', fontWeight:'var(--weight-medium)', margin:0 }}>
            {t('artisan.aiBannerDraft')}
          </p>
        </div>
        <button type="button" onClick={handleRegenerate} disabled={regenerating}
          style={{ background:'transparent', border:'1px solid var(--color-primary)', borderRadius:'var(--radius-md)', padding:'4px 10px', fontSize:'var(--text-xs)', color:'var(--color-primary)', cursor:regenerating?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:4, fontWeight:600 }}>
          {regenerating ? <Loader2 size={12} style={{ animation:'spin 0.8s linear infinite' }} /> : <RefreshCw size={12} />}
          {t('artisan.regenerate')}
        </button>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'var(--space-5)' }}>
        <h1 style={{ fontSize:'var(--text-2xl)', fontWeight:'var(--weight-bold)', color:'var(--color-text)', marginBottom:'var(--space-1)' }}>
          {t('artisan.reviewListing')}
        </h1>
        <p style={{ fontSize:'var(--text-sm)', color:'var(--color-text-muted)', marginBottom:'var(--space-6)' }}>
          {t('artisan.reviewListingDesc')}
        </p>

        {error && (
          <div role="alert" style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'0.75rem 1rem', fontSize:'0.875rem', color:'#B91C1C', marginBottom:'var(--space-4)' }}>
            {error}
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom:'var(--space-4)' }}>
          <label style={lab}>{t('artisan.productNameEn')} <span style={{ color:'var(--color-error)' }}>*</span></label>
          <input value={form.title} onChange={set('title')} style={inp} placeholder="e.g. Handcrafted Kutch Bag" />
        </div>
        <div style={{ marginBottom:'var(--space-4)' }}>
          <label style={lab}>{t('artisan.productNameHi')}</label>
          <input value={form.titleHindi} onChange={set('titleHindi')} style={{ ...inp, fontFamily:'inherit' }} dir="auto" placeholder="उत्पाद का नाम" />
        </div>

        {/* Description */}
        <div style={{ marginBottom:'var(--space-4)' }}>
          <label style={lab}>{t('artisan.descriptionEn')} <span style={{ color:'var(--color-error)' }}>*</span></label>
          <textarea value={form.description} onChange={set('description')} rows={4} style={{ ...inp, resize:'vertical', fontFamily:'inherit' }} />
        </div>
        <div style={{ marginBottom:'var(--space-4)' }}>
          <label style={lab}>{t('artisan.descriptionHi')}</label>
          <textarea value={form.descriptionHindi} onChange={set('descriptionHindi')} rows={3} dir="auto" style={{ ...inp, resize:'vertical', fontFamily:'inherit' }} />
        </div>

        {/* Craft + Category */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)', marginBottom:'var(--space-4)' }}>
          <div>
            <label style={lab}>{t('artisan.craftType')}</label>
            <select value={form.craft} onChange={set('craft')} style={{ ...inp, appearance:'none' }}>
              {CRAFTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lab}>{t('artisan.category')}</label>
            <select value={form.category} onChange={set('category')} style={{ ...inp, appearance:'none' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Details */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)', marginBottom:'var(--space-4)' }}>
          <div>
            <label style={lab}>{t('artisan.dimensions')}</label>
            <input value={form.dimensions} onChange={set('dimensions')} placeholder="e.g. 30cm × 35cm" style={inp} />
          </div>
          <div>
            <label style={lab}>{t('artisan.weight')}</label>
            <input value={form.weight} onChange={set('weight')} placeholder="e.g. 350g" style={inp} />
          </div>
        </div>

        <div style={{ marginBottom:'var(--space-4)' }}>
          <label style={lab}>{t('artisan.materials')}</label>
          <input value={form.materials} onChange={set('materials')} placeholder="e.g. Cotton, Silk thread, Mirror pieces" style={inp} />
        </div>
        <div style={{ marginBottom:'var(--space-6)' }}>
          <label style={lab}>{t('artisan.colors')}</label>
          <input value={form.colors} onChange={set('colors')} placeholder="e.g. Red, Gold, Multicolor" style={inp} />
        </div>

        <button onClick={proceed}
          style={{ width:'100%', padding:'var(--space-4)', background:'var(--color-primary)', color:'#fff', border:'none', borderRadius:'var(--radius-lg)', fontSize:'var(--text-base)', fontWeight:'var(--weight-semibold)', cursor:'pointer', minHeight:52, display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--space-2)' }}>
          {t('artisan.continueToPricing')} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
