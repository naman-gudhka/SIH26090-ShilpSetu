import { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Edit2,
  Check,
  Loader2,
  User,
  Palette,
  ShieldCheck,
  LogOut,
  Sparkles,
  MapPin,
  Clock,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { artisanService } from '../../services/artisanService.js';
import { authService } from '../../services/authService.js';
import { CRAFTS, STATES } from '../../data/mockData.js';

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--radius-lg)',
  border: '1.5px solid var(--color-border)',
  background: 'var(--color-bg)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text)',
  boxSizing: 'border-box',
  minHeight: 46,
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: 'inherit',
};

const EXPERIENCE_OPTIONS = [
  'Less than 1 year',
  '1–3 years',
  '3–5 years',
  '5–10 years',
  '10–20 years',
  'More than 20 years',
];

const EXPERIENCE_OPTIONS_HI = [
  '1 वर्ष से कम',
  '1–3 वर्ष',
  '3–5 वर्ष',
  '5–10 वर्ष',
  '10–20 वर्ष',
  '20 वर्ष से अधिक',
];

export function ArtisanProfile() {
  const { currentUser, logout } = useAuth();
  const { t, isHindi } = useLanguage();
  const fileInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  const [form, setForm] = useState({
    name: currentUser?.displayName || 'Meera Devi',
    village: 'Madhubani',
    state: 'Bihar',
    craft: 'Madhubani Painting',
    bio: 'Meera Devi comes from a family of Madhubani painters spanning four generations.',
    experience: '22 years',
  });

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        const artisanId = currentUser?.uid || 'a1';
        let artisan = await artisanService.getArtisanById(artisanId);
        if (!artisan && artisanId !== 'a1') {
          artisan = await artisanService.updateArtisan(artisanId, {
            name: currentUser?.displayName || 'Artisan Partner',
            verified: false,
          });
        } else if (!artisan && artisanId === 'a1') {
          artisan = await artisanService.getArtisanById('a1');
        }
        if (isMounted && artisan) {
          const isUserVerified = artisanId === 'a1' ? Boolean(artisan.verified) : Boolean(artisan.verified === true);
          setIsVerified(isUserVerified);
          setForm({
            name:
              (artisanId === 'a1'
                ? artisan.name
                : (currentUser?.displayName || artisan.name)) || 'Artisan Partner',
            village: artisan.village || 'Madhubani',
            state: artisan.state || 'Bihar',
            craft: artisan.craft || 'Madhubani Painting',
            bio: artisan.bio || '',
            experience: artisan.experience || '5 years',
          });
          if (artisan.photo) setAvatarUrl(artisan.photo);
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadProfile();

    const handleArtisansChanged = (e) => {
      const { id, artisan, updates } = e.detail || {};
      const currentArtisanId = currentUser?.uid || 'a1';
      if (id === currentArtisanId || (currentArtisanId === 'a1' && id === 'a1')) {
        const verifiedVal = artisan?.verified ?? updates?.verified;
        if (verifiedVal !== undefined && isMounted) {
          setIsVerified(Boolean(verifiedVal));
        }
      }
    };
    window.addEventListener('shilpsetu_artisans_changed', handleArtisansChanged);

    return () => {
      isMounted = false;
      window.removeEventListener('shilpsetu_artisans_changed', handleArtisansChanged);
    };
  }, [currentUser]);

  const setField = (field) => (e) => {
    if (error) setError('');
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError(t('artisan.errSelectImage'));
        return;
      }
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError(t('artisan.errEnterFullName'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const artisanId = currentUser?.uid || 'a1';
      await artisanService.updateArtisan(artisanId, {
        ...form,
        photo: avatarUrl,
      });
      await authService.updateProfile(form.name.trim(), avatarUrl);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(t('artisan.errUpdateProfile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-6))',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-5)' }}>
        {/* Profile Header Hero Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #092C28 0%, #134E48 60%, #9A3412 100%)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--space-6) var(--space-5)',
            marginBottom: 'var(--space-5)',
            boxShadow: '0 4px 20px rgba(10, 40, 36, 0.18)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle pattern */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.07,
              backgroundImage: 'radial-gradient(circle, #FFE4D6 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 'var(--space-3)',
            }}
          >
            {/* Avatar with Camera Overlay */}
            <div style={{ position: 'relative' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFE4D6, #CCFBF1)',
                  border: '4px solid rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  overflow: 'hidden',
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={form.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  form.name?.[0] || 'A'
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label={t('artisan.tapToUpdatePhoto')}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'var(--color-secondary)',
                  border: '2.5px solid #FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  transition: 'transform 0.15s',
                }}
              >
                <Camera size={15} color="#fff" />
              </button>
            </div>

            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span
                  style={{
                    background: isVerified
                      ? 'rgba(16, 185, 129, 0.25)'
                      : 'rgba(251, 191, 36, 0.25)',
                    border: isVerified
                      ? '1px solid rgba(52, 211, 153, 0.6)'
                      : '1px solid rgba(251, 191, 36, 0.5)',
                    color: isVerified ? '#A7F3D0' : '#FDE68A',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {isVerified ? <Sparkles size={11} /> : <Clock size={11} />}
                  {isVerified
                    ? t('artisan.verifiedBadge')
                    : t('artisan.unverifiedBadge')}
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--weight-bold)',
                  color: '#FFFFFF',
                  margin: '0 0 4px',
                }}
              >
                {form.name}
              </h1>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFFFFF',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {form.craft}
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <MapPin size={12} color="#FCD34D" />
                  {form.village}
                  {form.state ? `, ${form.state}` : ''}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', margin: '2px 0 0' }}>
              {t('artisan.tapToUpdatePhoto')}
            </p>
          </div>
        </div>

        {/* Action / Edit Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--color-text)',
                margin: 0,
              }}
            >
              {editing
                ? (isHindi ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile Details')
                : (isHindi ? 'प्रोफ़ाइल विवरण' : 'Profile Overview')}
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              {editing
                ? (isHindi ? 'फ़ॉर्म भरकर नीचे परिवर्तन सहेजें' : 'Update your craft details below')
                : (isHindi ? 'सार्वजनिक स्टोर पर प्रदर्शित जानकारी' : 'Public information visible to buyers')}
            </p>
          </div>

          {editing ? (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => setEditing(false)}
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                }}
              >
                {t('actions.cancel')}
              </button>

              <button
                type="button"
                onClick={save}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-bold)',
                  opacity: saving ? 0.7 : 1,
                  boxShadow: '0 2px 6px rgba(15, 118, 110, 0.25)',
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                    {t('artisan.saving')}
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    {t('artisan.saveChanges')}
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: 'var(--color-surface)',
                color: 'var(--color-primary)',
                border: '1.5px solid var(--color-primary)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semibold)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <Edit2 size={13} />
              {t('artisan.editProfile')}
            </button>
          )}
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 'var(--radius-lg)',
              padding: '0.75rem 1rem',
              fontSize: 'var(--text-sm)',
              color: '#B91C1C',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {saved && (
          <div
            style={{
              background: 'var(--color-success-bg)',
              border: '1px solid var(--color-success)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-success)',
              fontWeight: 'var(--weight-medium)',
              textAlign: 'center',
            }}
          >
            ✓ {t('artisan.profileSaved')}
          </div>
        )}

        {/* Card 1: Personal Information */}
        <section
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-4)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 'var(--space-4)',
              paddingBottom: 'var(--space-3)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}
            >
              <User size={16} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--color-text)',
                  margin: 0,
                }}
              >
                {t('artisan.personalInfo')}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--color-text)',
                  marginBottom: 6,
                  display: 'block',
                }}
              >
                {t('artisan.fullName')} *
              </label>
              {editing ? (
                <input
                  type="text"
                  value={form.name}
                  onChange={setField('name')}
                  style={inputStyle}
                  placeholder={isHindi ? 'उदा. मीरा देवी' : 'e.g. Meera Devi'}
                />
              ) : (
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    margin: 0,
                    padding: '8px 12px',
                    background: 'var(--color-bg)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {form.name || '—'}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-3)',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text)',
                    marginBottom: 6,
                    display: 'block',
                  }}
                >
                  {t('artisan.villageTown')}
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={form.village}
                    onChange={setField('village')}
                    style={inputStyle}
                    placeholder={isHindi ? 'गाँव का नाम' : 'Village or town'}
                  />
                ) : (
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text)',
                      margin: 0,
                      padding: '8px 12px',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    {form.village || '—'}
                  </p>
                )}
              </div>

              <div>
                <label
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text)',
                    marginBottom: 6,
                    display: 'block',
                  }}
                >
                  {t('artisan.state')}
                </label>
                {editing ? (
                  <select
                    value={form.state}
                    onChange={setField('state')}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                  >
                    {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text)',
                      margin: 0,
                      padding: '8px 12px',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    {form.state || '—'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Card 2: Craft Heritage & Story */}
        <section
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-4)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 'var(--space-4)',
              paddingBottom: 'var(--space-3)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-secondary)',
              }}
            >
              <Palette size={16} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--color-text)',
                  margin: 0,
                }}
              >
                {t('artisan.craftHeritage')}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-3)',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text)',
                    marginBottom: 6,
                    display: 'block',
                  }}
                >
                  {t('artisan.primaryCraft')}
                </label>
                {editing ? (
                  <select
                    value={form.craft}
                    onChange={setField('craft')}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                  >
                    {CRAFTS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      margin: 0,
                      padding: '8px 12px',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    {form.craft || '—'}
                  </p>
                )}
              </div>

              <div>
                <label
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text)',
                    marginBottom: 6,
                    display: 'block',
                  }}
                >
                  {t('artisan.yearsExperience')}
                </label>
                {editing ? (
                  <select
                    value={form.experience}
                    onChange={setField('experience')}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                  >
                    {EXPERIENCE_OPTIONS.map((opt, i) => (
                      <option key={opt} value={opt}>
                        {isHindi ? EXPERIENCE_OPTIONS_HI[i] : opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text)',
                      margin: 0,
                      padding: '8px 12px',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Clock size={13} color="var(--color-text-muted)" />
                    {form.experience || '—'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--color-text)',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <FileText size={13} color="var(--color-text-muted)" />
                {t('artisan.bioAndStory')}
              </label>
              {editing ? (
                <textarea
                  value={form.bio}
                  onChange={setField('bio')}
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: 100,
                    lineHeight: 1.6,
                  }}
                  placeholder={
                    isHindi
                      ? 'अपनी कला परंपरा, पीढ़ियों के अनुभव और अपने शिल्प की खासियत के बारे में बताएं...'
                      : 'Tell buyers about your family heritage, traditional techniques, and craft inspiration...'
                  }
                />
              ) : (
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.75,
                    margin: 0,
                    padding: '12px 14px',
                    background: 'var(--color-bg)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {form.bio ||
                    (isHindi
                      ? 'अपनी शिल्प यात्रा और परंपरा के बारे में यहाँ लिखें।'
                      : 'Share your craft journey and tradition with buyers.')}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Card 3: Account & Session */}
        <section
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 'var(--space-4)',
              paddingBottom: 'var(--space-3)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--color-text)',
                  margin: 0,
                }}
              >
                {t('artisan.accountDetails')}
              </h3>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                {t('artisan.signedInAs')}
              </p>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  margin: '2px 0 0',
                }}
              >
                {currentUser?.email || 'artisan@shilpsetu.in'}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: 'var(--color-error-bg)',
                color: 'var(--color-error)',
                border: '1.5px solid var(--color-error)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semibold)',
                transition: 'background 0.2s',
              }}
            >
              <LogOut size={13} />
              {t('artisan.signOut')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
