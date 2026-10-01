import React, { useState } from 'react';
import type { DomainData } from '../data/webinarData';
import { DomainCard } from './DomainCard';
import { Search } from 'lucide-react';

interface DomainGridProps {
  domains: DomainData[];
  onSelectDomain: (domain: DomainData) => void;
}

export const DomainGrid: React.FC<DomainGridProps> = ({
  domains,
  onSelectDomain,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDomains = domains.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto my-8">
      {/* Search / Filter Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 px-1">
        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="text-primary font-bold">{filteredDomains.length}</span> Domains
        </div>
        
        {/* Quick Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* 3-Column Desktop / 2-Column Tablet / 1-Column Mobile Layout */}
      {filteredDomains.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDomains.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              onClick={onSelectDomain}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-12 text-center border border-slate-200 max-w-md mx-auto my-8 shadow-xs">
          <p className="text-slate-600 text-sm font-medium">No domains found matching "{searchQuery}".</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-2 bg-primary-soft hover:bg-primary-light text-primary font-semibold rounded-md text-xs transition-colors border border-purple-200 cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
};
