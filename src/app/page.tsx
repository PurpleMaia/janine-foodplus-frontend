import AdminPage from '@/components/admin/admin-server';
import KanbanBoardPage from '@/components/kanban/main';
import { KanbanHeader } from '@/components/main/kanban-header';
import { auth } from '@/lib/auth';

export default async function Home({ searchParams,
}: {
  searchParams: { view?: string };
}) {
  const params = await searchParams;
  const view = params.view || 'kanban';

  const session = await auth()
  const user = session?.user;  

  return (
    <div className="flex min-h-screen flex-col">
      <KanbanHeader user={user} />

      <MainContent view={view} />

    </div>
  );
}

function MainContent({ view }: { view: string }) {
  switch (view) {
    case 'kanban':
      return <KanbanBoardPage />;
    case 'spreadsheet':
      return <div>Spreadsheet View</div>;
    case 'admin':
      return <AdminPage />;
    case 'supervisor':
      return <div>Supervisor View</div>
    default:
      return <div>Invalid view</div>;
  }
}
