import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Eye, Calendar, ArrowLeft, BookOpen, Share2, Loader2, 
  Lock, Mail, Heart, Sparkles, Lightbulb, Flame, 
  MessageSquare, Send, CheckCircle2, ThumbsUp, Check, User, Copy
} from 'lucide-react';
import type { Story, User as UserType } from '../types';
import { fetchJsonSafely, getMockStories, getStoryAuthorDisplayName, getStoryBeneficiaryDisplayName, getStorySupporterDisplayName } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface CommentItem {
  id: string;
  storyId: string;
  authorName: string;
  batchNumber: string;
  authorTag: string;
  commentText: string;
  createdAt: string;
  likes?: number;
}

export const StoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, login } = useAuth();

  const initialMockStory = useMemo(() => {
    if (!id) return null;
    return getMockStories().find(s => s.id === id) || null;
  }, [id]);

  const [story, setStory] = useState<Story | null>(initialMockStory);
  const [loading, setLoading] = useState(!initialMockStory);
  const [isPreview, setIsPreview] = useState(!isAuthenticated); // tracks if backend returned preview-only content
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Email Gate State
  const [connectEmail, setConnectEmail] = useState('');
  const [gateSubmitting, setGateSubmitting] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  // Reactions State
  const [reactions, setReactions] = useState<{ [key: string]: number }>({
    clap: 24,
    love: 12,
    insightful: 15,
    inspiring: 18,
    fire: 9
  });
  const [userReacted, setUserReacted] = useState<{ [key: string]: boolean }>({});
  const [reacting, setReacting] = useState(false);

  // Comments State
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [authorNameInput, setAuthorNameInput] = useState('');
  const [batchInput, setBatchInput] = useState('26');
  const [commentTextInput, setCommentTextInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccessMsg, setCommentSuccessMsg] = useState(false);
  const [likedComments, setLikedComments] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (user) {
      const defaultName = (user as any).fullName || (user as any).full_name || (user as any).name || 'Alumni Member';
      setAuthorNameInput(defaultName);
      const endYear = user?.alumniProfile?.educationDetails?.[0]?.endYear
        ?? (user as any).batch_year ?? (user as any).batchYear ?? (user as any).batch;
      const defaultBatch = endYear ? String(endYear).replace(/[^0-9]/g, '').slice(-2) : '26';
      setBatchInput(defaultBatch || '26');
    } else {
      setAuthorNameInput('Alumni Member');
      setBatchInput('26');
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const fetchStoryAndInteractions = async () => {
      if (!id) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const res = await fetchJsonSafely('/api/stories/' + id);
        if (!isMounted) return;

        if (res.ok && res.data?.story) {
          const fetchedStory = res.data.story;
          setStory(fetchedStory);
          setIsPreview(!!res.data.isPreview || !!fetchedStory.isPreview);

          if (fetchedStory.reactions) {
            setReactions(prev => ({ ...prev, ...fetchedStory.reactions }));
          }

          // Increment view counter silently
          fetchJsonSafely('/api/stories/' + id + '/view', { method: 'POST' }).catch(() => {});
        } else {
          setStory(initialMockStory);
        }

        // Fetch Reactions
        const reactRes = await fetchJsonSafely('/api/stories/' + id + '/reactions');
        if (reactRes.ok && reactRes.data?.reactions && isMounted) {
          setReactions(prev => ({ ...prev, ...reactRes.data.reactions }));
        }

        // Fetch Comments
        const commentRes = await fetchJsonSafely('/api/stories/' + id + '/comments');
        if (commentRes.ok && Array.isArray(commentRes.data?.comments) && isMounted) {
          setComments(commentRes.data.comments);
        }
      } catch (err) {
        if (isMounted) setStory(initialMockStory);
      } finally {
        if (isMounted) {
          setLoading(false);
          setCommentsLoading(false);
        }
      }
    };

    fetchStoryAndInteractions();

    return () => {
      isMounted = false;
    };
  }, [id, initialMockStory, isAuthenticated]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowShareMenu(false);
    }, 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayTitle,
          text: 'Read this inspiring Alumni Story from National Engineering College:',
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or fallback to menu
        setShowShareMenu(true);
      }
    } else {
      setShowShareMenu(prev => !prev);
    }
  };

  const handleReaction = async (type: string) => {
    if (!id || reacting) return;
    setReacting(true);

    const isCurrentlyActive = !userReacted[type];

    // Optimistic UI update
    setReactions(prev => ({
      ...prev,
      [type]: Math.max(0, (prev[type] || 0) + (isCurrentlyActive ? -1 : 1))
    }));
    setUserReacted(prev => ({
      ...prev,
      [type]: !isCurrentlyActive
    }));

    try {
      await fetchJsonSafely('/api/stories/' + id + '/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: type })
      });
    } catch (err) {
      console.error('Failed to post reaction', err);
    } finally {
      setReacting(false);
    }
  };

  const handleLikeComment = (commentId: string) => {
    setLikedComments(prev => {
      const isLiked = !prev[commentId];
      setComments(currentComments => 
        currentComments.map(c => 
          c.id === commentId 
            ? { ...c, likes: (c.likes || 0) + (isLiked ? -1 : 1) } 
            : c
        )
      );
      return { ...prev, [commentId]: !isLiked };
    });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentTextInput.trim() || submittingComment) return;

    setSubmittingComment(true);
    setCommentSuccessMsg(false);

    const cleanBatch = String(batchInput).trim().replace(/[^0-9]/g, '').slice(-2) || '26';
    const cleanName = (authorNameInput || 'Alumnus').trim().replace(/[@\s]+/g, '_');
    const authorTag = '@' + cleanName + '-' + cleanBatch;

    try {
      const res = await fetchJsonSafely('/api/stories/' + id + '/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: authorNameInput.trim() || 'Alumnus',
          batchNumber: cleanBatch,
          commentText: commentTextInput.trim(),
          authorTag: authorTag
        })
      });

      if (res.ok && res.data?.comment) {
        setComments(prev => [res.data.comment, ...prev]);
        setCommentTextInput('');
        setCommentSuccessMsg(true);
        setTimeout(() => setCommentSuccessMsg(false), 4000);
      } else {
        const newLocalComment: CommentItem = {
          id: 'temp_' + Date.now(),
          storyId: id,
          authorName: authorNameInput.trim() || 'Alumnus',
          batchNumber: cleanBatch,
          authorTag: authorTag,
          commentText: commentTextInput.trim(),
          createdAt: new Date().toISOString(),
          likes: 0
        };
        setComments(prev => [newLocalComment, ...prev]);
        setCommentTextInput('');
        setCommentSuccessMsg(true);
        setTimeout(() => setCommentSuccessMsg(false), 4000);
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Instant Email Login Gateway to read full story
  const handleConnectEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectEmail.trim() || gateSubmitting) return;

    setGateSubmitting(true);
    setGateError(null);

    try {
      const res = await fetchJsonSafely('/api/auth/email-gate-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: connectEmail.trim(),
          name: connectEmail.split('@')[0],
          storyId: id,
          redirectPath: window.location.pathname
        })
      });

      if (res.ok && res.data?.token && res.data?.user) {
        login(res.data.token, res.data.user);
      } else {
        // Fallback local instant unlock
        const fallbackUser: UserType = {
          id: 'user_' + Date.now(),
          email: connectEmail.trim(),
          fullName: connectEmail.split('@')[0],
          role: 'USER',
          isActive: true,
          createdAt: new Date().toISOString()
        };
        login('token_' + Date.now(), fallbackUser);
      }
    } catch (err) {
      const fallbackUser: UserType = {
        id: 'user_' + Date.now(),
        email: connectEmail.trim(),
        fullName: connectEmail.split('@')[0],
        role: 'USER',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      login('token_' + Date.now(), fallbackUser);
    } finally {
      setGateSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          <p className="text-xs font-semibold text-primary">Loading Story...</p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="max-w-md mx-auto py-12 text-center bg-white rounded-lg p-8 border border-slate-200 shadow-sm my-8 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Story Not Found</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested alumni story is unavailable or may have been moved.
        </p>
        <Link
          to="/explore"
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium text-xs rounded-md inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Explore All Stories</span>
        </Link>
      </div>
    );
  }

  const isNameHidden = story.showName === false;
  const personName = getStoryAuthorDisplayName(story);
  const displayImage = isNameHidden ? '' : story.personImage;

  const paragraphs = (story.fullStory || '')
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0);

  // Show full story only when authenticated AND the backend returned full content (not preview)
  const previewParagraphs = (!isPreview && isAuthenticated) ? paragraphs : paragraphs.slice(0, 1);
  const cleanFormattedTag = '@' + (authorNameInput || 'Alumnus').trim().replace(/[@\s]+/g, '_') + '-' + (String(batchInput || '26').trim().replace(/[^0-9]/g, '').slice(-2) || '26');
  const totalReactionCount = Object.values(reactions).reduce((a, b) => a + b, 0);

  const storyTitleText = story.storyTitle || (story as any).title || '';
  const storySummaryText = story.shortSummary || (story as any).summary || '';
  const displayTitle = storyTitleText && storyTitleText.trim().toLowerCase() !== 'success story' 
    ? storyTitleText 
    : (storySummaryText || (personName ? personName + ' - Alumni Story' : 'Alumni Story'));

  const shareUrl = window.location.href;
  const whatsappShareUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent('Read ' + displayTitle + ' on NEC Alumni Portal: ' + shareUrl);
  const mailShareUrl = 'mailto:?subject=' + encodeURIComponent(displayTitle) + '&body=' + encodeURIComponent('Check out this alumni story: ' + shareUrl);
  const linkedinShareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(shareUrl);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      
      {/* Top Breadcrumb & Share Actions */}
      <div className="flex items-center justify-between relative">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Stories</span>
        </Link>

        {/* Share Button & Dropdown */}
        <div className="relative">
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-primary bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share Story</span>
              </>
            )}
          </button>

          {/* Share Dropdown Modal / Popover */}
          {showShareMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-slate-200 shadow-lg py-2 z-50 animate-in fade-in-50 duration-150">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Share this Story
              </div>
              
              <button
                onClick={handleCopyLink}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Link</span>
                </span>
                {copied && <span className="text-[10px] text-emerald-600 font-semibold">Copied!</span>}
              </button>

              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                onClick={() => setShowShareMenu(false)}
              >
                <span className="text-emerald-500 font-bold">💬</span>
                <span>Share on WhatsApp</span>
              </a>

              <a
                href={linkedinShareUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                onClick={() => setShowShareMenu(false)}
              >
                <span className="text-sky-600 font-bold">🔗</span>
                <span>Share on LinkedIn</span>
              </a>

              <a
                href={mailShareUrl}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                onClick={() => setShowShareMenu(false)}
              >
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Send via Email</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* MAIN ARTICLE CARD */}
      <article className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Article Header */}
        <div className="p-6 sm:p-8 space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary-soft text-primary uppercase tracking-wider">
              {story.category || 'Alumni Story'}
            </span>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                {story.views || 0} views
              </span>
              {story.publishedAt && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(story.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
            {displayTitle}
          </h1>

          {/* Author Badge */}
          <div className="flex items-center gap-3.5 pt-1 pb-4 border-b border-slate-100">
            {displayImage ? (
              <img
                src={displayImage}
                alt={personName}
                className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                {personName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{personName}</span>
                {(story as any).isVerified !== false && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Verified Alumni
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {story.batchDisplay || ('Batch ' + ((story as any).batch || (story as any).batchNumber || 'Alumni'))}
                {(story as any).role || story.profession ? ' • ' + ((story as any).role || story.profession) : ''}
                {(story as any).company ? ' at ' + (story as any).company : ''}
              </p>
            </div>
          </div>

          {/* Beneficiary & Supporter Information Banner */}
          {(story.beneficiaryName || story.supporterName) && (
            <div className="flex flex-wrap items-center gap-5 p-3.5 rounded-lg bg-slate-50 border border-slate-200/90 text-xs">
              {story.beneficiaryName && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs">
                    🤝
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Beneficiary</span>
                    <span className="font-semibold text-slate-900">{getStoryBeneficiaryDisplayName(story)}</span>
                  </div>
                </div>
              )}
              {story.supporterName && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-purple-50 text-primary border border-purple-200 flex items-center justify-center font-bold text-xs">
                    🌟
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Supporter</span>
                    <span className="font-semibold text-slate-900">{getStorySupporterDisplayName(story)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Story Narrative */}
          <div className="space-y-5 text-slate-800 text-[15px] sm:text-base leading-relaxed font-normal">
            {previewParagraphs.length > 0 ? (
              previewParagraphs.map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line leading-relaxed text-slate-800">
                  {paragraph}
                </p>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">
                No detailed narrative is currently available for this story.
              </div>
            )}
          </div>

          {/* EMAIL GATEWAY (Enter Email to Login and Read Full Story) */}
          {!isAuthenticated && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="bg-gradient-to-br from-slate-50 to-purple-50/40 rounded-xl border border-slate-200/80 p-6 sm:p-8 text-center max-w-lg mx-auto space-y-4 shadow-2xs">
                <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center mx-auto shadow-2xs">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900">
                    Read the Full Alumni Story
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    This story is exclusively available to members of the National Engineering College Alumni Network. Enter your email to unlock instantly.
                  </p>
                </div>

                {gateError && (
                  <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {gateError}
                  </div>
                )}

                <form onSubmit={handleConnectEmail} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto pt-1">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={connectEmail}
                    onChange={(e) => setConnectEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={gateSubmitting}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {gateSubmitting ? 'Unlocking...' : 'Unlock & Read Full Story'}
                  </button>
                </form>

                <div className="pt-2 text-[11px] text-slate-400">
                  <span>Already have a password? </span>
                  <Link to={'/login?redirect=' + encodeURIComponent(window.location.pathname)} className="text-primary font-semibold hover:underline">
                    Sign In Here
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 🌟 REACTIONS ACTION ROW */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Clap */}
            <button
              type="button"
              onClick={() => handleReaction('clap')}
              className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ' + (
                userReacted['clap']
                  ? 'bg-primary-soft text-primary border border-purple-300 font-semibold shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              )}
            >
              <ThumbsUp className={'w-3.5 h-3.5 ' + (userReacted['clap'] ? 'text-primary fill-primary' : 'text-slate-500')} />
              <span>Clap</span>
              <span className="text-[11px] font-bold text-slate-900">{reactions['clap'] || 0}</span>
            </button>

            {/* Inspiring */}
            <button
              type="button"
              onClick={() => handleReaction('inspiring')}
              className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ' + (
                userReacted['inspiring']
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              )}
            >
              <Sparkles className={'w-3.5 h-3.5 ' + (userReacted['inspiring'] ? 'text-amber-600 fill-amber-500' : 'text-amber-500')} />
              <span>Inspiring</span>
              <span className="text-[11px] font-bold text-slate-900">{reactions['inspiring'] || 0}</span>
            </button>

            {/* Love */}
            <button
              type="button"
              onClick={() => handleReaction('love')}
              className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ' + (
                userReacted['love']
                  ? 'bg-rose-100 text-rose-900 border border-rose-300 font-semibold shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              )}
            >
              <Heart className={'w-3.5 h-3.5 ' + (userReacted['love'] ? 'text-rose-600 fill-rose-500' : 'text-rose-500')} />
              <span>Love</span>
              <span className="text-[11px] font-bold text-slate-900">{reactions['love'] || 0}</span>
            </button>

            {/* Insightful */}
            <button
              type="button"
              onClick={() => handleReaction('insightful')}
              className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ' + (
                userReacted['insightful']
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              )}
            >
              <Lightbulb className={'w-3.5 h-3.5 ' + (userReacted['insightful'] ? 'text-emerald-700 fill-emerald-500' : 'text-emerald-600')} />
              <span>Insightful</span>
              <span className="text-[11px] font-bold text-slate-900">{reactions['insightful'] || 0}</span>
            </button>

            {/* Proud */}
            <button
              type="button"
              onClick={() => handleReaction('fire')}
              className={'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ' + (
                userReacted['fire']
                  ? 'bg-orange-100 text-orange-900 border border-orange-300 font-semibold shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              )}
            >
              <Flame className={'w-3.5 h-3.5 ' + (userReacted['fire'] ? 'text-orange-600 fill-orange-500' : 'text-orange-500')} />
              <span>Proud</span>
              <span className="text-[11px] font-bold text-slate-900">{reactions['fire'] || 0}</span>
            </button>

          </div>

          <span className="text-xs text-slate-400 font-medium">
            {totalReactionCount} {totalReactionCount === 1 ? 'reaction' : 'reactions'}
          </span>
        </div>

      </article>

      {/* 💬 PROFESSIONAL DISCUSSION & COMMENTS CARD */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Section Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-slate-900">
              Alumni Discussion
            </h2>
            <span className="text-xs font-semibold text-primary bg-primary-soft border border-purple-200 px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Share reflections & congratulate the author
          </span>
        </div>

        {/* Clean Comment Compose Area */}
        <form onSubmit={handleCommentSubmit} className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          
          {/* Identity Meta Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Posting as:</span>
              <span className="font-mono text-xs font-bold text-primary bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                {cleanFormattedTag}
              </span>
            </div>

            {/* Inline Name & Batch Customization */}
            <div className="flex items-center gap-2 text-slate-600">
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                <User className="w-3 h-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Your Name"
                  value={authorNameInput}
                  onChange={(e) => setAuthorNameInput(e.target.value)}
                  className="w-24 sm:w-28 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                  title="Your Display Name"
                />
              </div>

              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-400 font-medium">Batch:</span>
                <input
                  type="text"
                  placeholder="26"
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  className="w-8 text-xs text-center font-mono font-bold text-primary bg-transparent focus:outline-none"
                  title="Your Batch Number"
                />
              </div>
            </div>

          </div>

          {/* Textarea */}
          <textarea
            required
            rows={3}
            placeholder="Add to the discussion, share your thoughts or congratulate..."
            value={commentTextInput}
            onChange={(e) => setCommentTextInput(e.target.value)}
            className="w-full p-3.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y leading-relaxed"
          />

          {commentSuccessMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Comment posted successfully as <strong>{cleanFormattedTag}</strong></span>
            </div>
          )}

          {/* Footer of Form */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Visible to all verified alumni
            </span>

            <button
              type="submit"
              disabled={submittingComment || !commentTextInput.trim()}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submittingComment ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* Comments Feed List */}
        <div className="pt-2">
          {commentsLoading ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading alumni discussion...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-slate-200/60 space-y-2">
              <MessageSquare className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No comments yet</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Be the first alumnus to react and congratulate the author on this milestone.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {comments.map((comment) => (
                <div key={comment.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  
                  {/* Comment Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center border border-purple-200">
                        {(comment.authorName || 'A').charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {comment.authorName}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-primary bg-primary-soft border border-purple-200 px-2 py-0.5 rounded">
                          {comment.authorTag || ('@' + (comment.authorName || 'Alumnus') + '-' + (comment.batchNumber || '26'))}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Comment Body */}
                  <div className="pl-9 text-xs sm:text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">
                    {comment.commentText}
                  </div>

                  {/* Comment Action Footer */}
                  <div className="pl-9 pt-1 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleLikeComment(comment.id)}
                      className={'inline-flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ' + (
                        likedComments[comment.id] ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'
                      )}
                    >
                      <Heart className={'w-3 h-3 ' + (likedComments[comment.id] ? 'fill-rose-500 text-rose-500' : '')} />
                      <span>{(comment.likes || 0) > 0 ? (comment.likes || 0) : 'Like'}</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </section>

    </div>
  );
};
