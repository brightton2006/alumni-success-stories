import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { MemberCard } from '../components/member/MemberCard';
import { MemberFilterSidebar } from '../components/member/MemberFilterSidebar';
import { MemberDetailModal } from '../components/member/MemberDetailModal';
import { fetchMembers, fetchMemberFilters, fetchMemberById } from '../utils/api';
import type { Member, MemberFilterParams, MemberFilterOptions, MemberPaginatedResponse } from '../types';

export const MembersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<MemberFilterParams>(() => ({
    search: searchParams.get('search') || '',
    stream: searchParams.get('stream') || '',
    course: searchParams.get('course') || '',
    endYear: searchParams.get('endYear') || '',
    city: searchParams.get('city') || '',
    company: searchParams.get('company') || '',
    skill: searchParams.get('skill') || '',
    page: parseInt(searchParams.get('page') || '1'),
    limit: 12
  }));

  const [filterOptions, setFilterOptions] = useState<MemberFilterOptions>({
    streams: [],
    graduationYears: [],
    courses: [],
    cities: [],
    companies: []
  });

  const [data, setData] = useState<MemberPaginatedResponse['pagination']>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Load filter options once on mount
  useEffect(() => {
    fetchMemberFilters().then(res => {
      if (res.success && res.filters) {
        setFilterOptions(res.filters);
      }
    });
  }, []);

  // Sync state & URL params and fetch members
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadData = async () => {
      const res = await fetchMembers(filters);
      if (!isMounted) return;

      if (res.success) {
        setMembers(res.members);
        setData(res.pagination);
      } else {
        setError(res.error || 'Unable to load alumni records.');
        setMembers([]);
      }
      setLoading(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const handleSelectMember = async (member: Member) => {
    setSelectedMember(member);
    if (member.id) {
      const res = await fetchMemberById(member.id);
      if (res.success && res.member) {
        setSelectedMember(res.member);
      }
    }
  };

  const handleFilterChange = (newFilters: MemberFilterParams) => {
    setFilters(newFilters);

    // Sync to URL search params
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.stream) params.set('stream', newFilters.stream);
    if (newFilters.course) params.set('course', newFilters.course);
    if (newFilters.endYear) params.set('endYear', String(newFilters.endYear));
    if (newFilters.city) params.set('city', newFilters.city);
    if (newFilters.company) params.set('company', newFilters.company);
    if (newFilters.skill) params.set('skill', newFilters.skill);
    if (newFilters.page && newFilters.page > 1) params.set('page', String(newFilters.page));

    setSearchParams(params);
  };

  const handleClearFilters = () => {
    const emptyFilters = { page: 1, limit: 12 };
    setFilters(emptyFilters);
    setSearchParams({});
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > data.totalPages) return;
    handleFilterChange({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-soft text-primary rounded-full text-xs font-semibold uppercase tracking-wide border border-purple-200 mb-2">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>Alumni Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Institutional Alumni Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search, filter and connect with National Engineering College graduates worldwide.
          </p>
        </div>

        {/* Quick Stats in Header */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-center">
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Total Records</span>
            <span className="text-sm font-bold text-primary">{data.total ? data.total.toLocaleString() : '0'}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-center">
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Batches</span>
            <span className="text-sm font-bold text-primary">{filterOptions.graduationYears.length || '0'}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Filter Sidebar */}
        <div className="lg:col-span-1 sticky top-20">
          <MemberFilterSidebar
            filters={filters}
            options={filterOptions}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>

        {/* Member Cards Grid Container */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Header Stats Bar */}
          <div className="bg-white rounded-lg px-4 py-2.5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              {loading ? (
                <span className="text-primary font-medium animate-pulse">Loading alumni directory...</span>
              ) : (
                <span>
                  Showing <strong className="text-slate-900">{members.length > 0 ? (data.page - 1) * data.limit + 1 : 0}</strong> - <strong className="text-slate-900">{Math.min(data.page * data.limit, data.total)}</strong> of <strong className="text-primary">{data.total.toLocaleString()}</strong> records
                </span>
              )}
            </div>

            {data.totalPages > 1 && (
              <div className="text-slate-400">
                Page {data.page} of {data.totalPages}
              </div>
            )}
          </div>

          {/* Cards Grid / Error / Empty States */}
          {error ? (
            <div className="bg-white rounded-xl p-8 text-center border border-red-200 max-w-md mx-auto space-y-3">
              <Users className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">{error}</h3>
              <button
                onClick={() => handleFilterChange(filters)}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg transition-all duration-200 cursor-pointer shadow-2xs"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white animate-pulse h-64 rounded-lg border border-slate-200" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-slate-200 max-w-md mx-auto space-y-3 shadow-xs">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No records available</h3>
              <p className="text-xs text-slate-500">
                No alumni match your current search terms or filter criteria.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg transition-all duration-200 cursor-pointer shadow-2xs"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr">
              {members.map((member) => (
                <MemberCard
                  key={member._id || member.id}
                  member={member}
                  onSelectMember={handleSelectMember}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {data.totalPages > 1 && (
            <div className="bg-white rounded-lg p-3 border border-slate-200 flex items-center justify-between shadow-xs">
              <button
                onClick={() => handlePageChange(data.page - 1)}
                disabled={!data.hasPrev || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-primary-soft hover:text-primary hover:border-primary disabled:opacity-40 text-slate-700 font-semibold text-xs rounded-md transition-colors cursor-pointer border border-slate-200"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1 overflow-x-auto px-2">
                {Array.from({ length: Math.min(7, data.totalPages) }, (_, i) => {
                  let pNum = i + 1;
                  if (data.totalPages > 7) {
                    if (data.page > 4) {
                      pNum = data.page - 3 + i;
                    }
                    if (pNum > data.totalPages) {
                      pNum = data.totalPages - 6 + i;
                    }
                  }
                  const isCurrent = pNum === data.page;
                  return (
                    <button
                      key={pNum}
                      onClick={() => handlePageChange(pNum)}
                      className={`w-7 h-7 rounded-md font-semibold text-xs transition-colors ${
                        isCurrent
                          ? 'bg-primary text-white shadow-2xs'
                          : 'bg-white hover:bg-primary-soft hover:text-primary text-slate-700 border border-slate-200'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(data.page + 1)}
                disabled={!data.hasNext || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-primary-soft hover:text-primary hover:border-primary disabled:opacity-40 text-slate-700 font-semibold text-xs rounded-md transition-colors cursor-pointer border border-slate-200"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
};
