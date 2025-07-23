import React from 'react';
import type { Bill, BillStatus } from '@/types/legislation';
import { KANBAN_COLUMNS, COLUMN_TITLES } from '@/lib/kanban-columns';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { CheckCircle } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useState } from 'react';

interface KanbanSpreadsheetProps {
  bills: Bill[];
}

export function KanbanSpreadsheet({ bills }: KanbanSpreadsheetProps) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  return (
    <div className="h-full w-full overflow-auto">
      <div className="min-w-max p-4">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-20 bg-background min-w-[12rem] max-w-[12rem] w-[12rem] truncate py-4">Bill Number</TableHead>
              <TableHead className="sticky left-[12rem] z-20 bg-background min-w-[12rem] max-w-[12rem] w-[12rem] truncate py-4">Title</TableHead>
              {KANBAN_COLUMNS.map((col) => (
                <TableHead key={col.id} className="min-w-[12rem] max-w-[12rem] w-[12rem] truncate py-4">{col.title}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell className="sticky left-0 z-20 bg-background min-w-[10rem] max-w-[10rem] w-[10rem] truncate py-4">{bill.bill_number}</TableCell>
                <TableCell className="sticky left-[10rem] z-20 bg-background min-w-[10rem] max-w-[10rem] w-[10rem] truncate cursor-pointer py-4">
                  <Popover open={openPopover === bill.id} onOpenChange={(open) => setOpenPopover(open ? bill.id : null)}>
                    <PopoverTrigger asChild>
                      <div className="truncate w-full" onClick={() => setOpenPopover(bill.id)}>
                        {bill.bill_title}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="max-w-xs">
                      {bill.bill_title}
                    </PopoverContent>
                  </Popover>
                </TableCell>
                {KANBAN_COLUMNS.map((col) => (
                  <TableCell key={col.id} className="text-center min-w-[10rem] max-w-[10rem] w-[10rem] truncate py-4">
                    {bill.current_status === col.id ? (
                      <CheckCircle className="inline-block text-green-600" />
                    ) : null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 