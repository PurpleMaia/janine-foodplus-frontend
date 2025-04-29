import React from 'react';
import type { Bill, BillStatus } from '@/types/legislation';
import { KanbanCard } from './kanban-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

interface KanbanColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  columnId: BillStatus;
  title: string;
  bills: Bill[];
  isDraggingOver: boolean;
  draggingBillId: string | null;
  children?: React.ReactNode; // For Droppable placeholder
}


export const KanbanColumn = React.forwardRef<HTMLDivElement, KanbanColumnProps>(
    ({ columnId, title, bills, isDraggingOver, draggingBillId, children, className, ...props }, ref) => {
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
           <h2 className="text-sm font-semibold text-secondary-foreground truncate" title={title}>
            {title} ({bills.length})
           </h2>
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="flex flex-col gap-2">
            {bills.map((bill, index) => (
              <Draggable key={bill.id} draggableId={bill.id} index={index}>
                {(provided, snapshot) => (
                  <KanbanCard
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    bill={bill}
                    isDragging={snapshot.isDragging}
                     style={{
                      ...provided.draggableProps.style,
                      // Add styles for dragging appearance if needed
                    }}
                  />
                )}
              </Draggable>
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
