import React, { useState } from 'react';
import { X, GraduationCap, Briefcase, MapPin, ExternalLink, Calendar, User, Building2, CheckCircle2 } from 'lucide-react';
import type { Member, EducationDetail, WorkDetail } from '../../types';

interface MemberDetailModalProps {
  member: Member | null;
  onClose: () => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ member, onClose }) => {
  const [imgError, setImgError] = useState(false);

  if (!member) return null;

  const basic: NonNullable<Member['basic']> = member.basic || { name: 'Alumni Member' };
  const name = basic.name || 'Alumni Member';
  const salutation = basic.salutation ? `${basic.salutation} ` : '';
  const fullName = `${salutation}${name}`;
  const gender = basic.gender || 'Not specified';
  const label = basic.label || 'Alumni';

  const photoUrl = !imgError && (member.pictures?.full || member.pictures?.profile || member.pictures?.thumb);

  // Education list
  const educationList: EducationDetail[] = Array.isArray(member.educationDetails) ? member.educationDetails : [];

  // Work experience list
  const workList: WorkDetail[] = Array.isArray(member.workDetails) ? member.workDetails : [];

  // Professional details
  const prof = member.professionalDetails || {};
  const skills = Array.isArray(prof.skills) ? prof.skills : [];
  const industries = Array.isArray(prof.industries) ? prof.industries : [];
  const roles = Array.isArray(prof.roles) ? prof.roles : [];
  const expYears = prof.experienceYears || 0;

  // Location
  const loc = member.contactDetails?.currentLocation || {};
  const locationStr = [loc.city, loc.country].filter(Boolean).filter(c => c !== 'Unknown').join(', ') || loc.location || 'Not specified';

  // Social Links
  const rawLinks = basic.profileLinks || {};
  const validSocialLinks = [
    { name: 'LinkedIn', url: rawLinks.linkedin, color: 'text-primary bg-primary-soft hover:bg-primary-light border-purple-200' },
    { name: 'Twitter', url: rawLinks.twitter, color: 'text-primary bg-primary-soft hover:bg-primary-light border-purple-200' },
    { name: 'Facebook', url: rawLinks.facebook, color: 'text-primary bg-primary-soft hover:bg-primary-light border-purple-200' },
    { name: 'Website', url: rawLinks.website, color: 'text-primary bg-primary-soft hover:bg-primary-light border-purple-200' },
    { name: 'YouTube', url: rawLinks.youtube, color: 'text-primary bg-primary-soft hover:bg-primary-light border-purple-200' },
    { name: 'Instagram', url: rawLinks.instagram, color: 'text-primary bg-primary-soft hover:bg-primary-light border-purple-200' }
  ].filter(link => Boolean(link.url && link.url.trim() && link.url.startsWith('http')));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-lg shadow-xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-slate-900">Alumni Profile Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          
          {/* Top Profile Summary */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="relative shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={fullName}
                  onError={() => setImgError(true)}
                  className="w-20 h-20 rounded-lg object-cover border border-slate-200 shadow-2xs"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-2xs">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                {fullName}
              </h1>
              
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary-soft rounded-md text-xs font-semibold text-primary border border-purple-200">
                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                <span>{label}</span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-600 pt-1">
                {locationStr && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" />
                    {locationStr}
                  </span>
                )}
                {expYears > 0 && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-primary" />
                    {expYears} Years Experience
                  </span>
                )}
                {gender && gender !== 'Not specified' && (
                  <span className="capitalize">
                    Gender: {gender}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          {validSocialLinks.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wide">
                External Profiles & Links
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {validSocialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${link.color}`}
                  >
                    <span>{link.name}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Education Details Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <GraduationCap className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-primary uppercase tracking-wide">Education Background</h3>
            </div>

            {educationList.length > 0 ? (
              <div className="space-y-2">
                {educationList.map((edu, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-md p-3 space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900">
                      {edu.course || 'Degree'} {edu.stream ? `— ${edu.stream}` : ''}
                    </h4>
                    {edu.institution && (
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-primary" />
                        {edu.institution}
                      </p>
                    )}
                    {(edu.startYear || edu.endYear) && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {edu.startYear || 'N/A'} - {edu.endYear || 'Present'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                Education records not available
              </p>
            )}
          </div>

          {/* Work Experience Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <Briefcase className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-primary uppercase tracking-wide">Professional Experience</h3>
            </div>

            {workList.length > 0 ? (
              <div className="space-y-2">
                {workList.map((work, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-md p-3 space-y-0.5 relative">
                    {work.currentCompany && (
                      <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Current
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-slate-900">
                      {work.position || 'Position'}
                    </h4>
                    <p className="text-xs text-primary font-medium">
                      {work.company || 'Company'}
                      {work.department ? ` (${work.department})` : ''}
                    </p>
                    {(work.startYear || work.endYear) && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {work.startYear || 'N/A'} - {work.currentCompany ? 'Present' : (work.endYear || 'N/A')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                Work experience records not available
              </p>
            )}
          </div>

          {/* Skills & Domains */}
          {(skills.length > 0 || industries.length > 0 || roles.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wide">Skills & Expertise</h3>
              </div>

              {skills.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-[11px] font-semibold text-slate-600">Key Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {skills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-primary-soft text-primary text-[11px] font-medium rounded border border-purple-200"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {industries.length > 0 && (
                <div className="space-y-1 pt-1">
                  <h4 className="text-[11px] font-semibold text-slate-600">Industries</h4>
                  <div className="flex flex-wrap gap-1">
                    {industries.map((ind, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[11px] rounded border border-slate-200"
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            National Engineering College Alumni Record
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-md transition-all duration-200 cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>

      </div>

    </div>
  );
};
