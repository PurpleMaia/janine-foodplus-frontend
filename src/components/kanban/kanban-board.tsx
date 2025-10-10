'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Bill, BillStatus, TempBill } from '@/types/legislation';
import { KANBAN_COLUMNS, COLUMN_TITLES } from '@/lib/kanban-columns';
// import { KanbanColumn } from './kanban-column'; // we inline KanbanColumn below
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { updateBillStatusServerAction, searchBills } from '@/services/legislation';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useKanbanBoard } from '@/contexts/kanban-board-context';
import { useToast } from '@/hooks/use-toast';
import { BillDetailsDialog } from './bill-details-dialog';
import { Button } from '@/components/ui/button';
import { useBills } from '@/contexts/bills-context';
import KanbanBoardSkeleton from './skeletons/skeleton-board';
import { useAuth } from '@/contexts/auth-context';
import { KanbanCard } from './kanban-card';


// ------------------------------------------------------------
// Inlined KanbanColumn (with enableDnd + pending proposal UI)
// ------------------------------------------------------------

export interface KanbanColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  columnId: BillStatus;
  title: string;
  bills: Bill[];
  isDraggingOver: boolean;
  draggingBillId: string | null;
  onCardClick: (bill: Bill) => void;
  onUnadopt?: (billId: string) => void;
  showUnadoptButton?: boolean;
  readOnly: boolean;

  // Pending proposals
  pendingTempBills?: TempBill[];
  canModerate?: boolean;
  onApproveTemp?: (billId: string) => void;
  onRejectTemp?: (billId: string) => void;

  // Only render <Draggable> when inside DragDropContext/Droppable
  enableDnd?: boolean;
}

export const KanbanColumn = React.forwardRef<HTMLDivElement, KanbanColumnProps>(
  function KanbanColumn(
    {
      columnId,
      title,
      bills,
      isDraggingOver,
      draggingBillId,
      onCardClick,
      onUnadopt,
      showUnadoptButton = false,
      readOnly,

      // pending proposals
      pendingTempBills = [],
      canModerate = false,
      onApproveTemp,
      onRejectTemp,

      // Draggable gate
      enableDnd = false,

      children, // Droppable placeholder
      className,
      ...divProps
    },
    ref
  ) {
    const useDnD = enableDnd && !readOnly;
    const pendingCount = pendingTempBills?.length ?? 0;

    return (
      <div
        ref={ref}
        {...divProps} // enableDnd was destructured so it won't leak to DOM
        className={`flex h-[calc(100vh-10rem)] w-80 shrink-0 flex-col rounded-lg border bg-card shadow-sm ${className ?? ''}`}
        data-column-id={columnId}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 rounded-t-lg bg-secondary/95 backdrop-blur p-3 shadow-sm border-b">
          <h3 className="flex items-center justify-between gap-2 text-sm font-semibold" title={title}>
            <span className="truncate max-w-[12rem]">{title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">({bills.length})</span>
            {pendingCount > 0 && (
              <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full border">
                Pending {pendingCount}
              </span>
            )}
          </h3>
        </div>

        {/* Cards list with vertical scroll */}
        <ScrollArea className="flex-1 p-2">
          <div className={`flex flex-col gap-2 ${isDraggingOver ? 'bg-muted/30 rounded p-1' : ''}`}>
            {bills.map((bill, index) =>
              useDnD ? (
                <Draggable key={bill.id} draggableId={bill.id} index={index} isDragDisabled={readOnly}>
                  {(provided, snapshot) => (
                    <KanbanCard
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      bill={bill}
                      isDragging={snapshot.isDragging || draggingBillId === bill.id}
                      onCardClick={onCardClick}
                      onUnadopt={onUnadopt}
                      showUnadoptButton={showUnadoptButton}
                      style={{ ...provided.draggableProps.style }}
                    />
                  )}
                </Draggable>
              ) : (
                <KanbanCard
                  key={bill.id}
                  bill={bill}
                  isDragging={false}
                  onCardClick={onCardClick}
                  onUnadopt={onUnadopt}
                  showUnadoptButton={showUnadoptButton}
                />
              )
            )}

            {/* Droppable placeholder goes here */}
            {children}

            {/* Pending proposals (dashed) */}
            {pendingCount > 0 && (
              <div className="mt-2 space-y-2">
                {pendingTempBills.map((tb) => (
                  <div
                    key={`pending-${tb.id}`}
                    className="rounded-lg border-2 border-dashed p-2 bg-muted/30"
                    title={
                      tb.proposed_by
                        ? `Proposed by ${tb.proposed_by.role} at ${new Date(tb.proposed_by.at).toLocaleString()}`
                        : 'Pending change'
                    }
                  >
                    <div className="text-xs font-medium">
                      🕒 Pending: {tb.current_status} → {tb.suggested_status}
                      {tb.source ? ` • ${tb.source.toUpperCase()}` : null}
                    </div>

                    {canModerate && (
                      <div className="mt-2 flex gap-2">
                        <button
                          className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground"
                          onClick={() => onApproveTemp?.(tb.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="px-2 py-1 text-xs rounded bg-destructive text-destructive-foreground"
                          onClick={() => onRejectTemp?.(tb.id)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* empty state */}
          {!bills.length && pendingCount === 0 && !children && (
            <p className="p-4 text-center text-sm text-muted-foreground">No bills in this stage.</p>
          )}
        </ScrollArea>
      </div>
    );
  }
);

// ---------------------------------------------
// Kanban Board
// ---------------------------------------------

interface KanbanBoardProps {
  readOnly: boolean;
  onUnadopt?: (billId: string) => void;
  showUnadoptButton?: boolean;
}

export function KanbanBoard({ readOnly, onUnadopt, showUnadoptButton = false }: KanbanBoardProps) {
  const { searchQuery } = useKanbanBoard();
  const { toast } = useToast();
  const { user } = useAuth();

  // Pull everything from a single bills context call
  const {
    loadingBills: loading,
    setLoadingBills: setLoading,
    bills,
    setBills,
    tempBills,
    proposeStatusChange,
    acceptTempChange,
    rejectTempChange,
  } = useBills();

  const [, setError] = useState<string | null>(null);
  const [draggingBillId, setDraggingBillId] = useState<string | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [filteredBills, setFilteredBills] = useState<Bill[] | null>();

  // --- Add refs for scroll groups ---
  const viewportRef = useRef<HTMLDivElement>(null);

  // Create refs for all columns dynamically
  const columnRefs = useRef<(HTMLDivElement | null)[]>(
    new Array(KANBAN_COLUMNS.length).fill(null)
  );

  const introducedIdx = KANBAN_COLUMNS.findIndex((col) => col.id === 'introduced');
  const crossoverIdx = KANBAN_COLUMNS.findIndex((col) => col.id === 'crossoverWaiting1');
  const conferenceIdx = KANBAN_COLUMNS.findIndex((col) => col.id === 'conferenceAssigned');
  const governorIdx = KANBAN_COLUMNS.findIndex((col) => col.id === 'transmittedGovernor');

  const scrollToIntroduced = () => scrollToColumnByIndex(introducedIdx);
  const scrollToCrossover = () => scrollToColumnByIndex(crossoverIdx);
  const scrollToConference = () => scrollToColumnByIndex(conferenceIdx);
  const scrollToGovernor = () => scrollToColumnByIndex(governorIdx);

  // --- Scroll handler ---
  const handleScrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current && viewportRef.current) {
      const container = viewportRef.current;
      const target = ref.current;

      const targetRect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft + (targetRect.left - containerRect.left);
      container.scrollLeft = scrollLeft;
    }
  };

  const scrollToColumnByIndex = useCallback((columnIndex: number) => {
    if (columnIndex >= 0 && columnIndex < columnRefs.current.length) {
      const element = columnRefs.current[columnIndex];
      if (element) {
        const ref = { current: element };
        handleScrollTo(ref);
      }
    } else {
      console.warn('Invalid column index:', columnIndex);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBills(null);
      return;
    }

    setError(null);
    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchBills(bills, searchQuery);
        setFilteredBills(results);
      } catch (err) {
        console.error('Error searching bills:', err);
        setError('Failed to search bills.');
        setFilteredBills(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, setLoading, bills]);

  const billsByColumn = useMemo(() => {
    const grouped = Object.fromEntries(
      KANBAN_COLUMNS.map(c => [c.id as BillStatus, [] as Bill[]])
    ) as Record<BillStatus, Bill[]>;
  
    const items = (searchQuery.trim() && filteredBills) ? filteredBills : bills;
  
    const fallbackId = (KANBAN_COLUMNS.find(c => c.id === 'unassigned')?.id
                     ?? KANBAN_COLUMNS[0].id) as BillStatus;
  
    for (const bill of items) {
      const valid = KANBAN_COLUMNS.some(c => c.id === bill.current_status);
      const key = (valid ? bill.current_status : fallbackId) as BillStatus;
      grouped[key].push(bill);
    }
    return grouped;
  }, [bills, filteredBills, searchQuery]);

  const billsToGroup: Bill[] = searchQuery.trim() && filteredBills ? filteredBills : bills;

  // For quick lookups when filtering temp bills to match search results
  const visibleBillIds = useMemo(() => new Set(billsToGroup.map((b) => b.id)), [billsToGroup]);

  const tempBillsByColumn = useMemo(() => {
    const grouped: { [key in BillStatus]?: TempBill[] } = {};
    KANBAN_COLUMNS.forEach((c) => (grouped[c.id as BillStatus] = []));

    tempBills.forEach((tb) => {
      if (searchQuery.trim() && !visibleBillIds.has(tb.id)) return;
      const key = tb.suggested_status as BillStatus;
      grouped[key]?.push(tb);
    });

    return grouped;
  }, [tempBills, searchQuery, visibleBillIds]);

  const onDragStart = useCallback((start: any) => {
    setDraggingBillId(start.draggableId);
  }, []);

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      if (readOnly) return;

      setDraggingBillId(null);
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;

      const sourceColumnId = source.droppableId as BillStatus;
      const destinationColumnId = destination.droppableId as BillStatus;
      const movedBill = bills.find((b) => b.id === draggableId);
      if (!movedBill) return;

      // Interns propose (no direct commit)
      if (user?.role === 'intern') {
        proposeStatusChange(movedBill, destinationColumnId, {
          userId: user.id,
          role: 'intern',
        });
        toast({
          title: 'Change proposed',
          description: `Awaiting supervisor approval.`,
        });
        return;
      }

      // Optimistic commit for supervisors/admins
      const newBills = Array.from(bills);
      const billIndex = newBills.findIndex((b) => b.id === draggableId);

      if (billIndex > -1) {
        const updatedBill = {
          ...newBills[billIndex],
          current_status: destinationColumnId,
          llm_suggested: false,
        };
        newBills.splice(billIndex, 1, updatedBill);
        setBills(newBills);

        if (filteredBills && searchQuery.trim()) {
          const newFilteredBills = Array.from(filteredBills);
          const filteredBillIndex = newFilteredBills.findIndex((b) => b.id === draggableId);
          if (filteredBillIndex > -1) {
            newFilteredBills.splice(filteredBillIndex, 1, updatedBill);
            setFilteredBills(newFilteredBills);
          }
        }
      } else {
        console.error('Bill not found for optimistic update');
        return;
      }

      try {
        const updatedBillFromServer = await updateBillStatusServerAction(
          draggableId,
          destinationColumnId
        );
        if (!updatedBillFromServer) {
          throw new Error('Failed to update bill status on server.');
        }
        toast({
          title: 'Bill Status Updated',
          description: `${movedBill.bill_title} moved to ${COLUMN_TITLES[destinationColumnId]}.`,
        });
      } catch (error) {
        console.error('Failed to update bill status:', error);
        setError('Failed to update bill status. Please try again.');
        // Revert optimistic update on error
        const revertedBills = Array.from(bills);
        const billToRevertIndex = revertedBills.findIndex((b) => b.id === draggableId);
        if (billToRevertIndex > -1) {
          const revertedBill = {
            ...revertedBills[billToRevertIndex],
            current_status: sourceColumnId,
          };
          revertedBills.splice(billToRevertIndex, 1, revertedBill);
          setBills(revertedBills);
        }
        toast({
          title: 'Update Failed',
          description: `Could not move ${movedBill.bill_title}. Please try again.`,
          variant: 'destructive',
        });
      }
    },
    [bills, readOnly, user, proposeStatusChange, toast, filteredBills, searchQuery, setBills]
  );

  const handleCardClick = useCallback((bill: Bill) => {
    setSelectedBillId(bill.id);
    setIsDialogOpen(true);
  }, []);

  const handleTempCardClick = useCallback(
    (bill: TempBill) => {
      // optional: if you want pending click to scroll to its target column
      scrollToColumnByIndex(bill.target_idx);
    },
    [scrollToColumnByIndex]
  );

  return (
    <>
      {readOnly ? (
        <ScrollArea className="h-full w-full whitespace-nowrap p-4">
          <ScrollAreaPrimitive.Viewport
            ref={viewportRef}
            className="h-full w-full max-w-[100vw] rounded-[inherit]"
            style={{ scrollBehavior: 'smooth' }}
          >
            {loading ? (
              <KanbanBoardSkeleton />
            ) : (
              <div className="flex space-x-4 pb-4">
                {KANBAN_COLUMNS.map((column, idx) => (
                  <div
                    key={column.id}
                    ref={(el) => {
                      columnRefs.current[idx] = el;
                    }}
                    className="inline-block"
                  >
                    <KanbanColumn
                      columnId={column.id as BillStatus}
                      title={column.title}
                      bills={billsByColumn[column.id as BillStatus] || []}
                      isDraggingOver={false}
                      draggingBillId={null}
                      onCardClick={handleCardClick}
                      onUnadopt={onUnadopt}
                      showUnadoptButton={showUnadoptButton}
                      readOnly={true}
                      enableDnd={false}
                      /* pending proposals */
                      pendingTempBills={tempBillsByColumn[column.id as BillStatus] || []}
                      canModerate={user?.role === 'supervisor' || user?.role === 'admin'}
                      onApproveTemp={(billId) => acceptTempChange(billId)}
                      onRejectTemp={(billId) => rejectTempChange(billId)}
                    />
                  </div>
                ))}
              </div>
            )}
          </ScrollAreaPrimitive.Viewport>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <ScrollArea className="h-full w-full whitespace-nowrap p-4">
            <ScrollAreaPrimitive.Viewport
              ref={viewportRef}
              className="h-full w-full max-w-[100vw] rounded-[inherit]"
              style={{ scrollBehavior: 'smooth' }}
            >
              {loading ? (
                <KanbanBoardSkeleton />
              ) : (
                <div className="flex space-x-4 pb-4">
                  {KANBAN_COLUMNS.map((column, idx) => (
                    <div
                      key={column.id}
                      ref={(el) => {
                        columnRefs.current[idx] = el;
                      }}
                      className="inline-block"
                    >
                      <Droppable droppableId={column.id}>
                        {(provided, snapshot) => (
                          <KanbanColumn
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            columnId={column.id as BillStatus}
                            title={column.title}
                            bills={billsByColumn[column.id as BillStatus] || []}
                            isDraggingOver={snapshot.isDraggingOver}
                            draggingBillId={draggingBillId}
                            onCardClick={handleCardClick}
                            onUnadopt={onUnadopt}
                            showUnadoptButton={showUnadoptButton}
                            readOnly={false}
                            enableDnd={true}
                            /* pending proposals */
                            pendingTempBills={tempBillsByColumn[column.id as BillStatus] || []}
                            canModerate={user?.role === 'supervisor' || user?.role === 'admin'}
                            onApproveTemp={(billId) => acceptTempChange(billId)}
                            onRejectTemp={(billId) => rejectTempChange(billId)}
                          >
                            {provided.placeholder}
                          </KanbanColumn>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              )}
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DragDropContext>
      )}

      {/* Bottom scroll bar */}
      <div className="fixed bottom-0 left-0 w-full flex justify-center gap-4 bg-background/90 p-2 z-20 border-t">
        <Button variant="secondary" onClick={scrollToIntroduced}>
          Introduced
        </Button>
        <Button variant="secondary" onClick={scrollToCrossover}>
          Crossover
        </Button>
        <Button variant="secondary" onClick={scrollToConference}>
          Conference
        </Button>
        <Button variant="secondary" onClick={scrollToGovernor}>
          Governor
        </Button>
      </div>

      {/* Details dialog */}
      <BillDetailsDialog
        billID={selectedBillId}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
