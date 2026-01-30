

'use client';

import React, { useState, useRef, use } from 'react';
import type { Bill, TempBill } from '@/types/legislation';
import { KanbanCard } from './kanban-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { TempBillCard } from './temp-card';
import { ListRestart, TriangleAlert } from 'lucide-react';
import ColumnOptionsMenu from './column-options-menu';
import { KanbanCardSkeleton } from './skeletons/skeleton-board';
import { useAuth } from '@/hooks/contexts/auth-context';

// Adds readOnly prop to control card rendering
// When readOnly=true, cards aren't wrapped in Draggable components

export interface KanbanColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  columnId: any; // keep as-is since your board passes a string id
  title: string;
  bills: Bill[];
  isDraggingOver: boolean;
  draggingBillId: string | null;
  children?: React.ReactNode; // Droppable placeholder
  onCardClick: (bill: Bill) => void;
  readOnly?: boolean;
  onUnadopt?: (billId: string) => void;
  showUnadoptButton?: boolean;

  // NEW — pending proposals support
  pendingTempBills?: TempBill[];
  canModerate?: boolean; // show Approve/Reject for supervisors/admins
  onApproveTemp?: (billId: string) => void;
  onRejectTemp?: (billId: string) => void;
  onUndoProposal?: (billId: string) => void;
  onTempCardClick?: (tempBill: TempBill) => void; // Handler for temp card clicks
  billCardRefs?: React.MutableRefObject<Map<string, HTMLDivElement>>; // Shared refs for all bill cards
  columnScrollViewportRefs?: React.MutableRefObject<Map<number, HTMLDivElement>>; // Shared refs for all column scroll viewports
  columnIndex?: number; // Index of this column in the board

  enableDnd?: boolean;
}


export const KanbanColumn = React.forwardRef<HTMLDivElement, KanbanColumnProps>(
  (
    {
      columnId,
      title,
      bills,
      isDraggingOver,
      draggingBillId,
      onCardClick,
      onUnadopt,
      showUnadoptButton = false,
      children,
      className,
      readOnly = false,

      pendingTempBills = [],
      canModerate = false,
      onApproveTemp,
      onRejectTemp,
      onUndoProposal,
      onTempCardClick,
      billCardRefs: sharedBillCardRefs,
      columnScrollViewportRefs,
      columnIndex,

      enableDnd = false,
      ...props
    },
    ref
  ) => {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState<boolean>(false);

    // Use shared refs from parent, or create local ones if not provided
    const localBillCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const billCardRefsToUse = sharedBillCardRefs || localBillCardRefs;

    const pendingCount = pendingTempBills?.length ?? 0;

    return (
      <div
        ref={ref}
        className={cn(
          'flex h-[calc(100vh-10rem)] w-80 shrink-0 flex-col rounded-lg border bg-secondary/50 shadow-sm',
          isDraggingOver ? 'bg-accent/20' : '',
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-lg bg-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-secondary/80 p-3 shadow-sm border-b">
          <h2
            className="flex items-center justify-between gap-2 text-sm font-semibold text-secondary-foreground"
            title={title}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-wrap max-w-[12rem] md:max-w-[16rem]">
                {title}
              </span>
              <span className="shrink-0 text-muted-foreground">({bills.length})</span>
              {pendingCount > 0 && (
                <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full border">
                  Pending {pendingCount}
                </span>
              )}
            </span>

            { user && (
              <ColumnOptionsMenu
                bills={bills}
                onRefreshStart={() => setRefreshing(true)}
                onRefreshEnd={() => setRefreshing(false)}
              />
            )}
          </h2>

          {/* {bills.length >= 20 && (
            <p className="mt-2 text-xs text-gray-600 flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-yellow-600" />
              Clicking <ListRestart className="h-3 w-3" /> will take a long time
            </p>
          )} */}
        </div>

        <ScrollArea className="flex-1 p-2">
          <div
            className="flex flex-col gap-2"
            ref={(el) => {
              // Get the viewport element (parent of this div) and store it in the shared map
              if (el && el.parentElement && columnScrollViewportRefs && columnIndex !== undefined) {
                columnScrollViewportRefs.current.set(columnIndex, el.parentElement as HTMLDivElement);
              }
            }}
          >
            {/* REAL BILL CARDS */}
            {bills.map((bill, index) =>
              refreshing ? (
                <div key={bill.id}>
                  <KanbanCardSkeleton />
                </div>
              ) : readOnly ? (
                <KanbanCard
                  key={bill.id}
                  ref={(el) => {
                    if (el) billCardRefsToUse.current.set(bill.id, el);
                  }}
                  bill={bill}
                  isDragging={false}
                  onCardClick={onCardClick}
                  onUnadopt={onUnadopt}
                  showUnadoptButton={showUnadoptButton}
                />
              ) : (
                <Draggable key={bill.id} draggableId={bill.id} index={index}>
                  {(provided, snapshot) => (
                    <KanbanCard
                      ref={(el) => {
                        provided.innerRef(el);
                        if (el) billCardRefsToUse.current.set(bill.id, el);
                      }}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      bill={bill}
                      isDragging={snapshot.isDragging}
                      onCardClick={onCardClick}
                      onUnadopt={onUnadopt}
                      showUnadoptButton={showUnadoptButton}
                      style={{
                        ...provided.draggableProps.style,
                      }}
                    />
                  )}
                </Draggable>
              )
            )}

            {/* Droppable placeholder goes here */}
            {children}

            {/* PENDING PROPOSALS (using TempBillCard component) */}
            {pendingCount > 0 && (
              <div className="mt-2 space-y-2">
                {pendingTempBills.map((tb) => (
                  <TempBillCard
                    key={`pending-${tb.id}`}
                    tempBill={tb}
                    canModerate={canModerate}
                    onApproveTemp={onApproveTemp}
                    onRejectTemp={onRejectTemp}
                    onUndoProposal={onUndoProposal}
                    onTempCardClick={onTempCardClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Empty state */}
          {!bills.length && pendingCount === 0 && !children && (
            <p className="p-4 text-center text-sm text-muted-foreground">No bills in this stage.</p>
          )}
        </ScrollArea>
      </div>
    );
  }
);

KanbanColumn.displayName = 'KanbanColumn';
