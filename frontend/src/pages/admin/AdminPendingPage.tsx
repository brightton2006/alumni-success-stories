import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, FileText, AlertCircle, Clock, Check, Edit2 } from 'lucide-react';

import { AdminSidebar } from '../../components/admin/AdminSidebar';
import type { Story } from '../../types';

import { fetchJsonSafely } from '../../utils/api';

export const AdminPendingPage: React.FC = () => {
  const [pendingStories, setPendingStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectModalError, setRejectModalError] = useState<string | null>(null);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState('');

  const fetchPendingStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJsonSafely('/api/admin/stories/pending');
      if (res.ok && res.data?.stories) {
        setPendingStories(prev => JSON.stringify(prev) === JSON.stringify(res.data.stories) ? prev : res.data.stories);
        if (res.data.stories.length > 0 && !selectedStory) {
          setSelectedStory(res.data.stories[0]);
        }
      } else {
        setError(res.data?.error || 'Failed to fetch pending stories.');
      }
    } catch (err) {
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingStories();
  }, []);

  const handleApprove = async (storyId: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetchJsonSafely(`/api/admin/stories/${storyId}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        setMessage('Story approved successfully.');
        setTimeout(() => setMessage(null), 3000);
        fetchPendingStories();
      } else {
        setError(res.data?.error || 'Failed to approve story.');
      }
    } catch (err) {
      setError('Network error approving story.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (storyId: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetchJsonSafely(`/api/admin/stories/${storyId}/publish`, {
        method: 'POST'
      });
      if (res.ok) {
        setMessage('Story published live to the alumni directory.');
        setTimeout(() => setMessage(null), 3000);
        setSelectedStory(null);
        fetchPendingStories();
      } else {
        setError(res.data?.error || 'Failed to publish story.');
      }
    } catch (err) {
      setError('Network error publishing story.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleName = async (showName: boolean) => {
    if (!selectedStory) return;
    setActionLoading(true);
    try {
      const res = await fetchJsonSafely(`/api/admin/stories/${selectedStory.id}/name-visibility`, {
        method: 'PUT',
        body: JSON.stringify({ showName })
      });
      if (res.ok && res.data?.story) {
        setSelectedStory(res.data.story);
        setMessage(`Name visibility updated to ${showName ? 'SHOW_NAME' : 'HIDE_NAME'}`);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setError('Failed to update name visibility.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLocation = async (locationName: string) => {
    if (!selectedStory) return;
    const currentLocs = Array.isArray(selectedStory.publicationLocations) ? selectedStory.publicationLocations : ['Success Stories'];
    const isChecked = currentLocs.includes(locationName);
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

    setActionLoading(true);
    try {
      const res = await fetchJsonSafely(`/api/admin/stories/${selectedStory.id}/publication-locations`, {
        method: 'PUT',
        body: JSON.stringify({ publicationLocations: updated })
      });
      if (res.ok && res.data?.story) {
        setSelectedStory(res.data.story);
      }
    } catch (err) {
      setError('Failed to update locations.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedStory) return;
    if (!rejectionReason.trim()) {
      setRejectModalError('Please write a specific reason why you are declining this story. The respective author needs this reason to revise their submission.');
      return;
    }
    setActionLoading(true);
    setRejectModalError(null);
    setError(null);
    try {
      const res = await fetchJsonSafely(`/api/admin/stories/${selectedStory.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() })
      });
      if (res.ok) {
        setMessage('Story rejected. Rejection reason has been recorded and will be shown to the author.');
        setTimeout(() => setMessage(null), 3500);
        setShowRejectModal(false);
        setRejectionReason('');
        setRejectModalError(null);
        setSelectedStory(null);
        fetchPendingStories();
      } else {
        setRejectModalError(res.data?.error || 'Failed to reject story.');
      }
    } catch (err) {
      setRejectModalError('Network error rejecting story.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedStory || !adminFeedback.trim()) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetchJsonSafely(`/api/admin/stories/${selectedStory.id}/request-changes`, {
        method: 'POST',
        body: JSON.stringify({ feedback: adminFeedback.trim() })
      });
      if (res.ok) {
        setMessage('Change request sent to author.');
        setTimeout(() => setMessage(null), 3000);
        setShowChangesModal(false);
        setAdminFeedback('');
        setSelectedStory(null);
        fetchPendingStories();
      } else {
        setError(res.data?.error || 'Failed to request changes.');
      }
    } catch (err) {
      setError('Network error requesting changes.');
    } finally {
      setActionLoading(false);
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
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Verification Queue</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#172B3A] flex items-center gap-2.5">
              <span>Pending Reviews</span>
              <span className="px-2 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] font-bold text-xs">
                {pendingStories.length} Awaiting Review
              </span>
            </h1>
            <p className="text-xs text-[#52606D] mt-0.5">
              Review submitted alumni milestones, inspect milestones, approve for directory publication, or request revisions.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3.5 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Pending Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Stories List Column */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#52606D]">
                Queue ({pendingStories.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-[#52606D] font-medium bg-[#FFFFFF] rounded-md border border-[#D9DDE1]">
                Loading queue...
              </div>
            ) : pendingStories.length === 0 ? (
              <div className="p-8 text-center bg-[#FFFFFF] rounded-md border border-[#D9DDE1] space-y-2 shadow-2xs">
                <CheckCircle className="w-8 h-8 text-[#16A34A] mx-auto" />
                <p className="text-sm font-bold text-[#172B3A]">Queue is Empty</p>
                <p className="text-xs text-[#52606D]">All submitted stories have been reviewed.</p>
              </div>
            ) : (
              pendingStories.map((story) => {
                const isSelected = selectedStory?.id === story.id;
                return (
                  <div
                    key={story.id}
                    onClick={() => setSelectedStory(story)}
                    className={`p-3.5 rounded-md border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-2xs'
                        : 'bg-[#FFFFFF] text-[#172B3A] border-[#D9DDE1] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 inline-block ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
                    }`}>
                      {story.category || 'Story'}
                    </span>

                    <h4 className="text-xs sm:text-sm font-bold line-clamp-1">
                      {story.storyTitle}
                    </h4>

                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-purple-100' : 'text-[#52606D]'}`}>
                      By: {story.submittedByUserName || story.personName}
                    </p>

                    <div className="flex items-center gap-1 mt-2 text-[10px] opacity-80">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Story Inspection Column */}
          <div className="lg:col-span-2 space-y-6">
            {selectedStory ? (
              <div className="bg-[#FFFFFF] rounded-md p-5 sm:p-6 shadow-2xs border border-[#D9DDE1] space-y-5">
                
                {/* Header Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#D9DDE1]">
                  <div>
                    <span className="px-2.5 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] text-[11px] font-bold uppercase">
                      Pending Verification
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-primary mt-1">
                      {selectedStory.storyTitle}
                    </h2>
                    <p className="text-xs text-[#52606D]">
                      Protagonist: <strong className="text-[#172B3A]">{selectedStory.personName}</strong> • Submitter: {selectedStory.submittedByUserName} ({selectedStory.submittedByUserEmail})
                    </p>
                    {(selectedStory.beneficiaryName || selectedStory.supporterName) && (
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                        {selectedStory.beneficiaryName && (
                          <span>
                            🤝 <strong>Beneficiary:</strong> {selectedStory.beneficiaryName} {selectedStory.beneficiaryBatch ? `(Batch - ${selectedStory.beneficiaryBatch})` : ''}
                          </span>
                        )}
                        {selectedStory.supporterName && (
                          <span>
                            🌟 <strong>Supporter / Mentor:</strong> {selectedStory.supporterName} {selectedStory.supporterBatch ? `(Batch - ${selectedStory.supporterBatch})` : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleApprove(selectedStory.id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-[#FFFFFF] border border-[#D9DDE1] hover:bg-[#F1F1F1] text-[#166534] font-semibold text-xs rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => handlePublish(selectedStory.id)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Publish</span>
                    </button>

                    <button
                      onClick={() => setShowChangesModal(true)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-primary-soft text-primary border border-purple-200 font-semibold text-xs rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Request Revisions</span>
                    </button>

                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] font-semibold text-xs rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>

                {/* Admin Controls for Name Visibility & Publication Locations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-md bg-[#F7F8F4] border border-[#D9DDE1]">
                  {/* Name Visibility */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider">
                      Name Attribution
                    </label>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        onClick={() => handleToggleName(true)}
                        disabled={actionLoading}
                        className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          selectedStory.showName !== false
                            ? 'bg-primary text-white shadow-2xs'
                            : 'bg-[#FFFFFF] text-[#52606D] border border-[#D9DDE1] hover:bg-[#F1F1F1]'
                        }`}
                      >
                        <span>Display Name</span>
                      </button>

                      <button
                        onClick={() => handleToggleName(false)}
                        disabled={actionLoading}
                        className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          selectedStory.showName === false
                            ? 'bg-primary text-white shadow-2xs'
                            : 'bg-[#FFFFFF] text-[#52606D] border border-[#D9DDE1] hover:bg-[#F1F1F1]'
                        }`}
                      >
                        <span>Hide Name (Batch - XX Alumni)</span>
                      </button>
                    </div>
                  </div>

                  {/* Publication Locations */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#172B3A] uppercase tracking-wider">
                      Target Placement Channels
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      {['Homepage', 'Success Stories', 'Featured Stories', 'Category Page', 'Community', 'Do Not Publish'].map((loc) => {
                        const currentLocs = Array.isArray(selectedStory.publicationLocations) ? selectedStory.publicationLocations : ['Success Stories'];
                        const isChecked = currentLocs.includes(loc);

                        return (
                          <label key={loc} className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-[#172B3A]">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleLocation(loc)}
                              className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-slate-300"
                            />
                            <span>{loc}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>



                {/* Full Original Story */}
                <div className="space-y-2 pt-2 border-t border-[#D9DDE1]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#172B3A] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Submitted Narrative</span>
                  </h3>
                  <div className="p-4 rounded-md bg-[#FFFFFF] border border-[#D9DDE1] text-[#172B3A] text-xs font-normal leading-relaxed whitespace-pre-line">
                    {selectedStory.fullStory}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-[#FFFFFF] rounded-md p-12 text-center border border-[#D9DDE1] font-medium text-[#52606D]">
                Select a pending story from the left queue to review its contents.
              </div>
            )}
          </div>

        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 bg-[#172B3A]/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Decline Story Submission</h3>
                  <p className="text-xs text-slate-500">
                    Story: <strong className="text-slate-800 font-semibold">{selectedStory?.storyTitle}</strong>
                  </p>
                </div>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-1">
                <span className="font-semibold block">Notice to Reviewer:</span>
                <p className="leading-relaxed">
                  The reason you provide below will be shown directly to the respective author (
                  <strong>{selectedStory?.submittedByUserName || selectedStory?.personName}</strong>
                  ) in their portal dashboard and story edit screen.
                </p>
              </div>

              {rejectModalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{rejectModalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why this story is being declined (e.g., Incomplete career narrative, inaccurate batch data, claims need evidence, or unsuitable publication content)..."
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (rejectModalError) setRejectModalError(null);
                  }}
                  className="w-full p-3 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setRejectModalError(null);
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{actionLoading ? 'Declining...' : 'Decline Story & Send Reason'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Request Changes Modal */}
        {showChangesModal && (
          <div className="fixed inset-0 z-50 bg-[#172B3A]/50 flex items-center justify-center p-4">
            <div className="bg-[#FFFFFF] rounded-md p-6 max-w-md w-full space-y-4 shadow-xl border border-[#D9DDE1]">
              <h3 className="text-base font-bold text-[#172B3A]">Request Editorial Revision</h3>
              <p className="text-xs text-[#52606D]">
                Specify the required modifications before this story can be approved for publication.
              </p>
              <textarea
                rows={4}
                required
                placeholder="e.g. Please clarify your graduation batch year and expand on the technical challenges..."
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
                className="w-full p-3 border border-slate-200 bg-white rounded-md text-xs font-normal focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-[#D9DDE1]">
                <button
                  onClick={() => setShowChangesModal(false)}
                  className="px-3.5 py-1.5 bg-[#FFFFFF] border border-[#D9DDE1] text-[#52606D] font-semibold text-xs rounded-md hover:bg-[#F1F1F1] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestChanges}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-md shadow-2xs cursor-pointer"
                >
                  Submit Revision Request
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

