import React, { useEffect, useState } from 'react';
import { AlertCircle, Users, Check } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import type { User } from '../../types';

import { fetchJsonSafely } from '../../utils/api';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetchJsonSafely('/api/admin/users');
      if (res.ok && res.data?.users) {
        setUsers(prev => JSON.stringify(prev) === JSON.stringify(res.data.users) ? prev : res.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: User) => {
    const newStatus = !user.isActive;

    setError(null);
    setMessage(null);

    try {
      const res = await fetchJsonSafely(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: newStatus })
      });

      if (res.ok) {
        setMessage(res.data?.message || 'User status updated successfully.');
        setTimeout(() => setMessage(null), 3000);
        fetchUsers();
      } else {
        setError(res.data?.error || 'Failed to update user status.');
      }
    } catch (err) {
      setError('Network error updating user.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 py-6">
      <AdminSidebar />

      <main className="flex-1 space-y-6">
        
        {/* Header */}
        <div className="bg-[#FFFFFF] rounded-md p-6 sm:p-7 border border-[#D9DDE1] shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>Account Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight">
            User Account Management
          </h1>
          <p className="text-xs text-[#52606D] mt-0.5">
            Audit registered user accounts, inspect submission counts, and manage platform authorization status.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3.5 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-[#FFFFFF] rounded-md shadow-2xs border border-[#D9DDE1] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8F4] border-b border-[#D9DDE1] text-[10px] font-bold text-[#52606D] uppercase tracking-wider">
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Stories Authored</th>
                  <th className="p-3.5">Joined Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DDE1] text-xs font-normal text-[#172B3A]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#52606D] font-medium">Loading user accounts...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#52606D] font-medium">No user accounts found.</td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isAdminRole = u.role === 'ADMIN';

                    return (
                      <tr key={u.id} className="hover:bg-[#F7F8F4]/80 transition-colors">
                        <td className="p-3.5">
                          <div>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                              {u.fullName}
                            </span>
                            <span className="text-[#52606D] text-[11px]">
                              {u.email}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase tracking-wider ${
                            isAdminRole ? 'bg-primary text-white shadow-2xs' : 'bg-[#F1F1F1] text-[#52606D] border border-[#D9DDE1]'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            u.isActive ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]' : 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]'
                          }`}>
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>

                        <td className="p-3.5 font-bold text-[#172B3A]">
                          {u.storiesCount || 0}
                        </td>

                        <td className="p-3.5 text-[#52606D]">
                          {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                              u.isActive
                                ? 'bg-[#FEF2F2] text-[#991B1B] hover:bg-[#FEE2E2] border border-[#FECACA]'
                                : 'bg-[#F0FDF4] text-[#166534] hover:bg-[#DCFCE7] border border-[#BBF7D0]'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

