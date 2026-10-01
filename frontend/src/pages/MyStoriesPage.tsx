import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Edit3, Eye, Trash2, Clock, BookOpen, AlertCircle, XCircle } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import type { Story } from '../types';

import { fetchJsonSafely } from '../utils/api';

export const MyStoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJsonSafely('/api/stories/my');
      if (res.ok && res.data?.stories) {
        setStories(res.data.stories);
      } else {
        setError(res.data?.error || 'Failed to load your stories.');
      }
    } catch (err) {
      setError('Unable to connect to Success Story server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchMyStories();
  }, [isAuthenticated, navigate]);

  const handleDeleteDraft = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this story draft?')) return;
    try {
      const res = await fetchJsonSafely(`/api/stories/my/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchMyStories();
      } else {
        alert(res.data?.error || 'Failed to delete story.');
      }
    } catch (err) {
      alert('Failed to delete story.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-semibold">Published</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-semibold">Approved</span>;
      case 'UNPUBLISHED':
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[11px] font-semibold">Unpublished</span>;
      case 'PENDING_REVIEW':
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-semibold inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Under Review</span>;
      case 'CHANGES_REQUESTED':
        return <span className="px-2.5 py-0.5 bg-primary-soft text-primary border border-purple-200 rounded-md text-[11px] font-semibold">Changes Requested</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md text-[11px] font-semibold">Declined</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[11px] font-semibold">Draft</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>Alumni Portfolio</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Submitted Stories
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track verification progress, review editorial feedback, and manage your alumni milestones.
          </p>
        </div>

        <Link
          to="/stories/write"
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit New Story</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stories List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 bg-white rounded-xl text-center text-slate-500 font-medium border border-slate-200">
            Loading your stories...
          </div>
        ) : stories.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 max-w-lg mx-auto space-y-4 shadow-xs">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center mx-auto text-primary">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Submitted Stories Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You haven't submitted any alumni success stories yet. Click below to share your journey and achievements.
            </p>
            <Link
              to="/stories/write"
              className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-lg shadow-2xs inline-block hover:bg-primary-hover transition-all duration-200"
            >
              Write Your First Story
            </Link>
          </div>
        ) : (
          stories.map((story) => (
            <div
              key={story.id}
              className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-3.5 hover:border-primary/30 transition-all duration-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  {getStatusBadge(story.status)}
                  <span className="text-xs font-semibold text-slate-500">
                    Category: <strong className="text-slate-900">{story.category}</strong>
                  </span>
                </div>

                <span className="text-[11px] font-medium text-slate-400">
                  Updated: {new Date(story.updatedAt || story.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 hover:text-primary transition-colors">
                  {story.storyTitle}
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  Protagonist: <span className="font-semibold text-slate-900">{story.personName}</span> {story.location ? `• ${story.location}` : ''}
                </p>
                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                  {story.fullStory}
                </p>
              </div>

              {/* Admin Feedback Box for CHANGES_REQUESTED */}
              {story.status === 'CHANGES_REQUESTED' && story.adminFeedback && (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium space-y-1">
                  <span className="font-bold block text-amber-900">Editorial Feedback / Requested Revisions:</span>
                  <p className="text-slate-900">{story.adminFeedback}</p>
                </div>
              )}

              {/* Rejection Reason Box */}
              {story.status === 'REJECTED' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Submission Declined by Reviewer</span>
                    {story.rejectedAt && (
                      <span className="text-[11px] font-normal text-rose-500">
                        • {new Date(story.rejectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="pl-6 space-y-1">
                    <span className="font-semibold text-slate-800 block">Feedback / Reason Provided:</span>
                    <p className="text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-rose-100 font-medium whitespace-pre-line">
                      {story.rejectionReason || 'Does not meet current publication criteria. Please review and update your submission.'}
                    </p>
                    <p className="text-[11px] text-slate-500 pt-1">
                      You can address this feedback and click <strong>"Edit & Resubmit"</strong> below to send your revised story for re-verification.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div>
                  {story.status === 'PUBLISHED' && (
                    <Link
                      to={`/stories/${story.id}`}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-primary-soft hover:text-primary hover:border-primary text-slate-700 font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 transition-all duration-200"
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      <span>View Live Story</span>
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(story.status === 'DRAFT' || story.status === 'CHANGES_REQUESTED' || story.status === 'REJECTED') && (
                    <Link
                      to={`/stories/${story.id}/edit`}
                      className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition-all duration-200"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{story.status === 'DRAFT' ? 'Edit Draft' : 'Edit & Resubmit'}</span>
                    </Link>
                  )}

                  {story.status === 'DRAFT' && (
                    <button
                      onClick={() => handleDeleteDraft(story.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                      title="Delete Draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
