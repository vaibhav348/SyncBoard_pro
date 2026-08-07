import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { IssueHeader } from '../../components/Issue/IssueHeader';
import { IssueMainContent } from '../../components/Issue/IssueMainContent';
import { IssueRightSidebar } from '../../components/Issue/IssueRightSidebar';
import AddMembersToIssue from '../../components/Issue/AddMembersToIssue';
import { useActiveIssue } from '../../hooks/useActiveIssue';
import type { Issue } from '../../types/issue';

const IssueSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-4 w-28 rounded-md bg-slate-100" />
    <div className="rounded-3xl bg-white border border-slate-200/80 shadow-md shadow-slate-200/50 p-6 md:p-8 space-y-3">
      <div className="flex gap-2">
        <div className="h-4 w-16 rounded-md bg-slate-100" />
        <div className="h-4 w-12 rounded-md bg-slate-100" />
      </div>
      <div className="h-6 w-2/3 rounded-md bg-slate-100" />
      <div className="h-4 w-32 rounded-md bg-slate-100 mt-4" />
      <div className="flex gap-8 pt-4">
        <div className="flex-1 space-y-3">
          <div className="h-24 rounded-xl bg-slate-50" />
          <div className="h-32 rounded-xl bg-slate-50" />
        </div>
        <div className="w-72 space-y-4">
          <div className="h-20 rounded-xl bg-slate-50" />
          <div className="h-32 rounded-xl bg-slate-50" />
          <div className="h-24 rounded-xl bg-slate-50" />
        </div>
      </div>
    </div>
  </div>
);

export default function IssueDetailPage() {
  const { issueId } = useParams();
  const location = useLocation();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const {
    issue,
    loading,
    error,
    startLoadingActiveIssue,
    selectActiveIssue,
    failActiveIssue,
    resetActiveIssue,
  } = useActiveIssue();

  useEffect(() => {
    if (!issueId) return;

    const fetchIssue = async () => {
      startLoadingActiveIssue();
      try {
        const response = await axiosInstance.get(`/issue/${issueId}`);
        const issue = response.data?.issue as Issue | undefined;
        if (issue) {
          selectActiveIssue(issue);
        } else {
          failActiveIssue('This issue could not be loaded.');
        }
      } catch {
        failActiveIssue('Unable to load this issue. It may have been deleted or you may not have access.');
      }
    };

    void fetchIssue();

    return () => {
      resetActiveIssue();
    };
  }, [issueId, startLoadingActiveIssue, selectActiveIssue, failActiveIssue, resetActiveIssue]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <IssueSkeleton />
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-md shadow-slate-200/50 p-6 max-w-lg">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
              <AlertCircle size={16} className="text-rose-500" />
              Issue not found
            </div>
            <p className="text-sm text-slate-500 mb-4">
              {error || 'This issue could not be loaded.'}
            </p>
 

            <Link
              to=".."
              relative="path"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to issues
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const returnTo = (location.state as { returnTo?: { pathname?: string; search?: string } } | undefined)?.returnTo;
  const returnPath = returnTo?.pathname ? `${returnTo.pathname}${returnTo.search ?? ''}` : null;

  return (
    <div className="min-h-screen bg-slate-100 ">
      <div className="flex items-start">
        <div className="w-full min-w-0">
          <IssueHeader />
          <IssueMainContent />
        </div>
        <IssueRightSidebar setIsPopupOpen={setIsPopupOpen} returnTo={returnPath} />
      </div>

      {isPopupOpen && (
        <AddMembersToIssue onClose={() => setIsPopupOpen(false)} />
      )}
    </div>
  );
}
