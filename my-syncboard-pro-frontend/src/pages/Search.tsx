// Search.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListTodo, Rocket, BookOpen, Users, AlertCircle, Search as SearchIcon, X, Filter } from "lucide-react";
import { useAppSelector } from "../hooks/storeHooks"; // 1. Imported your Redux hook

import SkeletonLoader from "../components/Search/SkeletonLoader";
import ResultSection from "../components/Search/ResultSection";
import type {
  SearchResults,
  TaskResult,
  SprintResult,
  StoryResult,
  IssueResult,
  MemberResult,
} from "../types/search.types";
import axiosInstance from "../api/axiosInstance";
import axios from "axios";

interface SearchProps {
  projectId: string;
}

// Added strict type for the filters to remove the 'any' cast later
type FilterType = "all" | "tasks" | "stories" | "sprints" | "issues" | "members";

export default function Search({ projectId }: SearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");

  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);
   

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
      // ✨ Using your axiosInstance instead of fetch
      const response = await axiosInstance.get(
        `/projects/${projectId}/search?q=${encodeURIComponent(query)}&type=${filterType}`,
        { 
          signal: controller.signal // Passes the abort signal to Axios
        }
      );
      
      // Axios automatically parses the JSON and throws on bad status codes
      setResults(response.data);
      } catch (err) {
        if (axios.isCancel(err) || (err as Error).name === "CanceledError") {
          return; 
        }
        
        console.error("Search API Error:", err);
        setError("Something went wrong while searching. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query, projectId, filterType]); // Added token to dependency array

  const hasNoResults =
    results &&
    results.tasks.length === 0 &&
    results.sprints.length === 0 &&
    results.stories.length === 0 &&
    results.issues.length === 0 &&
    results.members.length === 0;

  return (
    <div className="search-page mx-auto max-w-2xl px-4 py-8">
      {/* Search input */}
      <div className="relative mb-6">
        <SearchIcon
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks, sprints, stories, people..."
          className="search-input w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter chips */}
      {query.trim().length >= 2 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <Filter size={16} className="text-gray-400 shrink-0" />
          {(["all", "tasks", "stories", "sprints", "issues", "members"] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)} // Removed 'as any' cast
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors shrink-0 ${
                filterType === type
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* States */}
      {loading && <SkeletonLoader />}

      {!loading && error && (
        <p className="text-sm text-red-500 text-center py-8">{error}</p>
      )}

      {!loading && !error && query.trim().length >= 2 && hasNoResults && (
        <p className="text-sm text-gray-500 text-center py-8">
          No results for "<span className="font-medium text-gray-700">{query}</span>"
        </p>
      )}

      {!loading && !error && results && !hasNoResults && (
        <>
          <ResultSection
            title="Tasks"
            icon={ListTodo}
            query={query}
            items={results.tasks.map((t: TaskResult) => ({
              _id: t._id,
              primaryText: t.taskKey ? `${t.taskKey} · ${t.title}` : t.title,
              secondaryText: t.assignee?.name || t.status,
              status: t.status,
            }))}
            onItemClick={(item) => navigate(`/projects/${projectId}/task/${item._id}`)}
          />

          <ResultSection
            title="Sprints"
            icon={Rocket}
            query={query}
            items={results.sprints.map((s: SprintResult) => ({
              _id: s._id,
              primaryText: s.name,
              secondaryText: s.goal || s.status,
              status: s.status,
            }))}
            onItemClick={(item) => navigate(`/projects/${projectId}/sprint/${item._id}`)}
          />

          <ResultSection
            title="Stories"
            icon={BookOpen}
            query={query}
            items={results.stories.map((s: StoryResult) => ({
              _id: s._id,
              primaryText: s.title,
              secondaryText: s.points ? `${s.points} points` : s.status,
              status: s.status,
            }))}
            onItemClick={(item) => navigate(`/projects/${projectId}/story/${item._id}`)}
          />

          <ResultSection
            title="Issues"
            icon={AlertCircle}
            query={query}
            items={results.issues.map((i: IssueResult) => ({
              _id: i._id,
              primaryText: i.issueKey ? `${i.issueKey} · ${i.title}` : i.title,
              secondaryText: i.type || i.priority,
              status: i.status,
            }))}
            onItemClick={(item) => navigate(`/projects/${projectId}/issue/${item._id}`)}
          />

          <ResultSection
            title="Team"
            icon={Users}
            query={query}
            items={results.members.map((m: MemberResult) => ({
              _id: m._id,
              primaryText: m.name,
              secondaryText: m.email || m.role,
            }))}
            onItemClick={(item) => navigate(`/projects/${projectId}/team/${item._id}`)}
          />
        </>
      )}

      {!loading && !results && query.trim().length < 2 && (
        <p className="text-sm text-gray-400 text-center py-8">
          Type at least 2 characters to search across your project.
        </p>
      )}
    </div>
  );
}