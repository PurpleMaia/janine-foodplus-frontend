'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Bill, BillStatus } from '@/types/legislation';
import { KANBAN_COLUMNS, COLUMN_TITLES } from '@/lib/kanban-columns';
import { KanbanColumn } from './kanban-column';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { updateBillStatusServerAction, searchBills } from '@/services/legislation';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useKanbanBoard } from '@/hooks/use-kanban-board';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { BillDetailsDialog } from './bill-details-dialog'; // Import the new dialog component
import { Button } from '@/components/ui/button';
import { useBills } from '@/hooks/use-bills';

interface KanbanBoardProps {
  initialBills: Bill[];
}

export function KanbanBoard({ initialBills }: KanbanBoardProps) {
  const { searchQuery } = useKanbanBoard();
  const { toast } = useToast(); // Get toast function
  // const [bills, setBills] = useState<Bill[]>(initialBills);
  const { bills, setBills } = useBills()
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingBillId, setDraggingBillId] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null); // State for selected bill
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false); // State for dialog visibility

  // --- Add refs for scroll groups ---
  const viewportRef = useRef<HTMLDivElement>(null);
  const beforeCrossoverRef = useRef<HTMLDivElement>(null);
  const crossoverRef = useRef<HTMLDivElement>(null);
  const governorRef = useRef<HTMLDivElement>(null);

  // --- Find first column index for each group ---
  const beforeCrossoverIdx = KANBAN_COLUMNS.findIndex(col => col.id === 'introduced');
  const crossoverIdx = KANBAN_COLUMNS.findIndex(col => col.id.startsWith('crossover'));
  const governorIdx = KANBAN_COLUMNS.findIndex(col => col.id === 'transmittedGovernor');

  // --- Scroll handler ---
  const handleScrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current && viewportRef.current) {
      const container = viewportRef.current;
      const target = ref.current;
      // Get the left position of the target relative to the scroll container
      const targetRect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft + (targetRect.left - containerRect.left);      
      console.log('before', container.scrollLeft, '+', scrollLeft);
      container.scrollLeft = scrollLeft  
      console.log('after', container.scrollLeft);

    }
  };

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setBills(initialBills);
      return;
    }
    
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


  // put this in a context to have the ai status button edit it
  const billsByColumn = useMemo(() => {
    const grouped: { [key in BillStatus]?: Bill[] } = {};
    KANBAN_COLUMNS.forEach(col => grouped[col.id as BillStatus] = []); // Initialize all columns
    bills.forEach(bill => {
      // Ensure bill.current_status is a valid key
      const statusKey = bill.current_status as BillStatus;
      if (grouped.hasOwnProperty(statusKey)) {
        grouped[statusKey]?.push(bill);
      } else {
        // Handle potentially invalid status (optional, depends on data integrity)
        console.warn(`Bill ${bill.id} has invalid status: ${bill.current_status}`);
        // Place it in a default column like 'introduced' or handle as needed
        grouped['introduced']?.push(bill);
      }
    });
    // Sort bills within each column if needed, e.g., by ID or name
    // Object.values(grouped).forEach(billArray => billArray?.sort((a, b) => a.bill_title.localeCompare(b.bill_title)));
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
    // edit the global bill status
    const newBills = Array.from(bills);
    const billIndex = newBills.findIndex(b => b.id === draggableId);

    if (billIndex > -1) {
        const updatedBill = { ...newBills[billIndex], current_status: destinationColumnId };
        newBills.splice(billIndex, 1, updatedBill);
        setBills(newBills); // Update state optimistically      
    } else {
        console.error("Bill not found for optimistic update");
        return;
    }
    // --- End Optimistic UI Update ---

    // Call Server Action to update status
    try {
        setLoading(true);
        const updatedBillFromServer = await updateBillStatusServerAction(draggableId, destinationColumnId);
        if (!updatedBillFromServer) {
            throw new Error('Failed to update bill status on server.');
        }
        toast({
          title: "Bill Status Updated",
          description: `${movedBill.bill_title} moved to ${COLUMN_TITLES[destinationColumnId]}.`,
        });
    } catch (error) {
        console.error("Failed to update bill status:", error);
        setError("Failed to update bill status. Please try again.");
        // Revert optimistic update on error
        const revertedBills = Array.from(bills);
        const billToRevertIndex = revertedBills.findIndex(b => b.id === draggableId);
         if (billToRevertIndex > -1) {
            const revertedBill = { ...revertedBills[billToRevertIndex], current_status: sourceColumnId };
            revertedBills.splice(billToRevertIndex, 1, revertedBill);
            setBills(revertedBills);
         }
         toast({
           title: "Update Failed",
           description: `Could not move ${movedBill.bill_title}. Please try again.`,
           variant: "destructive",
         });
    } finally {
        setLoading(false);
    }
  }, [bills, toast]);


   // Updated handler to open the dialog
   const handleCardClick = useCallback((bill: Bill) => {
     console.log("Card clicked, opening details:", bill);
     setSelectedBill(bill);
     setIsDialogOpen(true);
   }, []);


   return (
    <>
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <ScrollArea className="h-full w-full whitespace-nowrap p-4">
            <ScrollAreaPrimitive.Viewport
              ref={viewportRef}
              className="h-full w-full max-w-[100vw] rounded-[inherit]"
              style={{ scrollBehavior: 'smooth' }}
            >
              <div className="flex space-x-4 pb-4">
                {KANBAN_COLUMNS.map((column, idx) => {
                  let ref = undefined;
                  if (idx === beforeCrossoverIdx) {
                    ref = beforeCrossoverRef;
                  } else if (idx === crossoverIdx) {
                    ref = crossoverRef;
                  } else if (idx === governorIdx) {
                    ref = governorRef;
                  }
                  return (
                    <div key={column.id} ref={ref} className="inline-block">
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
                          >
                            {provided.placeholder}
                          </KanbanColumn>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DragDropContext>

        {/* Bottom scroll bar */}
        <div className="fixed bottom-0 left-0 w-full flex justify-center gap-4 bg-background/90 p-2 z-20 border-t">
          <Button variant="secondary" onClick={() => handleScrollTo(beforeCrossoverRef)}>
            Before Crossover
          </Button>
          <Button variant="secondary" onClick={() => handleScrollTo(crossoverRef)}>
            Crossover
          </Button>
          <Button variant="secondary" onClick={() => handleScrollTo(governorRef)}>
            Governor
          </Button>
        </div>

        {/* Render the dialog */}
        <BillDetailsDialog
            bill={selectedBill}
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
        />
    </>
  );
}
