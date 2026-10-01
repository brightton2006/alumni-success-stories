import React, { useState } from 'react';
import { MapPin, GraduationCap, Briefcase, ArrowRight } from 'lucide-react';
import type { Member, EducationDetail, WorkDetail } from '../../types';

interface MemberCardProps {
  member: Member;
  onSelectMember?: (member: Member) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onSelectMember }) => {
  const [imgError, setImgError] = useState(false);

  const name = member.basic?.name || 'Alumni Member';
  const salutation = member.basic?.salutation ? `${member.basic.salutation} ` : '';
  const fullName = `${salutation}${name}`;

  // Image selection
  const photoUrl = !imgError && (member.pictures?.thumb || member.pictures?.profile || member.pictures?.full);

  // Education details
  const edu: Partial<EducationDetail> = member.educationDetails?.[0] || {};
  const course = edu.course || member.searchHelper?.course || '';
  const stream = edu.stream || member.searchHelper?.stream || '';
  const endYear = edu.endYear || member.searchHelper?.endYear || null;

  const eduLabel = [course, stream].filter(Boolean).join(' • ') || member.basic?.label || 'Alumni';

  // Work details
  const work: Partial<WorkDetail> = member.workDetails?.find(w => w.currentCompany) || member.workDetails?.[0] || {};
  const company = work.company || member.searchHelper?.company || '';
  const position = work.position || member.searchHelper?.position || '';

  let workLabel = '';
  if (position && company) {
    workLabel = `${position} at ${company}`;
  } else if (company) {
    workLabel = company;
  } else if (position) {
    workLabel = position;
  }

  // Location
  const city = member.contactDetails?.currentLocation?.city || member.searchHelper?.city || '';
  const country = member.contactDetails?.currentLocation?.country || '';
  const locationLabel = [city, country].filter(Boolean).filter(c => c !== 'Unknown').join(', ');

  // Skills tags preview
  const skills = member.professionalDetails?.skills || member.searchHelper?.skills || [];
  const topSkills = skills.slice(0, 3);

  return (
    <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs flex flex-col justify-between h-full transition-all hover:border-primary/40 hover:shadow-md group">
      
      <div className="flex flex-col flex-1 space-y-3">
        
        {/* Header Avatar & Basic Info */}
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={fullName}
                onError={() => setImgError(true)}
                loading="lazy"
                className="w-14 h-14 rounded-lg object-cover border border-slate-200"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg shadow-2xs">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            {endYear && (
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-primary text-white text-[9px] font-bold rounded border border-white">
                '{String(endYear).slice(-2)}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-primary transition-colors truncate">
              {fullName}
            </h3>
            
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary mt-0.5">
              <GraduationCap className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span className="truncate">{eduLabel}</span>
            </div>

            {endYear && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Batch of {endYear}
              </p>
            )}
          </div>
        </div>

        {/* Work Experience */}
        {workLabel ? (
          <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-md border border-slate-200">
            <Briefcase className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {position || 'Position'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {company || 'Company'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-2 rounded-md border border-slate-200">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Work experience not specified</span>
          </div>
        )}

        {/* Location & Skills */}
        <div className="space-y-1.5 pt-0.5">
          {locationLabel && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <MapPin className="w-3 h-3 text-primary shrink-0" />
              <span className="truncate">{locationLabel}</span>
            </div>
          )}

          {topSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {topSkills.map((sk, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-primary-soft text-primary text-[10px] font-medium rounded border border-purple-200"
                >
                  {sk}
                </span>
              ))}
              {skills.length > 3 && (
                <span className="px-1 py-0.5 text-slate-400 text-[10px]">
                  +{skills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Footer Action Button */}
      <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          ID: {member.id?.slice(-6) || 'Member'}
        </span>

        <button
          onClick={() => onSelectMember && onSelectMember(member)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary-soft hover:bg-primary text-primary hover:text-white font-semibold text-xs transition-colors duration-150 cursor-pointer shadow-2xs"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

    </div>
  );
};
