import { useState, useEffect } from 'react';
import { Users, Activity, Package, CheckCircle, MapPin, Clock } from 'lucide-react';
import { artisans, adminStats, adminRegionData, adminCraftData } from '../../data/mockData.js';
import { productService } from '../../services/productService.js';
import { artisanService } from '../../services/artisanService.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

function StatCard({ icon: Icon, label, value, iconColor, iconBg }) {
  return (
    <article style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12, padding:'20px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:16 }}>
      <span aria-hidden="true" style={{ width:48, height:48, borderRadius:10, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={22} color={iconColor} />
      </span>
      <div>
        <p style={{ fontSize:'var(--text-sm)', color:'var(--color-text-muted)', fontWeight:'var(--weight-medium)', marginBottom:2 }}>{label}</p>
        <p style={{ fontSize:'var(--text-2xl)', fontWeight:'var(--weight-bold)', color:'var(--color-text)' }}>{value}</p>
      </div>
    </article>
  );
}

function CSSBarChart({ data, valueKey, labelKey, title }) {
  const [animated, setAnimated] = useState(false);
  const maxVal = Math.max(...data.map(d => d[valueKey]));
  const safeMax = Math.max(maxVal, 1);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  return (
    <section style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12, padding:24, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontSize:'var(--text-lg)', fontWeight:'var(--weight-semibold)', color:'var(--color-text)', marginBottom:16 }}>{title}</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {data.map(row => {
          const pct = (row[valueKey] / safeMax) * 100;
          return (
            <div key={row[labelKey]} style={{ padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize:'var(--text-sm)', color:'var(--color-text)', fontWeight:'var(--weight-semibold)' }}>{row[labelKey]}</span>
                <span style={{ fontSize:'var(--text-sm)', fontWeight:'var(--weight-bold)', color:'var(--color-primary)' }}>{row[valueKey]}</span>
              </div>
              <div style={{ width:'100%', height:8, background:'var(--color-border-light)', borderRadius:999, overflow:'hidden' }}
                role="progressbar" aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={row[valueKey]} aria-label={`${row[labelKey]}: ${row[valueKey]}`}>
                <div style={{ height:'100%', width: animated?`${pct}%`:'0%', background:'linear-gradient(90deg, var(--color-primary) 0%, #14B8A6 100%)', borderRadius:999, transition:'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const STATUS_STYLES = {
  published:  { bg:'var(--color-success-bg)', color:'var(--color-success)' },
  processing: { bg:'var(--color-warning-bg)', color:'var(--color-warning)' },
  draft:      { bg:'var(--color-border-light)', color:'var(--color-text-muted)' },
  pending:    { bg:'var(--color-warning-bg)', color:'var(--color-warning)' },
};

function StatusBadge({ status, label }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:999, fontSize:'var(--text-xs)', fontWeight:'var(--weight-semibold)', background:s.bg, color:s.color, textTransform:'capitalize' }}>{label || status}</span>;
}

export function AdminDashboard() {
  const { t, isHindi } = useLanguage();
  const [productList, setProductList] = useState([]);
  const [artisanList, setArtisanList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      productService.getProducts(),
      artisanService.getArtisans(),
    ]).then(([prods, arts]) => {
      if (isMounted) {
        if (prods) setProductList(prods);
        if (arts) setArtisanList(arts);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const totalArtisans = artisanList.length > 0 ? (adminStats.totalArtisans + Math.max(0, artisanList.length - artisans.length)) : adminStats.totalArtisans;
  const totalProducts = productList.length > 0 ? (adminStats.productsCatalogued + Math.max(0, productList.length - 12)) : adminStats.productsCatalogued;
  const publishedCount = productList.length > 0 ? (adminStats.publishedListings + Math.max(0, productList.filter(p=>p.status==='published').length - 8)) : adminStats.publishedListings;

  const statCards = [
    { label: t('admin.totalArtisans'), value:totalArtisans.toLocaleString('en-IN'), icon:Users, iconColor:'var(--color-primary)', iconBg:'var(--color-primary-light)' },
    { label: t('admin.activeArtisans'), value:adminStats.activeArtisans.toLocaleString('en-IN'), icon:Activity, iconColor:'#2D7A3E', iconBg:'var(--color-success-bg)' },
    { label: t('admin.productsCatalogued'), value:totalProducts.toLocaleString('en-IN'), icon:Package, iconColor:'var(--color-primary)', iconBg:'var(--color-primary-light)' },
    { label: t('admin.publishedListings'), value:publishedCount.toLocaleString('en-IN'), icon:CheckCircle, iconColor:'#2D7A3E', iconBg:'var(--color-success-bg)' },
    { label: t('admin.regions'), value:adminStats.regions.toString(), icon:MapPin, iconColor:'var(--color-secondary)', iconBg:'var(--color-secondary-light)' },
    { label: t('admin.pendingReview'), value:adminStats.pendingReview.toString(), icon:Clock, iconColor:'var(--color-warning)', iconBg:'var(--color-warning-bg)' },
  ];

  const recentArtisans = artisanList.length > 0 ? artisanList.slice(0, 5) : artisans;

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-bg)', padding:'24px 16px 48px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <header style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:28 }}>
          <div>
            <h1 style={{ fontSize:'var(--text-2xl)', fontWeight:'var(--weight-bold)', color:'var(--color-text)', marginBottom:4 }}>{t('admin.programDashboard')}</h1>
            <p style={{ fontSize:'var(--text-sm)', color:'var(--color-text-muted)' }}>{new Date().toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
          </div>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', background:'var(--color-primary-light)', color:'var(--color-primary)', borderRadius:999, fontSize:'var(--text-sm)', fontWeight:'var(--weight-semibold)' }}>{t('admin.shilpSetuAdmin')}</span>
        </header>

        <section aria-label="Key statistics" className="admin-stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%, 200px),1fr))', gap:16, marginBottom:28 }}>
          {statCards.map(card => <StatCard key={card.label} {...card} />)}
        </section>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%, 320px),1fr))', gap:16, marginBottom:28 }}>
          <CSSBarChart data={adminRegionData} valueKey="artisans" labelKey="region" title={t('admin.artisansByRegion')} />
          <CSSBarChart data={adminCraftData} valueKey="count" labelKey="craft" title={t('admin.productsByCraft')} />
        </div>

        <section style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:12, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid var(--color-border)' }}>
            <h2 style={{ fontSize:'var(--text-lg)', fontWeight:'var(--weight-semibold)', color:'var(--color-text)' }}>{t('admin.recentArtisans')}</h2>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'var(--text-sm)' }} aria-label="Recent artisans">
              <thead>
                <tr style={{ background:'var(--color-surface-warm)', borderBottom:'1px solid var(--color-border)' }}>
                  {[t('admin.colName'), t('admin.colCraft'), t('admin.colRegion'), t('admin.colProducts'), t('admin.colStatus')].map(h => (
                    <th key={h} scope="col" style={{ padding:'10px 16px', textAlign:'left', fontWeight:'var(--weight-semibold)', color:'var(--color-text-muted)', fontSize:'var(--text-xs)', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentArtisans.map((a, i) => (
                  <tr key={a.id} style={{ background:i%2===0?'var(--color-surface)':'var(--color-surface-warm)', borderBottom:'1px solid var(--color-border)' }}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems: 'center', gap:10 }}>
                        <span aria-hidden="true" style={{ width:36, height:36, borderRadius:'50%', background:'var(--color-primary-light)', color:'var(--color-primary)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'var(--weight-bold)', fontSize:'var(--text-sm)', flexShrink:0 }}>{a.name[0]}</span>
                        <span style={{ fontWeight:'var(--weight-medium)' }}>{a.name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px', color:'var(--color-text-muted)' }}>{a.craft}</td>
                    <td style={{ padding:'12px 16px', color:'var(--color-text-muted)' }}>{a.state}</td>
                    <td style={{ padding:'12px 16px', fontWeight:'var(--weight-medium)' }}>{a.published}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <StatusBadge
                        status={a.verified?'published':'pending'}
                        label={a.verified ? t('status.published') : t('status.pending')}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
