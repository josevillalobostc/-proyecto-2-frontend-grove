import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

      <div className="bg-grove-surface border border-grove-border rounded-xl p-6 mb-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-grove-green/20 border-2 border-grove-green/40 flex items-center justify-center">
            <span className="text-2xl font-bold text-grove-green">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.username}</h2>
            <p className="text-gray-400 text-sm">{user?.role?.replace('ROLE_', '') || 'User'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-grove-dark rounded-lg">
            <User className="w-4 h-4 text-grove-green" />
            <div>
              <p className="text-xs text-gray-500">Username</p>
              <p className="text-white text-sm">{user?.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-grove-dark rounded-lg">
            <Mail className="w-4 h-4 text-grove-green" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-white text-sm">{user?.email || '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-grove-dark rounded-lg">
            <Shield className="w-4 h-4 text-grove-green" />
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <p className="text-white text-sm">{user?.role || '—'}</p>
            </div>
          </div>

          {user?.createdAt && (
            <div className="flex items-center gap-3 p-3 bg-grove-dark rounded-lg">
              <Calendar className="w-4 h-4 text-grove-green" />
              <div>
                <p className="text-xs text-gray-500">Member since</p>
                <p className="text-white text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors font-medium"
      >
        Sign out
      </button>
    </div>
  );
}
