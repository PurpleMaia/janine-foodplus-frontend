import React from 'react';
import type { Bill } from '@/types/legislation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle, XCircle, Clock, FileText, UserCheck, GitBranch, Flag, Send, Edit, Gavel } from 'lucide-react'; // Example icons

interface KanbanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  bill: Bill;
  isDragging: boolean;
}

// Function to get an appropriate icon based on status (simple example)
const getStatusIcon = (status: Bill['status']): React.ReactNode => {
  if (status.includes('scheduled')) return <Calendar className="h-4 w-4 text-accent" />;
  if (status.includes('deferred')) return <Clock className="h-4 w-4 text-muted-foreground" />;
  if (status.includes('passed')) return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status.includes('veto') || status.includes('deferred')) return <XCircle className="h-4 w-4 text-destructive" />;
  if (status.includes('conference')) return <GitBranch className="h-4 w-4 text-purple-600" />;
  if (status.includes('governor')) return <UserCheck className="h-4 w-4 text-blue-600" />;
  if (status.includes('law')) return <Gavel className="h-4 w-4 text-green-700" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />; // Default icon
};


export const KanbanCard = React.forwardRef<HTMLDivElement, KanbanCardProps>(
    ({ bill, isDragging, className, style, ...props }, ref) => {
    return (
        <Card
            ref={ref}
            className={cn(
                "cursor-grab rounded-md border bg-card shadow-sm hover:shadow-md transition-shadow duration-200",
                isDragging ? "opacity-80 shadow-xl rotate-3 scale-105" : "",
                 className
            )}
            style={style} // Pass style for dnd positioning
            {...props} // Pass dnd props
        >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
             <CardTitle className="text-sm font-medium leading-tight truncate" title={bill.name}>{bill.name}</CardTitle>
             {getStatusIcon(bill.status)}
          </div>
          <p className="text-xs text-muted-foreground">{bill.id}</p>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <CardDescription className="text-xs line-clamp-2">{bill.description}</CardDescription>
        </CardContent>
      </Card>
    );
});
KanbanCard.displayName = "KanbanCard";

