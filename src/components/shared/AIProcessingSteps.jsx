import { useEffect } from 'react';
import { Check } from 'lucide-react';

function StepIcon({ status }) {
  if (status === 'complete') {
    return (
      <div aria-label="Completed" style={{
        width: 26, height: 26, borderRadius: '50%',
        background: 'var(--color-success-bg)', border: '1.5px solid var(--color-success)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Check size={14} strokeWidth={2.5} style={{ color: 'var(--color-success)' }} />
      </div>
    );
  }
  if (status === 'active') {
    return (
      <div aria-label="In progress" style={{
        width: 26, height: 26, borderRadius: '50%',
        border: '2.5px solid var(--color-border-teal)',
        borderTopColor: 'var(--color-primary)',
        animation: 'spin 0.85s linear infinite', flexShrink: 0,
      }} />
    );
  }
  return (
    <div aria-label="Pending" style={{
      width: 26, height: 26, borderRadius: '50%',
      border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', flexShrink: 0,
    }} />
  );
}

export function AIProcessingSteps({ steps = [], onComplete }) {
  const allComplete = steps.length > 0 && steps.every(s => s.status === 'complete');

  useEffect(() => {
    if (allComplete && onComplete) onComplete();
  }, [allComplete, onComplete]);

  return (
    <div role="list" aria-label="Processing steps" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={i} role="listitem" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <StepIcon status={step.status} />
              {!isLast && (
                <div aria-hidden="true" style={{
                  width: 2, flex: 1, minHeight: 24,
                  background: step.status === 'complete' ? 'var(--color-success)' : 'var(--color-border)',
                  borderRadius: 2, marginTop: 2, opacity: 0.4,
                  transition: 'background var(--transition-slow)',
                }} />
              )}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 'var(--space-5)', paddingTop: 2 }}>
              <span aria-current={step.status === 'active' ? 'step' : undefined} style={{
                fontSize: 'var(--text-sm)',
                fontWeight: step.status === 'active' ? 'var(--weight-semibold)' : 'var(--weight-regular)',
                color: step.status === 'complete' ? 'var(--color-success)'
                     : step.status === 'active' ? 'var(--color-primary)'
                     : 'var(--color-text-muted)',
                transition: 'color var(--transition-base)',
              }}>{step.label}</span>
              {step.status === 'active' && (
                <div aria-hidden="true" style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  {[0, 1, 2].map(d => (
                    <span key={d} style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: 'var(--color-primary)', opacity: 0.7,
                      animation: `pulse 1.2s ease ${d * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
