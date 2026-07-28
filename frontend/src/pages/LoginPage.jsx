import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { readErrorMessage } from '../api/client';
import Field from '../components/Field';
import { ErrorMessage } from '../components/states';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Whoever is already signed in has no business on the login screen.
  if (user) {
    return <Navigate to="/" replace />;
  }

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
  };

  // Catch the obvious mistakes here; the api is still the authority.
  const validate = () => {
    const errors = {};

    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errors.email = 'That does not look like an email address';
    }

    if (!form.password) {
      errors.password = 'Password is required';
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFailure('');

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await signIn({ email: form.email.trim(), password: form.password });
      navigate(location.state?.from || '/', { replace: true });
    } catch (error) {
      setFailure(readErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <form className="card auth__card" onSubmit={handleSubmit} noValidate>
        <h1 className="auth__title">Welcome back</h1>
        <p className="auth__subtitle">Sign in to get to your projects.</p>

        {failure && <ErrorMessage>{failure}</ErrorMessage>}

        <Field
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={update}
          error={fieldErrors.email}
          autoComplete="email"
          placeholder="you@company.com"
        />

        <Field
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={update}
          error={fieldErrors.password}
          autoComplete="current-password"
          placeholder="••••••••"
        />

        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="auth__switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
