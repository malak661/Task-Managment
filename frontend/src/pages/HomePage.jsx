import { useAuth } from '../context/AuthContext';

// Stands in for the project list until the next step adds it.
function HomePage() {
  const { user, isAdmin } = useAuth();

  return (
    <section className="card">
      <h1>Hello {user.name.split(' ')[0]}</h1>
      <p className="muted">
        You are signed in as <strong>{user.email}</strong> with the{' '}
        <strong>{user.role}</strong> role.
      </p>
      {isAdmin && <p className="muted">Admins can see every project and manage members.</p>}
    </section>
  );
}

export default HomePage;
