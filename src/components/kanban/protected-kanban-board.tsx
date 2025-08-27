'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { KanbanBoard } from './kanban-board';
import { KanbanSpreadsheet } from './kanban-spreadsheet';
import { useAdoptedBills } from '@/hooks/use-adopted-bills';
import { AdoptBillDialog } from './adopt-bill-dialog';
import type { Bill } from '@/types/legislation';
import { KanbanBoardOrSpreadsheet } from '@/app/KanbanBoardOrSpreadsheet';

interface ProtectedKanbanBoardProps {
  initialBills: Bill[];
  view: 'kanban' | 'spreadsheet';
}

export function ProtectedKanbanBoard({ initialBills, view }: ProtectedKanbanBoardProps) {
  const { user, loading } = useAuth();
  const { bills: adoptedBills, loading: adoptedBillsLoading, refreshBills, unadoptBill } = useAdoptedBills();

  // Debug logging
  console.log('ProtectedKanbanBoard Debug:', {
    user: user?.email,
    loading,
    adoptedBillsLoading,
    adoptedBillsLength: adoptedBills?.length || 0,
    adoptedBills: adoptedBills,
    initialBillsLength: initialBills?.length || 0
  });

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  // If not authenticated, show read-only view of all bills
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
        <div className="text-center space-y-2">
          <h2 className="text-1xl font-semibold">Public View</h2>
          <p className="text-muted-foreground max-w-md">
            This is a read-only view of the legislation tracker. 
            Login to adopt and manage bills.
          </p>
        </div>
        {view === 'kanban' ? (
          <KanbanBoard initialBills={initialBills} readOnly={true} />
        ) : (
          <KanbanSpreadsheet bills={initialBills} />
        )}
      </div>
    );
  }

  // If authenticated, show only adopted bills
  if (adoptedBillsLoading) {
    return <div className="flex items-center justify-center h-full">Loading your bills...</div>;
  }

  // Show adopted bills if user has any, otherwise show empty state with adopt button
  if (adoptedBills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 p-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">No Bills Adopted Yet</h2>
          <p className="text-muted-foreground max-w-md">
            You haven't adopted any bills yet. Use the button below to start tracking bills that interest you.
          </p>
        </div>
        <div className="w-64">
          <AdoptBillDialog onBillAdopted={refreshBills} />
        </div>
      </div>
    );
  }

  // Show adopted bills with full functionality
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2>Your Adopted Bills</h2>
        <AdoptBillDialog onBillAdopted={refreshBills} />
      </div>

      {/* <KanbanBoardOrSpreadsheet view={view} bills={adoptedBills} />  */}
      {view === 'kanban' ? (
        <KanbanBoard 
          key={adoptedBills.length}
          initialBills={adoptedBills}  // ← THIS is where bills are passed!
          readOnly={false} 
          onUnadopt={unadoptBill}
          showUnadoptButton={true}
        />
      ) : (
        <KanbanSpreadsheet bills={adoptedBills} />
      )}
    </div>
  );
}
