import React, { useEffect, useState } from 'react';
import { BarChart3, Eye, TrendingUp } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminDashboardStats } from '../../components/admin/AdminDashboardStats';
import type { AdminAnalyticsStats } from '../../types';

import { fetchJsonSafely } from '../../utils/api';

export const AdminAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<Partial<AdminAnalyticsStats>>({});

  useEffect(() => {
    fetchJsonSafely('/api/admin/dashboard/stats')
      .then((res) => {
        if (res.ok && res.data) {
          setAnalytics(prev => JSON.stringify(prev) === JSON.stringify(res.data) ? prev : res.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6 py-6">
      <AdminSidebar />

      <main className="flex-1 space-y-6">
        
        {/* Header */}
        <div className="bg-[#FFFFFF] rounded-md p-6 sm:p-7 border border-[#D9DDE1] shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span>Platform Metrics</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight">
            Institutional Analytics & Insights
          </h1>
          <p className="text-xs text-[#52606D] mt-0.5">
            Monitor story reader engagement, view counts, category distribution, and alumni directory stats.
          </p>
        </div>

        <AdminDashboardStats stats={analytics} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Most Viewed Stories */}
          <div className="bg-[#FFFFFF] rounded-md p-5 sm:p-6 shadow-2xs border border-[#D9DDE1] space-y-3.5">
            <h3 className="text-sm font-bold text-[#172B3A] flex items-center gap-2 pb-2 border-b border-[#D9DDE1]">
              <Eye className="w-4 h-4 text-primary" />
              <span>Top Viewed Stories</span>
            </h3>

            <div className="space-y-2">
              {analytics.mostViewedStories && analytics.mostViewedStories.length > 0 ? (
                analytics.mostViewedStories.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-md bg-[#F7F8F4] border border-[#D9DDE1]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded bg-primary text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{s.storyTitle}</h4>
                        <p className="text-[11px] text-[#52606D]">{s.personName} • {s.category}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-primary bg-white px-2.5 py-1 rounded border border-purple-200">
                      {s.views} views
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#52606D] py-4 text-center">No view records available.</p>
              )}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-[#FFFFFF] rounded-md p-5 sm:p-6 shadow-2xs border border-[#D9DDE1] space-y-3.5">
            <h3 className="text-sm font-bold text-[#172B3A] flex items-center gap-2 pb-2 border-b border-[#D9DDE1]">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span>Stories by Domain Distribution</span>
            </h3>

            <div className="space-y-3">
              {analytics.storiesByCategory && analytics.storiesByCategory.length > 0 ? (
                analytics.storiesByCategory.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-[#172B3A]">
                      <span>{cat.category}</span>
                      <span className="text-[#52606D]">{cat.count} {cat.count === 1 ? 'story' : 'stories'}</span>
                    </div>
                    <div className="w-full bg-[#F1F1F1] rounded h-2 overflow-hidden border border-[#D9DDE1]">
                      <div
                        className="bg-primary h-full rounded"
                        style={{ width: `${Math.min((cat.count / (analytics.totalStories || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#52606D] py-4 text-center">No category distribution data.</p>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

