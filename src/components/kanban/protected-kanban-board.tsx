'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { KanbanBoard } from './kanban-board';
import { KanbanSpreadsheet } from './kanban-spreadsheet';
import { useAdoptedBills } from '@/hooks/use-adopted-bills';
import { AdoptBillDialog } from './adopt-bill-dialog';
import { useBills } from '@/contexts/bills-context';

interface ProtectedKanbanBoardProps {
  view: string | 'kanban' | 'spreadsheet';
}

export function ProtectedKanbanBoardOrSpreadsheet({ view }: ProtectedKanbanBoardProps) {
  const { user, loading } = useAuth();
  const { bills, loadingBills } = useBills();
  const { unadoptBill } = useAdoptedBills();

  if (loading) {
    return null
  }

  // If not authenticated, show read-only view of all bills
  if (!user) {
    console.log('Rendering public view with', bills.length, 'bills');
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
          <KanbanBoard readOnly={true} />
        ) : (
          <KanbanSpreadsheet />
        )}
      </div>
    );
  }


  // Show adopted bills if user has any, otherwise show empty state with adopt button
  if (user && bills.length === 0 && !loadingBills) {
    console.log('User has', bills.length, 'adopted bills, rendering empty state');
    
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 p-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">No Bills Adopted Yet</h2>
          <p className="text-muted-foreground max-w-md">
            You haven&apos;t adopted any bills yet. Use the button below to start tracking bills that interest you.
          </p>
        </div>
        <div className="w-64">
          <AdoptBillDialog />
        </div>
      </div>
    );
  }

  // Show adopted bills with full functionality
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2>Your Adopted Bills</h2>
        <AdoptBillDialog />
      </div>

      {/* <KanbanBoardOrSpreadsheet view={view} bills={adoptedBills} />  */}
      {view === 'kanban' ? (
        <KanbanBoard 
          readOnly={false} 
          onUnadopt={unadoptBill}
          showUnadoptButton={true}
        />
      ) : (
        <KanbanSpreadsheet />
      )}
    </div>
  );
}
