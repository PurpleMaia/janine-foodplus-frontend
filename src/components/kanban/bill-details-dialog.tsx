'use client';

import React, { useEffect } from 'react';
import type { BillStatus } from '@/types/legislation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { FileText, RefreshCw, WandSparkles, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMemo, useState } from 'react';
import AIUpdateSingleButton from '../llm/llm-update-single-button';
import RefreshStatusesButton from '../scraper/scrape-updates-button';
import { useBills } from '@/hooks/contexts/bills-context';
import { useAuth } from '@/hooks/contexts/auth-context';
import { COLUMN_TITLES, KANBAN_COLUMNS } from '@/lib/kanban-columns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';
import { updateBillStatus } from '@/services/data/legislation';
import { Input } from '@/components/ui/input';
import { TagSelector } from '../tags/tag-selector';
import { useTrackedBills } from '@/hooks/use-tracked-bills';

interface BillDetailsDialogProps {
  billID: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// --- Progress Tracker ---
// Define the stages and their corresponding statuses
const PROGRESS_STAGES = [
  { name: 'Introduced', statuses: ['introduced'] },
  { name: 'Orig. Chamber', statuses: ['scheduled1', 'deferred1', 'waiting2', 'scheduled2', 'deferred2', 'waiting3', 'scheduled3', 'deferred3', 'crossoverWaiting1'] },
  { name: 'Non-Orig. Chamber', statuses: ['crossoverScheduled1', 'crossoverDeferred1', 'crossoverWaiting2', 'crossoverScheduled2', 'crossoverDeferred2', 'crossoverWaiting3', 'crossoverScheduled3', 'crossoverDeferred3', 'passedCommittees'] },
  { name: 'Conference', statuses: ['conferenceAssigned', 'conferenceScheduled', 'conferenceDeferred', 'conferencePassed'] },
  { name: 'Governor', statuses: ['transmittedGovernor', 'vetoList'] },
  { name: 'Law', statuses: ['governorSigns', 'lawWithoutSignature'] },
];

const getProgressValue = (status: BillStatus): number => {
  const currentStageIndex = PROGRESS_STAGES.findIndex(stage => stage.statuses.includes(status));
  // If status not found in defined stages, assume introductory phase (or handle as error)
  if (currentStageIndex === -1) {
      if (status === 'introduced') return (1 / (PROGRESS_STAGES.length + 1)) * 100; // ~14% if just introduced
      return 0; // Default or error state
  }
  // Calculate progress based on the index of the *completed* stage
  // Since index is 0-based, add 1, and add 1 again because 'Introduced' is the first *step*
  const completedStages = currentStageIndex + 1;
  // Add 1 to length for the 'Introduced' step before the first chamber
  return (completedStages / PROGRESS_STAGES.length) * 100;
};

const getCurrentStageName = (status: BillStatus): string => {
    const currentStage = PROGRESS_STAGES.find(stage => stage.statuses.includes(status));
    if (currentStage) return currentStage.name;
    if (status === 'introduced') return 'Introduced';
    return 'Not Assigned'; // Fallback
}

export function BillDetailsDialog({ billID, isOpen, onClose }: BillDetailsDialogProps) {
  const { bills, setBills, setTempBills, updateBillNickname, proposeStatusChange, viewMode, updateBill } = useBills()
  const { user } = useAuth() // Add this line to get authentication state
  const { trackBill, untrackBill } = useTrackedBills();
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [, setSaving] = useState<boolean>(false)
  const [nickname, setNickname] = useState<string>('');
  const [isSavingNickname, setIsSavingNickname] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [isUntracking, setIsUntracking] = useState<boolean>(false);

  // Find the bill based on billID
  const bill = useMemo(() => {

    const found = bills.find(b => b.id === billID)    

    return found
  }, [bills, billID])
      
  // Sync selectedStatus with bill's current_status when dialog opens or bill changes
  useEffect(() => {
      if (isOpen && bill) {
          setSelectedStatus(bill.current_status || '');
          setNickname(bill.user_nickname ?? '');
      }
  }, [isOpen, bill, bill?.current_status, bill?.id, bill?.user_nickname]);
  
  // Clear selectedStatus when dialog closes
  useEffect(() => {
      if (!isOpen) {
          setSelectedStatus('');
          setNickname('');
      }
  }, [isOpen]);
  
  

  if (!bill) {
    return null; // Don't render anything if no bill is selected
  }
  const progressValue = getProgressValue(bill.current_status as BillStatus);
  const currentStageName = getCurrentStageName(bill.current_status as BillStatus);

  const handleOnValueChange = (status: string) => {
    setSelectedStatus(status)
  }

  // Check if editing should be disabled for interns in "All Bills" view
  const isInternInAllBillsView = user?.role === 'user' && viewMode === 'all-bills';
  
  // Interns can only edit bills in "My Bills" view (not in "All Bills" view)
  const canEditBill = !isInternInAllBillsView;
  const canSeeTracking = user?.role === 'admin' || user?.role === 'supervisor';
  const canClaimBill = canSeeTracking;
  const isAlreadyTracking = !!(user && bill.tracked_by?.some((tracker) => tracker.id === user.id));

  const handleSave = async () => {
    try {
        setSaving(true);

        // If intern is in "All Bills" view, prevent editing
        if (isInternInAllBillsView) {
          toast({
            title: "Cannot Edit",
            description: "You can only edit bills in your 'My Bills' view. Switch to 'My Bills' to edit this bill.",
            variant: "destructive",
          });
          return;
        }

        // Interns (users with role 'user') propose changes instead of directly updating
        if (user?.role === 'user') {
          console.log('🔵 [DIALOG] User proposing change:', bill.id, '→', selectedStatus);
          await proposeStatusChange(bill, selectedStatus as BillStatus, {
            userId: user.id,
            role: 'intern',
          });
          toast({
            title: "Change Proposed",
            description: `Awaiting supervisor approval.`,
          });
          onClose();
          return;
        }

        // Admins and supervisors can directly update
        const updatedBillFromServer = await updateBillStatus(bill.id, selectedStatus);
        if (!updatedBillFromServer) {
            throw new Error('Failed to update bill status on server.');
        }

        // Update the UI bill
        setBills(prevBills => 
            prevBills.map(b => 
            b.id === bill.id 
                ? { 
                    ...b, 
                    llm_suggested: false,
                    llm_processing: false,
                    previous_status: b.current_status, // Store original status
                    current_status: selectedStatus,                        
                }
                : b
            )
        );

        // Remove the corresponding temp bill
        setTempBills(prevTempBills => 
          prevTempBills.filter(tb => tb.id !== bill.id)
        );

        toast({
          title: "Bill Status Updated",
          description: `${bill.bill_title} moved to ${COLUMN_TITLES[selectedStatus]}.`,
        });
        
        onClose()
    } catch (error) {
        console.error("Failed to update bill status:", error);
        toast({
          title: "Error",
          description: "Failed to update bill status. Please try again.",
          variant: "destructive",
        });
    } finally {
        setSaving(false)
    }         
  } 

  const handleSaveNickname = async (value?: string) => {
    if (!bill) return;
    if (!user || user.role !== 'user') return;

    const currentNickname = value !== undefined ? value : nickname;
    const trimmed = currentNickname.trim();
    if (trimmed === (bill.user_nickname ?? '')) {
      toast({
        title: 'No changes',
        description: 'Nickname is unchanged.',
      });
      return;
    }

    try {
      setIsSavingNickname(true);
      await updateBillNickname(bill.id, trimmed);
      toast({
        title: 'Nickname saved',
        description: trimmed ? `Saved "${trimmed}"` : 'Nickname cleared.',
      });
    } catch (error) {
      console.error('Failed to save nickname', error);
      toast({
        title: 'Error',
        description: 'Failed to save nickname. Please try again.',
        variant: 'destructive',
      });
      setNickname(bill.user_nickname ?? '');
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleClearNickname = async () => {
    setNickname('');
    await handleSaveNickname('');
  };

  const handleClaimBill = async () => {
    if (!user) return;
    if (isAlreadyTracking) return;

    try {
      setIsClaiming(true);
      await trackBill(bill.bill_url);
      const nextTrackedBy = bill.tracked_by ? [...bill.tracked_by] : [];
      nextTrackedBy.unshift({
        id: user.id,
        email: user.email ?? null,
        username: user.username ?? null,
      });
      updateBill(bill.id, {
        tracked_by: nextTrackedBy,
        tracked_count: (bill.tracked_count ?? nextTrackedBy.length) + 1,
      });
    } catch (error) {
      console.error('Failed to claim bill', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleUntrackBill = async () => {
    if (!user) return;
    if (!isAlreadyTracking) return;

    try {
      setIsUntracking(true);
      const success = await untrackBill(bill.id, {
        keepInList: viewMode === 'all-bills',
        suppressToast: true,
      });
      if (!success) return;

      toast({
        title: 'Bill untracked',
        description: 'You are no longer tracking this bill.',
      });
    } catch (error) {
      console.error('Failed to untrack bill', error);
    } finally {
      setIsUntracking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0"> {/* Larger, full height, flex-col ensures footer is at bottom */}
        {/* Header */}
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
            <div className="flex justify-between items-start">
                <div>
                    <DialogTitle className="text-lg font-semibold">{bill.bill_number} - {bill.bill_title}</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Current Stage: {currentStageName}
                    </DialogDescription>
                </div>
                 {/* The 'X' close button is part of DialogContent by default */}
            </div>

          {/* Progress Tracker */}
          <div className="mt-2">
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Progress value={progressValue} className="w-full h-2" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{currentStageName} ({Math.round(progressValue)}%)</p>
                    </TooltipContent>
                 </Tooltip>
            </TooltipProvider>
            <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
              <span>Introduced</span>
              <span>Orig. Chamber</span>
              <span>Non-Orig. Chamber</span>
              <span>Conference</span>
              <span>Governor</span>
              <span>Law</span>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content Area (Scrollable) */}
        <ScrollArea className="flex-1 overflow-y-auto"> {/* flex-1 allows this area to grow and push footer down */}
          <div className="space-y-6 p-4">
            {/* Top Section */}
            <div className="mt-3 grid gap-4 grid-cols-4">

              {/* Tags */}
              <div className="rounded-md border bg-muted/40 p-3 space-y-2 col-span-2">
                <h4 className="font-semibold text-sm">Tags</h4>
                <p className="text-xs text-muted-foreground">
                  Add tags to categorize this bill.
                </p>
                <TagSelector billId={bill.id} />
              </div>              

              {/* View Original Url */}
              <div className="rounded-md border bg-muted/40 p-3 space-y-2">
                <h4 className="text-sm font-semibold">Bill URL</h4>
                <p className='text-xs text-muted-foreground'>Hawaii State Legislature: </p>
                <a href={bill.bill_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline">
                  <FileText className="h-4 w-4" />
                  View Original Bill
                </a>
              </div>

              {/* Who is Tracking */}
              <div className="rounded-md border bg-muted/40 p-3 space-y-3">
                {canSeeTracking && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold">Tracking</h4>
                        {canClaimBill && (
                          <Button
                            size="sm"
                            variant={isAlreadyTracking ? "destructive" : "default"}
                            onClick={isAlreadyTracking ? handleUntrackBill : handleClaimBill}
                            disabled={isClaiming || isUntracking}
                          >
                            {isAlreadyTracking ? 'Untrack Bill' : 'Track Bill'}
                          </Button>
                        )}
                    </div>
                    {bill.tracked_by && bill.tracked_by.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {bill.tracked_by.map((tracker) => (
                          <Badge key={tracker.id} variant="outline" className="text-xs">
                            {tracker.username || tracker.email || 'Unknown'}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No one is tracking this bill.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <section className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bill Information
              </h3>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <DetailItem label="Bill Number" value={bill.bill_number} />
                <DetailItem label="Year Introduced" value={bill.year?.toString() ?? 'N/A'} />
                <DetailItem label="Bill Title" value={bill.bill_title} />
                <DetailItem label="Committee Assignment" value={bill.committee_assignment ? bill.committee_assignment : 'Not Assigned'} />
                <div className="sm:col-span-2 space-y-4">
                  <DetailItem label="Introducers" value={bill.introducer} />
                  <DetailItem label="Description" value={bill.description || 'No description available.'} />
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold">Status Updates</h3>
              <div className="mt-3 space-y-3">
                {bill.updates && bill.updates.length > 0 ? (
                  <div className="relative max-h-96 overflow-y-auto pr-2">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
                    
                    {bill.updates.map((update, index) => (
                      <div key={`${bill.id}-update-${index}-${update.id || index}`} className="relative flex gap-4 mb-4 last:mb-0">
                        <div className="relative z-10 flex-shrink-0 w-12 h-12 flex items-center justify-center">
                          {index === 0 ? (
                            <div className="w-5 h-5 bg-green-500 border-4 border-green-200 rounded-full shadow-lg"></div>
                          ) : (
                            <div className="w-4 h-4 bg-gray-300 border-2 border-gray-200 rounded-full opacity-60"></div>
                          )}
                        </div>
                        <div className="flex-1 bg-muted/50 rounded-lg p-3 border min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="text-xs">
                              {update.chamber}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(update.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {update.statustext}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No status updates available</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
        {/* Status Change Section - Now conditionally editable */}
        <div className="z-10 border-t justify-center align-middle space-y-4 p-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">New Status</h3>
            {!user && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Login required to edit</span>
              </div>
            )}
          </div>

          <div className='flex gap-4'>
            <Select 
              value={selectedStatus} 
              onValueChange={handleOnValueChange}
              disabled={!user || !canEditBill} // Disable when not authenticated or intern in all-bills view
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={
                  !user 
                    ? "Login to edit status" 
                    : !canEditBill 
                      ? "Only editable in 'My Bills' view" 
                      : "Select a new status"
                } />
              </SelectTrigger>
              <SelectContent>
                {KANBAN_COLUMNS.map((column) => (
                  <SelectItem key={column.id} value={column.id}>
                    {column.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleSave}
              disabled={!user || !selectedStatus || !canEditBill} // Disable when not authenticated, no status selected, or intern in all-bills view
            >
              Save
            </Button>
          </div>
        </div>

        {/* Footer - Also conditionally show admin buttons */}
        <DialogFooter className="p-4 border-t bg-background z-10 mt-auto sm:justify-between">
          <div className='flex gap-2'>
            {user ? (
              <>
                <AIUpdateSingleButton bill={bill} />
                <RefreshStatusesButton bill={bill} /> 
              </>
            ) : (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span>Admin features require login</span>
              </div>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for displaying details
interface DetailItemProps {
    label: string;
    value: string;
    badge?: boolean;
}
const DetailItem: React.FC<DetailItemProps> = ({ label, value, badge }) => (
    <div>
        <span className="font-medium">{label}:</span>{' '}
        {label === 'Bill URL' ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all hover:text-blue-800"
          >
            {checkURL(value)}
          </a>
        ) : badge ? (
          <Badge variant="secondary">{value}</Badge>
        ) : (
          <span className="text-muted-foreground">{value}</span>
        )}
    </div>
);

function checkURL(url: string){
  // extracting href from the html incase it is not caught on server-side
  if (url.startsWith('<a')) {
    const match = url.match(/href=(["']?)([^"'\s>]+)\1/);
    const editedURL = match ? match[2] : null;
    console.log('Had to convert:', url)
    return editedURL
  } else {
    return url
  }
}
