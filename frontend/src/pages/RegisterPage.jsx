import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { readErrorMessage } from '../api/client';
import Field from '../components/Field';
import { ErrorMessage } from '../components/states';
import { useAuth } from '../context/AuthContext';

const MIN_PASSWORD_LENGTH = 8;

function RegisterPage() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
  };

  // Mirrors the rules the api enforces, so the common mistakes never need a round
  // trip. The confirmation field is ours alone — the api does not know about it.
  const validate = () => {
    const errors = {};

    if (form.name.trim().length < 2) {
      errors.name = 'Please use at least 2 characters';
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errors.email = 'That does not look like an email address';
    }

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }

    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = 'The two passwords do not match';
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
      await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/', { replace: true });
    } catch (error) {
      setFailure(readErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <form className="card auth__card" onSubmit={handleSubmit} noValidate>
        <h1 className="auth__title">Create your account</h1>
        <p className="auth__subtitle">You will start as a member of the team.</p>

        {failure && <ErrorMessage>{failure}</ErrorMessage>}

        <Field
          label="Name"
          name="name"
          value={form.name}
          onChange={update}
          error={fieldErrors.name}
          autoComplete="name"
          placeholder="Omar Farouk"
        />

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
          hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
          autoComplete="new-password"
        />

        <Field
          label="Confirm password"
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={update}
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
        />

        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? 'Creating your account…' : 'Create account'}
        </button>

        <p className="auth__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
