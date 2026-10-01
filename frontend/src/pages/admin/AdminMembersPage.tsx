import React, { useState, useEffect } from 'react';
import { Users, Database, ShieldAlert, CheckCircle2, RefreshCw, AlertCircle, FileText, GraduationCap } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { fetchMemberStats, fetchJsonSafely } from '../../utils/api';

export const AdminMembersPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    const res = await fetchMemberStats();
    if (res.success && res.stats) {
      setStats(res.stats);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleTriggerImport = async () => {
    setImporting(true);
    setImportMessage(null);
    try {
      const res = await fetchJsonSafely('/api/members/admin/import', { method: 'POST' });
      if (res.ok && res.data) {
        setImportMessage(`Synchronization complete: ${res.data.summary?.insertedCount || 0} inserted, ${res.data.summary?.duplicateCount || 0} duplicates skipped.`);
        await loadStats();
      } else {
        setImportMessage(`Import error: ${res.data?.error || 'Server connection issue'}`);
      }
    } catch (err) {
      setImportMessage('Error executing dataset synchronization request.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 py-6">
      <AdminSidebar />

      <main className="flex-1 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-6 sm:p-7 rounded-md border border-[#D9DDE1] shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              <span>Registry Synchronization</span>
            </div>
            <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight">Alumni Database Records</h1>
            <p className="text-xs text-[#52606D] mt-0.5">
              Audit institutional directory records, verify data completeness, and synchronize records.
            </p>
          </div>

          <button
            onClick={handleTriggerImport}
            disabled={importing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold text-xs rounded-md shadow-2xs transition-all shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${importing ? 'animate-spin' : ''}`} />
            <span>{importing ? 'Syncing Database...' : 'Run Database Sync'}</span>
          </button>
        </div>

        {importMessage && (
          <div className={`p-3.5 rounded-md border text-xs font-semibold flex items-center gap-2 ${importMessage.includes('complete') ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]' : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'}`}>
            {importMessage.includes('complete') ? <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> : <AlertCircle className="w-4 h-4 text-[#DC2626]" />}
            <span>{importMessage}</span>
          </div>
        )}

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-[#FFFFFF] animate-pulse h-24 rounded-md border border-[#D9DDE1]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            
            <div className="bg-[#FFFFFF] p-4 rounded-md border border-[#D9DDE1] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-primary">
                <span className="text-[11px] font-bold text-[#52606D] uppercase tracking-wider">Total Alumni</span>
                <Database className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#172B3A]">
                {stats?.totalMembers?.toLocaleString() || 0}
              </p>
              <p className="text-[10px] text-[#7A8793]">Verified alumni profiles</p>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-md border border-[#D9DDE1] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-primary">
                <span className="text-[11px] font-bold text-[#52606D] uppercase tracking-wider">Academic Details</span>
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#172B3A]">
                {stats?.withEducationCount?.toLocaleString() || 0}
              </p>
              <p className="text-[10px] text-[#7A8793]">Degree & branch records</p>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-md border border-[#D9DDE1] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[#166534]">
                <span className="text-[11px] font-bold text-[#52606D] uppercase tracking-wider">Work History</span>
                <Users className="w-4 h-4 text-[#16A34A]" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#172B3A]">
                {stats?.withWorkExperienceCount?.toLocaleString() || 0}
              </p>
              <p className="text-[10px] text-[#7A8793]">Career entries attached</p>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-md border border-[#D9DDE1] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[#92400E]">
                <span className="text-[11px] font-bold text-[#52606D] uppercase tracking-wider">Missing Email</span>
                <ShieldAlert className="w-4 h-4 text-[#D97706]" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#172B3A]">
                {stats?.missingEmailCount || 0}
              </p>
              <p className="text-[10px] text-[#7A8793]">Fallback identifier used</p>
            </div>

          </div>
        )}

        {/* Top Streams Breakdown */}
        {stats?.topStreams && (
          <div className="bg-[#FFFFFF] p-5 sm:p-6 rounded-md border border-[#D9DDE1] shadow-2xs space-y-3.5">
            <h3 className="text-sm font-bold text-[#172B3A]">Top Departments & Engineering Streams</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {stats.topStreams.map((st: any) => (
                <div key={st.name} className="flex items-center justify-between bg-[#F7F8F4] p-3 rounded-md border border-[#D9DDE1]">
                  <span className="text-xs font-semibold text-[#172B3A] truncate pr-2">{st.name}</span>
                  <span className="px-2 py-0.5 bg-[#FFFFFF] border border-purple-200 text-primary text-xs font-bold rounded">
                    {st.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

