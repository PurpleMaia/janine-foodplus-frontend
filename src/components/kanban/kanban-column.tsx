// import React, { useState } from 'react';
// import type { Bill, TempBill } from '@/types/legislation';
// import { KanbanCard } from './kanban-card';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Draggable } from '@hello-pangea/dnd';
// import { cn } from '@/lib/utils';
// import { TempBillCard } from './temp-card';
// import { ListRestart, TriangleAlert } from 'lucide-react';
// import RefreshColumnButton from '../scraper/update-column-button';
// import { KanbanCardSkeleton } from './skeletons/skeleton-board';


// //Adds readOnlu prop to control card rendering 
// // When readOnly=true, cards arent wrapped in Draggable components


// interface KanbanColumnProps extends React.HTMLAttributes<HTMLDivElement> {
//   columnId: any
//   draggingBillId: any
//   title: string;
//   bills: Bill[];
//   // tempBills: TempBill[]
//   isDraggingOver: boolean;
//   // draggingBillId: string | null;
//   children?: React.ReactNode; // For Droppable placeholder
//   onCardClick: (bill: Bill) => void; // Add callback prop
//   // onTempCardClick: (bill: TempBill) => void; // Add callback prop
//   readOnly?: boolean;
//   onUnadopt?: (billId: string) => void;
//   showUnadoptButton?: boolean;
// }


// export const KanbanColumn = React.forwardRef<HTMLDivElement, KanbanColumnProps>(
//     ({ columnId, title, bills, isDraggingOver, draggingBillId, onCardClick, onUnadopt, showUnadoptButton = false, children, className, readOnly = false, ...props }, ref) => {
//       const [refreshing, setRefreshing] = useState<boolean>(false)
//     return (
//       <div
//         ref={ref}
//         className={cn(
//             "flex h-[calc(100vh-10rem)] w-80 shrink-0 flex-col rounded-lg border bg-secondary/50 shadow-sm", // Light blue header bg, lighter card area
//             isDraggingOver ? "bg-accent/20" : "", // Highlight when dragging over
//             className
//             )}
//         {...props}
//       >
//         <div className="sticky top-0 z-[1] rounded-t-lg bg-secondary p-3 shadow-sm">
//            {/* Allow text wrapping for long column titles */}
//            <h2 className="flex justify-between text-sm font-semibold text-secondary-foreground whitespace-normal break-words" title={title}>
//             {title} ({bills.length})
//             <RefreshColumnButton bills={bills} 
//               onRefreshStart={() => setRefreshing(true)}  
//               onRefreshEnd={() => setRefreshing(false)}  
//             />
//            </h2>
//            { bills.length >= 20 && (
//             <div>              
//              <p className='text-sm break-words whitespace-normal mt-2 text0center'>
//                    <span className="flex items-center gap-2 text-gray-600"><TriangleAlert className='w-5 h-5 text-yellow-600'/> Clicking <ListRestart className='w-4 h-4'/> will take a long time </span>
//               </p>                
//             </div>
//            )}
//         </div>

//         <ScrollArea className="flex-1 p-2">
//           <div className="flex flex-col gap-2">

//             {/* {tempBills.map((bill) => (
//               <div key={`temp-${bill.id}`}>
//                 <TempBillCard tempBill={bill} onTempCardClick={onTempCardClick}/>
//               </div>
//             ))} */}

//             {bills.map((bill, index) => (
//               refreshing ? (
//                 // Return something when refreshing (placeholder, skeleton, etc.)
//                 <div key={bill.id}>
//                   <KanbanCardSkeleton />
//                 </div>
//               ) : readOnly ? (
//                 <KanbanCard
//                   key={bill.id}
//                   bill={bill}
//                   isDragging={false}
//                   onCardClick={onCardClick}
//                   onUnadopt={onUnadopt}
//                   showUnadoptButton={showUnadoptButton}
//                 />
//               ) : (
//                 <Draggable key={bill.id} draggableId={bill.id} index={index}>
//                   {(provided, snapshot) => (
//                     <KanbanCard
//                       ref={provided.innerRef}
//                       {...provided.draggableProps}
//                       {...provided.dragHandleProps}
//                       bill={bill}
//                       isDragging={snapshot.isDragging}
//                       onCardClick={onCardClick}
//                       onUnadopt={onUnadopt}
//                       showUnadoptButton={showUnadoptButton}
//                       style={{
//                         ...provided.draggableProps.style,
//                       }}
//                     />
//                   )}
//                 </Draggable>
//               )
//             ))}

//              {children} {/* This is where the Droppable placeholder goes */}
//           </div>
//            {!bills.length && !children && (
//                 <p className="p-4 text-center text-sm text-muted-foreground">No bills in this stage.</p>
//             )}
//         </ScrollArea>
//       </div>
//     );
// });

// KanbanColumn.displayName = "KanbanColumn";




'use client';

import React, { useState } from 'react';
import type { Bill, TempBill } from '@/types/legislation';
import { KanbanCard } from './kanban-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
// import { TempBillCard } from './temp-card'; // optional: not used below
import { ListRestart, TriangleAlert } from 'lucide-react';
import RefreshColumnButton from '../scraper/update-column-button';
import { KanbanCardSkeleton } from './skeletons/skeleton-board';




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

      // NEW
      pendingTempBills = [],
      canModerate = false,
      onApproveTemp,
      onRejectTemp,

      enableDnd = false,


      ...props
    },
    ref
  ) => {
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const pendingCount = pendingTempBills?.length ?? 0;
    const useDnD = enableDnd && !readOnly;


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
              <span className="truncate text-ellipsis max-w-[12rem] md:max-w-[16rem]">
                {title}
              </span>
              <span className="shrink-0 text-muted-foreground">({bills.length})</span>
              {pendingCount > 0 && (
                <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full border">
                  Pending {pendingCount}
                </span>
              )}
            </span>

            <RefreshColumnButton
              bills={bills}
              onRefreshStart={() => setRefreshing(true)}
              onRefreshEnd={() => setRefreshing(false)}
            />
          </h2>

          {bills.length >= 20 && (
            <p className="mt-2 text-xs text-gray-600 flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-yellow-600" />
              Clicking <ListRestart className="h-3 w-3" /> will take a long time
            </p>
          )}
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="flex flex-col gap-2">
            {/* REAL BILL CARDS */}
            {bills.map((bill, index) =>
              refreshing ? (
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
            )}

            {/* Droppable placeholder goes here */}
            {children}

            {/* PENDING PROPOSALS (dashed ghost cards) */}
            {pendingCount > 0 && (
              <div className="mt-2 space-y-2">
                {pendingTempBills.map((tb) => {
                  const proposerName =
                    tb.proposed_by?.username ??
                    tb.proposed_by?.email ??
                    tb.proposed_by?.user_id ??
                    'Unknown user';
                  const tooltip = tb.proposed_by
                    ? `Proposed by ${proposerName} (${tb.proposed_by.role}) at ${new Date(
                        tb.proposed_by.at
                      ).toLocaleString()}`
                    : 'Pending change';

                  return (
                    <div
                      key={`pending-${tb.id}`}
                      className="rounded-lg border-2 border-dashed p-2 opacity-80 bg-background"
                      title={tooltip}
                    >
                      <div className="text-xs font-medium">
                        🕒 Pending: {tb.current_status} → {tb.suggested_status}
                        {tb.source ? ` • ${tb.source.toUpperCase()}` : null}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Requested by {proposerName}
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
                  );
                })}
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
