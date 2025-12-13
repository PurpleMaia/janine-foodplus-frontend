'use server'

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth"
import { getKanbanBoardData } from "@/services/actions/kanban";

export default async function KanbanBoardPage() {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'supervisor')) {
        redirect('/');
    }

    const result = await getKanbanBoardData();

    if (!result.success) {
        return <div>Failed to load kanban board data</div>;
    }

    return (
        <pre>{JSON.stringify(result.data, null, 2)}</pre>
    );
}