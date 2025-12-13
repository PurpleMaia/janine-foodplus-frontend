'use server'

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth"
import { getKanbanBoardData } from "@/services/actions/kanban";
import { KanbanBoard } from "./kanban-board";
import { Suspense } from "react";
import KanbanBoardSkeleton from "./skeletons/skeleton-board";

interface KanbanBoardLoaderProps {
    readOnly: boolean;
}
export default async function KanbanServer({ readOnly }: KanbanBoardLoaderProps) {
    const result = await getKanbanBoardData();

    if (!result.success) {
        return <div>Failed to load kanban board data</div>;
    }

    return (
        <Suspense fallback={<KanbanBoardSkeleton />}>
            <KanbanBoard initialData={result.data} readOnly={readOnly} />
        </Suspense>
    );
}