import React, { useState, useEffect } from 'react';
import type { Bill } from '@/types/legislation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Removed unused imports
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle, Clock, FileText, GitBranch, Send, Gavel } from 'lucide-react';
import { COLUMN_TITLES } from '@/lib/kanban-columns'; // Keep for status text if needed briefly

interface KanbanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  bill: Bill;
  isDragging: boolean;
  onCardClick: (bill: Bill) => void;
}

// Function to get an appropriate icon based on status
const getStatusIcon = (status: Bill['current_status']): React.ReactNode => {
  if (status.includes('scheduled')) return <Calendar className="h-4 w-4 text-accent" />;
  if (status.includes('deferred') || status.includes('vetoList') ) return <Clock className="h-4 w-4 text-orange-600" />;
  if (status.includes('passedCommittees')) return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status.includes('governorSigns') || status.includes('lawWithoutSignature')) return <Gavel className="h-4 w-4 text-green-700" />;
  if (status.includes('conference')) return <GitBranch className="h-4 w-4 text-purple-600" />;
  if (status.includes('transmittedGovernor')) return <Send className="h-4 w-4 text-blue-600" />;
  if (status.includes('introduced') || status.includes('waiting')) return <FileText className="h-4 w-4 text-muted-foreground" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />; // Default icon
};

export const KanbanCard = React.forwardRef<HTMLDivElement, KanbanCardProps>(
    ({ bill, isDragging, onCardClick, className, style, ...props }, ref) => {

    const [formattedDate, setFormattedDate] = useState<string>('N/A');

    // Format date only on client-side after mount to prevent hydration mismatch
    useEffect(() => {
      let dateToFormat: Date | null = null;
      if (bill.updated_at instanceof Date) {
        dateToFormat = bill.updated_at;
      } else if (typeof bill.updated_at === 'string') {
          try {
              const parsedDate = new Date(bill.updated_at);
              if (!isNaN(parsedDate.getTime())) {
                dateToFormat = parsedDate;
              }
          } catch (e) {
              console.warn("Could not parse date string:", bill.updated_at);
          }
      }
      setFormattedDate(dateToFormat ? dateToFormat.toLocaleDateString() : 'N/A');
    }, [bill.updated_at]);


    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation(); // Prevent drag-and-drop from triggering
      onCardClick(bill);
    };

    return (
        <div
            ref={ref}
            className={cn(
                "rounded-md border bg-card text-card-foreground shadow-sm transition-shadow duration-200",
                "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", // Focus state
                isDragging ? "opacity-80 shadow-xl rotate-3 scale-105 cursor-grabbing" : "hover:shadow-md cursor-grab",
                 className
            )}
            style={style} // dnd positioning
            {...props} // dnd props
            tabIndex={0} // Make focusable
        >
            {/* Add click handler to the content div */}
            <div 
                className="flex flex-col p-3 w-full min-h-[80px] cursor-pointer"
                onClick={handleCardClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick(e as any);
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View details for bill ${bill.id}: ${bill.bill_title}`}
            >
                <CardHeader className="p-0 pb-1 space-y-0.5">
                     <div className="flex items-start justify-between gap-1">
                         <CardTitle className="text-sm font-medium leading-tight break-words" title={bill.bill_title}>
                            {bill.bill_number} - {bill.bill_title}
                        </CardTitle>
                        {getStatusIcon(bill.current_status)}
                     </div>
                </CardHeader>
                <CardContent className="p-0 mt-1 flex-grow">
                    <p className="text-xs text-muted-foreground">Updated: {formattedDate}</p>
                </CardContent>
            </div>
      </div>
    );
});
KanbanCard.displayName = "KanbanCard";
