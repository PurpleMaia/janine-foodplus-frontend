import React, { useState, useEffect, useRef } from 'react';
import type { BillDetails } from '@/types/legislation';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useBills } from '@/hooks/contexts/bills-context';
import { useKanbanBoard } from '@/hooks/contexts/kanban-board-context';
import { getBillDetails } from '@/services/data/legislation';
import { formatBillStatusName } from '@/lib/utils';


interface KanbanSpreadsheetProps {
  isPublicView?: boolean;
}

export function KanbanSpreadsheet({ isPublicView = false }: KanbanSpreadsheetProps) {
  const { bills } = useBills();
  const { searchQuery } = useKanbanBoard();
  const [loading, setLoading] = useState<boolean>(false);
  const [filteredBills, setFilteredBills] = useState<BillDetails[]>([]);
  const firstMatchRef = useRef<HTMLTableRowElement | null>(null);

  // From the bills object, fetch all bill details
  useEffect(() => {
    const fetchBillDetails = async () => {
      setLoading(true);
      setFilteredBills([]); // Clear previous data to prevent duplicates

      try {
        // Fetch all bill details in parallel
        const detailsPromises = bills.map(bill =>
          getBillDetails(bill.id).catch(err => {
            console.error('Error fetching bill details for', bill.bill_number, err);
            return null; // Return null for failed fetches
          })
        );

        const allDetails = await Promise.all(detailsPromises);

        // Filter out null values (failed fetches) and deduplicate by ID
        const validDetails = allDetails.filter((detail): detail is BillDetails => detail !== null);
        const uniqueDetails = Array.from(
          new Map(validDetails.map(detail => [detail.id, detail])).values()
        );

        setFilteredBills(uniqueDetails);
      } catch (err) {
        console.error('Error fetching bill details:', err);
        setFilteredBills([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBillDetails();
  }, [bills]);

  // Filter bills based on search query (async)
  // useEffect(() => {
  //   if (!searchQuery.trim()) {
  //     setFilteredBills(bills);
  //     return;
  //   }

  //   const handler = setTimeout(async () => {
  //     try {
  //       const results = await searchBills(bills, searchQuery);
  //       setFilteredBills(results);
  //     } catch (err) {
  //       console.error('Error searching bills:', err);
  //       setFilteredBills(bills);
  //     }
  //   }, 300);

  //   return () => {
  //     clearTimeout(handler);
  //   };
  // }, [bills, searchQuery]);

  // Scroll to first match when search results change
  // useEffect(() => {
  //   if (searchQuery.trim() && filteredBills.length > 0 && firstMatchRef.current) {
  //     // Small delay to ensure DOM is updated
  //     setTimeout(() => {
  //       firstMatchRef.current?.scrollIntoView({ 
  //         behavior: 'smooth', 
  //         block: 'center' 
  //       });
  //     }, 100);
  //   }
  // }, [filteredBills, searchQuery]);

  return (
    <div className="h-full w-full overflow-auto">
      <div className="min-w-max p-4">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-20 bg-background w-[8rem] py-4">Bill #</TableHead>
              <TableHead className="w-[10rem] py-4">Current Status</TableHead>
              <TableHead className="min-w-[20rem] max-w-[30rem] w-[30rem] py-4">Bill Title</TableHead>
              <TableHead className="min-w-[15rem] max-w-[30rem] w-[30rem] py-4">Policy Description</TableHead>
              <TableHead className="w-[12rem] py-4">Committee</TableHead>
              <TableHead className="w-[12rem] py-4">Introducer</TableHead>
              <TableHead className="w-[15rem] py-4">Tags</TableHead>
              {!isPublicView && <TableHead className="w-[12rem] py-4">Tracking</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isPublicView ? 7 : 8} className="text-center py-8 text-muted-foreground">
                  Loading bill details...
                </TableCell>
              </TableRow>
            ) : filteredBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isPublicView ? 7 : 8} className="text-center py-8 text-muted-foreground">
                  {searchQuery.trim() ? `No bills found matching "${searchQuery}"` : 'No bills available'}
                </TableCell>
              </TableRow>
            ) : (
              filteredBills.map((bill, index) => (
                <TableRow
                  key={bill.id}
                  ref={index === 0 && searchQuery.trim() ? firstMatchRef : null}
                  className={index === 0 && searchQuery.trim() ? 'bg-blue-50 border-blue-300 border-2' : ''}
                >
                  {/* Bill Number */}
                  <TableCell className="sticky left-0 z-20 bg-background w-[8rem] py-4">
                    {bill.bill_number}
                  </TableCell>

                  {/* Current Status */}
                  <TableCell className="w-[10rem] py-4">
                    {formatBillStatusName(bill.current_bill_status)}
                  </TableCell>

                  {/* Bill Title */}
                  <TableCell className="text-wrap min-w-[20rem] max-w-[30rem] w-[30rem] py-4">
                    {bill.bill_title}
                  </TableCell>

                  {/* Policy Description */}
                  <TableCell className="text-wrap min-w-[15rem] max-w-[30rem] w-[30rem] py-4">
                    {bill.description}
                  </TableCell>

                  {/* Committee */}
                  <TableCell className="text-wrap w-[12rem] py-4">
                    {bill.committee_assignment || 'N/A'}
                  </TableCell>

                  {/* Introducer */}
                  <TableCell className="text-wrap w-[12rem] py-4">
                    {bill.introducer || 'N/A'}
                  </TableCell>

                  {/* Tags */}
                  <TableCell className="w-[15rem] py-4">
                    <div className="flex flex-wrap gap-1">
                      {bill.tags && bill.tags.length > 0 ? (
                        bill.tags.map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No tags</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Tracking Information - Hidden in public view */}
                  {!isPublicView && (
                    <TableCell className="w-[12rem] py-4">
                      <div className="text-sm">
                        {bill.tracked_count !== undefined && bill.tracked_count > 0 ? (
                          <span className="text-muted-foreground">
                            {bill.tracked_count} {bill.tracked_count === 1 ? 'tracker' : 'trackers'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not tracked</span>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
