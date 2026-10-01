import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Compass, BookOpen, Users, Globe2, Award, ChevronRight } from 'lucide-react';
import type { Story, DashboardSummaryStats } from '../types';
import { StoryCard } from '../components/story/StoryCard';
import { fetchJsonSafely, getMockStories, getMockStats } from '../utils/api';
import { useRealtime } from '../context/RealtimeContext';

export const HomePage: React.FC = () => {
  const [stats, setStats] = useState<DashboardSummaryStats>(() => getMockStats());
  const [featuredStories, setFeaturedStories] = useState<Story[]>(() => getMockStories().slice(0, 3));
  const { subscribe } = useRealtime();

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, storiesRes] = await Promise.all([
        fetchJsonSafely('/api/stories/stats/summary'),
        fetchJsonSafely('/api/stories?location=Homepage&sort=trending')
      ]);

      if (statsRes.ok && statsRes.data) {
        setStats(prev => JSON.stringify(prev) === JSON.stringify(statsRes.data) ? prev : statsRes.data);
      }

      if (storiesRes.ok && Array.isArray(storiesRes.data?.stories) && storiesRes.data.stories.length > 0) {
        setFeaturedStories(prev => {
          const nextStories = storiesRes.data.stories.slice(0, 3);
          if (prev.length === nextStories.length && prev.every((s, i) => s.id === nextStories[i]?.id)) {
            return prev;
          }
          return nextStories;
        });
      }
    } catch (err) {
      // Keep instant fallback state
    }
  }, []);

  useEffect(() => {
    fetchData();
    const unsubscribe = subscribe(() => {
      fetchData();
    });
    return unsubscribe;
  }, [fetchData, subscribe]);

  const statItems = [
    { label: 'Published Stories', value: stats.storiesShared, icon: BookOpen },
    { label: 'Registered Alumni', value: stats.peopleFeatured, icon: Users },
    { label: 'Regional Chapters', value: stats.communitiesReached, icon: Globe2 },
    { label: 'Notable Achievements', value: stats.storiesInspiringChange, icon: Award }
  ];

  return (
    <div className="space-y-10 py-4 max-w-6xl mx-auto">
      
      {/* 1. Hero / Institutional Welcome Panel */}
      <section className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center shadow-xs">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-soft border border-purple-200 text-primary font-semibold text-xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>National Engineering College Alumni Association</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Connecting Generations of Engineers & Leaders
          </h1>

          <p className="text-slate-600 text-sm sm:text-base font-normal max-w-2xl mx-auto leading-relaxed">
            Welcome to the official institutional portal of National Engineering College. Explore career milestones, connect with alumni across diverse batches and domains, and engage with our global community.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              to="/members"
              className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm transition-all duration-200 shadow-xs flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-white" />
              <span>Browse Alumni Directory</span>
            </Link>
            <Link
              to="/explore"
              className="px-6 py-2.5 rounded-lg bg-white hover:bg-primary-soft hover:text-primary hover:border-primary text-slate-700 border border-slate-200 font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-primary" />
              <span>Explore Stories</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Institutional Statistics Bar */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200 text-center flex flex-col items-center justify-center"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center mb-2.5 border border-purple-200">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-slate-500 font-medium text-xs uppercase tracking-wide mb-1">
                  {stat.label}
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {stat.value}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Featured Alumni Stories */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Featured Alumni Stories
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Read about achievements, career trajectories, and contributions from NEC alumni.
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            <span>View All Stories</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featuredStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </section>

    </div>
  );
};
