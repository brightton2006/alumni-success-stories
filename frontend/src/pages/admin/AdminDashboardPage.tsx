import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Eye, ShieldCheck } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminDashboardStats } from '../../components/admin/AdminDashboardStats';
import type { AdminAnalyticsStats } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { fetchJsonSafely } from '../../utils/api';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const [analytics, setAnalytics] = useState<Partial<AdminAnalyticsStats>>(() => ({
    totalStories: 0,
    publishedStories: 0,
    pendingStories: 0,
    draftStories: 0,
    totalViews: 0,
    aiMapsGenerated: 0,
    totalUsers: 0,
    totalCategories: 0,
    mostViewedStories: [],
    storiesByCategory: []
  }));
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchJsonSafely('/api/admin/dashboard/stats');
      if (res.ok && res.data) {
        setAnalytics(prev => {
          if (JSON.stringify(prev) === JSON.stringify(res.data)) return prev;
          return res.data;
        });
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    const unsubscribe = subscribe(() => {
      fetchAnalytics();
    });
    return unsubscribe;
  }, [fetchAnalytics, subscribe]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 py-6">
      <AdminSidebar />

      <main className="flex-1 space-y-6">
        
        {error && (
          <div className="p-3.5 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchAnalytics()}
              className="px-3 py-1 bg-[#DC2626] text-white rounded text-xs font-bold hover:bg-[#B91C1C]"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Top Welcome Card */}
        <div className="bg-[#FFFFFF] rounded-md p-6 sm:p-7 border border-[#D9DDE1] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Portal Administration Console</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#172B3A]">
              Institutional Overview
            </h1>
            <p className="text-xs text-[#52606D]">
              Logged in as <strong className="text-[#172B3A]">{user?.fullName || 'Administrator'}</strong>. Oversee alumni success records, review submissions, and manage system metrics.
            </p>
          </div>

          <Link
            to="/admin/stories/create"
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-md shadow-2xs transition-all flex items-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Story</span>
          </Link>
        </div>

        {/* Dynamic Stats Cards */}
        <AdminDashboardStats stats={analytics} />

        {/* Recent & Most Viewed Stories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Most Viewed Stories */}
          <div className="bg-[#FFFFFF] rounded-md p-5 sm:p-6 shadow-2xs border border-[#D9DDE1]">
            <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[#D9DDE1]">
              <h3 className="text-sm font-bold text-[#172B3A]">
                Most Viewed Stories
              </h3>
              <Link to="/admin/stories" className="text-xs font-semibold text-primary hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2">
              {analytics.mostViewedStories?.length === 0 ? (
                <p className="text-xs text-[#52606D] py-4 text-center">No story views recorded yet.</p>
              ) : (
                analytics.mostViewedStories?.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-[#F7F8F4] border border-[#D9DDE1]">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-primary">
                        {s.storyTitle}
                      </h4>
                      <p className="text-[11px] text-[#52606D]">
                        {s.personName} • {s.category}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-[#FFFFFF] px-2.5 py-1 rounded border border-purple-200">
                      <Eye className="w-3 h-3 text-primary" />
                      {s.views}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stories by Category */}
          <div className="bg-[#FFFFFF] rounded-md p-5 sm:p-6 shadow-2xs border border-[#D9DDE1]">
            <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[#D9DDE1]">
              <h3 className="text-sm font-bold text-[#172B3A]">
                Stories by Domain
              </h3>
              <Link to="/admin/categories" className="text-xs font-semibold text-primary hover:underline">
                Manage
              </Link>
            </div>

            <div className="space-y-2">
              {analytics.storiesByCategory && analytics.storiesByCategory.length > 0 ? (
                analytics.storiesByCategory.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between text-xs p-2.5 rounded-md bg-[#F7F8F4] border border-[#D9DDE1]">
                    <span className="font-semibold text-[#172B3A]">{cat.category}</span>
                    <span className="px-2 py-0.5 rounded bg-primary-soft text-primary text-[11px] font-bold border border-purple-200">
                      {cat.count} {cat.count === 1 ? 'story' : 'stories'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#52606D] py-4 text-center">No categories available.</p>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

