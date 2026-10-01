import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Brain, ArrowLeft, PenTool, CheckCircle, AlertCircle } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { LoadingAnalyzer } from '../../components/story/LoadingAnalyzer';
import type { Story, Category } from '../../types';

import { getMockCategories } from '../../utils/api';

export const AdminCreateStoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>(() => getMockCategories());

  const [formData, setFormData] = useState({
    personName: '',
    storyTitle: '',
    profession: '',
    location: '',
    category: 'Innovation',
    fullStory: ''
  });

  const [createdStory, setCreatedStory] = useState<Story | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStage, setAnalyzingStage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveDraft = async () => {
    if (!formData.personName || !formData.storyTitle || !formData.fullStory) {
      setError('Please fill in protagonist name, story title, and story narrative.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const token = localStorage.getItem('successstory_token') || localStorage.getItem('storymap_token');

    try {
      const endpoint = createdStory ? `/api/admin/stories/${createdStory.id}` : '/api/admin/stories';
      const method = createdStory ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        setCreatedStory(data.story);
        setSuccessMsg('Draft story saved successfully.');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(data.error || 'Failed to save draft.');
      }
    } catch (err) {
      setError('Network error saving draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAiVisualization = async () => {
    if (!formData.personName || !formData.storyTitle || !formData.fullStory) {
      setError('Please fill in protagonist name, story title, and full narrative before processing.');
      return;
    }

    const token = localStorage.getItem('successstory_token') || localStorage.getItem('storymap_token');

    // First save draft if not saved
    let storyId = createdStory?.id;
    if (!storyId) {
      const res = await fetch('/api/admin/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save story for processing.');
        return;
      }
      storyId = data.story.id;
      setCreatedStory(data.story);
    }

    // Trigger AI Loading Animation sequence
    setAnalyzingStage(true);
    setIsAnalyzing(true);

    try {
      const res = await fetch(`/api/admin/stories/${storyId}/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        setCreatedStory(data.story);
        setSuccessMsg('Story verified and processed successfully.');
        setTimeout(() => {
          navigate('/admin/stories');
        }, 1200);
      } else {
        setError(data.error || 'Story verification failed.');
      }
    } catch (err) {
      setError('Network error during story processing.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 py-6">
      <AdminSidebar />

      <main className="flex-1 space-y-6">
        
        {/* Header */}
        <div className="bg-[#FFFFFF] rounded-md p-6 sm:p-7 border border-[#D9DDE1] shadow-2xs relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              <PenTool className="w-3.5 h-3.5 text-primary" />
              <span>Direct Authoring</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#172B3A]">
              Create Alumni Story
            </h1>
            <p className="text-xs text-[#52606D] mt-0.5">
              Author an official alumni spotlight, extract career milestones, and prepare it for publication.
            </p>
          </div>

          <button
            onClick={() => navigate('/admin/stories')}
            className="px-3.5 py-1.5 bg-[#FFFFFF] border border-[#D9DDE1] text-[#52606D] text-xs font-semibold rounded-md flex items-center gap-1.5 hover:bg-[#F1F1F1] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#7A8793]" />
            <span>Cancel</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Story Creation Form */}
        <div className="bg-[#FFFFFF] rounded-md p-6 sm:p-8 shadow-2xs border border-[#D9DDE1] space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Person Name */}
            <div>
              <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider mb-1.5">
                Alumni / Protagonist Name *
              </label>
              <input
                type="text"
                name="personName"
                placeholder="e.g. Dr. Jane Doe"
                value={formData.personName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Profession / Role */}
            <div>
              <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider mb-1.5">
                Profession / Designation
              </label>
              <input
                type="text"
                name="profession"
                placeholder="e.g. Clean Energy Lead Architect"
                value={formData.profession}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
              placeholder="e.g. Pioneering Microgrid Solar Infrastructure for Rural Communities"
              value={formData.storyTitle}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider mb-1.5">
                Current Location
              </label>
              <input
                type="text"
                name="location"
                placeholder="e.g. Bangalore, India"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
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
              Complete Story Narrative *
            </label>
            <textarea
              name="fullStory"
              rows={9}
              placeholder="Write the complete narrative highlighting graduation background, milestone transitions, and technical innovations..."
              value={formData.fullStory}
              onChange={handleChange}
              className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#D9DDE1]">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-4 py-2 bg-[#FFFFFF] border border-[#D9DDE1] hover:bg-[#F1F1F1] text-[#172B3A] font-semibold text-xs rounded-md shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#52606D]" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateAiVisualization}
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-md shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Brain className="w-4 h-4 text-white" />
              <span>Verify & Process Story</span>
            </button>
          </div>

        </div>

        {/* AI Multi-Stage Loader */}
        {analyzingStage && isAnalyzing && (
          <LoadingAnalyzer onComplete={() => setAnalyzingStage(false)} />
        )}

      </main>
    </div>
  );
};

