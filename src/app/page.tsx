'use client'


import { Header } from '@/components/main/header';
import { ProtectedKanbanBoardOrSpreadsheet } from '@/components/kanban/protected-kanban-board';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { ApprovalsDashboard } from '@/components/approvals/approvals-dashboard';
import { SupervisorDashboard } from '@/components/supervisor/supervisor-dashboard';
import { useAuth } from '@/hooks/contexts/auth-context';
import { useKanbanBoard } from '@/hooks/contexts/kanban-board-context';




//Adds login/logout button in top-right
// Protects NewBillButton (only shows when logged in)
// Replaces your old kanban component with protected version


export default function Home() {
  const { view, setView } = useKanbanBoard();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
          
      <main className="flex-1 overflow-auto">
          { view === 'admin' ? (
              <AdminDashboard />
          ) : view === 'supervisor' ? (
              <SupervisorDashboard />
          ) : view === 'approvals' ? (
              <ApprovalsDashboard />
          ) : view === 'spreadsheet' ? (
            <ProtectedKanbanBoardOrSpreadsheet />          
          ) : (
            <ProtectedKanbanBoardOrSpreadsheet />          
          )}
      </main>
    </div>
  );
}
