'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Bill, BillStatus } from '@/types/legislation';
import { KANBAN_COLUMNS, COLUMN_TITLES } from '@/lib/kanban-columns';
import { KanbanColumn } from './kanban-column';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { updateBillStatus, searchBills } from '@/services/legislation'; // Assuming searchBills is implemented
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useKanbanBoard } from '@/hooks/use-kanban-board';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface KanbanBoardProps {
  initialBills: Bill[];
}

export function KanbanBoard({ initialBills }: KanbanBoardProps) {
  const { searchQuery } = useKanbanBoard();
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingBillId, setDraggingBillId] = useState<string | null>(null);

  // Debounced search effect
  useEffect(() => {
    setLoading(true);
    setError(null);
    const handler = setTimeout(async () => {
      try {
        const results = await searchBills(searchQuery);
        setBills(results);
      } catch (err) {
        console.error("Error searching bills:", err);
        setError("Failed to search bills.");
        setBills(initialBills); // Revert to initial on error
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce search requests

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, initialBills]); // Rerun when searchQuery or initialBills change


  const billsByColumn = useMemo(() => {
    const grouped: { [key in BillStatus]?: Bill[] } = {};
    KANBAN_COLUMNS.forEach(col => grouped[col.id as BillStatus] = []); // Initialize all columns
    bills.forEach(bill => {
      if (grouped[bill.status]) {
        grouped[bill.status]?.push(bill);
      } else {
        // Handle potentially invalid status (optional, depends on data integrity)
        console.warn(`Bill ${bill.id} has invalid status: ${bill.status}`);
        // You might place it in a default column like 'introduced'
        grouped['introduced']?.push(bill);
      }
    });
    return grouped;
  }, [bills]);


  const onDragStart = useCallback((start: any) => {
      setDraggingBillId(start.draggableId);
  }, []);


  const onDragEnd = useCallback(async (result: DropResult) => {
    setDraggingBillId(null); // Reset dragging state
    const { source, destination, draggableId } = result;

    // Dropped outside a valid column
    if (!destination) {
      return;
    }

    // Dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumnId = source.droppableId as BillStatus;
    const destinationColumnId = destination.droppableId as BillStatus;
    const movedBill = bills.find(b => b.id === draggableId);

    if (!movedBill) return; // Should not happen

    // Optimistic UI Update
    const optimisticBills = bills.map(bill =>
      bill.id === draggableId ? { ...bill, status: destinationColumnId } : bill
    );
    setBills(optimisticBills);

    // Call API to update status
    try {
        setLoading(true); // Show loading state during update
        const updatedBill = await updateBillStatus(draggableId, destinationColumnId);
        if (!updatedBill) {
            throw new Error('Failed to update bill status on server.');
        }
        // Optionally, re-sync state if needed, though optimistic update often suffices
        // setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
    } catch (error) {
        console.error("Failed to update bill status:", error);
        setError("Failed to update bill status. Please try again.");
        // Revert optimistic update on error
        setBills(prevBills => prevBills.map(bill =>
            bill.id === draggableId ? { ...bill, status: sourceColumnId } : bill
        ));
    } finally {
        setLoading(false); // Hide loading state
    }
  }, [bills]); // Include bills in dependency array

   return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <ScrollArea className="h-full w-full whitespace-nowrap p-4">
        {error && <p className="text-destructive p-4">{error}</p>}
        {loading && !bills.length && ( // Show skeleton only if loading and no bills displayed
            <div className="flex space-x-4">
                 {KANBAN_COLUMNS.map((col) => (
                    <div key={col.id} className="w-80 shrink-0 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                 ))}
            </div>
        )}
        {!loading && !bills.length && searchQuery && (
             <p className="p-4 text-center text-muted-foreground">No bills found matching "{searchQuery}".</p>
        )}
        <div className="flex space-x-4 pb-4">
          {KANBAN_COLUMNS.map((column) => (
             <Droppable key={column.id} droppableId={column.id}>
              {(provided, snapshot) => (
                <KanbanColumn
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  columnId={column.id}
                  title={column.title}
                  bills={billsByColumn[column.id as BillStatus] || []}
                  isDraggingOver={snapshot.isDraggingOver}
                  draggingBillId={draggingBillId}
                >
                  {provided.placeholder}
                </KanbanColumn>
              )}
            </Droppable>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </DragDropContext>
  );
}
