import React, { useState, useEffect } from 'react';
import {
  Edit3,
  Check,
  AlertCircle,
  GraduationCap,
  Briefcase,
  MapPin,
  CheckCircle2,
  Award,
  Building2,
  Sparkles,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchJsonSafely } from '../utils/api';

export const DESIGNATIONS = [
  'Software Engineer',
  'Senior Software Engineer',
  'Data Engineer',
  'Data Scientist / AI Specialist',
  'Entrepreneur / Founder',
  'Researcher / Scientist',
  'Faculty Member / Professor',
  'Product Manager',
  'Engineering Manager',
  'Consultant',
  'Civil / Mechanical Engineer',
  'Student / Scholar',
  'Other'
];

export const ProfilePage: React.FC = () => {
  const { user, token, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    profileImage: '',
    designation: '',
    organization: '',
    department: '',
    graduationYear: '',
    location: '',
    bio: '',
    contactPrivacy: 'SHOW_ALL'
  });

  const [achievements, setAchievements] = useState<Array<{ id?: string; title: string; category?: string; year?: string | number; description?: string }>>([]);
  const [newAchievement, setNewAchievement] = useState({ title: '', category: 'Career Milestone', year: new Date().getFullYear().toString(), description: '' });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const ap = user.alumniProfile;
      const work = ap?.workDetails?.find(w => w.currentCompany) || ap?.workDetails?.[0];
      const edu = ap?.educationDetails?.[0];
      const loc = ap?.contactDetails?.currentLocation;

      setFormData({
        fullName: user.fullName || ap?.basic?.name || '',
        mobile: user.mobile || ap?.contactDetails?.mobile || '',
        profileImage: user.profileImage || ap?.pictures?.profile || '',
        designation: user.designation || work?.position || 'Alumni Member',
        organization: user.organization || user.company || work?.company || '',
        department: user.department || user.stream || edu?.stream || edu?.course || '',
        graduationYear: user.graduationYear ? String(user.graduationYear) : (edu?.endYear ? String(edu.endYear) : ''),
        location: user.location || (loc?.city ? `${loc.city}, ${loc.country || ''}`.replace(/,\s*$/, '') : ''),
        bio: user.bio || '',
        contactPrivacy: user.contactPrivacy || 'SHOW_ALL'
      });

      if (Array.isArray(user.achievements)) {
        setAchievements(user.achievements);
      }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddAchievement = () => {
    if (!newAchievement.title.trim()) return;
    setAchievements([...achievements, { ...newAchievement, id: `ach_${Date.now()}` }]);
    setNewAchievement({ title: '', category: 'Career Milestone', year: new Date().getFullYear().toString(), description: '' });
  };

  const handleRemoveAchievement = (idx: number) => {
    setAchievements(achievements.filter((_, i) => i !== idx));
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
      const payload = {
        ...formData,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : null,
        achievements
      };

      const res = await fetchJsonSafely('/api/users/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok && res.data?.user) {
        updateUser(res.data.user);
        setSuccessMsg('Profile & Alumni recognition details updated successfully!');
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

  const getMemberSince = () => {
    if (user.createdAt) {
      const d = new Date(user.createdAt);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    }
    return 'Official Member';
  };

  const ap = user.alumniProfile;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
        
        {/* Profile Header Banner */}
        <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {formData.profileImage || user.profileImage ? (
                <img
                  src={formData.profileImage || user.profileImage}
                  alt={formData.fullName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-primary-light shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white font-extrabold text-3xl flex items-center justify-center shadow-md">
                  {formData.fullName?.charAt(0) || 'U'}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {formData.fullName || user.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-primary-soft text-primary border border-purple-200">
                  {user.role}
                </span>
                {ap && (
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-md border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Alumni
                  </span>
                )}
              </div>

              <p className="text-xs font-semibold text-primary">
                {formData.designation || 'Alumni Member'} {formData.organization ? `at ${formData.organization}` : ''}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                {formData.graduationYear && (
                  <span className="flex items-center gap-1 font-medium">
                    <GraduationCap className="w-3.5 h-3.5 text-primary" />
                    Batch of {formData.graduationYear} {formData.department ? `(${formData.department})` : ''}
                  </span>
                )}
                {formData.location && (
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {formData.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-hover font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile & Recognition</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Profile Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-6 pt-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Alumni Identity & Recognition Form</span>
              </h3>
              <span className="text-[11px] text-slate-400">Updates sync across portal</span>
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Designation / Profession *</label>
                <input
                  type="text"
                  name="designation"
                  placeholder="e.g. Software Engineer, Data Engineer, Entrepreneur"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Organization / Current Company</label>
                <input
                  type="text"
                  name="organization"
                  placeholder="e.g. Google, Microsoft, Startup, University"
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Department / Branch</label>
                <input
                  type="text"
                  name="department"
                  placeholder="e.g. CSE, ECE, Mechanical, IT"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Graduation Year</label>
                <input
                  type="number"
                  name="graduationYear"
                  placeholder="e.g. 2024"
                  value={formData.graduationYear}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Location / City</label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Chennai, Bangalore, San Jose"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Mobile Number</label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="+91 93611 23899"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Profile Photo URL</label>
                <input
                  type="url"
                  name="profileImage"
                  placeholder="https://example.com/photo.jpg"
                  value={formData.profileImage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">Professional Bio / Career Overview</label>
              <textarea
                name="bio"
                rows={3}
                placeholder="Share a short overview of your career trajectory, domain expertise, and contributions..."
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Achievements & Milestones */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-primary" />
                <span>Professional Achievements & Milestones</span>
              </h4>

              {achievements.length > 0 && (
                <div className="space-y-2">
                  {achievements.map((ach, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">{ach.title} <span className="text-[10px] text-primary font-semibold">({ach.year})</span></p>
                        <p className="text-[11px] text-slate-500">{ach.description || ach.category}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAchievement(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Achievement Title (e.g. Published IEEE Paper)"
                  value={newAchievement.title}
                  onChange={e => setNewAchievement({ ...newAchievement, title: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Year (e.g. 2024)"
                  value={newAchievement.year}
                  onChange={e => setNewAchievement({ ...newAchievement, year: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md"
                />
                <button
                  type="button"
                  onClick={handleAddAchievement}
                  className="px-3 py-1.5 bg-primary text-white font-bold rounded-md flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Achievement</span>
                </button>
              </div>
            </div>

            {/* Privacy Setting */}
            <div>
              <label className="block font-bold text-slate-900 mb-1">Contact Privacy Setting</label>
              <select
                name="contactPrivacy"
                value={formData.contactPrivacy}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              >
                <option value="SHOW_ALL font-medium">Show Contact Info to Verified Portal Members</option>
                <option value="HIDE_MOBILE">Hide Mobile Number</option>
                <option value="HIDE_ALL">Hide Contact Details (Platform Requests Only)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* Profile Overview Display */
          <div className="space-y-6">
            
            {/* Professional Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white text-primary flex items-center justify-center font-bold shadow-2xs border border-slate-200">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Designation</span>
                  <span className="text-xs font-extrabold text-slate-900">{formData.designation || 'Not provided'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white text-primary flex items-center justify-center font-bold shadow-2xs border border-slate-200">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Organization</span>
                  <span className="text-xs font-extrabold text-slate-900">{formData.organization || 'Not provided'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white text-primary flex items-center justify-center font-bold shadow-2xs border border-slate-200">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Graduation Batch</span>
                  <span className="text-xs font-extrabold text-slate-900">
                    {formData.graduationYear ? `Batch of ${formData.graduationYear}` : 'Not provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            {formData.bio && (
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1">
                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>About & Career Trajectory</span>
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">{formData.bio}</p>
              </div>
            )}

            {/* Achievements List */}
            {achievements.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-primary" />
                  <span>Professional Achievements & Career Milestones</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {achievements.map((ach, idx) => (
                    <div key={idx} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{ach.title}</span>
                        {ach.year && <span className="text-[10px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded">{ach.year}</span>}
                      </div>
                      {ach.description && <p className="text-[11px] text-slate-500">{ach.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact & Verification Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900">Contact & Institutional Access</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                <p>Email: <strong className="text-slate-900">{user.email}</strong></p>
                <p>Mobile: <strong className="text-slate-900">{user.mobile || 'Not provided'}</strong></p>
                <p>Member Since: <strong className="text-slate-900">{getMemberSince()}</strong></p>
                <p>Visibility Preference: <strong className="text-slate-900">{formData.contactPrivacy}</strong></p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
