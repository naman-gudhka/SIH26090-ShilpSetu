import { useState } from 'react';
import { Search, CheckCircle, X, MapPin, Sparkles, Send, RefreshCw, Filter, MessageCircle } from 'lucide-react';
import { b2bMatches as initialMatches, CRAFTS, STATES } from '../../data/mockData.js';
import { matchingService } from '../../services/matchingService.js';
import { enquiryService } from '../../services/enquiryService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

const AVATAR_COLORS = [
  ['#CCFBF1', '#0F766E'],
  ['#FED7C3', '#C2542E'],
  ['#DBEAFE', '#1D4ED8'],
  ['#DCFCE7', '#2D7A3E'],
];

function Toast({ message, onDismiss }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-success)',
        color: 'var(--color-text)',
        borderRadius: 12,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: 'var(--shadow-lg)',
        maxWidth: '92vw',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
      }}
    >
      <CheckCircle size={18} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', marginLeft: 8 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

function MatchCard({ match, onEnquiry, requirement }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const idx = match.artisanName.charCodeAt(0) % AVATAR_COLORS.length;
  const [avatarBg, avatarFg] = AVATAR_COLORS[idx];
  const barColor = match.matchPercentage >= 85 ? 'var(--color-success)' : match.matchPercentage >= 65 ? 'var(--color-primary)' : 'var(--color-warning)';

  const handleEnquiry = async () => {
    setSending(true);
    try {
      await matchingService.sendEnquiry(match.id, requirement, {
        name: currentUser?.displayName || 'Enterprise Buyer',
        email: currentUser?.email || 'buyer@shilpsetu.in',
      });

      await enquiryService.createEnquiry({
        name: currentUser?.displayName || 'Enterprise Buyer',
        contact: currentUser?.email || 'buyer@shilpsetu.in',
        artisanName: match.artisanName,
        productTitle: `B2B Order: ${requirement.quantity || 150} units of ${match.craft}`,
        quantity: requirement.quantity || 150,
        message: requirement.description || `Inquiring about bulk capacity for ${match.craft}. Target budget: ₹${requirement.budget || 1200}/unit.`,
        type: 'b2b',
      });

      setSent(true);
      onEnquiry(t('b2b.enquirySentToast'));
    } catch {
      onEnquiry(t('pwa.syncFailed'));
    } finally {
      setSending(false);
    }
  };

  const getB2BWhatsAppUrl = () => {
    const phone = '919876543210';
    const artisanName = match.artisanName || 'Artisan';
    const craft = match.craft || requirement?.craft || 'Craft piece';
    const quantity = requirement?.quantity || 150;
    const budget = requirement?.budget || 1200;
    const deadline = requirement?.deadline || 'Upcoming quarter';
    const text = `Hello ${artisanName}! I am interested in a bulk order of ${quantity} units of ${craft}. My target budget is ₹${budget}/unit and my required timeline is ${deadline}. Please share availability, pricing and catalog details.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <article
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar */}
      <div
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: avatarBg,
          border: `2px solid ${avatarFg}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          fontWeight: 800,
          color: avatarFg,
          flexShrink: 0,
        }}
      >
        {match.artisanName[0]}
      </div>

      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 4 }}>
              {match.artisanName}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--color-surface-teal)', color: 'var(--color-primary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                {match.craft}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                <MapPin size={11} />
                {match.region}
              </span>
              {match.verified && (
                <span style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                  ✓ {t('b2b.verifiedArtisan')}
                </span>
              )}
            </div>
          </div>

          {/* Match % pill */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: barColor }}>
              {match.matchPercentage}%
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--weight-medium)' }}>
              {t('b2b.matchScore')}
            </div>
          </div>
        </div>

        {/* Match bar */}
        <div
          style={{ height: 8, background: 'var(--color-border-light)', borderRadius: 999, overflow: 'hidden', marginBottom: 12 }}
          role="progressbar"
          aria-valuenow={match.matchPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${match.matchPercentage}% ${t('b2b.matchScore')}`}
        >
          <div style={{ height: '100%', width: `${match.matchPercentage}%`, background: barColor, borderRadius: 999 }} />
        </div>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 12 }}>
          <strong style={{ color: 'var(--color-text)' }}>{t('b2b.capacity')}</strong> {match.capacity}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {match.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-surface-warm)',
                color: 'var(--color-text)',
                fontSize: 'var(--text-xs)',
                border: '1px solid var(--color-border)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleEnquiry}
            disabled={sent || sending}
            style={{
              minHeight: 38,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: sent ? '1px solid var(--color-success)' : 'none',
              background: sent ? 'var(--color-success-bg)' : 'var(--color-primary)',
              color: sent ? 'var(--color-success)' : '#fff',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              cursor: sent || sending ? 'not-allowed' : 'pointer',
            }}
          >
            {sent ? (
              <>
                <CheckCircle size={15} /> {t('b2b.enquirySent')}
              </>
            ) : sending ? (
              <>
                <RefreshCw size={14} className="spin" /> {t('b2b.sending')}
              </>
            ) : (
              <>
                <Send size={14} /> {t('b2b.sendBulkEnquiry')}
              </>
            )}
          </button>

          <a
            href={getB2BWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              minHeight: 38,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#25D366',
              color: '#FFFFFF',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              textDecoration: 'none',
            }}
          >
            <MessageCircle size={15} />
            {t('b2b.discussWhatsApp')}
          </a>
        </div>
      </div>
    </article>
  );
}

export function B2BMatching() {
  const { t } = useLanguage();
  const [toast, setToast] = useState('');
  const [craftFilter, setCraftFilter] = useState('');
  const [minMatch, setMinMatch] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const [requirement, setRequirement] = useState({
    description: '200 handwoven cotton dupattas with natural indigo dye for corporate festive gifting',
    quantity: 200,
    budget: 1500,
    craft: 'Kutch Embroidery',
    region: 'Gujarat',
    deadline: '2026-11-15',
  });

  const [matches, setMatches] = useState(initialMatches);

  const handleRequirementSubmit = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const res = await matchingService.findMatches(requirement);
      if (res && res.matches) {
        setMatches(res.matches);
        setToast(t('b2b.completedToast'));
      }
    } catch {
      setToast(t('b2b.searchError'));
    } finally {
      setIsSearching(false);
    }
  };

  const filtered = matches.filter((m) => {
    const matchCraft = !craftFilter || m.craft === craftFilter;
    const matchPct = m.matchPercentage >= minMatch;
    return matchCraft && matchPct;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 80 }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 'var(--space-5)' }}>
        <header style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-surface-teal)', color: 'var(--color-primary)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>
            <Sparkles size={13} />
            {t('b2b.aiSourcing')}
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginBottom: 4 }}>
            {t('b2b.bulkTitle')}
          </h1>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
            {t('b2b.bulkSubtitle')}
          </p>
        </header>

        {/* Sourcing Form Card */}
        <section
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderTop: '3px solid var(--color-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            marginBottom: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>
            {t('b2b.requirementDetails')}
          </h2>

          <form onSubmit={handleRequirementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label htmlFor="req-desc" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 6 }}>
                {t('b2b.lookingFor')}
              </label>
              <textarea
                id="req-desc"
                rows={2}
                value={requirement.description}
                onChange={(e) => setRequirement({ ...requirement, description: e.target.value })}
                placeholder={t('b2b.lookingForPlaceholder')}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 'var(--text-sm)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  resize: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
              <div>
                <label htmlFor="req-qty" style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 4 }}>
                  {t('b2b.unitsRequired')}
                </label>
                <input
                  id="req-qty"
                  type="number"
                  min="10"
                  value={requirement.quantity}
                  onChange={(e) => setRequirement({ ...requirement, quantity: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--text-sm)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>

              <div>
                <label htmlFor="req-craft" style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 4 }}>
                  {t('b2b.preferredCraft')}
                </label>
                <select
                  id="req-craft"
                  value={requirement.craft}
                  onChange={(e) => setRequirement({ ...requirement, craft: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--text-sm)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                >
                  {CRAFTS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="req-region" style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 4 }}>
                  {t('b2b.preferredRegion')}
                </label>
                <select
                  id="req-region"
                  value={requirement.region}
                  onChange={(e) => setRequirement({ ...requirement, region: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--text-sm)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="req-budget" style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginBottom: 4 }}>
                  {t('b2b.budgetPerUnit')}
                </label>
                <input
                  id="req-budget"
                  type="number"
                  value={requirement.budget}
                  onChange={(e) => setRequirement({ ...requirement, budget: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--text-sm)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button
                type="submit"
                disabled={isSearching}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: 'var(--space-3) var(--space-6)',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  opacity: isSearching ? 0.7 : 1,
                }}
              >
                {isSearching ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    {t('b2b.matchingArtisans')}
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    {t('b2b.runAiMatching')}
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Filter bar */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Filter size={15} style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={craftFilter}
              onChange={(e) => setCraftFilter(e.target.value)}
              aria-label={t('b2b.allMatchedCrafts')}
              style={{
                padding: '6px 10px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
            >
              <option value="">{t('b2b.allMatchedCrafts')}</option>
              {CRAFTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            {t('b2b.minMatch')}:
            <input
              type="range"
              min={0}
              max={90}
              step={10}
              value={minMatch}
              onChange={(e) => setMinMatch(Number(e.target.value))}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)', minWidth: 32 }}>
              {minMatch}%
            </span>
          </label>
        </div>

        {/* Matches results */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <Search size={40} strokeWidth={1.5} style={{ marginBottom: 'var(--space-3)', opacity: 0.5 }} />
            <p style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-lg)', color: 'var(--color-text)' }}>
              {t('b2b.noMatches')}
            </p>
            <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
              {t('b2b.noMatchesDesc')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {filtered.map((match) => (
              <MatchCard key={match.id} match={match} onEnquiry={setToast} requirement={requirement} />
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast('')} />}
    </div>
  );
}
