import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  PlusCircle,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  AlertTriangle,
  FileText,
  UserCheck,
  EyeOff,
  Check,
  X,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import type { Story } from '../../types';
import { ALL_PUBLICATION_LOCATIONS } from '../../types';

import { fetchJsonSafely } from '../../utils/api';

export const AdminStoriesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewStory, setReviewStory] = useState<Story | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectingStory, setRejectingStory] = useState<Story | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const fetchStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJsonSafely('/api/admin/stories');
      if (res.ok && res.data?.stories) {
        setStories(prev => JSON.stringify(prev) === JSON.stringify(res.data.stories) ? prev : res.data.stories);
        // If reviewing, update reviewStory with fresh data
        if (reviewStory) {
          const fresh = res.data.stories.find((s: Story) => s.id === reviewStory.id);
          if (fresh) {
            setReviewStory(prev => JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh);
          }
        }
      } else {
        setError(res.data?.error || 'Failed to fetch admin stories.');
      }
    } catch (err) {
      console.error('Error fetching admin stories:', err);
      setError('Unable to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleApprove = async (story: Story) => {
    setActionLoading(true);
    try {
      const res = await fetchJsonSafely(`/api/admin/stories/${story.id}/approve`, { method: 'POST' });
      if (res.ok) {
        setNotification(`Story "${story.storyTitle}" approved.`);
        setTimeout(() => setNotification(null), 3000);
        fetchStories();
      } else {
        alert(res.data?.error || 'Failed to approve story.');
      }
    } catch (err) {
      alert('Error approving story.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (story: Story) => {
    setRejectingStory(story);
    setRejectionReasonInput('');
    setRejectionError(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectingStory) return;
    if (!rejectionReasonInput.trim()) {
      setRejectionError('Please write a specific reason why you are rejecting this story. The author needs this feedback to revise.');
      return;
    }

    setActionLoading(true);
    setRejectionError(null);
    try {
      const res = await fetchJsonSafely(`/api/admin/stories/${rejectingStory.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: rejectionReasonInput.trim() })
      });
      if (res.ok) {
        setNotification(`Story "${rejectingStory.storyTitle}" declined. The rejection reason has been saved and will be shown to ${rejectingStory.submittedByUserName || 'the author'}.`);
        setTimeout(() => setNotification(null), 4000);
        if (reviewStory?.id === rejectingStory.id) {
          setReviewStory(null);
        }
        setRejectingStory(null);
        setRejectionReasonInput('');
        fetchStories();
      } else {
        setRejectionError(res.data?.error || 'Failed to reject story.');
      }
    } catch (err) {
      setRejectionError('Network error while declining story.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishToggle = async (story: Story) => {
    const isPublished = story.status === 'PUBLISHED';
    const endpoint = isPublished ? `/api/admin/stories/${story.id}/unpublish` : `/api/admin/stories/${story.id}/publish`;

    setActionLoading(true);
    try {
      const res = await fetchJsonSafely(endpoint, { method: 'POST' });
      if (res.ok) {
        setNotification(`Story "${story.storyTitle}" ${isPublished ? 'unpublished' : 'published'} successfully.`);
        setTimeout(() => setNotification(null), 3000);
        fetchStories();
      } else {
        alert(res.data?.error || 'Failed to update story status.');
      }
    } catch (err) {
      alert('Error updating publishing status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleNameVisibility = async (story: Story, targetShowName: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetchJsonSafely(`/api/admin/stories/${story.id}/name-visibility`, {
        method: 'PUT',
        body: JSON.stringify({ showName: targetShowName })
      });
      if (res.ok) {
        setNotification(`Name visibility updated to ${targetShowName ? 'SHOW_NAME' : 'HIDE_NAME'}`);
        setTimeout(() => setNotification(null), 3000);
        fetchStories();
      } else {
        alert(res.data?.error || 'Failed to update name visibility.');
      }
    } catch (err) {
      alert('Error updating name visibility.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePublicationLocations = async (story: Story, newLocations: string[]) => {
    setActionLoading(true);
    try {
      const res = await fetchJsonSafely(`/api/admin/stories/${story.id}/publication-locations`, {
        method: 'PUT',
        body: JSON.stringify({ publicationLocations: newLocations })
      });
      if (res.ok) {
        setNotification('Publication locations updated.');
        setTimeout(() => setNotification(null), 3000);
        fetchStories();
      } else {
        alert(res.data?.error || 'Failed to update publication locations.');
      }
    } catch (err) {
      alert('Error updating publication locations.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetchJsonSafely(`/api/admin/stories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotification('Story deleted permanently.');
        setTimeout(() => setNotification(null), 3000);
        setDeletingId(null);
        if (reviewStory?.id === id) setReviewStory(null);
        fetchStories();
      } else {
        alert('Failed to delete story.');
      }
    } catch (err) {
      alert('Error deleting story.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStories = stories.filter((s) => {
    if (statusFilter !== 'all' && s.status.toLowerCase() !== statusFilter.toLowerCase()) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        s.storyTitle.toLowerCase().includes(q) ||
        s.personName.toLowerCase().includes(q) ||
        (s.submittedByUserName && s.submittedByUserName.toLowerCase().includes(q)) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="px-2 py-0.5 rounded bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-[10px] font-bold uppercase">Published</span>;
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-[10px] font-bold uppercase">Approved</span>;
      case 'PENDING_REVIEW':
        return <span className="px-2 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] text-[10px] font-bold uppercase">Pending</span>;
      case 'UNPUBLISHED':
        return <span className="px-2 py-0.5 rounded bg-[#F1F1F1] text-[#52606D] border border-[#D9DDE1] text-[10px] font-bold uppercase">Unpublished</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] text-[10px] font-bold uppercase">Declined</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-[#F1F1F1] text-[#52606D] border border-[#D9DDE1] text-[10px] font-bold uppercase">Draft</span>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 py-6">
      <AdminSidebar />

      <main className="flex-1 space-y-6">
        
        {error && (
          <div className="p-3.5 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchStories()}
              className="px-3 py-1 bg-[#DC2626] text-white rounded text-xs font-bold hover:bg-[#B91C1C] shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {notification && (
          <div className="p-3.5 rounded-md bg-primary text-white text-xs font-semibold shadow-2xs flex items-center justify-between border border-primary-hover">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-purple-200 hover:text-white font-bold cursor-pointer">×</button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 z-50 bg-[#172B3A]/50 flex items-center justify-center p-4">
            <div className="bg-[#FFFFFF] rounded-md p-6 max-w-md w-full text-center space-y-4 shadow-xl border border-[#D9DDE1]">
              <div className="w-10 h-10 bg-[#FEF2F2] border border-[#FECACA] rounded-full flex items-center justify-center mx-auto text-[#991B1B]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#172B3A]">Confirm Story Deletion</h3>
              <p className="text-xs text-[#52606D]">
                Are you sure you want to permanently delete this story and its milestones from the directory?
              </p>
              <div className="flex gap-2 justify-center pt-2 border-t border-[#D9DDE1]">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-3.5 py-1.5 bg-[#FFFFFF] border border-[#D9DDE1] text-[#52606D] font-semibold text-xs rounded-md hover:bg-[#F1F1F1] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  className="px-4 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFFFF] font-semibold text-xs rounded-md shadow-2xs cursor-pointer"
                >
                  Delete Story
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject / Decline Reason Modal */}
        {rejectingStory && (
          <div className="fixed inset-0 z-50 bg-[#172B3A]/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Decline Story Submission</h3>
                  <p className="text-xs text-slate-500">
                    Story: <strong className="text-slate-800 font-semibold">{rejectingStory.storyTitle}</strong>
                  </p>
                </div>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-1">
                <span className="font-semibold block">Notice to Reviewer:</span>
                <p className="leading-relaxed">
                  The reason you provide below will be shown directly to the respective author (
                  <strong>{rejectingStory.submittedByUserName || rejectingStory.personName}</strong>
                  ) in their dashboard and story edit page so they can understand what needs to be improved.
                </p>
              </div>

              {rejectionError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{rejectionError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why this story is being declined (e.g., Needs verification of batch details, claims need supporting links, inappropriate language, or incomplete graduation journey)..."
                  value={rejectionReasonInput}
                  onChange={(e) => {
                    setRejectionReasonInput(e.target.value);
                    if (rejectionError) setRejectionError(null);
                  }}
                  className="w-full p-3 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all leading-relaxed"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingStory(null);
                    setRejectionReasonInput('');
                    setRejectionError(null);
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={actionLoading || !rejectionReasonInput.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{actionLoading ? 'Declining...' : 'Decline Story & Send Reason'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header Bar */}
        <div className="bg-[#FFFFFF] rounded-md p-6 sm:p-7 border border-[#D9DDE1] shadow-2xs relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>Editorial Archive</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#172B3A]">
              Success Story Management
            </h1>
            <p className="text-xs text-[#52606D] mt-0.5">
              Review submitted records, configure name visibility, manage channel placements, and moderate publications.
            </p>
          </div>

          <Link
            to="/admin/stories/create"
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-md shadow-2xs flex items-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Story</span>
          </Link>
        </div>

        {/* Search & Status Filter Tabs */}
        <div className="bg-[#FFFFFF] rounded-md p-4 shadow-2xs border border-[#D9DDE1] space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#7A8793] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search stories by title, alumni name, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-md text-xs font-normal text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-0.5">
              {['all', 'pending_review', 'approved', 'published', 'unpublished', 'rejected', 'draft'].map((st) => {
                const isActive = statusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      if (st === 'all') params.delete('status');
                      else params.set('status', st);
                      setSearchParams(params);
                    }}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-primary-soft hover:text-primary'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SUCCESS STORY MANAGEMENT TABLE */}
        <div className="bg-[#FFFFFF] rounded-md shadow-2xs border border-[#D9DDE1] overflow-hidden">
          <div className="p-4 border-b border-[#D9DDE1] flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172B3A]">
              Stories Archive ({filteredStories.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8F4] border-b border-[#D9DDE1] text-[10px] font-bold text-[#52606D] uppercase tracking-wider">
                  <th className="p-3.5">Story & Title</th>
                  <th className="p-3.5">Protagonist / Author</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Attribution</th>
                  <th className="p-3.5">Channels</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DDE1] text-xs font-normal text-[#172B3A]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#52606D] font-medium">Loading stories queue...</td>
                  </tr>
                ) : filteredStories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#52606D] font-medium">No success stories match the selected criteria.</td>
                  </tr>
                ) : (
                  filteredStories.map((story) => {
                    const showName = story.showName !== false;
                    const locations = Array.isArray(story.publicationLocations) && story.publicationLocations.length > 0
                      ? story.publicationLocations
                      : ['Success Stories'];

                    return (
                      <tr key={story.id} className="hover:bg-[#F7F8F4]/80 transition-colors">
                        {/* Story Title & Category */}
                        <td className="p-3.5">
                          <div>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm block line-clamp-1 hover:text-primary">
                              {story.storyTitle}
                            </span>
                            <span className="text-[#52606D] text-[11px]">
                              Domain: {story.category} • {new Date(story.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>

                        {/* User Submitter & Photo */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md bg-primary-soft overflow-hidden shrink-0 border border-purple-200">
                              {story.personImage ? (
                                <img src={story.personImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-primary">
                                  {(story.submittedByUserName || story.personName || 'U').charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="line-clamp-1">
                              <span className="font-semibold text-[#172B3A] text-xs block">
                                {story.submittedByUserName || story.personName}
                              </span>
                              <span className="text-[10px] text-[#52606D] block">
                                {story.submittedByUserEmail || story.profession}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Current Status */}
                        <td className="p-3.5">
                          {getStatusBadge(story.status)}
                        </td>

                        {/* Name Visibility Status & Quick Toggle */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              showName ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]' : 'bg-[#F1F1F1] text-[#52606D] border border-[#D9DDE1]'
                            }`}>
                              {showName ? 'SHOW_NAME' : 'HIDE_NAME (Batch - XX Alumni)'}
                            </span>
                            <button
                              onClick={() => handleToggleNameVisibility(story, !showName)}
                              disabled={actionLoading}
                              className="p-1 text-[#7A8793] hover:text-primary rounded hover:bg-[#F1F1F1] cursor-pointer disabled:opacity-50"
                              title={showName ? 'Switch to Hide Name (Batch - XX Alumni)' : 'Switch to Display Name'}
                            >
                              {showName ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* Publication Locations Badges */}
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {locations.map((loc) => (
                              <span key={loc} className="px-1.5 py-0.5 rounded bg-[#F1F1F1] border border-[#D9DDE1] text-[#52606D] text-[10px] font-medium">
                                {loc}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Admin Action Buttons */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Review Button */}
                            <button
                              onClick={() => setReviewStory(story)}
                              className="px-2.5 py-1 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-md shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Review Detailed Story"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Review</span>
                            </button>

                            {/* Edit */}
                            <Link
                              to={`/admin/stories/${story.id}/edit`}
                              className="p-1.5 rounded-md text-[#52606D] hover:text-primary hover:bg-[#F1F1F1]"
                              title="Edit Story Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Link>

                            {/* Delete */}
                            <button
                              onClick={() => setDeletingId(story.id)}
                              className="p-1.5 rounded-md text-[#7A8793] hover:text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                              title="Delete Story"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILED STORY REVIEW MODAL */}
        {reviewStory && (
          <div className="fixed inset-0 z-50 bg-[#172B3A]/50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#FFFFFF] rounded-md p-6 max-w-3xl w-full my-8 space-y-5 shadow-xl border border-[#D9DDE1] max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#D9DDE1]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(reviewStory.status)}
                    <span className="text-xs font-mono text-[#52606D]">
                      ID: {reviewStory.id}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-primary">
                    {reviewStory.storyTitle}
                  </h2>
                </div>
                <button
                  onClick={() => setReviewStory(null)}
                  className="p-1.5 text-[#7A8793] hover:text-[#172B3A] rounded-md hover:bg-[#F1F1F1] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Submitter & Protagonist Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md bg-[#F7F8F4] border border-[#D9DDE1]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-md bg-primary text-white overflow-hidden shrink-0 border border-purple-200 shadow-2xs">
                    {reviewStory.personImage ? (
                      <img src={reviewStory.personImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-sm">
                        {(reviewStory.personName || 'S').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#172B3A]">
                      {reviewStory.personName}
                    </h4>
                    <p className="text-xs text-[#52606D]">
                      {reviewStory.profession} • {reviewStory.location}
                    </p>
                  </div>
                </div>

                <div className="space-y-0.5 text-xs text-[#52606D] sm:border-l sm:border-[#D9DDE1] sm:pl-4">
                  <p><strong className="text-[#172B3A]">Submitted By:</strong> {reviewStory.submittedByUserName || reviewStory.personName}</p>
                  <p><strong className="text-[#172B3A]">Email:</strong> {reviewStory.submittedByUserEmail || 'N/A'}</p>
                  <p><strong className="text-[#172B3A]">Date:</strong> {new Date(reviewStory.createdAt).toLocaleDateString()}</p>
                  {reviewStory.beneficiaryName && (
                    <p><strong className="text-[#172B3A]">Beneficiary:</strong> {reviewStory.beneficiaryName} {reviewStory.beneficiaryBatch ? `(Batch - ${reviewStory.beneficiaryBatch})` : ''}</p>
                  )}
                  {reviewStory.supporterName && (
                    <p><strong className="text-[#172B3A]">Supporter:</strong> {reviewStory.supporterName} {reviewStory.supporterBatch ? `(Batch - ${reviewStory.supporterBatch})` : ''}</p>
                  )}
                </div>
              </div>

              {/* Admin Configuration Controls: Name Visibility & Publication Locations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-md bg-[#F7F8F4] border border-[#D9DDE1]">
                
                {/* 1. Name Visibility Control */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider">
                    Name Attribution
                  </label>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      onClick={() => handleToggleNameVisibility(reviewStory, true)}
                      disabled={actionLoading}
                      className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        reviewStory.showName !== false
                          ? 'bg-primary text-white shadow-2xs'
                          : 'bg-[#FFFFFF] text-[#52606D] border border-[#D9DDE1] hover:bg-[#F1F1F1]'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>SHOW_NAME</span>
                    </button>

                    <button
                      onClick={() => handleToggleNameVisibility(reviewStory, false)}
                      disabled={actionLoading}
                      className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        reviewStory.showName === false
                          ? 'bg-primary text-white shadow-2xs'
                          : 'bg-[#FFFFFF] text-[#52606D] border border-[#D9DDE1] hover:bg-[#F1F1F1]'
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>HIDE_NAME (Anonymous)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Publication Locations */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider">
                    Target Channels
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {ALL_PUBLICATION_LOCATIONS.map((loc) => {
                      const currentLocs = Array.isArray(reviewStory.publicationLocations) && reviewStory.publicationLocations.length > 0
                        ? reviewStory.publicationLocations
                        : ['Success Stories'];
                      const isChecked = currentLocs.includes(loc);

                      const toggleLoc = (locationName: string) => {
                        let updated: string[];
                        if (locationName === 'Do Not Publish') {
                          updated = isChecked ? ['Success Stories'] : ['Do Not Publish'];
                        } else {
                          if (isChecked) {
                            updated = currentLocs.filter(l => l !== locationName);
                          } else {
                            updated = [...currentLocs.filter(l => l !== 'Do Not Publish'), locationName];
                          }
                        }
                        handleUpdatePublicationLocations(reviewStory, updated);
                      };

                      return (
                        <label key={loc} className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-[#172B3A]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleLoc(loc)}
                            className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-slate-300"
                          />
                          <span>{loc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

              </div>



              {/* Story Content */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-[#172B3A] uppercase tracking-wider">
                  Full Story Text
                </h3>
                <div className="p-4 rounded-md bg-[#FFFFFF] border border-[#D9DDE1] text-[#172B3A] text-xs font-normal leading-relaxed whitespace-pre-line max-h-56 overflow-y-auto">
                  {reviewStory.fullStory}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#D9DDE1]">
                <div className="flex items-center gap-2">
                  {reviewStory.status !== 'APPROVED' && reviewStory.status !== 'PUBLISHED' && (
                    <button
                      onClick={() => handleApprove(reviewStory)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-[#FFFFFF] border border-[#D9DDE1] hover:bg-[#F1F1F1] text-[#166534] font-semibold text-xs rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {reviewStory.status !== 'REJECTED' && (
                    <button
                      onClick={() => openRejectModal(reviewStory)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] font-semibold text-xs rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePublishToggle(reviewStory)}
                    disabled={actionLoading}
                    className={`px-3.5 py-1.5 font-semibold text-xs rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      reviewStory.status === 'PUBLISHED'
                        ? 'bg-[#FFFFFF] border border-[#D9DDE1] text-[#52606D] hover:bg-[#F1F1F1]'
                        : 'bg-primary hover:bg-primary-hover text-white'
                    }`}
                  >
                    {reviewStory.status === 'PUBLISHED' ? <XCircle className="w-3.5 h-3.5 text-[#991B1B]" /> : <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    <span>{reviewStory.status === 'PUBLISHED' ? 'Unpublish Story' : 'Publish Story'}</span>
                  </button>

                  <Link
                    to={`/admin/stories/${reviewStory.id}/edit`}
                    className="px-3.5 py-1.5 bg-[#FFFFFF] border border-[#D9DDE1] hover:bg-[#F1F1F1] text-[#172B3A] font-semibold text-xs rounded-md inline-flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#52606D]" />
                    <span>Edit Details</span>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

