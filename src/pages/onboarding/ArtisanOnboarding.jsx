import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { artisanService } from '../../services/artisanService.js';
import { CRAFTS, STATES } from '../../data/mockData.js';

const TOTAL = 3;

const inp = {
  padding: '0.75rem 1rem',
  borderRadius: 10,
  border: '1.5px solid var(--color-border)',
  background: 'var(--color-surface)',
  fontSize: '1rem',
  color: 'var(--color-text)',
  minHeight: 48,
  width: '100%',
  boxSizing: 'border-box',
  appearance: 'none',
};
const lab = { fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' };

function initials(n = '') {
  return n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export function ArtisanOnboarding() {
  const navigate = useNavigate();
  const { currentUser, selectRole } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasOtherCraft, setHasOtherCraft] = useState(false);
  const [customCraft, setCustomCraft] = useState('');
  const [form, setForm] = useState({
    name: currentUser?.displayName || '',
    village: '',
    state: '',
    crafts: [],
    experience: '',
    bio: '',
    language: language || 'en',
  });

  const set = (f) => (e) => {
    setError('');
    setForm((p) => ({ ...p, [f]: e.target.value }));
  };

  const toggleCraft = (c) => {
    setError('');
    setForm((p) => ({
      ...p,
      crafts: p.crafts.includes(c)
        ? p.crafts.filter((x) => x !== c)
        : [...p.crafts, c],
    }));
  };

  const toggleOtherCraft = () => {
    setError('');
    setHasOtherCraft((prev) => !prev);
  };

  const handleLanguageChange = (code) => {
    setForm((p) => ({ ...p, language: code }));
    changeLanguage(code);
  };

  const getEffectiveCrafts = () => {
    const list = [...form.crafts];
    if (hasOtherCraft && customCraft.trim() && !list.includes(customCraft.trim())) {
      list.push(customCraft.trim());
    }
    return list;
  };

  const validate = () => {
    if (step === 1) {
      if (!form.name.trim()) return t('auth.errNameRequired');
      if (!form.village.trim()) return t('onboarding.errCityRequired');
      if (!form.state) return t('onboarding.errStateRequired');
    }
    if (step === 2) {
      if (hasOtherCraft && !customCraft.trim()) {
        return t('onboarding.errOtherCraftRequired');
      }
      const totalCrafts = getEffectiveCrafts();
      if (totalCrafts.length === 0) {
        return t('onboarding.errCraftsRequired');
      }
    }
    return null;
  };

  const next = () => {
    const e = validate();
    if (e) {
      setError(e);
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, TOTAL));
  };
  const back = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const finish = async () => {
    const effectiveCrafts = getEffectiveCrafts();
    setLoading(true);
    try {
      await selectRole('artisan');
      const artisanId = currentUser?.uid || 'a1';
      await artisanService.updateArtisan(artisanId, {
        name: form.name.trim() || currentUser?.displayName || 'Artisan Partner',
        village: form.village.trim() || 'Madhubani',
        city: form.village.trim() || 'Madhubani',
        state: form.state || 'Bihar',
        craft: effectiveCrafts[0] || 'Madhubani Painting',
        crafts: effectiveCrafts,
        experience: form.experience ? `${form.experience} years` : '5 years',
        bio: form.bio.trim() || `Traditional artisan practicing ${effectiveCrafts.join(', ')}.`,
      });
      changeLanguage(form.language);
      navigate('/artisan');
    } catch {
      navigate('/artisan');
    } finally {
      setLoading(false);
    }
  };

  const pct = (step / TOTAL) * 100;

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
      }}
    >
      {/* TopBar */}
      <div
        style={{
          width: '100%',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '1rem 1.5rem',
          boxSizing: 'border-box',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
            fontWeight: 600,
            textAlign: 'center',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          {t('onboarding.stepIndicator')
            .replace('{step}', String(step))
            .replace('{total}', String(TOTAL))}
        </p>
        <div
          style={{
            height: 6,
            background: 'var(--color-border)',
            borderRadius: 99,
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={TOTAL}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'var(--color-primary)',
              borderRadius: 99,
              transition: 'width 0.35s ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 520,
          padding: '2rem 1.5rem 1rem',
          boxSizing: 'border-box',
          flex: 1,
        }}
      >
        {/* Step 1: About You */}
        {step === 1 && (
          <>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: 4,
              }}
            >
              {t('onboarding.aboutYou')}
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-muted)',
                marginBottom: 24,
              }}
            >
              {t('onboarding.aboutYouSubtitle')}
            </p>

            {/* Avatar */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  background: 'var(--color-primary-light)',
                  border: '3px solid var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                }}
              >
                {initials(form.name) || '?'}
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                {t('onboarding.profilePicOptional')}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginBottom: 16,
              }}
            >
              <label htmlFor="ao-name" style={lab}>
                {t('onboarding.fullName')}{' '}
                <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                id="ao-name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={set('name')}
                placeholder={t('onboarding.fullName')}
                style={inp}
              />
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginBottom: 16,
              }}
            >
              <label htmlFor="ao-village" style={lab}>
                {t('onboarding.village')}{' '}
                <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                id="ao-village"
                type="text"
                autoComplete="address-line1"
                value={form.village}
                onChange={set('village')}
                placeholder="e.g. Madhubani"
                style={inp}
              />
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginBottom: 16,
              }}
            >
              <label htmlFor="ao-state" style={lab}>
                {t('onboarding.state')}{' '}
                <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <select
                id="ao-state"
                value={form.state}
                onChange={set('state')}
                style={inp}
              >
                <option value="">{t('onboarding.selectState')}</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginBottom: 16,
              }}
            >
              <label htmlFor="ao-exp" style={lab}>
                {t('onboarding.experience')}
              </label>
              <select
                id="ao-exp"
                value={form.experience}
                onChange={set('experience')}
                style={inp}
              >
                <option value="">{t('onboarding.selectExperience')}</option>
                {[
                  'Less than 1 year',
                  '1–3 years',
                  '3–5 years',
                  '5–10 years',
                  '10–20 years',
                  'More than 20 years',
                ].map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginBottom: 16,
              }}
            >
              <label htmlFor="ao-bio" style={lab}>
                {t('onboarding.bio')}{' '}
                <span
                  style={{
                    fontWeight: 400,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {t('onboarding.bioOptional')}
                </span>
              </label>
              <textarea
                id="ao-bio"
                value={form.bio}
                onChange={set('bio')}
                rows={3}
                placeholder="e.g. I have been practicing Madhubani painting for 15 years..."
                style={{
                  ...inp,
                  minHeight: 96,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </>
        )}

        {/* Step 2: Select Crafts */}
        {step === 2 && (
          <>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: 4,
              }}
            >
              {t('onboarding.craftsTitle')}
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-muted)',
                marginBottom: 24,
              }}
            >
              {t('onboarding.craftsSubtitle')}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {CRAFTS.map((c) => {
                const sel = form.crafts.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCraft(c)}
                    aria-pressed={sel}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 99,
                      border: `1.5px solid ${
                        sel ? 'var(--color-primary)' : 'var(--color-border)'
                      }`,
                      background: sel
                        ? 'var(--color-primary-light)'
                        : 'var(--color-surface)',
                      color: sel
                        ? 'var(--color-primary)'
                        : 'var(--color-text-muted)',
                      fontWeight: sel ? 700 : 500,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      minHeight: 36,
                      transition: 'all 0.12s',
                    }}
                  >
                    {c}
                  </button>
                );
              })}

              {/* Others / Anya Option */}
              <button
                type="button"
                onClick={toggleOtherCraft}
                aria-pressed={hasOtherCraft}
                style={{
                  padding: '8px 16px',
                  borderRadius: 99,
                  border: `1.5px solid ${
                    hasOtherCraft ? 'var(--color-primary)' : 'var(--color-border)'
                  }`,
                  background: hasOtherCraft
                    ? 'var(--color-primary-light)'
                    : 'var(--color-surface)',
                  color: hasOtherCraft
                    ? 'var(--color-primary)'
                    : 'var(--color-text-muted)',
                  fontWeight: hasOtherCraft ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  minHeight: 36,
                  transition: 'all 0.12s',
                }}
              >
                + {t('onboarding.craftOther')}
              </button>
            </div>

            {hasOtherCraft && (
              <div style={{ marginTop: 14 }}>
                <label
                  htmlFor="ao-other-craft"
                  style={{ ...lab, display: 'block', marginBottom: 6 }}
                >
                  {t('onboarding.craftOther')} <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  id="ao-other-craft"
                  type="text"
                  value={customCraft}
                  onChange={(e) => {
                    setError('');
                    setCustomCraft(e.target.value);
                  }}
                  placeholder={t('onboarding.otherCraftPlaceholder')}
                  style={inp}
                  autoFocus
                />
              </div>
            )}

            {getEffectiveCrafts().length > 0 && (
              <p
                style={{
                  marginTop: 20,
                  fontSize: '0.875rem',
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                }}
              >
                ✓ {getEffectiveCrafts().length}{' '}
                {t('onboarding.craftsSelected').replace(
                  '{s}',
                  getEffectiveCrafts().length !== 1 ? 's' : ''
                )}
              </p>
            )}
          </>
        )}

        {/* Step 3: Language & Summary */}
        {step === 3 && (
          <>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: 4,
              }}
            >
              {t('onboarding.almostDone')}
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-muted)',
                marginBottom: 24,
              }}
            >
              {t('onboarding.reviewSubtitle')}
            </p>

            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 14,
                padding: '1rem 1.5rem',
                marginBottom: 24,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {[
                {
                  label: t('onboarding.fullName'),
                  value: form.name || '—',
                },
                {
                  label: t('onboarding.location'),
                  value:
                    [form.village, form.state].filter(Boolean).join(', ') || '—',
                },
                {
                  label: t('onboarding.experience'),
                  value: form.experience || '—',
                },
                {
                  label: t('onboarding.crafts'),
                  value:
                    getEffectiveCrafts().length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {getEffectiveCrafts().map((craft) => (
                          <span
                            key={craft}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 9px',
                              borderRadius: 6,
                              background: 'var(--color-primary-light)',
                              color: 'var(--color-primary)',
                              fontSize: '0.825rem',
                              fontWeight: 600,
                            }}
                          >
                            {craft}
                          </span>
                        ))}
                      </div>
                    ) : (
                      '—'
                    ),
                },
              ].map((item, idx, arr) => (
                <div
                  key={item.label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(130px, 160px) 1fr',
                    gap: 16,
                    padding: '11px 0',
                    borderBottom:
                      idx < arr.length - 1
                        ? '1px solid var(--color-border-subtle, #F0EAE1)'
                        : 'none',
                    alignItems: 'center',
                    fontSize: '0.925rem',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {item.label}
                  </span>
                  <div
                    style={{
                      color: 'var(--color-text-muted)',
                      fontWeight: 500,
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                }}
              >
                {t('onboarding.prefLanguage')}
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  ['en', 'English'],
                  ['hi', 'हिंदी (Hindi)'],
                ].map(([code, label]) => (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code)}
                    aria-pressed={form.language === code}
                    style={{
                      flex: 1,
                      padding: '0.875rem',
                      borderRadius: 12,
                      border: `2px solid ${
                        form.language === code
                          ? 'var(--color-primary)'
                          : 'var(--color-border)'
                      }`,
                      background:
                        form.language === code
                          ? 'var(--color-primary-light)'
                          : 'var(--color-surface)',
                      color:
                        form.language === code
                          ? 'var(--color-primary)'
                          : 'var(--color-text-muted)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: 52,
                      fontSize: '1rem',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {error && (
          <div
            role="alert"
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 10,
              padding: '0.75rem',
              fontSize: '0.875rem',
              color: '#B91C1C',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Nav */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          width: '100%',
          maxWidth: 520,
          padding: '0 1.5rem 2rem',
          boxSizing: 'border-box',
        }}
      >
        {step > 1 && (
          <button
            onClick={back}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: 'transparent',
              color: 'var(--color-primary)',
              border: '2px solid var(--color-primary)',
              borderRadius: 12,
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 52,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <ChevronLeft size={18} /> {t('onboarding.back')}
          </button>
        )}
        <button
          onClick={step === TOTAL ? finish : next}
          disabled={loading}
          style={{
            flex: 2,
            padding: '0.875rem',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: '1rem',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            minHeight: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <Loader2
                size={18}
                style={{ animation: 'spin 0.8s linear infinite' }}
              />{' '}
              {t('onboarding.finishing')}
            </>
          ) : step === TOTAL ? (
            t('onboarding.startSelling')
          ) : (
            t('onboarding.next')
          )}
        </button>
      </div>
    </main>
  );
}
