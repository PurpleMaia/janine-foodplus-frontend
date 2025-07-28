import { KANBAN_COLUMNS } from "@/lib/kanban-columns";
import { cn } from '@/lib/utils';

export const KanbanColumnSkeleton = () => {
    const numCols = KANBAN_COLUMNS.length
    return (
    <div
    className={cn(
        "flex h-[calc(100vh-10rem)] w-80 shrink-0 flex-col rounded-lg border bg-secondary/50 shadow-sm animate-pulse",          
    )}
    >
        {/* Header skeleton */}
        <div className="sticky top-0 z-[1] rounded-t-lg bg-secondary p-3 shadow-sm">
          <div className="h-5 w-32 bg-muted rounded animate-pulse"></div>
        </div>
  
        <div className="flex-1 p-2">
          <div className="flex flex-col gap-2">
            {/* Generate skeleton cards */}            
            {Array.from({ length: 3 }).map((_, index) => (
              <KanbanCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        </div>
      </div>
    )
}

const KanbanCardSkeleton = () => {
    return (
        <div className="rounded-lg border bg-card p-3 shadow-sm animate-pulse">
            {/* Card title skeleton */}
            <div className="h-4 w-3/4 bg-muted rounded mb-2"></div>
            
            {/* Card content skeleton - vary heights for realism */}
            <div className="space-y-2">
                <div className="h-3 w-full bg-muted rounded"></div>
                <div className="h-3 w-2/3 bg-muted rounded"></div>
            </div>
            
            {/* Card metadata skeleton (like date, amount, etc.) */}
            <div className="flex justify-between items-center mt-3">
                <div className="h-3 w-16 bg-muted rounded"></div>
                <div className="h-3 w-12 bg-muted rounded"></div>
            </div>
        </div>
    )
}

export default function KanbanBoardSkeleton() {
    return (
        <>
            <div className="flex gap-4 p-4 overflow-x-auto">
                {KANBAN_COLUMNS.map((column, index) => (
                    <KanbanColumnSkeleton 
                    key={`column-skeleton-${index}`}
                    />
                ))}
            </div>
        </>
    )
}