'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { commentService } from '@/lib/services/comments';
import type { ServiceRequestComment, CommentType, AddCallCommentInput } from '@/types';

interface CommentsSectionProps {
  serviceRequestId: string;
}

const COMMENT_TYPE_LABELS: Record<CommentType, string> = {
  INTERNAL_NOTE: 'Internal Note',
  CUSTOMER_CALL: 'Called Customer',
  CUSTOMER_CALLED: 'Customer Called',
  EMAIL_SENT: 'Email Sent',
  EMAIL_RECEIVED: 'Email Received',
  SMS_SENT: 'SMS Sent',
  SMS_RECEIVED: 'SMS Received',
  WHATSAPP: 'WhatsApp',
  CUSTOMER_MESSAGE: 'Customer Message',
  SITE_VISIT_NOTE: 'Site Visit Note',
  SCHEDULING_NOTE: 'Scheduling Note',
  SCOPE_OF_WORK: 'Scope of Work',
};

const COMMENT_TYPE_ICONS: Record<CommentType, string> = {
  INTERNAL_NOTE: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  CUSTOMER_CALL: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  CUSTOMER_CALLED: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  EMAIL_SENT: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  EMAIL_RECEIVED: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  SMS_SENT: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  SMS_RECEIVED: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  WHATSAPP: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  CUSTOMER_MESSAGE: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z',
  SITE_VISIT_NOTE: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  SCHEDULING_NOTE: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  SCOPE_OF_WORK: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
};

const COMMENT_TYPE_COLORS: Record<CommentType, string> = {
  INTERNAL_NOTE: 'bg-gray-100 text-gray-600',
  CUSTOMER_CALL: 'bg-green-100 text-green-600',
  CUSTOMER_CALLED: 'bg-blue-100 text-blue-600',
  EMAIL_SENT: 'bg-purple-100 text-purple-600',
  EMAIL_RECEIVED: 'bg-indigo-100 text-indigo-600',
  SMS_SENT: 'bg-yellow-100 text-yellow-600',
  SMS_RECEIVED: 'bg-orange-100 text-orange-600',
  WHATSAPP: 'bg-green-100 text-green-700',
  CUSTOMER_MESSAGE: 'bg-cyan-100 text-cyan-600',
  SITE_VISIT_NOTE: 'bg-pink-100 text-pink-600',
  SCHEDULING_NOTE: 'bg-sky-100 text-sky-600',
  SCOPE_OF_WORK: 'bg-amber-100 text-amber-700',
};

export function CommentsSection({ serviceRequestId }: CommentsSectionProps) {
  const [comments, setComments] = useState<ServiceRequestComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<CommentType | 'ALL'>('ALL');

  // Form state for regular comment
  const [commentContent, setCommentContent] = useState('');
  const [commentType, setCommentType] = useState<CommentType>('INTERNAL_NOTE');

  // Form state for call comment
  const [callContent, setCallContent] = useState('');
  const [callDirection, setCallDirection] = useState<'OUTBOUND' | 'INBOUND'>('OUTBOUND');
  const [callNumber, setCallNumber] = useState('');
  const [callDuration, setCallDuration] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  useEffect(() => {
    loadComments();
  }, [serviceRequestId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await commentService.getByServiceRequest(serviceRequestId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      setSubmitting(true);
      const newComment = await commentService.create({
        serviceRequestId,
        content: commentContent,
        commentType,
        isInternal: true,
      });
      setComments([newComment, ...comments]);
      setCommentContent('');
      setCommentType('INTERNAL_NOTE');
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCallComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callContent.trim()) return;

    try {
      setSubmitting(true);
      const data: AddCallCommentInput = {
        serviceRequestId,
        content: callContent,
        direction: callDirection,
        contactNumber: callNumber || undefined,
        contactDuration: callDuration ? parseInt(callDuration) * 60 : undefined, // Convert minutes to seconds
        preferredDate: preferredDate || undefined,
        preferredTime: preferredTime || undefined,
      };
      const newComment = await commentService.addCallComment(data);
      setComments([newComment, ...comments]);
      // Reset form
      setCallContent('');
      setCallDirection('OUTBOUND');
      setCallNumber('');
      setCallDuration('');
      setPreferredDate('');
      setPreferredTime('');
      setShowCallForm(false);
    } catch (error) {
      console.error('Failed to add call comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentService.delete(id);
      setComments(comments.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Filter comments based on search query and type filter
  const filteredComments = comments.filter((comment) => {
    // Apply type filter
    if (filterType !== 'ALL' && comment.commentType !== filterType) {
      return false;
    }
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesContent = comment.content.toLowerCase().includes(query);
      const matchesAuthor = comment.createdBy
        ? `${comment.createdBy.firstName} ${comment.createdBy.lastName}`.toLowerCase().includes(query)
        : false;
      const matchesPhone = comment.contactNumber?.toLowerCase().includes(query);
      const matchesDate = comment.preferredDate?.toLowerCase().includes(query);
      return matchesContent || matchesAuthor || matchesPhone || matchesDate;
    }
    return true;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Comments & Activity</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{comments.length} comments</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowCallForm(true);
              setShowAddForm(false);
            }}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Log Call
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowAddForm(true);
              setShowCallForm(false);
            }}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Note
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      {comments.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search comments..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as CommentType | 'ALL')}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="ALL">All Types</option>
              {Object.entries(COMMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          {(searchQuery || filterType !== 'ALL') && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Showing {filteredComments.length} of {comments.length} comments</span>
              {(searchQuery || filterType !== 'ALL') && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterType('ALL'); }}
                  className="text-sky-600 hover:text-sky-700 dark:text-sky-400"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Comment Form */}
      {showAddForm && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
          <form onSubmit={handleAddComment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Comment Type</label>
              <select
                value={commentType}
                onChange={(e) => setCommentType(e.target.value as CommentType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {Object.entries(COMMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Content</label>
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Enter your comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Comment'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Log Call Form */}
      {showCallForm && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
          <form onSubmit={handleAddCallComment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Call Direction</label>
                <select
                  value={callDirection}
                  onChange={(e) => setCallDirection(e.target.value as 'OUTBOUND' | 'INBOUND')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="OUTBOUND">Called Customer (Outbound)</option>
                  <option value="INBOUND">Customer Called (Inbound)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={callNumber}
                  onChange={(e) => setCallNumber(e.target.value)}
                  placeholder="+973-1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Call Duration (minutes)</label>
              <input
                type="number"
                value={callDuration}
                onChange={(e) => setCallDuration(e.target.value)}
                placeholder="e.g., 5"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Call Notes</label>
              <textarea
                value={callContent}
                onChange={(e) => setCallContent(e.target.value)}
                placeholder="What was discussed during the call..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Customer&apos;s Preferred Appointment
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Preferred Time</label>
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCallForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Call Log'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Comments List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p>No comments yet</p>
            <p className="text-sm">Add a note or log a call to get started</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>No matching comments</p>
            <p className="text-sm">Try adjusting your search or filter</p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div key={comment.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${COMMENT_TYPE_COLORS[comment.commentType]}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={COMMENT_TYPE_ICONS[comment.commentType]} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${COMMENT_TYPE_COLORS[comment.commentType]}`}>
                        {COMMENT_TYPE_LABELS[comment.commentType]}
                      </span>
                      {comment.contactDuration && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDuration(comment.contactDuration)}
                        </span>
                      )}
                      {comment.isInternal && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          Internal
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete comment"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{comment.content}</p>
                  {(comment.preferredDate || comment.preferredTime) && (
                    <div className="mt-2 p-2 bg-sky-50 dark:bg-sky-900/30 rounded-lg border border-sky-100 dark:border-sky-800">
                      <div className="flex items-center gap-2 text-sm text-sky-700 dark:text-sky-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Preferred:</span>
                        {comment.preferredDate && <span>{comment.preferredDate}</span>}
                        {comment.preferredTime && <span>at {comment.preferredTime}</span>}
                      </div>
                    </div>
                  )}
                  {comment.contactNumber && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {comment.contactNumber}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {comment.createdBy
                        ? `${comment.createdBy.firstName} ${comment.createdBy.lastName}`
                        : 'System'}
                    </span>
                    <span>{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
