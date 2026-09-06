export function LoadingState({ message = 'Loading…', fullPage = false }) {
  const spinner = (
    <div role="status" aria-label={message} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)',
    }}>
      <div aria-hidden="true" style={{
        width: fullPage ? 48 : 36, height: fullPage ? 48 : 36,
        borderRadius: '50%',
        border: '4px solid var(--color-border-teal)',
        borderTopColor: 'var(--color-primary)',
        animation: 'spin 0.85s linear infinite',
      }} />
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 'var(--weight-medium)', margin: 0 }}>
        {message}
      </p>
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--color-bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 'var(--space-8)', zIndex: 9999,
      }}>
        <div style={{ textAlign: 'center' }}>
          <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="ShilpSetu" width={56} height={56} style={{ borderRadius: 14, margin: '0 auto' }} />
          <p style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)', marginTop: 'var(--space-2)' }}>ShilpSetu</p>
        </div>
        {spinner}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', width: '100%' }}>
      {spinner}
    </div>
  );
}
