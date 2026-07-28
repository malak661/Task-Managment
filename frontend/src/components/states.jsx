// The four things a screen can be showing besides its content: busy, broken,
// empty, or reporting something that went well.

export function Loading({ label = 'Loading…' }) {
  return (
    <p className="state state--loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </p>
  );
}

export function ErrorMessage({ children, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <span>{children}</span>
      {onRetry && (
        <button type="button" className="button button--ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function SuccessMessage({ children }) {
  return (
    <p className="state state--success" role="status">
      {children}
    </p>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="state state--empty">
      <p className="state__title">{title}</p>
      {children}
    </div>
  );
}
