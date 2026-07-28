import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { Loading } from './states';

// Guards everything behind it. While the stored token is still being checked we
// show a spinner — redirecting straight away would bounce a signed-in user out on
// every refresh.
function ProtectedRoute() {
  const { user, restoring } = useAuth();
  const location = useLocation();

  if (restoring) {
    return <Loading label="Checking your session…" />;
  }

  if (!user) {
    // Remember where they were headed so login can send them back there.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
