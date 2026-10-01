import React from 'react';
import { Search, Filter, RotateCcw, Building2, MapPin, GraduationCap, Calendar, Tag } from 'lucide-react';
import type { MemberFilterParams, MemberFilterOptions } from '../../types';

interface MemberFilterSidebarProps {
  filters: MemberFilterParams;
  options: MemberFilterOptions;
  onChange: (newFilters: MemberFilterParams) => void;
  onClear: () => void;
}

export const MemberFilterSidebar: React.FC<MemberFilterSidebarProps> = ({
  filters,
  options,
  onChange,
  onClear
}) => {
  const handleInputChange = (field: keyof MemberFilterParams, value: string) => {
    onChange({
      ...filters,
      [field]: value || undefined,
      page: 1 // Reset to page 1 on filter change
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.stream || filters.course || filters.endYear || filters.city || filters.company || filters.skill
  );

  return (
    <div className="bg-white rounded-lg p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
      
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-primary">Filter Directory</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-900 flex items-center gap-1">
          <Search className="w-3.5 h-3.5 text-primary" />
          Search Alumni
        </label>
        <input
          type="text"
          placeholder="Name, company, keyword..."
          value={filters.search || ''}
          onChange={(e) => handleInputChange('search', e.target.value)}
          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Department / Stream Filter */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-900 flex items-center gap-1">
          <GraduationCap className="w-3.5 h-3.5 text-primary" />
          Department / Branch
        </label>
        <select
          value={filters.stream || ''}
          onChange={(e) => handleInputChange('stream', e.target.value)}
          className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
        >
          <option value="">All Branches</option>
          {options.streams.map((st) => (
            <option key={st.name} value={st.name}>
              {st.name} ({st.count})
            </option>
          ))}
        </select>
      </div>

      {/* Graduation Year Filter */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-900 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          Graduation Year
        </label>
        <select
          value={filters.endYear || ''}
          onChange={(e) => handleInputChange('endYear', e.target.value)}
          className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
        >
          <option value="">All Batches</option>
          {options.graduationYears.map((yr) => (
            <option key={yr} value={yr}>
              Batch of {yr}
            </option>
          ))}
        </select>
      </div>

      {/* Course Filter */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-900 flex items-center gap-1">
          <GraduationCap className="w-3.5 h-3.5 text-primary" />
          Degree / Course
        </label>
        <select
          value={filters.course || ''}
          onChange={(e) => handleInputChange('course', e.target.value)}
          className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
        >
          <option value="">All Degrees</option>
          {options.courses.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
      </div>

      {/* Location Filter */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-900 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          Location / City
        </label>
        <select
          value={filters.city || ''}
          onChange={(e) => handleInputChange('city', e.target.value)}
          className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
        >
          <option value="">All Locations</option>
          {options.cities.map((ct) => (
            <option key={ct.name} value={ct.name}>
              {ct.name} ({ct.count})
            </option>
          ))}
        </select>
      </div>

      {/* Company Filter */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-900 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          Organization
        </label>
        <select
          value={filters.company || ''}
          onChange={(e) => handleInputChange('company', e.target.value)}
          className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
        >
          <option value="">All Organizations</option>
          {options.companies.map((cp) => (
            <option key={cp.name} value={cp.name}>
              {cp.name} ({cp.count})
            </option>
          ))}
        </select>
      </div>

      {/* Skill Input */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-900 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-primary" />
          Skill / Domain
        </label>
        <input
          type="text"
          placeholder="e.g. Python, VLSI, Cloud..."
          value={filters.skill || ''}
          onChange={(e) => handleInputChange('skill', e.target.value)}
          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

    </div>
  );
};
