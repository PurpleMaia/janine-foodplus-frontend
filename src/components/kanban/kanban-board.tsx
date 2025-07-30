'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Bill, BillStatus, TempBill } from '@/types/legislation';
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
import * as refs from '@/types/column-refs';
import KanbanBoardSkeleton from './skeletons/skeleton-board';

interface KanbanBoardProps {
  initialBills: Bill[];
}

export function KanbanBoard({ initialBills }: KanbanBoardProps) {
  const { searchQuery } = useKanbanBoard();
  const { toast } = useToast(); // Get toast function
  // const [bills, setBills] = useState<Bill[]>(initialBills);
  const { loadingBills, setLoadingBills, bills, setBills, tempBills, setTempBills } = useBills()
  const [error, setError] = useState<string | null>(null);
  const [draggingBillId, setDraggingBillId] = useState<string | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null); // State for selected bill
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false); // State for dialog visibility

  const [filteredBills, setFilteredBills] = useState<Bill[] | null>()

  // --- Add refs for scroll groups ---
  const viewportRef = useRef<HTMLDivElement>(null);

  // Create refs for all columns dynamically
  const columnRefs = useRef<(HTMLDivElement | null)[]>(
    new Array(KANBAN_COLUMNS.length).fill(null)
  );

  const introducedIdx = KANBAN_COLUMNS.findIndex(col => col.id === 'introduced');
  const crossoverIdx = KANBAN_COLUMNS.findIndex(col => col.id === ('crossoverWaiting1'));
  const conferenceIdx = KANBAN_COLUMNS.findIndex(col => col.id === ('conferenceAssigned'));
  const governorIdx = KANBAN_COLUMNS.findIndex(col => col.id === 'transmittedGovernor');

  const scrollToIntroduced = () => scrollToColumnByIndex(introducedIdx);
  const scrollToCrossover = () => scrollToColumnByIndex(crossoverIdx);
  const scrollToConference = () => scrollToColumnByIndex(conferenceIdx);
  const scrollToGovernor = () => scrollToColumnByIndex(governorIdx);

  // --- Scroll handler ---
  const handleScrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current && viewportRef.current) {
      const container = viewportRef.current;
      const target = ref.current;

      // Get the left position of the target relative to the scroll container
      const targetRect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft + (targetRect.left - containerRect.left);      
      container.scrollLeft = scrollLeft  
    }
  };

  const scrollToColumnByIndex = useCallback((columnIndex: number) => {
    if (columnIndex >= 0 && columnIndex < columnRefs.current.length) {
      const element = columnRefs.current[columnIndex];
      if (element) {
        const ref = { current: element };
        console.log('Scrolling to column index:', columnIndex, 'Status:', KANBAN_COLUMNS[columnIndex]?.id);
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
      setLoadingBills(true)
      try {
        const results = await searchBills(searchQuery);
        setFilteredBills(results);        
      } catch (err) {
        console.error("Error searching bills:", err);
        setError("Failed to search bills.");
        setFilteredBills(null); // Revert to initial on error        
      } finally {
        setLoadingBills(false)      
      }
    }, 300); // Debounce search requests
    
    return () => {
      clearTimeout(handler);     
    };
  }, [searchQuery]); // Rerun when searchQuery or initialBills change

  const billsByColumn = useMemo(() => {
    const grouped: { [key in BillStatus]?: Bill[] } = {};
    KANBAN_COLUMNS.forEach(col => grouped[col.id as BillStatus] = []); // Initialize all columns
    const billsTobeGrouped = (searchQuery.trim() && filteredBills) ? filteredBills : bills;
    console.log('grouping', billsTobeGrouped)
    console.log('filteredBills', filteredBills, 'searchQuery', searchQuery)

    billsTobeGrouped.forEach(bill => {
      // Ensure bill.current_status is a valid key
      const statusKey = bill.current_status as BillStatus;
      if (grouped.hasOwnProperty(statusKey)) {
        grouped[statusKey]?.push(bill);
      } else {
        // Handle potentially invalid status (optional, depends on data integrity)
        console.warn(`Bill ${bill.id} has invalid status: ${bill.current_status}`);
        // Place it in a default column like 'introduced' or handle as needed
        grouped['unassigned']?.push(bill);
      }
    });
    // Sort bills within each column if needed, e.g., by ID or name
    // Object.values(grouped).forEach(billArray => billArray?.sort((a, b) => a.bill_title.localeCompare(b.bill_title)));
    return grouped;
  }, [bills, filteredBills, searchQuery]);

  const tempBillsByColumn = useMemo(() => {
    const grouped: { [key in BillStatus]?: TempBill[] } = {};
    KANBAN_COLUMNS.forEach(col => grouped[col.id as BillStatus] = []); // Initialize all columns
    tempBills.forEach(bill => {
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
  }, [tempBills])

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
    const movedBill = bills.find(b => b.id === draggableId)

    if (!movedBill) return; // Should not happen

    // --- Optimistic UI Update ---
    // edit the global bill status
    const newBills = Array.from(bills)
    const billIndex = newBills.findIndex(b => b.id === draggableId);
    
    console.log('newBills', newBills)
    if (billIndex > -1) {

        // update the bill container
        const updatedBill = { 
          ...newBills[billIndex],
          current_status: destinationColumnId,
          llm_suggested: false 
        };
        newBills.splice(billIndex, 1, updatedBill);
        setBills(newBills)

        // Also update filteredBills if it exists
        console.log('ON_DRAG_END: filteredBills', filteredBills, 'searchQuery', searchQuery)
        if (filteredBills && searchQuery.trim()) {
          const newFilteredBills = Array.from(filteredBills);
          const filteredBillIndex = newFilteredBills.findIndex(b => b.id === draggableId);
          
          if (filteredBillIndex > -1) {
            newFilteredBills.splice(filteredBillIndex, 1, updatedBill);
            setFilteredBills(newFilteredBills);
          }

          console.log('filteredBills after setting', filteredBills)
        }

        setTempBills(prevTempBills => 
          prevTempBills.filter(tb => tb.id !== updatedBill.id)
        );
    } else {
        console.error("Bill not found for optimistic update");
        return;
    }

    // --- End Optimistic UI Update ---

    // Call Server Action to update status
    try {
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
    } 
  }, [bills, toast, filteredBills, searchQuery]);

   // Updated handler to open the dialog
   const handleCardClick = useCallback((bill: Bill) => {
     console.log("Card clicked, opening details:", bill);
     setSelectedBillId(bill.id);
     setIsDialogOpen(true);
   }, []);

   const handleTempCardClick = useCallback((bill: TempBill) => {
      console.log("Temp Card clicked, scrolling to target:", bill.target_idx);
      scrollToColumnByIndex(bill.target_idx);
  }, [scrollToColumnByIndex]);

   return (
    <>
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <ScrollArea className="h-full w-full whitespace-nowrap p-4">
            <ScrollAreaPrimitive.Viewport
              ref={viewportRef}
              className="h-full w-full max-w-[100vw] rounded-[inherit]"
              style={{ scrollBehavior: 'smooth' }}
            >
              { loadingBills ? (
                <KanbanBoardSkeleton />
              ) : (
                <div className="flex space-x-4 pb-4">
                  {KANBAN_COLUMNS.map((column, idx) => {
                    return (
                      <div key={column.id} 
                        ref={(el) => {
                            columnRefs.current[idx] = el
                          }} 
                        className="inline-block">
                        <Droppable droppableId={column.id}>
                          {(provided, snapshot) => (
                            <KanbanColumn
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              columnId={column.id as BillStatus}
                              title={column.title}
                              bills={billsByColumn[column.id as BillStatus] || []}
                              tempBills={tempBillsByColumn[column.id as BillStatus] || []}
                              isDraggingOver={snapshot.isDraggingOver}
                              draggingBillId={draggingBillId}
                              onCardClick={handleCardClick}
                              onTempCardClick={handleTempCardClick}
                            >
                              {provided.placeholder}
                            </KanbanColumn>
                          )}
                        </Droppable>
                      </div>                    
                    );
                  })}
                </div>
              )}
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DragDropContext>

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

        {/* Render the dialog */}
        <BillDetailsDialog
            billID={selectedBillId}
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
        />
    </>
  );
}
