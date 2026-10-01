import React, { useState, useEffect } from 'react';
import { Mail, Phone, Shield, User as UserIcon, Edit3, Check, AlertCircle, GraduationCap, Briefcase, MapPin, Calendar, CheckCircle2, HeartHandshake, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchJsonSafely } from '../utils/api';

export const ProfilePage: React.FC = () => {
  const { user, token, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    mobile: user?.mobile || '',
    profileImage: user?.profileImage || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        mobile: user.mobile || '',
        profileImage: user.profileImage || ''
      });
    }
  }, [user]);

  // Fetch fresh profile on mount
  useEffect(() => {
    if (token) {
      fetchJsonSafely('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.ok && res.data?.user) {
          updateUser(res.data.user);
        }
      }).catch(() => {});
    }
  }, [token]);

  if (!user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      const res = await fetchJsonSafely('/api/users/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok && res.data?.user) {
        updateUser(res.data.user);
        setSuccessMsg('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setError(res.data?.error || 'Failed to update profile.');
      }
    } catch (err) {
      setError('Network error. Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Safe Member Since Date Parser
  const getMemberSince = () => {
    if (user.createdAt) {
      const d = new Date(user.createdAt);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    }
    const regDate = user.alumniProfile?.membershipDetails?.[0]?.registeredOn;
    if (regDate) {
      const d = new Date(regDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    }
    return 'Official Member';
  };

  const ap = user.alumniProfile;
  const edu = ap?.educationDetails?.[0];
  const work = ap?.workDetails?.find(w => w.currentCompany) || ap?.workDetails?.[0];
  const loc = ap?.contactDetails?.currentLocation;
  const otherMap = new Map((ap?.other || []).map(o => [o.key, o.value]));

  const chapter = otherMap.get('Chapter') || 'Kovilpatti';
  const mentorPref = otherMap.get('Would you like to Mentor the Student') || 'Yes';
  const scholarshipPref = otherMap.get('Do you want to contribute to scholarships for students') || 'Yes';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
        
        {/* Profile Header */}
        <div className="pb-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.fullName}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary text-white font-bold text-2xl flex items-center justify-center shadow-2xs">
                  {user.fullName?.charAt(0) || 'U'}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {ap?.basic?.name || user.fullName}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase bg-primary-soft text-primary border border-purple-200">
                  {user.role}
                </span>
                {ap && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-md border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Alumni
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Member since {getMemberSince()}</span>
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-primary-soft text-slate-700 hover:text-primary hover:border-primary font-semibold text-xs rounded-lg border border-slate-200 transition-all duration-200 cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-primary" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Profile Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wide">
              Update Account Information
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="e.g. +91 93611 23899"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                Profile Image URL
              </label>
              <input
                type="url"
                name="profileImage"
                value={formData.profileImage}
                onChange={handleChange}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg transition-all duration-200 flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    fullName: user.fullName || '',
                    mobile: user.mobile || '',
                    profileImage: user.profileImage || ''
                  });
                }}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <span>Cancel</span>
              </button>
            </div>
          </form>
        ) : (
          /* Profile Details Cards Layout */
          <div className="space-y-5">
            
            {/* Account Basics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-white border border-slate-200 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                    Full Name
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {ap?.basic?.name || user.fullName}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-white border border-slate-200 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                    Email Address
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {user.email}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-white border border-slate-200 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                    Mobile Number
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {user.mobile || ap?.contactDetails?.mobile || 'Not provided'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-white border border-slate-200 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                    Account Status & Role
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    Active Verified ({user.role})
                  </span>
                </div>
              </div>
            </div>

            {/* Comprehensive Verified Alumni Database Card */}
            {ap && (
              <div className="bg-white rounded-lg p-5 border border-slate-200 space-y-4 shadow-xs">
                
                {/* Banner Title Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-primary">
                      Verified Institutional Alumni Record
                    </h3>
                  </div>

                  <span className="px-2 py-0.5 bg-primary-soft text-primary text-[10px] font-bold rounded-md border border-purple-200 uppercase">
                    Matched By Email
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  
                  {/* Basic Info */}
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-0.5">
                    <span className="text-slate-500 font-semibold uppercase text-[10px] block">
                      Name & Record ID
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      {ap.basic?.salutation ? `${ap.basic.salutation} ` : ''}
                      {ap.basic?.name || user.fullName}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      ID: #{ap.id || ap._id}
                    </p>
                  </div>

                  {/* Education Details */}
                  {edu && (
                    <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-0.5">
                      <span className="text-slate-500 font-semibold uppercase text-[10px] flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-primary" />
                        Degree & Education
                      </span>
                      <p className="text-xs font-bold text-slate-900">
                        {edu.course} {edu.stream ? `— ${edu.stream}` : ''}
                      </p>
                      {edu.endYear && (
                        <p className="text-[11px] font-semibold text-primary">
                          Batch of {edu.endYear}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Work Experience */}
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-0.5">
                    <span className="text-slate-500 font-semibold uppercase text-[10px] flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-primary" />
                      Organization & Role
                    </span>
                    {work ? (
                      <>
                        <p className="text-xs font-bold text-slate-900">
                          {work.position || 'Position Not Specified'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {work.company || 'Company Not Specified'}
                        </p>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        Work records not specified
                      </p>
                    )}
                  </div>

                  {/* Location & Chapter */}
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-0.5">
                    <span className="text-slate-500 font-semibold uppercase text-[10px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      Location & Chapter
                    </span>
                    <p className="text-xs font-bold text-slate-900">
                      {[loc?.city, loc?.country].filter(Boolean).join(', ') || loc?.location || 'India'}
                    </p>
                    {chapter && (
                      <p className="text-[11px] text-slate-400">
                        Chapter: {chapter}
                      </p>
                    )}
                  </div>

                </div>

                {/* Alumni Engagement */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <div className="px-2.5 py-1 bg-slate-50 rounded-md border border-slate-200 flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5 text-primary" />
                    <span>Mentorship: <strong className="text-slate-900">{mentorPref}</strong></span>
                  </div>

                  <div className="px-2.5 py-1 bg-slate-50 rounded-md border border-slate-200 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-primary" />
                    <span>Scholarship Support: <strong className="text-slate-900">{scholarshipPref}</strong></span>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

