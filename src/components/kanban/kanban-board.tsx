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
import { useToast } from "@/hooks/use-toast"; // Import useToast

interface KanbanBoardProps {
  initialBills: Bill[];
}

export function KanbanBoard({ initialBills }: KanbanBoardProps) {
  const { searchQuery } = useKanbanBoard();
  const { toast } = useToast(); // Get toast function
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
      // Ensure bill.status is a valid key
      const statusKey = bill.status as BillStatus;
      if (grouped.hasOwnProperty(statusKey)) {
        grouped[statusKey]?.push(bill);
      } else {
        // Handle potentially invalid status (optional, depends on data integrity)
        console.warn(`Bill ${bill.id} has invalid status: ${bill.status}`);
        // Place it in a default column like 'introduced' or handle as needed
        grouped['introduced']?.push(bill);
      }
    });
    // Sort bills within each column if needed, e.g., by ID or name
    // Object.values(grouped).forEach(billArray => billArray?.sort((a, b) => a.name.localeCompare(b.name)));
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

    // --- Optimistic UI Update ---
    // 1. Remove from old column array
    // 2. Add to new column array at the destination index
    // 3. Update the bill's status property
    const newBills = Array.from(bills);
    const billIndex = newBills.findIndex(b => b.id === draggableId);

    if (billIndex > -1) {
        // Create a new bill object with the updated status
        const updatedBill = { ...newBills[billIndex], status: destinationColumnId };
        // Replace the old bill object with the updated one
        newBills.splice(billIndex, 1, updatedBill);
        setBills(newBills); // Update state optimistically
    } else {
        console.error("Bill not found for optimistic update");
        return; // Exit if bill wasn't found in the array somehow
    }
    // --- End Optimistic UI Update ---


    // Call API to update status
    try {
        setLoading(true); // Show loading state during update
        const updatedBillFromServer = await updateBillStatus(draggableId, destinationColumnId);
        if (!updatedBillFromServer) {
            throw new Error('Failed to update bill status on server.');
        }
        // Optional: Re-sync state if server returns slightly different data, though optimistic often suffices
        // setBills(prev => prev.map(b => b.id === updatedBillFromServer.id ? updatedBillFromServer : b));
        toast({
          title: "Bill Status Updated",
          description: `${movedBill.name} moved to ${COLUMN_TITLES[destinationColumnId]}.`,
        });
    } catch (error) {
        console.error("Failed to update bill status:", error);
        setError("Failed to update bill status. Please try again.");
        // Revert optimistic update on error
        const revertedBills = Array.from(bills); // Use the state *before* this failed attempt
        const billToRevertIndex = revertedBills.findIndex(b => b.id === draggableId);
         if (billToRevertIndex > -1) {
            // Create a new bill object with the original status
            const revertedBill = { ...revertedBills[billToRevertIndex], status: sourceColumnId };
            // Replace the optimistically updated bill object with the reverted one
            revertedBills.splice(billToRevertIndex, 1, revertedBill);
            setBills(revertedBills); // Revert state
         }
         toast({
           title: "Update Failed",
           description: `Could not move ${movedBill.name}. Please try again.`,
           variant: "destructive",
         });
    } finally {
        setLoading(false); // Hide loading state
    }
  }, [bills, toast]); // Include bills and toast in dependency array


   // Placeholder function for handling card clicks
   const handleCardClick = useCallback((bill: Bill) => {
     console.log("Card clicked:", bill);
     // TODO: Implement navigation or modal display logic here
     // Example: router.push(`/bills/${bill.id}`);
     // Example: setSelectedBill(bill); setModalOpen(true);
     toast({
        title: "Bill Clicked",
        description: `You clicked on ${bill.name} (${bill.id}). Add details view logic here.`,
      });
   }, [toast]); // Include dependencies like router or state setters if needed


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
         {!loading && !bills.length && !searchQuery && ( // Message when no bills exist initially
             <p className="p-4 text-center text-muted-foreground">No bills to display.</p>
        )}
        <div className="flex space-x-4 pb-4">
          {KANBAN_COLUMNS.map((column) => (
             <Droppable key={column.id} droppableId={column.id}>
              {(provided, snapshot) => (
                <KanbanColumn
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  columnId={column.id as BillStatus}
                  title={column.title}
                  bills={billsByColumn[column.id as BillStatus] || []}
                  isDraggingOver={snapshot.isDraggingOver}
                  draggingBillId={draggingBillId}
                  onCardClick={handleCardClick} // Pass click handler
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