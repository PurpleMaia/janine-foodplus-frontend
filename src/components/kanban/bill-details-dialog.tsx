'use client';

import type React from 'react';
import type { Bill, Introducer, BillDraft, NewsArticle } from '@/types/legislation';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, FileText, Newspaper } from 'lucide-react';
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

  const progressValue = getProgressValue(bill.status);
  const currentStageName = getCurrentStageName(bill.status);

  // Sort drafts newest to oldest
  const sortedDrafts = [...bill.billDrafts].sort((a, b) => b.date.getTime() - a.date.getTime());
  // Sort articles newest to oldest
  const sortedArticles = [...bill.newsArticles].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0"> {/* Larger, full height */}
        {/* Header */}
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
            <div className="flex justify-between items-start">
                <div>
                    <DialogTitle className="text-lg font-semibold">{bill.id} - {bill.shortName}</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Current Stage: {currentStageName}
                    </DialogDescription>
                </div>
                 <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    <span className="sr-only">Close</span>
                 </Button>
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
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">

            {/* Left Column: Introducers */}
            <div className="space-y-4 md:border-r md:pr-4">
              <h3 className="text-md font-semibold border-b pb-1">Introducers</h3>
              {bill.introducers.length > 0 ? (
                <ul className="space-y-3">
                  {bill.introducers.map((intro, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={intro.imageUrl} alt={intro.name} />
                        <AvatarFallback>{intro.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{intro.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No introducers listed.</p>
              )}
            </div>

            {/* Middle Column: Details & PDF */}
            <div className="space-y-4 md:col-span-1"> {/* Default to 1 span, let right take remaining */}
              <h3 className="text-md font-semibold border-b pb-1">Details</h3>
              <div className="space-y-2 text-sm">
                <DetailItem label="Measure Title" value={bill.measureTitle} />
                {bill.reportTitle && <DetailItem label="Report Title" value={bill.reportTitle} />}
                <DetailItem label="Description" value={bill.description} />
                {bill.companionBill && <DetailItem label="Companion Bill" value={bill.companionBill} badge />}
                {bill.package && <DetailItem label="Package" value={bill.package} badge />}
              </div>

              <Separator />

              <h3 className="text-md font-semibold border-b pb-1">Current Bill Text</h3>
              <div className="border rounded-md overflow-hidden h-64 md:h-96"> {/* Fixed height container */}
                {bill.currentDraftPdfUrl ? (
                  <iframe
                    src={bill.currentDraftPdfUrl}
                    title={`Current draft of ${bill.id}`}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                  />
                ) : (
                   <div className="flex items-center justify-center h-full text-muted-foreground">
                        <FileText className="h-10 w-10 mr-2" />
                        <span>No PDF available</span>
                   </div>
                )}
              </div>
            </div>

            {/* Right Column: Links & News */}
            <div className="space-y-4 md:border-l md:pl-4 md:col-span-1"> {/* Explicitly 1 span */}
                {/* Bill Drafts */}
                <div>
                    <h3 className="text-md font-semibold border-b pb-1 mb-2">Bill Drafts</h3>
                    {sortedDrafts.length > 0 ? (
                        <ul className="space-y-2">
                        {sortedDrafts.map((draft) => (
                            <li key={draft.version} className="text-sm space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">{draft.version}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {draft.date.toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex space-x-2">
                                    <a href={draft.htmlUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs flex items-center">
                                       HTML <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                    <a href={draft.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs flex items-center">
                                        PDF <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                </div>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">No drafts available.</p>
                    )}
                 </div>

                <Separator />

                 {/* News Articles */}
                 <div>
                    <h3 className="text-md font-semibold border-b pb-1 mb-2">In the News</h3>
                     {sortedArticles.length > 0 ? (
                        <ul className="space-y-3">
                        {sortedArticles.map((article, index) => (
                            <li key={index} className="text-sm">
                               <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline block">
                                  {article.title}
                               </a>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {article.source} - {article.date.toLocaleDateString()}
                                </p>
                            </li>
                        ))}
                        </ul>
                     ) : (
                        <p className="text-sm text-muted-foreground">No recent news articles found.</p>
                     )}
                 </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer (optional close button) */}
        <DialogFooter className="p-4 border-t sticky bottom-0 bg-background z-10">
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
        {badge ? <Badge variant="secondary">{value}</Badge> : <span className="text-muted-foreground">{value}</span>}
    </div>
);
