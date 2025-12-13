import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import KanbanServer from './kanban-server';
import KanbanBoardSkeleton from './skeletons/skeleton-board';

export default async function KanbanBoardPage() {
  const session = await auth();
  const isPublicView = !session?.user;

  return (
    <Suspense fallback={<KanbanBoardSkeleton />}>
      <KanbanServer readOnly={isPublicView} />
    </Suspense>
  );
}