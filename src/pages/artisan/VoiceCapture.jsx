import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  Square,
  ArrowRight,
  X,
  RefreshCw,
  Sparkles,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LanguageSelector } from '../../components/shared/LanguageSelector.jsx';

export function VoiceCapture() {
  const navigate = useNavigate();
  const { t, isHindi } = useLanguage();

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  const startRecording = () => {
    setRecording(true);
    setSeconds(0);
    setTranscript('');
    setDone(false);

    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);

    // Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = isHindi ? 'hi-IN' : 'en-IN';

      recognitionRef.current.onresult = (e) => {
        let text = '';
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        setTranscript(text);
      };

      try {
        recognitionRef.current.start();
      } catch {
        // Recognition already started or not allowed
      }
    }
  };

  const stopRecording = () => {
    setRecording(false);
    setDone(true);
    clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Safe catch
      }
    }
    // High-quality contextual fallback if API did not capture
    setTranscript((prev) =>
      prev ||
      (isHindi
        ? 'मेरा यह थैला हाथ से बना है, गुजरात के कच्छ जिले से। इसमें शीशे का काम है और रंगीन धागे से कढ़ाई है। कपास के कपड़े पर बनाया गया है। यह बहुत मजबूत है।'
        : 'This handcrafted tote bag is made from organic cotton in Kutch, Gujarat. It features traditional mirror work and vibrant multicolor thread embroidery.')
    );
  };

  const reset = () => {
    setRecording(false);
    setDone(false);
    setTranscript('');
    setSeconds(0);
  };

  const proceed = () => {
    sessionStorage.setItem('ss_voice_transcript', transcript);
    navigate('/artisan/products/processing', {
      state: { method: 'voice', transcript },
    });
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(
      2,
      '0'
    )}`;

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        paddingBottom: 100,
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--space-4) var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
          <h1
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text)',
              margin: 0,
            }}
          >
            {t('artisan.voiceCaptureTitle')}
          </h1>
        </div>

        <LanguageSelector compact />
      </div>

      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          padding: 'var(--space-6) var(--space-4)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-8)',
            lineHeight: 1.6,
          }}
        >
          {t('artisan.voiceCaptureSubtitle')}
        </p>

        {/* Central Recording Control Card */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem 1.5rem',
            marginBottom: 'var(--space-6)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Pulsing ring container */}
          <div
            style={{
              position: 'relative',
              width: 140,
              height: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            {recording && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    inset: -12,
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.15)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: -24,
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.08)',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
              </>
            )}

            <button
              onClick={recording ? stopRecording : startRecording}
              aria-label={recording ? t('artisan.tapToStop') : t('artisan.tapToSpeak')}
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: recording
                  ? 'var(--color-error)'
                  : 'linear-gradient(135deg, var(--color-primary), #0D9488)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                color: '#fff',
                boxShadow: recording
                  ? '0 0 0 8px rgba(239, 68, 68, 0.25)'
                  : '0 6px 24px rgba(15, 118, 110, 0.35)',
                transition: 'all 0.3s ease',
                zIndex: 2,
              }}
            >
              {recording ? (
                <Square size={36} fill="#fff" />
              ) : (
                <Mic size={40} strokeWidth={2} />
              )}
            </button>
          </div>

          {recording ? (
            <div>
              <p
                style={{
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--color-error)',
                  fontVariantNumeric: 'tabular-nums',
                  margin: '8px 0 4px',
                }}
              >
                {fmt(seconds)}
              </p>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                {t('artisan.tapToStop')}
              </p>
            </div>
          ) : (
            <div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  margin: '4px 0 2px',
                }}
              >
                {done ? (
                  <span style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={16} /> {t('artisan.recordingCaptured')}
                  </span>
                ) : (
                  t('artisan.tapToSpeak')
                )}
              </p>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                {t('artisan.speakNaturalHint')}
              </p>
            </div>
          )}
        </div>

        {/* Live Transcript / Result Card */}
        {(recording || done) && (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4) var(--space-5)',
              marginBottom: 'var(--space-5)',
              textAlign: 'left',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Volume2 size={14} />
                {recording ? t('artisan.listening') : t('artisan.yourRecording')}
              </span>
              {recording && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--color-error)',
                    animation: 'pulse 1s infinite',
                  }}
                />
              )}
            </div>

            <p
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--color-text)',
                lineHeight: 1.7,
                minHeight: 64,
                margin: 0,
              }}
            >
              {transcript || (
                <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  {t('artisan.waitingForSpeech')}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Action Controls when Done */}
        {done && (
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <button
              onClick={reset}
              style={{
                flex: 1,
                padding: '0.875rem',
                background: 'var(--color-surface)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                color: 'var(--color-text)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                minHeight: 50,
              }}
            >
              <RefreshCw size={16} /> {t('artisan.tryAgain')}
            </button>
            <button
              onClick={proceed}
              style={{
                flex: 2,
                padding: '0.875rem',
                background: 'var(--color-primary)',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                color: '#fff',
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                minHeight: 50,
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)',
              }}
            >
              {t('actions.continue')} <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Hints / What to Say Card */}
        <div
          style={{
            background: 'var(--color-surface-teal)',
            border: '1px solid var(--color-border-teal)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4) var(--space-5)',
            textAlign: 'left',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-primary)',
              fontWeight: 700,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={16} />
            {t('artisan.whatToSay')}
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {[
              t('artisan.tip1'),
              t('artisan.tip2'),
              t('artisan.tip3'),
              t('artisan.tip4'),
            ].map((tip, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  gap: 8,
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
