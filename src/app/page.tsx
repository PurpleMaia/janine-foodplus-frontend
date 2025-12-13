'use server'

import { KanbanHeader } from '@/components/kanban/kanban-header';
import { ProtectedKanbanBoardOrSpreadsheet } from '@/components/kanban/protected-kanban-board';
import { Button } from '@/components/ui/button';
import NewBillButton from '@/components/new-bill/new-bill-button';
import { AuthHeader } from '@/components/auth/auth-header';
import { ProtectedAdminComponent, ProtectedComponent } from '@/components/auth/protected-component';
import { ProtectedApprovalsComponent } from '@/components/auth/protected-approvals-component';
import { ApprovalsDashboard } from '@/components/approvals/approvals-dashboard';
import { SupervisorDashboard } from '@/components/supervisor/supervisor-dashboard';
import AIUpdateButton from '@/components/llm/llm-update-button';
import AdminPage from '@/components/admin/admin-server';




//Adds login/logout button in top-right
// Protects NewBillButton (only shows when logged in)
// Replaces your old kanban component with protected version


export default async function Home() {  

  return (
    <div className="flex min-h-screen flex-col">
        <div className='flex justify-between items-center px-4 border-b py-3 shadow-sm'>
          <div className='w-full'>
            <KanbanHeader />
          </div>
          <div className='flex items-center gap-2'>
            <AIUpdateButton/>
            <ProtectedComponent>
              <NewBillButton />
            </ProtectedComponent>
            <AuthHeader />
          </div>
        </div>
        <div className="flex items-center gap-2 p-4 border-b bg-background">
        {/* <Button
          variant={view === 'kanban' ? 'default' : 'outline'}
          onClick={() => setView('kanban')}
        >
          Kanban View
        </Button>
        <Button
          variant={view === 'spreadsheet' ? 'default' : 'outline'}
          onClick={() => setView('spreadsheet')}
        >
          Spreadsheet View
        </Button>

        <ProtectedAdminComponent>
          <Button
            variant={view === 'admin' ? 'default' : 'outline'}
            onClick={() => setView('admin')}
          >
            Admin View
          </Button>
        </ProtectedAdminComponent>
        
        <ProtectedApprovalsComponent>
          <Button
            variant={view === 'approvals' ? 'default' : 'outline'}
            onClick={() => setView('approvals')}
          >
            Approvals
          </Button>
        </ProtectedApprovalsComponent>
        
        {user?.role === 'supervisor' && (
          <Button
            variant={view === 'supervisor' ? 'default' : 'outline'}
            onClick={() => setView('supervisor')}
          >
            Supervisor
          </Button>
        )}
        </div> */}
        <main className="flex-1 overflow-auto">
            {/* { view === 'admin' ? (
                <AdminPage />
            ) : view === 'supervisor' ? (
              <SupervisorDashboard />
            ) : view === 'approvals' ? (
              <ApprovalsDashboard />
            ) : (
              <ProtectedKanbanBoardOrSpreadsheet view={view}/>
            )} */}
            <AdminPage />
            
        </main>
      </div>
    </div>
  );
}
