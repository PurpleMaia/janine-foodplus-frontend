import AdminPage from '@/components/admin/admin-server';
import { KanbanHeader } from '@/components/kanban/kanban-header';

export default async function Home(searchParams: Promise<{ view?: string }>) {
  const { view } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">
      <KanbanHeader />

      <MainContent view={view} />

    </div>
  );
}

function MainContent({ view }: { view: string | undefined }) {
  switch (view) {
    case 'kanban':
      // return <KanbanBoard />;
    // case 'spreadsheet':
    //     return <KanbanSpreadsheet />;
    case 'admin':
      return <AdminPage />;
    // case 'supervisor':
    //     return <SupervisorPage />;
    default:
      return <div>Invalid view</div>;
  }
}
