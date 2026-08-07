import { useEffect, useRef, useState } from 'react';
import { Plus, Paperclip, Send } from 'lucide-react';
import { IssueDescriptionEditor } from './IssueDescriptionEditor';
import { IssueCommentEditor } from './IssueCommentEditor';
import axiosInstance from '../../api/axiosInstance';
import { useActiveIssue } from '../../hooks/useActiveIssue';
import { useCanEditIssue } from '../../hooks/useCanEditIssue';
import { useIssueFieldUpdate } from '../../hooks/useIssueFieldUpdate';

const proseClass =
  'text-[15px] leading-[1.6] text-slate-800 ' +
  '[&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-2 ' +
  '[&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-2 ' +
  '[&_li]:pl-1 [&_li]:mb-1 ' +
  '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-slate-900 ' +
  '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:text-slate-900 ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-indigo-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-700 [&_blockquote]:my-2 ' +
  '[&_pre]:bg-slate-50 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-2 [&_pre]:overflow-x-auto ' +
  '[&_code]:bg-slate-100 [&_code]:text-indigo-600 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-xs ' +
  '[&_hr]:border-slate-200 [&_hr]:my-4 ' +
  '[&_p]:mb-2';

// ── Collapsible comment body — YouTube-style "Show more/less" ──────────────
const COMMENT_COLLAPSED_HEIGHT = 120; // px

const CommentBody = ({ html }: { html: string }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      setIsOverflowing(contentRef.current.scrollHeight > COMMENT_COLLAPSED_HEIGHT + 4);
    }
  }, [html]);

  return (
    <div>
      <div
        ref={contentRef}
        className={`${proseClass} break-words [overflow-wrap:anywhere] overflow-hidden transition-[max-height] duration-300 ease-in-out`}
        style={{
          maxHeight: expanded ? contentRef.current?.scrollHeight ?? 'none' : COMMENT_COLLAPSED_HEIGHT,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {isOverflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 mt-1.5 cursor-pointer"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

export const IssueMainContent = () => {
  const [descriptionEdit, setDescriptionEdit] = useState(false);
  const [localDescription, setLocalDescription] = useState('');
  const [localComments, setLocalComments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [loading, setLoading] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const { issue } = useActiveIssue();
  const canEditAll = useCanEditIssue();
  const updateField = useIssueFieldUpdate();

  useEffect(() => {
    if (issue?.description) {
      setLocalDescription(issue.description);
    }
  }, [issue?.description]);

  const handleSaveDescription = (updatedHTML: string) => {
    setLocalDescription(updatedHTML);
    void updateField('description', updatedHTML);
    setDescriptionEdit(false);
  };

  useEffect(() => {
    if (!issue?._id) return;

    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/issue/${issue._id}/comments`);
        setLocalComments(response.data?.comments || []);
      } catch (error) {
        console.log('Unable to load comments.', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchComments();
  }, [issue?._id]);

  const handleSaveComment = async (commentHtml: string) => {
    if (!issue?._id) return;

    try {
      const response = await axiosInstance.post(`/issue/${issue._id}/comments`, { content: commentHtml });
      if (response.data?.success && response.data?.comment) {
        setLocalComments((prev) => [...prev, response.data.comment]);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
    setIsCommenting(false);
  };

  if (!issue) return null;

  return (
    <div className="flex-1 min-w-0 space-y-8 p-8 bg-white">
      <div>
        {descriptionEdit && canEditAll ? (
          <IssueDescriptionEditor
            initialDescription={localDescription}
            canEditAll={canEditAll}
            onSave={handleSaveDescription}
            onCancel={() => setDescriptionEdit(false)}
          />
        ) : (
          <div className="space-y-4">
            <div
              onClick={() => canEditAll && setDescriptionEdit(true)}
              className={`py-2 min-h-[200px] transition-colors ${proseClass} break-words [overflow-wrap:anywhere] ${
                canEditAll ? 'cursor-pointer' : ''
              } ${localDescription ? '' : 'text-slate-400 italic'}`}
              dangerouslySetInnerHTML={{ __html: localDescription || 'No description yet. Click here to add one.' }}
            />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2 bg-slate-100 p-2">
          <p className="font-mono text-[12px] uppercase tracking-wide text-slate-800">
            Attachments
            <span className="ml-1.5">·</span>
            <span className="ml-1.5">0</span>
          </p>
          <button className="w-6 h-6 rounded-md border border-slate-500 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:border-slate-700 transition-colors hover:cursor-pointer">
            <Plus size={12} />
          </button>
        </div>
        <div className="border border-dashed border-slate-300 bg-slate-50 p-8 flex flex-col items-center justify-center gap-2 text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer">
          <Paperclip size={20} />
          <span className="text-xs">Drop attachments here</span>
        </div>
      </div>

      <div>
        <div className="flex border-b border-slate-200 mb-5">
          {(
            [
              { key: 'comments', label: 'Comments', count: localComments.length },
              { key: 'activity', label: 'Activity', count: 2 },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 mr-6 text-sm font-medium border-b-2 cursor-pointer transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-700 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 font-mono text-xs text-slate-400">{tab.count}</span>
            </button>
          ))}
        </div>

        {activeTab === 'comments' && (
          <>
            <div className="space-y-3">
              {isCommenting ? (
                <IssueCommentEditor
                  onSave={handleSaveComment}
                  onCancel={() => setIsCommenting(false)}
                />
              ) : (
                <div
                  className="w-full flex flex-col justify-between border cursor-text border-slate-200 bg-slate-50 hover:border-slate-300 p-0 min-h-0 text-sm text-slate-700 transition-colors select-none rounded-none space-y-3 h-32"
                  onClick={() => setIsCommenting(true)}
                >
                  <div className="w-full p-4 text-sm text-slate-400 focus:outline-none resize-none">
                    Type a new comment here...
                  </div>
                  <div className="flex justify-end px-3 pb-3">
                    <button
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 opacity-30 cursor-not-allowed transition-colors shrink-0"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            {loading ? (
              <div className="text-xs text-slate-400 mt-4">Loading comments...</div>
            ) : (
              <div className="space-y-5 mt-6">
                {localComments.length === 0 ? (
                  <p className="text-[12px] text-slate-400 italic py-4 text-center">
                    No comments yet. Be the first to comment.
                  </p>
                ) : (
                  localComments.map((comment) => (
                    <div key={comment._id} className="flex items-start gap-3 text-sm border-b border-slate-200 pb-4 last:border-0">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700 shrink-0 mt-0.5 uppercase">
                        {comment.userId.name[0]}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{comment.userId.name}</span>
                          <span className="text-xs text-slate-700">
                            •{' '}
                            {new Date(comment.createdAt).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* ✅ YouTube-style collapsible comment */}
                        <CommentBody html={comment.content} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-3">
            {[
              { actor: 'System', action: 'Issue created', time: '2h ago' },
              { actor: 'System', action: 'Status changed to Open', time: '2h ago' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-medium text-slate-600 shrink-0 mt-0.5">
                  {item.actor[0]}
                </div>
                <p className="text-slate-700 leading-relaxed">
                  <span className="font-medium text-slate-800">{item.actor}</span> {item.action}
                  <span className="text-slate-400"> · {item.time}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};