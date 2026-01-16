import React, { useState, useEffect } from 'react';
import { cn, formatBillStatusName } from '@/lib/utils';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Removed unused imports
import { Calendar, CheckCircle, Clock, FileText, GitBranch, Send, Gavel, Sparkles, X, Check } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '@/components/ui/button';
import { CardTagSelector } from '../tags/card-tag-selector';
import { useBills } from '@/hooks/contexts/bills-context';
import { useAuth } from '@/hooks/contexts/auth-context';
import type { Bill } from '@/types/legislation';

interface KanbanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  bill: Bill;
  isDragging: boolean;
  onCardClick: (bill: Bill) => void;
  onUnadopt?: (billId: string) => void;
  showUnadoptButton?: boolean;
  isHighlighted?: boolean;
}

// Function to get an appropriate icon based on status
const getStatusIcon = (status: Bill['current_status']): React.ReactNode => {
  if (!status) return <FileText className="h-3 w-3 text-muted-foreground" />; // Handle undefined/null
  if (status.includes('scheduled')) return <Calendar className="h-3 w-3 text-blue-600" />;
  if (status.includes('deferred') || status.includes('vetoList')) return <Clock className="h-3 w-3 text-orange-600" />;
  if (status.includes('passedCommittees')) return <CheckCircle className="h-3 w-3 text-green-600" />;
  if (status.includes('governorSigns') || status.includes('lawWithoutSignature')) return <Gavel className="h-3 w-3 text-green-700" />;
  if (status.includes('conference')) return <GitBranch className="h-3 w-3 text-purple-600" />;
  if (status.includes('transmittedGovernor')) return <Send className="h-3 w-3 text-blue-600" />;
  if (status.includes('introduced') || status.includes('waiting')) return <FileText className="h-3 w-3 text-muted-foreground" />;
  return <FileText className="h-3 w-3 text-muted-foreground" />; // Default icon
};

// Function to get status color variant
const getStatusVariant = (status: Bill['current_status']): "default" | "secondary" | "destructive" | "outline" => {
  if (!status) return "outline"; // Handle undefined/null
  if (status.includes('passedCommittees') || status.includes('governorSigns') || status.includes('lawWithoutSignature')) return "default";
  if (status.includes('deferred') || status.includes('vetoList')) return "destructive";
  if (status.includes('scheduled') || status.includes('transmittedGovernor')) return "secondary";
  return "outline";
};

export const KanbanCard = React.forwardRef<HTMLDivElement, KanbanCardProps>(
    ({ bill, isDragging, onCardClick, onUnadopt, showUnadoptButton = false, isHighlighted = false, className, style, ...props }, ref) => {

    const [formattedDate, setFormattedDate] = useState<string>('N/A');
    const [isProcessing, setIsProcessing] = useState(false);
    const { acceptLLMChange, rejectLLMChange, setBills } = useBills()
    const { user } = useAuth();
    const canSeeTracking = user?.role === 'admin' || user?.role === 'supervisor';
    const trackedBy = bill.tracked_by ?? [];
    const trackedCount = bill.tracked_count ?? trackedBy.length;
    const visibleTrackers = trackedBy.slice(0, 2);
    const extraTrackerCount = trackedBy.length - visibleTrackers.length;

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
          } catch {
              console.warn("Could not parse date string:", bill.updated_at);
          }
      }
      setFormattedDate(dateToFormat ? dateToFormat.toLocaleDateString() : 'N/A');
    }, [bill.updated_at]);


    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation(); // Prevent drag-and-drop from triggering
      onCardClick(bill);
    };

    const handleAccept = async () => {
      setIsProcessing(true);
      try {
        await acceptLLMChange(bill.id);
      } finally {
        setIsProcessing(false);
      }
    };
  
    const handleReject = async () => {
      setIsProcessing(true);
      try {
        await rejectLLMChange(bill.id);
      } finally {
        setIsProcessing(false);
      }
    };

    return (
        <div
            ref={ref}
            className={cn(
                "rounded-md border bg-card text-card-foreground shadow-sm transition-all duration-200",
                "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 w-full max-w-[300px]", // limit card width
                "flex flex-col", // Flex column layout
                isDragging ? "opacity-80 shadow-xl rotate-3 scale-105 cursor-grabbing" : "hover:shadow-md cursor-grab",
                bill.updates && bill.updates.length > 0 && "ring-1 ring-green-200/50", // Subtle glow for active bills
                isHighlighted && "ring-2 ring-blue-500 ring-offset-2 bg-blue-50/50 border-blue-300", // Highlight search match
                 className
            )}
            style={style} // dnd positioning
            {...props} // dnd props
            tabIndex={0} // Make focusable
        >
            {/* Add click handler to the content div */}
            <div 
                className="flex flex-col w-full min-h-[80px] cursor-pointer"
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
                <CardHeader className="px-3 py-2 space-y-1 justify-between">        

                      <CardTagSelector
                        billId={bill.id}
                        billTags={bill.tags}
                      />                                
                      <div className="flex gap-2 my-1 items-center">
                        <CardTitle className="text-md font-bold" title={bill.bill_title}>
                          {bill.bill_number}
                        </CardTitle>
                        {bill.year && (
                          <Badge variant='secondary' className="text-xs h-4 px-1 rounded-md text-muted-foreground">
                            {bill.year}
                          </Badge>
                        )}
                     </div>           

                </CardHeader>
                <CardContent className="p-0 gap-2">
                    {bill.user_nickname && (
                      <p className="text-xs text-muted-foreground">
                        Nickname: {bill.user_nickname}
                      </p>
                    )}
                    <p className='text-sm text-foreground text-wrap line-clamp-2 px-3'>{bill.description}</p>

                    {/* Latest Status Update Preview */}
                    {bill.updates && bill.updates.length > 0 && (
                        <div className="border-y bg-slate-100 bg-muted/30 my-2 p-3 mt-3 items-center align-middle justify-center">
                            <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs text-muted-foreground">
                                            Latest update • {new Date(bill.updates[0].date).toLocaleDateString()}
                                        </p>
                                        {bill.updates.length > 1 && (
                                            <Badge variant="outline" className="text-xs h-5 px-1.5">
                                                +{bill.updates.length - 1} more
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                                        {bill.updates[0].statustext}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className='flex justify-between items-center mt-2 px-3 mb-2'>

                      <Badge variant='outline' className='text-muted-foreground'>
                        {formatBillStatusName(bill.current_status)}
                      </Badge>

                      {canSeeTracking ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Tracked By: </span>
                          {trackedBy.length > 0 ? (
                            <div className="gap-1 flex items-center">
                              {visibleTrackers.map((tracker) => (
                                <Badge key={tracker.id} variant="outline" className="text-[10px] h-5 px-1.5">
                                  {tracker.username || tracker.email || 'Unknown'}
                                </Badge>
                              ))}
                              {extraTrackerCount > 0 && (
                              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                +{extraTrackerCount} more
                              </Badge>
                            )}
                          </div>
                          ) : trackedBy.length === 0 ? (
                          <Badge variant="destructive" className="text-[10px] text-white">No One</Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Restricted</span>
                        )}
                        </div>
                      ) : (
                        <div>
                          {trackedCount > 0 ? (
                            <Badge className="h-5 px-1.5">
                              Tracked
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-white">Not Tracked</Badge>
                          )}
                        </div>
                      )}
                    </div>

                </CardContent>                           
            </div>

            {/* LLM Action Buttons */}
            {bill.llm_suggested && !bill.llm_processing && (
              <div className="p-4 flex gap-2 mt-3 pt-3 border-t border-blue-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="flex-1 text-xs h-8 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="flex-1 text-xs h-8 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                >
                  <X className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              </div>
            )}

            {bill.llm_processing && (
              <div className="mt-3 pt-3 border-t border-blue-100 p-4">
                <div className="flex items-center justify-center text-xs text-blue-600">
                  <div className="relative">
                    <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                  </div>
                  <span className="animate-pulse">AI Processing...</span>
                </div>
              </div>
            )}
      </div>
    );
});
KanbanCard.displayName = "KanbanCard";
