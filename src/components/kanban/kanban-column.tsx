import React, { useState } from 'react';
import type { Bill, TempBill } from '@/types/legislation';
import { KanbanCard } from './kanban-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { TempBillCard } from './temp-card';
import { ListRestart, TriangleAlert } from 'lucide-react';
import RefreshColumnButton from '../scraper/update-column-button';
import { KanbanCardSkeleton } from './skeletons/skeleton-board';


//Adds readOnlu prop to control card rendering 
// When readOnly=true, cards arent wrapped in Draggable components


interface KanbanColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  columnId: any
  draggingBillId: any
  title: string;
  bills: Bill[];
  tempBills: TempBill[]
  isDraggingOver: boolean;
  // draggingBillId: string | null;
  children?: React.ReactNode; // For Droppable placeholder
  onCardClick: (bill: Bill) => void; // Add callback prop
  onTempCardClick: (bill: TempBill) => void; // Add callback prop
  readOnly?: boolean;
  onUnadopt?: (billId: string) => void;
  showUnadoptButton?: boolean;
}


export const KanbanColumn = React.forwardRef<HTMLDivElement, KanbanColumnProps>(
    ({ columnId, title, bills, tempBills, isDraggingOver, draggingBillId, onCardClick, onTempCardClick, onUnadopt, showUnadoptButton = false, children, className, readOnly = false, ...props }, ref) => {
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
           { bills.length >= 20 && (
            <div>              
             <p className='text-sm break-words whitespace-normal mt-2 text0center'>
                   <span className="flex items-center gap-2 text-gray-600"><TriangleAlert className='w-5 h-5 text-yellow-600'/> Clicking <ListRestart className='w-4 h-4'/> will take a long time </span>
              </p>                
            </div>
           )}
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="flex flex-col gap-2">

            {tempBills.map((bill) => (
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
              ) : readOnly ? (
                <KanbanCard
                  key={bill.id}
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
                      ref={provided.innerRef}
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
