import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './ui/Spinner';

export default function ProtectedRoute() {
  const { token, loading } = useAuth();
  if (loading) return <Spinner fullScreen />;
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}
