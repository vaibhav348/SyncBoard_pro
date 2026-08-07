// SkeletonLoader.tsx
// Animated placeholder rows shown while a search request is in flight.

interface SkeletonLoaderProps {
    rows?: number;
  }
  
  export default function SkeletonLoader({ rows = 4 }: SkeletonLoaderProps) {
    return (
      <div className="space-y-6 animate-pulse" aria-hidden="true">
        {Array.from({ length: 2 }).map((_, groupIdx) => (
          <div key={groupIdx}>
            {/* Fake section title */}
            <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
  
            <div className="space-y-2">
              {Array.from({ length: rows }).map((_, rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"
                >
                  <div className="h-8 w-8 rounded-md bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/5" />
                    <div className="h-2.5 bg-gray-100 rounded w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }