import { Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function ProductCreationSteps({ currentStep = 1 }) {
  const { isHindi } = useLanguage();

  const steps = [
    { num: 1, label: isHindi ? 'फ़ोटो' : 'Photo' },
    { num: 2, label: isHindi ? 'शिल्प की कहानी' : 'Your Story' },
    { num: 3, label: isHindi ? 'समीक्षा' : 'Review' },
  ];

  return (
    <div
      role="navigation"
      aria-label="Product creation progress"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '10px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {steps.map((step, idx) => {
          const isDone = currentStep > step.num;
          const isActive = currentStep === step.num;

          return (
            <div
              key={step.num}
              style={{
                display: 'flex',
                alignItems: 'center',
                flex: idx < steps.length - 1 ? 1 : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: isDone
                      ? 'var(--color-success)'
                      : isActive
                      ? 'var(--color-primary)'
                      : 'var(--color-border-light)',
                    color: isDone || isActive ? '#fff' : 'var(--color-text-muted)',
                    border: `1.5px solid ${
                      isDone
                        ? 'var(--color-success)'
                        : isActive
                        ? 'var(--color-primary)'
                        : 'var(--color-border)'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isDone ? <Check size={14} strokeWidth={3} /> : step.num}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive
                      ? 'var(--color-primary)'
                      : isDone
                      ? 'var(--color-success)'
                      : 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.num}. {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: currentStep > step.num ? 'var(--color-success)' : 'var(--color-border)',
                    margin: '0 12px',
                    borderRadius: 1,
                    transition: 'background 0.3s ease',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
