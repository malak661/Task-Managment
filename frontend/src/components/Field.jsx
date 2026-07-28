// A label, an input and the room for an error message, so every form in the app
// lines up the same way.
function Field({ label, error, hint, children, ...inputProps }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>

      {children || <input className={error ? 'field__input has-error' : 'field__input'} {...inputProps} />}

      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}

export default Field;
