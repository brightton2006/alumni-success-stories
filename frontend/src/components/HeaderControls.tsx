import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MoreVertical, RefreshCw, Download, Filter, Settings, Check, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

interface HeaderControlsProps {
  selectedPhase: string;
  onPhaseChange: (phase: string) => void;
  phasesList: string[];
  onRefresh?: () => void;
  onExport?: () => void;
}

export const HeaderControls: React.FC<HeaderControlsProps> = ({
  selectedPhase,
  onPhaseChange,
  phasesList,
  onRefresh,
  onExport
}) => {
  const { user } = useAuth();
  const { isConnected } = useRealtime();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(prev => prev ? false : prev);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(prev => prev ? false : prev);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full relative mb-6">
      {/* Top Bar with Top-Right Controls */}
      <div className="flex justify-end items-center gap-2.5 pt-2 pb-1 relative z-20">
        
        {/* Real-time DB Live Badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
          isConnected
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-600' : 'bg-amber-500'}`} />
          <Radio className="w-3 h-3" />
          <span>{isConnected ? 'Real-time Live' : 'Connecting...'}</span>
        </div>

        {/* Phase Select Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-primary rounded-md shadow-2xs transition-all duration-150 text-primary font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <span>{selectedPhase}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-primary transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Phase Dropdown Options */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-30">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                Select Phase
              </div>
              {phasesList.map((phase) => (
                <button
                  key={phase}
                  onClick={() => {
                    onPhaseChange(phase);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    selectedPhase === phase
                      ? 'bg-primary-soft text-primary font-semibold'
                      : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>{phase}</span>
                  {selectedPhase === phase && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Three-Dot Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 hover:border-primary rounded-md shadow-2xs text-primary hover:text-primary-hover transition-all duration-150 focus:outline-none cursor-pointer"
            aria-label="Options menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Three-Dot Menu Popover */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-30">
              <button
                onClick={() => {
                  onRefresh?.();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-primary-soft hover:text-primary flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Refresh Data</span>
              </button>
              <button
                onClick={() => {
                  onExport?.();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-primary-soft hover:text-primary flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Report (PDF)</span>
              </button>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-primary-soft hover:text-primary flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter Domains</span>
              </button>
              <div className="my-1 border-t border-slate-100"></div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-primary-soft hover:text-primary flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Dashboard Settings</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Heading */}
      <div className="text-center mt-3 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
          Welcome, {user?.fullName || 'Alumni Member'}
        </h1>
      </div>
    </div>
  );
};
