import React from 'react';
import type { Bill } from '@/types/legislation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Use Button for click handling
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle, XCircle, Clock, FileText, UserCheck, GitBranch, Flag, Send, Edit, Gavel, ExternalLink } from 'lucide-react'; // Added ExternalLink
import { COLUMN_TITLES } from '@/lib/kanban-columns'; // Import column titles

interface KanbanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  bill: Bill;
  isDragging: boolean;
  onCardClick: (bill: Bill) => void; // Add onClick handler prop
}

// Function to get an appropriate icon based on status (simple example)
const getStatusIcon = (status: Bill['status']): React.ReactNode => {
  if (status.includes('scheduled')) return <Calendar className="h-4 w-4 text-accent" />;
  if (status.includes('deferred') || status.includes('vetoList') ) return <Clock className="h-4 w-4 text-orange-600" />; // Combine deferred/veto for clock
  if (status.includes('passedCommittees')) return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status.includes('governorSigns') || status.includes('lawWithoutSignature')) return <Gavel className="h-4 w-4 text-green-700" />;
  if (status.includes('conference')) return <GitBranch className="h-4 w-4 text-purple-600" />;
  if (status.includes('transmittedGovernor')) return <Send className="h-4 w-4 text-blue-600" />;
  if (status.includes('introduced') || status.includes('waiting')) return <FileText className="h-4 w-4 text-muted-foreground" />; // Waiting/Introduced
  return <FileText className="h-4 w-4 text-muted-foreground" />; // Default icon
};

export const KanbanCard = React.forwardRef<HTMLDivElement, KanbanCardProps>(
    ({ bill, isDragging, onCardClick, className, style, ...props }, ref) => {

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation(); // Prevent drag-and-drop from triggering
      onCardClick(bill);
    };

    return (
        <div
            ref={ref}
            className={cn(
                "rounded-md border bg-card text-card-foreground shadow-sm transition-shadow duration-200",
                "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", // Added focus state for accessibility
                isDragging ? "opacity-80 shadow-xl rotate-3 scale-105 cursor-grabbing" : "hover:shadow-md cursor-grab",
                 className
            )}
            style={style} // Pass style for dnd positioning
            {...props} // Pass dnd props
            // Add tabIndex to make the div focusable for keyboard navigation with dnd handle
            tabIndex={0}
        >
            {/* Make the entire card content area a button for clickability */}
            <Button
                variant="ghost"
                className="h-full w-full p-0 text-left justify-start items-stretch focus-visible:ring-0 focus-visible:ring-offset-0" // Remove button padding and styling
                onClick={handleButtonClick}
                aria-label={`View details for bill ${bill.id}: ${bill.name}`} // Accessibility
            >
                <div className="flex flex-col p-3 w-full"> {/* Use flex column for content */}
                    <CardHeader className="p-0 pb-2 space-y-1">
                         <div className="flex items-start justify-between gap-2">
                             <CardTitle className="text-sm font-medium leading-tight break-words" title={bill.name}>
                                {bill.name}
                            </CardTitle>
                            {getStatusIcon(bill.status)}
                         </div>
                         <p className="text-xs font-mono text-muted-foreground">{bill.id}</p>
                    </CardHeader>
                    <CardContent className="p-0 pb-2">
                        {/* Show concise status text */}
                        <CardDescription className="text-xs text-muted-foreground">
                           Status: {COLUMN_TITLES[bill.status] || bill.status}
                        </CardDescription>
                        {/* Optional: Add last updated date if available */}
                        <p className="text-xs text-muted-foreground mt-1">Updated: {bill.lastUpdated instanceof Date ? bill.lastUpdated.toLocaleDateString() : 'N/A'}</p>
                    </CardContent>
                    <CardFooter className="p-0 pt-2 mt-auto flex items-center justify-end text-xs text-accent hover:underline">
                         {/* Placeholder for "View Details" link/action */}
                        View Details
                        <ExternalLink className="h-3 w-3 ml-1" />
                    </CardFooter>
                </div>
            </Button>
      </div>
    );
});
KanbanCard.displayName = "KanbanCard";
