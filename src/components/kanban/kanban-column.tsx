import React, { useState } from 'react';
import type { Bill, BillStatus, TempBill } from '@/types/legislation';
import { KanbanCard } from './kanban-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { TempBillCard } from './temp-card';
import { Button } from '../ui/button';
import { ListRestart, WandSparkles } from 'lucide-react';
import RefreshColumnButton from '../scraper/update-column-button';
import { KanbanCardSkeleton } from './skeletons/skeleton-board';

interface KanbanColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  columnId: BillStatus;
  title: string;
  bills: Bill[];
  tempBills: TempBill[]
  isDraggingOver: boolean;
  draggingBillId: string | null;
  children?: React.ReactNode; // For Droppable placeholder
  onCardClick: (bill: Bill) => void; // Add callback prop
  onTempCardClick: (bill: TempBill) => void; // Add callback prop
}


export const KanbanColumn = React.forwardRef<HTMLDivElement, KanbanColumnProps>(
    ({ columnId, title, bills, tempBills, isDraggingOver, draggingBillId, onCardClick, onTempCardClick, children, className, ...props }, ref) => {
      const [refreshing, setRefreshing] = useState<boolean>(false)
    return (
      <div
        ref={ref}
        className={cn(
            "flex h-[calc(100vh-10rem)] w-80 shrink-0 flex-col rounded-lg border bg-secondary/50 shadow-sm", // Light blue header bg, lighter card area
            isDraggingOver ? "bg-accent/20" : "", // Highlight when dragging over
            className
            )}
        {...props}
      >
        <div className="sticky top-0 z-[1] rounded-t-lg bg-secondary p-3 shadow-sm">
           {/* Allow text wrapping for long column titles */}
           <h2 className="flex justify-between text-sm font-semibold text-secondary-foreground whitespace-normal break-words" title={title}>
            {title} ({bills.length})
            <RefreshColumnButton bills={bills} 
              onRefreshStart={() => setRefreshing(true)}  
              onRefreshEnd={() => setRefreshing(false)}  
            />
           </h2>
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="flex flex-col gap-2">

            {tempBills.map((bill, index) => (
              <div key={`temp-${bill.id}`}>
                <TempBillCard tempBill={bill} onTempCardClick={onTempCardClick}/>
              </div>
            ))}

            {bills.map((bill, index) => (
              refreshing ? (
                // Return something when refreshing (placeholder, skeleton, etc.)
                <div key={bill.id}>
                  <KanbanCardSkeleton />
                </div>
              ) : (
                <Draggable key={bill.id} draggableId={bill.id} index={index}>
                  {(provided, snapshot) => (
                    <KanbanCard
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      bill={bill}
                      isDragging={snapshot.isDragging}
                      onCardClick={onCardClick}
                      style={{
                        ...provided.draggableProps.style,
                      }}
                    />
                  )}
                </Draggable>
              )
            ))}

             {children} {/* This is where the Droppable placeholder goes */}
          </div>
           {!bills.length && !children && (
                <p className="p-4 text-center text-sm text-muted-foreground">No bills in this stage.</p>
            )}
        </ScrollArea>
      </div>
    );
});

KanbanColumn.displayName = "KanbanColumn";
