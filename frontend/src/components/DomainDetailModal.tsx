import React from 'react';
import { X, Calendar, Clock, User, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import type { DomainData } from '../data/webinarData';

interface DomainDetailModalProps {
  domain: DomainData | null;
  onClose: () => void;
}

export const DomainDetailModal: React.FC<DomainDetailModalProps> = ({
  domain,
  onClose,
}) => {
  if (!domain) return null;

  const completionPercentage = domain.planned > 0 ? Math.round((domain.conducted / domain.planned) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      {/* Modal Card Container */}
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 bg-white border-b border-slate-200 flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
          <div>
            <span className="text-xs font-semibold text-primary tracking-wider uppercase mb-1 block">
              Domain Schedule & Overview
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {domain.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Stat Summary Strip */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Planned</span>
              <span className="text-xl font-bold text-primary">{domain.planned}</span>
            </div>
            <div className="text-center border-x border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Conducted</span>
              <span className="text-xl font-bold text-emerald-700">{domain.conducted}</span>
            </div>
            <div className="text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Completion</span>
              <span className="text-xl font-bold text-primary">{completionPercentage}%</span>
            </div>
          </div>

          {/* Webinar List */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>Webinar Sessions ({domain.webinars.length})</span>
            </h3>

            {domain.webinars.length > 0 ? (
              <div className="space-y-3">
                {domain.webinars.map((webinar) => (
                  <div
                    key={webinar.id}
                    className="p-4 bg-white rounded-lg border border-slate-200 space-y-2.5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {webinar.title}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                          webinar.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : webinar.status === 'upcoming'
                            ? 'bg-primary-soft text-primary border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {webinar.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {webinar.status === 'postponed' && <AlertCircle className="w-3 h-3 text-amber-600" />}
                        <span className="capitalize">{webinar.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span>{webinar.speaker} ({webinar.speakerRole})</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Building className="w-3.5 h-3.5 text-primary" />
                        <span>{webinar.company}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{webinar.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{webinar.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-xs">
                Detailed webinar records for this phase are archived.
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-md text-xs transition-all duration-200 shadow-2xs cursor-pointer"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};
