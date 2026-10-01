import React from 'react';
import { BookOpen, CheckCircle2, FileEdit, Users, FolderTree, Network, Eye, Clock } from 'lucide-react';
import type { AdminAnalyticsStats } from '../../types';

interface AdminDashboardStatsProps {
  stats: Partial<AdminAnalyticsStats>;
}

export const AdminDashboardStats: React.FC<AdminDashboardStatsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Total Stories',
      value: stats.totalStories || 0,
      icon: BookOpen,
      iconColor: 'text-primary bg-primary-soft'
    },
    {
      label: 'Published',
      value: stats.publishedStories || 0,
      icon: CheckCircle2,
      iconColor: 'text-emerald-700 bg-emerald-50'
    },
    {
      label: 'Pending Review',
      value: stats.pendingStories || 0,
      icon: Clock,
      iconColor: 'text-amber-700 bg-amber-50'
    },
    {
      label: 'Draft / Revisions',
      value: stats.draftStories || 0,
      icon: FileEdit,
      iconColor: 'text-slate-600 bg-slate-100'
    },
    {
      label: 'Total Views',
      value: stats.totalViews || 0,
      icon: Eye,
      iconColor: 'text-primary bg-primary-soft'
    },
    {
      label: 'Maps Generated',
      value: stats.aiMapsGenerated || 0,
      icon: Network,
      iconColor: 'text-primary bg-primary-soft'
    },
    {
      label: 'Registered Users',
      value: stats.totalUsers || 0,
      icon: Users,
      iconColor: 'text-slate-700 bg-slate-100'
    },
    {
      label: 'Story Domains',
      value: stats.totalCategories || 0,
      icon: FolderTree,
      iconColor: 'text-primary bg-primary-soft'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-lg p-4 shadow-2xs border border-slate-200 hover:border-primary/40 hover:shadow-xs transition-all"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`w-7 h-7 rounded-md ${card.iconColor} flex items-center justify-center shrink-0`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900">
              {card.value}
            </span>
          </div>
        );
      })}
    </div>
  );
};
