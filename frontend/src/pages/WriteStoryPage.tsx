import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Send, Save, ArrowLeft, AlertCircle, CheckCircle, PenTool, ShieldCheck } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { LoadingAnalyzer } from '../components/story/LoadingAnalyzer';
import type { Category, Story } from '../types';

import { fetchJsonSafely, getMockCategories } from '../utils/api';

export const WriteStoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [categories, setCategories] = useState<Category[]>(() => getMockCategories());
  const [formData, setFormData] = useState({
    personName: '',
    storyTitle: '',
    profession: '',
    location: '',
    category: 'Innovation',
    fullStory: '',
    beneficiaryName: '',
    beneficiaryBatch: '',
    supporterName: '',
    supporterBatch: '',
    storyRole: 'BOTH'
  });

  const [loadingStory, setLoadingStory] = useState(Boolean(id));
  const [existingStory, setExistingStory] = useState<Story | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittingType, setSubmittingType] = useState<'draft' | 'verify' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id && user) {
      const ap = user.alumniProfile;
      const autoName = ap?.basic?.name || user.fullName || '';
      const autoProfession = ap?.workDetails?.[0]?.position || (ap as any)?.position || (ap as any)?.work_details?.[0]?.position || user.designation || '';
      const autoLocation = ap?.contactDetails?.currentLocation?.city || (ap as any)?.location || user.location || '';
      
      setFormData(prev => ({
        ...prev,
        personName: prev.personName || autoName,
        profession: prev.profession || autoProfession,
        location: prev.location || autoLocation
      }));
    }
  }, [id, user]);

  useEffect(() => {
    fetchJsonSafely('/api/categories')
      .then(res => {
        if (res.ok && Array.isArray(res.data?.categories) && res.data.categories.length > 0) {
          setCategories(res.data.categories);
        }
      })
      .catch(err => console.error(err));

    if (id) {
      fetchJsonSafely(`/api/stories/my/${id}`)
        .then(res => {
          if (res.ok && res.data?.story) {
            const story = res.data.story;
            setExistingStory(story);
            setFormData({
              personName: story.personName || '',
              storyTitle: story.storyTitle || '',
              profession: story.profession || '',
              location: story.location || '',
              category: story.category || 'Innovation',
              fullStory: story.fullStory || '',
              beneficiaryName: story.beneficiaryName || '',
              beneficiaryBatch: story.beneficiaryBatch || '',
              supporterName: story.supporterName || '',
              supporterBatch: story.supporterBatch || '',
              storyRole: story.storyRole || 'BOTH'
            });
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingStory(false));
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (submitImmediate: boolean) => {
    const fullStoryText = formData.fullStory.trim();
    if (!fullStoryText) {
      setError('Please write your complete story paragraph.');
      return;
    }

    const personName = formData.personName.trim() || user?.fullName || 'Inspiring Alumnus';
    const storyTitle = formData.storyTitle.trim() || (fullStoryText.split('.')[0]?.slice(0, 60) || 'Journey Story');

    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);
    setSubmittingType(submitImmediate ? 'verify' : 'draft');
    if (submitImmediate) setIsAnalyzing(true);

    try {
      const isEdit = Boolean(id || existingStory?.id);
      const targetId = id || existingStory?.id;
      const endpoint = isEdit ? `/api/stories/my/${targetId}` : '/api/stories';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetchJsonSafely(endpoint, {
        method,
        body: JSON.stringify({
          ...formData,
          personName,
          beneficiaryName: formData.beneficiaryName.trim(),
          beneficiaryBatch: formData.beneficiaryBatch.trim(),
          supporterName: formData.supporterName.trim(),
          supporterBatch: formData.supporterBatch.trim(),
          storyRole: formData.storyRole,
          storyTitle,
          authorMemberId: user?.alumniProfile?.id || null,
          batchYear: user?.alumniProfile?.educationDetails?.[0]?.endYear ? String(user.alumniProfile.educationDetails[0].endYear) : undefined,
          batchNumber: user?.alumniProfile?.educationDetails?.[0]?.endYear ? String(user.alumniProfile.educationDetails[0].endYear).slice(-2) : undefined,
          company: (user?.alumniProfile?.workDetails?.[0] as any)?.company || (user?.alumniProfile as any)?.company || undefined,
          role: formData.profession || (user?.alumniProfile?.workDetails?.[0] as any)?.position || undefined,
          personImage: user?.alumniProfile?.pictures?.profile || user?.profileImage || undefined,
          submitImmediate
        })
      });

      if (res.ok && res.data) {
        const savedStoryId = res.data.story?.id || targetId;

        // If editing and submitting for verification, trigger submit endpoint
        if (submitImmediate && isEdit) {
          await fetchJsonSafely(`/api/stories/${savedStoryId}/submit`, {
            method: 'POST'
          });
        }

        setSuccessMsg(submitImmediate ? 'Your success story has been submitted for verification.' : 'Story saved as draft.');
        setTimeout(() => {
          navigate('/my-stories');
        }, 1500);
      } else {
        setError(res.data?.error || 'Failed to save story.');
      }
    } catch (err) {
      setError('Network error saving story. Please try again.');
    } finally {
      setSubmitting(false);
      setIsAnalyzing(false);
    }
  };

  if (loadingStory) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center font-medium text-[#52606D]">
        Loading story details...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/my-stories"
          className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary-hover bg-white px-3.5 py-1.5 rounded-md border border-slate-200 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Stories</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="bg-white rounded-md p-6 sm:p-7 border border-slate-200 shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
        <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1.5 uppercase tracking-wider">
          <PenTool className="w-3.5 h-3.5 text-primary" />
          <span>Alumni Milestone Submission</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#172B3A]">
          {existingStory ? 'Edit & Resubmit Story' : 'Submit Alumni Success Story'}
        </h1>
        <p className="text-sm text-[#52606D] mt-1 max-w-2xl">
          Document your career milestones, entrepreneurial journey, or research achievements for publication in the alumni directory.
        </p>

        {existingStory?.adminFeedback && (
          <div className="mt-4 p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
            <span className="font-bold block text-amber-950 mb-1">Editorial Feedback / Requested Revisions:</span>
            {existingStory.adminFeedback}
          </div>
        )}

        {existingStory?.rejectionReason && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-rose-950">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Reviewer Decline / Rejection Rationale:</span>
            </div>
            <p className="text-slate-800 bg-white p-3 rounded-lg border border-rose-100 font-medium whitespace-pre-line leading-relaxed">
              {existingStory.rejectionReason}
            </p>
            <p className="text-[11px] text-slate-500">
              Please address this feedback in your story narrative below, then submit for verification.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Story Submission Form */}
      <div className="bg-[#FFFFFF] rounded-md p-6 sm:p-8 border border-[#D9DDE1] shadow-2xs space-y-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Person Name (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider">
                Alumni / Protagonist Name <span className="text-slate-400 font-normal text-[11px] normal-case">(Optional)</span>
              </label>
              <span className="text-[10px] text-primary font-medium flex items-center gap-1 bg-primary-soft px-1.5 py-0.5 rounded border border-purple-200">
                <ShieldCheck className="w-3 h-3 text-primary" />
                Admin Managed
              </span>
            </div>
            <input
              type="text"
              name="personName"
              placeholder="e.g. M. Brightton (optional - leave blank to remain anonymous)"
              value={formData.personName}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {/* Profession */}
          <div>
            <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider mb-1.5">
              Designation / Profession
            </label>
            <input
              type="text"
              name="profession"
              placeholder="e.g. Principal Architect, Tesla"
              value={formData.profession}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Story Title */}
        <div>
          <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider mb-1.5">
            Story Title / Headline *
          </label>
          <input
            type="text"
            name="storyTitle"
            required
            placeholder="e.g. Pioneering Clean Energy Solutions in Microgrid Systems"
            value={formData.storyTitle}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        {/* Beneficiary & Supporter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider">
                Beneficiary <span className="text-slate-400 font-normal text-[11px] normal-case">(Optional)</span>
              </label>
              <span className="text-[10px] text-primary font-medium flex items-center gap-1 bg-primary-soft px-1.5 py-0.5 rounded border border-purple-200">
                <ShieldCheck className="w-3 h-3 text-primary" />
                Admin Managed
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                name="beneficiaryName"
                placeholder="Beneficiary name"
                value={formData.beneficiaryName}
                onChange={handleChange}
                className="col-span-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <input
                type="text"
                name="beneficiaryBatch"
                placeholder="Batch (e.g. 26)"
                value={formData.beneficiaryBatch}
                onChange={handleChange}
                className="col-span-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider">
                Supporter <span className="text-slate-400 font-normal text-[11px] normal-case">(Optional)</span>
              </label>
              <span className="text-[10px] text-primary font-medium flex items-center gap-1 bg-primary-soft px-1.5 py-0.5 rounded border border-purple-200">
                <ShieldCheck className="w-3 h-3 text-primary" />
                Admin Managed
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                name="supporterName"
                placeholder="Supporter name"
                value={formData.supporterName}
                onChange={handleChange}
                className="col-span-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <input
                type="text"
                name="supporterBatch"
                placeholder="Batch (e.g. 24)"
                value={formData.supporterBatch}
                onChange={handleChange}
                className="col-span-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider mb-1.5">
              Current Location
            </label>
            <input
              type="text"
              name="location"
              placeholder="e.g. Kovilpatti"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider mb-1.5">
              Domain / Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Complete Original Story */}
        <div>
          <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider mb-1.5">
            Full Narrative / Achievement Story *
          </label>
          <textarea
            name="fullStory"
            required
            rows={9}
            placeholder="Document key background, career transitions, notable projects, leadership lessons, and words of advice for current students and fellow alumni..."
            value={formData.fullStory}
            onChange={handleChange}
            className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors leading-relaxed"
          />
        </div>

        {/* Submit Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#D9DDE1]">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="px-4 py-2 bg-[#FFFFFF] border border-[#D9DDE1] hover:bg-[#F1F1F1] text-[#172B3A] font-semibold text-xs rounded-md shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#52606D]" />
            <span>{submitting && submittingType === 'draft' ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-md shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-white" />
            <span>{submitting && submittingType === 'verify' ? 'Submitting Story...' : 'Submit Story for Verification'}</span>
          </button>
        </div>

      </div>

      {isAnalyzing && (
        <LoadingAnalyzer onComplete={() => {}} />
      )}

    </div>
  );
};
