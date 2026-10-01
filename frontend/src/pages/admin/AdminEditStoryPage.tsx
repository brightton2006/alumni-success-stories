import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, XCircle, Eye, Check } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { LoadingAnalyzer } from '../../components/story/LoadingAnalyzer';
import type { Story, Category } from '../../types';

import { getMockCategories } from '../../utils/api';

export const AdminEditStoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [story, setStory] = useState<Story | null>(null);
  const [categories, setCategories] = useState<Category[]>(() => getMockCategories());
  const [loading, setLoading] = useState(true);
  const [showAnalyzerAnimation, setShowAnalyzerAnimation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch(err => console.error(err));

    const fetchStory = async () => {
      if (!id) return;
      const token = localStorage.getItem('successstory_token') || localStorage.getItem('storymap_token');
      try {
        const res = await fetch(`/api/admin/stories/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStory(data.story);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!story) return;
    setStory({ ...story, [e.target.name]: e.target.value });
  };

  const handleSave = async (storyToSave?: Story) => {
    const targetStory = storyToSave || story;
    if (!targetStory || !id) return;

    setSaving(true);
    const token = localStorage.getItem('successstory_token') || localStorage.getItem('storymap_token');

    try {
      const res = await fetch(`/api/admin/stories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(targetStory)
      });

      if (res.ok) {
        const data = await res.json();
        setStory(data.story);
        setMessage('Story changes saved successfully.');
        setTimeout(() => setMessage(null), 3000);
      } else {
        alert('Failed to save changes.');
      }
    } catch (err) {
      alert('Error saving story.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!story || !id) return;
    const token = localStorage.getItem('successstory_token') || localStorage.getItem('storymap_token');
    const endpoint = story.status === 'PUBLISHED' ? `/api/admin/stories/${id}/unpublish` : `/api/admin/stories/${id}/publish`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStory(data.story);
        setMessage(`Story ${data.story.status === 'PUBLISHED' ? 'published' : 'unpublished'} successfully.`);
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Publish toggle failed.');
      }
    } catch (err) {
      alert('Error toggling publishing status.');
    }
  };

  if (loading || !story) {
    return (
      <div className="flex gap-6 py-6">
        <AdminSidebar />
        <div className="flex-1 p-12 text-center text-[#52606D] font-medium bg-[#FFFFFF] rounded-md border border-[#D9DDE1]">
          Loading story editor...
        </div>
      </div>
    );
  }

  const isPublished = story.status === 'PUBLISHED';

  return (
    <div className="flex flex-col lg:flex-row gap-6 py-6">
      <AdminSidebar />

      <main className="flex-1 space-y-6">
        
        {/* Header */}
        <div className="bg-[#FFFFFF] rounded-md p-6 sm:p-7 border border-[#D9DDE1] shadow-2xs relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
          <div>
            <Link
              to="/admin/stories"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover mb-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Stories Archive</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-[#172B3A]">
              Edit Story Details
            </h1>
            <p className="text-xs text-[#52606D]">
              Record ID: <span className="font-mono text-[#172B3A]">{story.id}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isPublished && (
              <a
                href={`/stories/${story.id}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#FFFFFF] border border-purple-200 text-primary hover:bg-primary-soft font-semibold text-xs rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span>View Live</span>
              </a>
            )}

            <button
              onClick={handlePublishToggle}
              className={`px-3.5 py-1.5 font-semibold text-xs rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                isPublished ? 'bg-[#FFFFFF] border border-[#D9DDE1] text-[#52606D] hover:bg-[#F1F1F1]' : 'bg-primary hover:bg-primary-hover text-white'
              }`}
            >
              {isPublished ? <XCircle className="w-3.5 h-3.5 text-[#991B1B]" /> : <CheckCircle className="w-3.5 h-3.5 text-white" />}
              <span>{isPublished ? 'Unpublish' : 'Publish Story'}</span>
            </button>

            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="p-3.5 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Story Text Inputs Form */}
        <div className="bg-[#FFFFFF] rounded-md p-6 sm:p-8 shadow-2xs border border-[#D9DDE1] space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider mb-1">
                Alumni / Protagonist Name
              </label>
              <input
                type="text"
                name="personName"
                value={story.personName}
                onChange={handleFieldChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider mb-1">
                Profession / Title
              </label>
              <input
                type="text"
                name="profession"
                value={story.profession}
                onChange={handleFieldChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider mb-1">
              Story Title / Headline
            </label>
            <input
              type="text"
              name="storyTitle"
              value={story.storyTitle}
              onChange={handleFieldChange}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider mb-1">
                Current Location
              </label>
              <input
                type="text"
                name="location"
                value={story.location}
                onChange={handleFieldChange}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider mb-1">
                Domain / Category
              </label>
              <select
                name="category"
                value={story.category}
                onChange={handleFieldChange}
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

          {/* Admin Name Visibility & Publication Locations Control */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-md bg-[#F7F8F4] border border-[#D9DDE1]">
            {/* Name Visibility */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider">
                Name Attribution
              </label>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#172B3A]">
                  <input
                    type="radio"
                    name="nameVisibility"
                    checked={story.showName !== false}
                    onChange={() => setStory({ ...story, showName: true })}
                    className="w-3.5 h-3.5 text-primary focus:ring-primary"
                  />
                  <span>Display Real Name</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#172B3A]">
                  <input
                    type="radio"
                    name="nameVisibility"
                    checked={story.showName === false}
                    onChange={() => setStory({ ...story, showName: false })}
                    className="w-3.5 h-3.5 text-primary focus:ring-primary"
                  />
                  <span>Hide Name (Batch - XX Alumni)</span>
                </label>
              </div>
            </div>

            {/* Publication Locations Checkboxes */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider">
                Placement Channels
              </label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {['Homepage', 'Success Stories', 'Featured Stories', 'Category Page', 'Community', 'Do Not Publish'].map((loc) => {
                  const currentLocs = Array.isArray(story.publicationLocations) ? story.publicationLocations : ['Success Stories'];
                  const isChecked = currentLocs.includes(loc);

                  const handleLocationToggle = (locationName: string) => {
                    let updatedLocs: string[];
                    if (locationName === 'Do Not Publish') {
                      updatedLocs = isChecked ? ['Success Stories'] : ['Do Not Publish'];
                    } else {
                      if (isChecked) {
                        updatedLocs = currentLocs.filter(l => l !== locationName);
                      } else {
                        updatedLocs = [...currentLocs.filter(l => l !== 'Do Not Publish'), locationName];
                      }
                    }
                    setStory({ ...story, publicationLocations: updatedLocs });
                  };

                  return (
                    <label key={loc} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#172B3A]">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleLocationToggle(loc)}
                        className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-slate-300"
                      />
                      <span>{loc}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider mb-1">
              Full Success Story Narrative
            </label>
            <textarea
              name="fullStory"
              rows={8}
              value={story.fullStory}
              onChange={handleFieldChange}
              className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-md text-sm font-normal leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

        </div>

        {/* AI Analyzer Loader */}
        {showAnalyzerAnimation && (
          <LoadingAnalyzer onComplete={() => setShowAnalyzerAnimation(false)} />
        )}

      </main>
    </div>
  );
};

