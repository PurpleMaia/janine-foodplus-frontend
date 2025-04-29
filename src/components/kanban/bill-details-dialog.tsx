'use client';

import type React from 'react';
import type { Bill } from '@/types/legislation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { COLUMN_TITLES } from '@/lib/kanban-columns';
import { ExternalLink } from 'lucide-react';

interface BillDetailsDialogProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BillDetailsDialog({ bill, isOpen, onClose }: BillDetailsDialogProps) {
  if (!bill) {
    return null; // Don't render anything if no bill is selected
  }

  const formattedDate = bill.lastUpdated instanceof Date
      ? bill.lastUpdated.toLocaleDateString()
      : (typeof bill.lastUpdated === 'string' ? new Date(bill.lastUpdated).toLocaleDateString() : 'N/A');

  // Generate a placeholder link (replace with actual link generation if available)
  const billLink = `/bills/${bill.id}`; // Example internal link
  // Or const billLink = `https://www.legislature.example.gov/bill/${bill.id}`; // Example external link


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] lg:max-w-[700px]"> {/* Adjust max-width as needed */}
        <DialogHeader>
          <DialogTitle>{bill.name} ({bill.id})</DialogTitle>
          <DialogDescription>
            Current Status: {COLUMN_TITLES[bill.status] || bill.status}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
             <p className="text-sm font-medium">Description:</p>
             <p className="text-sm text-muted-foreground">{bill.description}</p>
          </div>
          <div className="space-y-1">
              <p className="text-sm font-medium">Last Updated:</p>
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          {/* Placeholder for additional details */}
          {/*
          <div className="space-y-1">
              <p className="text-sm font-medium">Sponsors:</p>
              <p className="text-sm text-muted-foreground">Sen. Smith, Rep. Jones</p>
          </div>
          <div className="space-y-1">
              <p className="text-sm font-medium">Committee History:</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  <li>Passed Senate Committee on Health - 06/10/2024</li>
                  <li>Introduced - 06/01/2024</li>
              </ul>
          </div>
          */}
        </div>
        <DialogFooter className="sm:justify-start"> {/* Align footer items */}
            {/* Link to the bill page */}
           <Button variant="link" asChild className="p-0 h-auto text-accent hover:underline">
              <a href={billLink} target="_blank" rel="noopener noreferrer">
                View Full Bill Details <ExternalLink className="h-4 w-4 ml-1" />
              </a>
           </Button>
           <Button variant="outline" onClick={onClose} className="ml-auto sm:ml-2"> {/* Move Close to the right on larger screens */}
                Close
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
