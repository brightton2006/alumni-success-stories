import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  PlusCircle,
  Search,
  Layers
} from 'lucide-react';
import type { Story } from '../types';
import { StoryCard } from '../components/story/StoryCard';
import { fetchJsonSafely } from '../utils/api';
import { useRealtime } from '../context/RealtimeContext';

interface StoryStats {
  totalSuccessStories: number;
  verifiedSuccessStories: number;
  alumniFeatured: number;
  recentSuccessStories: number;
}

export const HomePage: React.FC = () => {
  const [stats, setStats] = useState<StoryStats>({
    totalSuccessStories: 0,
    verifiedSuccessStories: 0,
    alumniFeatured: 0,
    recentSuccessStories: 0
  });

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { subscribe } = useRealtime();

  // Fetch Dashboard KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetchJsonSafely('/api/stories/stats/summary');
      if (res.ok && res.data) {
        setStats({
          totalSuccessStories: res.data.totalSuccessStories ?? res.data.storiesShared ?? 0,
          verifiedSuccessStories: res.data.verifiedSuccessStories ?? res.data.storiesShared ?? 0,
          alumniFeatured: res.data.alumniFeatured ?? res.data.peopleFeatured ?? 0,
          recentSuccessStories: res.data.recentSuccessStories ?? 0
        });
      }
    } catch (err) {}
  }, []);

  // Fetch Stories Gallery
  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      let query = `/api/stories?page=${page}&limit=6`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (selectedCategory !== 'All') query += `&category=${encodeURIComponent(selectedCategory)}`;
      if (selectedYear !== 'All') query += `&graduationYear=${encodeURIComponent(selectedYear)}`;
      if (selectedDepartment !== 'All') query += `&department=${encodeURIComponent(selectedDepartment)}`;
      if (selectedIndustry !== 'All') query += `&industry=${encodeURIComponent(selectedIndustry)}`;

      const res = await fetchJsonSafely(query);
      if (res.ok && Array.isArray(res.data?.stories)) {
        setStories(res.data.stories);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, selectedYear, selectedDepartment, selectedIndustry]);

  useEffect(() => {
    fetchStats();
    fetchStories();
    const unsubscribe = subscribe(() => {
      fetchStats();
      fetchStories();
    });
    return unsubscribe;
  }, [fetchStats, fetchStories, subscribe]);

  const kpiCards = [
    { label: 'Total Success Stories', value: stats.totalSuccessStories, icon: BookOpen, color: 'text-primary bg-primary-soft border-purple-200' },
    { label: 'Verified Success Stories', value: stats.verifiedSuccessStories, icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { label: 'Alumni Featured', value: stats.alumniFeatured, icon: Users, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { label: 'Recent Success Stories', value: stats.recentSuccessStories, icon: Sparkles, color: 'text-amber-700 bg-amber-50 border-amber-200' }
  ];

  return (
    <div className="space-y-10 py-4 max-w-6xl mx-auto">
      
      {/* 1. Institutional Hero & Call to Action */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center shadow-xs relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-soft border border-purple-200 text-primary font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>National Engineering College Alumni Association</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Alumni Success Stories & Recognition Dashboard
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Discover inspiring career milestones, research breakthroughs, entrepreneurial achievements, and community leadership from NEC Alumni across the globe.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/stories/write"
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Submit Your Success Story</span>
            </Link>
            <Link
              to="/members"
              className="px-6 py-2.5 rounded-xl bg-white hover:bg-primary-soft hover:text-primary hover:border-primary text-slate-700 border border-slate-200 font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-primary" />
              <span>Browse Alumni Directory</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Dashboard KPI Cards (Requirement 3) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span>Alumni Success Stories — Real-Time KPI Metrics</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Live Database Sync</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCards.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-primary/40 hover:shadow-md transition-all text-center flex flex-col items-center justify-center"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 border ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider mb-1">
                  {kpi.label}
                </span>
                <span className="text-3xl font-extrabold text-slate-900">
                  {kpi.value}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Interactive Success Story Gallery & Filtering Module */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Published Success Stories Gallery
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Filter by batch year, department, industry, or category to explore achievements.
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
          >
            <span>Explore Full Gallery</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Filters Grid */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search stories, names..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              >
                <option value="All">Category: All</option>
                <option value="Career Growth">Career Growth</option>
                <option value="Entrepreneurship">Entrepreneurship</option>
                <option value="Research & Academia">Research & Academia</option>
                <option value="Social Impact">Social Impact</option>
                <option value="Awards & Recognition">Awards & Recognition</option>
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <select
                value={selectedYear}
                onChange={e => { setSelectedYear(e.target.value); setPage(1); }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              >
                <option value="All">Graduation Year: All</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2020">2020</option>
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={selectedDepartment}
                onChange={e => { setSelectedDepartment(e.target.value); setPage(1); }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              >
                <option value="All">Department: All</option>
                <option value="CSE">Computer Science (CSE)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="EEE">Electrical (EEE)</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="IT">Information Technology</option>
              </select>
            </div>

            {/* Industry Filter */}
            <div>
              <select
                value={selectedIndustry}
                onChange={e => { setSelectedIndustry(e.target.value); setPage(1); }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              >
                <option value="All">Industry / Role: All</option>
                <option value="Software">Software & Tech</option>
                <option value="Data">Data & AI</option>
                <option value="Entrepreneur">Entrepreneurship</option>
                <option value="Research">Research & Science</option>
              </select>
            </div>

          </div>
        </div>

        {/* Stories Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-20 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {stories.map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          /* Empty State (Requirement 3) */
          <div className="bg-white rounded-xl p-12 border border-slate-200 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto border border-purple-200">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No Success Stories Found Matching Filters
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try resetting your filters or search keywords to view more published alumni stories.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setSelectedYear('All');
                setSelectedDepartment('All');
                setSelectedIndustry('All');
                setPage(1);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Pagination / Load More Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-600 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </section>

    </div>
  );
};
