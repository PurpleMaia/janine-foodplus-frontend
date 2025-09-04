import React from 'react';
import type { Bill } from '@/types/legislation';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useState } from 'react';
import { useBills } from '@/contexts/bills-context';


export function KanbanSpreadsheet() {
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const { bills } = useBills();

  return (
    <div className="h-full w-full overflow-auto">
      <div className="min-w-max p-4">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-20 bg-background min-w-[12rem] max-w-[12rem] w-[12rem] truncate py-4">Bill Number</TableHead>
              <TableHead className="sticky left-0 z-20 bg-background min-w-[12rem] max-w-[12rem] w-[12rem] truncate py-4">Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Bill URL</TableHead>
              <TableHead>Current Status</TableHead>
              <TableHead>Committee Assignment</TableHead>
              <TableHead>Introducers</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell className="sticky left-0 z-20 bg-background min-w-[10rem] max-w-[10rem] w-[10rem] truncate py-4">{bill.bill_number}</TableCell>
                <TableCell className="sticky left-[10rem] z-20 bg-background min-w-[10rem] max-w-[10rem] w-[10rem] truncate cursor-pointer py-4">
                  <Popover open={openPopover === bill.id} onOpenChange={(open) => setOpenPopover(open ? bill.id : null)}>
                    <PopoverTrigger asChild>
                      <div className="truncate cursor-pointer" onClick={() => setOpenPopover(bill.id)}>
                        {bill.bill_title}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="max-w-xs">
                      {bill.bill_title}
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell className="min-w-[50rem] max-w-[10rem] w-[10rem] truncate cursor-pointer py-4">
                <Popover
                    open={openPopover === `${bill.id}-desc`}
                    onOpenChange={(open) => setOpenPopover(open ? `${bill.id}-desc` : null)}
                >
                    <PopoverTrigger asChild>
                    <div className="truncate cursor-pointer" onClick={() => setOpenPopover(`${bill.id}-desc`)}>
                        {bill.description}
                    </div>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="max-w-xs">
                    {bill.description}
                    </PopoverContent>
                </Popover>
                </TableCell>
                <TableCell>
                  <a href={bill.bill_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {bill.bill_number}
                  </a>
                </TableCell>
                <TableCell>{bill.current_status}</TableCell>
                <TableCell>{bill.committee_assignment}</TableCell>
                <TableCell>{bill.introducer}</TableCell>
                <TableCell>{bill.created_at ? new Date(bill.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>{bill.updated_at ? new Date(bill.updated_at).toLocaleDateString() : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
