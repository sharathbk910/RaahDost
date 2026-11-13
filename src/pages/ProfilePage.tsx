import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  School, 
  Save, 
  CheckCircle, 
  AlertCircle,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  navigate: (route: string) => void;
}

export const ProfilePage: React.FC<Props> = ({ navigate }) => {
  const { user, updateProfile, signOut } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-sm text-slate-500">You must be logged in to view your profile.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await updateProfile({ fullName, avatarUrl });
    if (!error) {
      setStatusMsg('Profile updated successfully.');
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          User Account & Security Profile
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Manage your verified credentials, institution alignment, and access authorization level.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {statusMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* User Card Header */}
        <div className="flex items-center space-x-4 border-b border-slate-100 pb-6">
          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
            alt="Profile Avatar"
            className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500 shadow-md"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900">{user.fullName}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                user.role === 'admin'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : user.role === 'operator'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Avatar Image URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Security Role (Immutable)</label>
              <input
                type="text"
                disabled
                value={user.role.toUpperCase()}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Privilege elevation is strictly managed by institution authorities.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account ID</label>
              <input
                type="text"
                disabled
                value={user.id}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-500 truncate"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center space-x-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

