

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div role="status" aria-label={title} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center',
      padding: 'var(--space-12) var(--space-6)', gap: 'var(--space-4)',
    }}>
      {Icon && (
        <div aria-hidden="true" style={{
          width: 80, height: 80, borderRadius: 'var(--radius-full)',
          background: 'var(--color-surface-teal)', border: '1.5px solid var(--color-border-teal)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={40} strokeWidth={1.5} style={{ color: 'var(--color-primary)' }} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxWidth: 360 }}>
        <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
          {title}
        </h3>
        {description && (
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <button className="btn btn-primary" onClick={action.onClick} style={{ marginTop: 'var(--space-2)' }}>
          {action.label}
        </button>
      )}
    </div>
  );
}
