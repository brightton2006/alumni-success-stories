import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, BookOpen } from 'lucide-react';
import { StoryCard } from '../components/story/StoryCard';
import type { Story } from '../types';

const CATEGORIES = [
  'All',
  'Education',
  'Entrepreneurship',
  'Technology',
  'Innovation',
  'Sports',
  'Agriculture',
  'Social Impact',
  'Career',
  'Community',
  'Other'
];

import { fetchJsonSafely, getMockStories } from '../utils/api';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || 'All';
  const selectedSort = searchParams.get('sort') || 'recent';

  const [stories, setStories] = useState<Story[]>(() => {
    let mockList = getMockStories();
    if (selectedCategory !== 'All') {
      mockList = mockList.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      mockList = mockList.filter(s =>
        s.storyTitle.toLowerCase().includes(q) ||
        s.personName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return mockList;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchStories = async () => {
      if (stories.length === 0) {
        setLoading(true);
      }
      try {
        const query = new URLSearchParams();
        const locationParam = searchParams.get('location');
        if (locationParam) query.set('location', locationParam);
        if (searchTerm) query.set('search', searchTerm);
        if (selectedCategory !== 'All') query.set('category', selectedCategory);
        if (selectedSort) query.set('sort', selectedSort);

        const res = await fetchJsonSafely(`/api/stories?${query.toString()}`);
        if (!isMounted) return;

        const updateStoriesIfChanged = (newList: Story[]) => {
          setStories(prev => {
            if (prev.length === newList.length && prev.every((s, i) => s.id === newList[i]?.id)) {
              return prev;
            }
            return newList;
          });
        };

        if (res.ok && Array.isArray(res.data?.stories)) {
          updateStoriesIfChanged(res.data.stories);
        } else {
          // Fallback to local filtering if backend unavailable
          let mockList = getMockStories();
          if (selectedCategory !== 'All') {
            mockList = mockList.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase());
          }
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            mockList = mockList.filter(s =>
              s.storyTitle.toLowerCase().includes(q) ||
              s.personName.toLowerCase().includes(q) ||
              s.category.toLowerCase().includes(q)
            );
          }
          updateStoriesIfChanged(mockList);
        }
      } catch (err) {
        if (isMounted && stories.length === 0) {
          setStories(getMockStories());
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStories();

    return () => {
      isMounted = false;
    };
  }, [searchTerm, selectedCategory, selectedSort]);

  const handleSearchChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleCategorySelect = (cat: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (cat !== 'All') {
      newParams.set('category', cat);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const handleSortSelect = (sortVal: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sortVal);
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-soft text-primary rounded-full text-xs font-semibold uppercase tracking-wide border border-purple-200 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>Alumni Articles & Journeys</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Explore Alumni Stories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Discover achievements, career insights, and experiences shared by NEC alumni.
          </p>
        </div>
      </div>

      {/* 2. Search Bar & Filters */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, author name, or location..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-primary">
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
              <span className="text-slate-600">Sort:</span>
              <select
                value={selectedSort}
                onChange={(e) => handleSortSelect(e.target.value)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer text-slate-900"
              >
                <option value="recent">Most Recent</option>
                <option value="views">Most Viewed</option>
                <option value="trending">Trending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-primary" />
            Category:
          </span>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-primary hover:border-primary hover:bg-primary-soft border border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Stories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white animate-pulse h-72 rounded-lg border border-slate-200" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-slate-200 max-w-md mx-auto space-y-3 shadow-xs">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No records available</h3>
          <p className="text-xs text-slate-500">
            No stories match your current search terms or category filter.
          </p>
          <button
            onClick={() => setSearchParams({})}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg transition-all duration-200 cursor-pointer shadow-2xs"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}

    </div>
  );
};
