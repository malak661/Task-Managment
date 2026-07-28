import { Link, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

// The frame around every signed-in page: who you are, and the way out.
function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="app">
      <header className="app__header">
        <Link to="/" className="app__brand">
          Task Board
        </Link>

        <div className="app__user">
          <span className="app__username">
            {user.name}
            <span className="badge">{user.role}</span>
          </span>

          <button type="button" className="button button--ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="app__main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
