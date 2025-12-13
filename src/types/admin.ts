import { User } from "@/db/types";
import { Selectable } from "kysely";

export interface PendingUser extends Selectable<User>{}
export interface PendingSupervisor extends Selectable<User>{}

export interface PendingProposal {
    id: string;
    bill_id: string;
    bill_number: string | null;
    bill_title: string | null;
    current_status: string | null;
    proposed_status: string | null;
    target_idx: number | null;
    source: 'human' | 'llm';
    approval_status: 'pending' | 'approved' | 'rejected';
    proposer: Proposer;
    created_at?: Date;
    proposalId: string;    
}

export interface Proposer {
    user_id: string;    
    role: string;
    at: string;
    note?: string;
    username?: string;
    email?: string;
}