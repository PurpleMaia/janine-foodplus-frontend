'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { KanbanBoard } from './kanban-board';
import { KanbanSpreadsheet } from './kanban-spreadsheet';
import { useAdoptedBills } from '@/hooks/use-adopted-bills';
import { AdoptBillDialog } from './adopt-bill-dialog';
import { useBills } from '@/contexts/bills-context';
import { KanbanHeader } from './kanban-header';
import { useKanbanBoard } from '@/contexts/kanban-board-context';

export function ProtectedKanbanBoardOrSpreadsheet() {
  const { user, loading } = useAuth();
  const { view } = useKanbanBoard();
  const { bills, loadingBills, viewMode } = useBills();
  const { unadoptBill } = useAdoptedBills();

  if (loading) {
    return null
  }

  // If not authenticated, show read-only view of all bills
  if (!user) {
    console.log('Rendering public view with', bills.length, 'bills');
    return (
      <>
        <KanbanHeader />
        { view === 'kanban' ? <KanbanBoard readOnly={true} /> : <KanbanSpreadsheet />}
      </>
    );
  }


  // Show adopted bills if user has any, otherwise show empty state with adopt button
  // BUT: Supervisors and admins should always see the kanban board (they might have bills from interns/adoptees)
  if (user && bills.length === 0 && !loadingBills && user.role !== 'supervisor' && user.role !== 'admin') {
    console.log('User has', bills.length, 'adopted bills, rendering empty state');
    
    return (
      <>
        <KanbanHeader />
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
      </>
    );
  }

  // Determine if editing should be disabled
  // For interns (role === 'user'), disable editing when viewing "All Bills"
  const isReadOnlyForIntern = user && user.role === 'user' && viewMode === 'all-bills';
  const shouldShowUnadoptButton = user && 
    (user.role === 'admin' || user.role === 'supervisor' || viewMode === 'my-bills');

  if (view === 'spreadsheet') {
    // Show adopted bills in spreadsheet view
    return (
      <div className="space-y-4">           
        <KanbanHeader />
        <KanbanSpreadsheet />      
      </div>
    );
  }

  // Show adopted bills with full functionality
  return (
    <div className="space-y-4">           
      <KanbanHeader />
      <KanbanBoard 
        readOnly={isReadOnlyForIntern || false} 
        onUnadopt={unadoptBill}
        showUnadoptButton={shouldShowUnadoptButton}
      />      
    </div>
  );
}
