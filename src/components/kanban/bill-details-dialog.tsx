'use client';

import React from 'react';
import type { Bill, BillStatus } from '@/types/legislation';
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
import { FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface BillDetailsDialogProps {
  bill: Bill | null;
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
    return 'Unknown'; // Fallback
}

// --- Component ---

export function BillDetailsDialog({ bill, isOpen, onClose }: BillDetailsDialogProps) {
  if (!bill) {
    return null; // Don't render anything if no bill is selected
  }

  const progressValue = getProgressValue(bill.current_status as BillStatus);
  const currentStageName = getCurrentStageName(bill.current_status as BillStatus);

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
          {/* Grid layout: Use grid-cols-2 for simpler layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">

            {/* Left Column: Details */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold border-b pb-1">Details</h3>
              <div className="space-y-2 text-sm">
                <DetailItem label="Bill Number" value={bill.bill_number} />
                <DetailItem label="Bill Title" value={bill.bill_title} />
                <DetailItem label="Description" value={bill.description} />
                <DetailItem label="Status" value={bill.current_status} badge />
                <DetailItem label="Committee Assignment" value={bill.committee_assignment} />
                <DetailItem label="Introducers" value={bill.introducers} />
                <DetailItem label="Created" value={bill.created_at.toLocaleDateString()} />
                <DetailItem label="Last Updated" value={bill.updated_at.toLocaleDateString()} />
              </div>
            </div>

            {/* Right Column: Bill URL & Additional Info */}
            <div className="space-y-4">
              <h3 className="text-md font-semibold border-b pb-1">Bill Information</h3>
              
              <div className="space-y-2">
                <DetailItem label="Bill URL" value={bill.bill_url} />

                {/* Comment Section */}
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Comments</h4>
                  <CommentSection billId={bill.id} />
                </div>
              </div>
            </div>


            <div className="space-y-4">
              <h3 className="text-md font-semibold border-b pb-1">Status updates</h3>
              
              <div className="space-y-2">
                <DetailItem label="Bill Status" value={bill.current_status} />
              </div>
            </div>


          </div>
        </ScrollArea>

        {/* Footer (contains the close button) - Removed sticky and bottom-0 */}
        <DialogFooter className="p-4 border-t bg-background z-10 mt-auto"> {/* mt-auto pushes it down if ScrollArea doesn't fill space */}
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
            {value}
          </a>
        ) : badge ? (
          <Badge variant="secondary">{value}</Badge>
        ) : (
          <span className="text-muted-foreground">{value}</span>
        )}
    </div>
);

interface CommentSectionProps {
  billId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ billId }) => {
  const [comment, setComment] = React.useState('');
  const [comments, setComments] = React.useState<string[]>([]);

  const handlePost = () => {
    if (comment.trim()) {
      setComments([...comments, comment.trim()]);
      setComment('');
    }
  };

  return (
    <div>
      <textarea
        className="w-full border rounded p-2 text-sm mb-2"
        rows={2}
        placeholder="Write a comment..."
        value={comment}
        onChange={e => setComment(e.target.value)}
      />
      <button
        className="bg-primary text-white px-3 py-1 rounded text-sm mb-2"
        onClick={handlePost}
        type="button"
      >
        Post
      </button>
      <div className="space-y-1 mt-2">
        {comments.length === 0 && <div className="text-xs text-muted-foreground">No comments yet.</div>}
        {comments.map((c, i) => (
          <div key={i} className="bg-secondary rounded p-2 text-sm">
            {c}
          </div>
        ))}
      </div>
    </div>
  );
};
