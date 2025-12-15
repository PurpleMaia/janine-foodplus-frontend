import { Bills, SupervisorUsers, User, UserBills } from "@/db/types";
import { Selectable } from "kysely";

export interface PendingUser{
  id: Selectable<User>['id'];
  email: Selectable<User>['email'];
  username: Selectable<User>['username'];
  created_at: Selectable<User>['created_at'];
  requested_admin: Selectable<User>['requested_admin'];
  requested_supervisor: Selectable<User>['requested_supervisor'];
  account_status: Selectable<User>['account_status'];
}

export interface SupervisorRequest {
  id: string;
  email: string;
  username: string;
  created_at: Date | null;
}

export interface PendingProposal {
  id: string;
  bill_id: string;
  bill_number?: string;
  bill_title?: string;
  proposed_status: string;
  current_status: string;
  proposed_at: string;
  proposing_user_id: string;
  proposing_username?: string;
  proposing_email?: string;
  proposed_by?: {
    user_id: string;
    role: string;
    at: string;
    note?: string;
    username?: string;
    email?: string;
  };
  proposalId: string;
}

export interface AdoptedBill {
  bill_id: Selectable<Bills>['id'];
  bill_number: Selectable<Bills>['bill_number'];
  bill_title: Selectable<Bills>['bill_title'];
  current_status: Selectable<Bills>['current_status'];
  adopted_at: Selectable<UserBills>['adopted_at'];
}
export interface InternWithBills {
  id: Selectable<User>['id'];
  email: Selectable<User>['email'];
  username: Selectable<User>['username'];
  created_at: Selectable<User>['created_at'];
  account_status: Selectable<User>['account_status'];
  supervisor_id: Selectable<SupervisorUsers>['id'] | null;
  supervisor_email: Selectable<User>['email'] | null;
  supervisor_username: Selectable<User>['username'] | null;
  adopted_bills: AdoptedBill[];
}

export interface SupervisorRelationship {
  supervisor_id: string;
  supervisor_email: string;
  supervisor_username: string;
  interns: Array<{
    id: string;
    email: string;
    username: string;
    adopted_at: string;
  }>;
}

export interface InternBill {
  bill: any;
  adopted_by: Array<{
    intern_id: string;
    intern_email: string;
    intern_username: string;
    supervisor_id: string | null;
    supervisor_email: string | null;
    supervisor_username: string | null;
    adopted_at: string;
  }>;
  pending_proposals: Array<{
    proposal_id: string;
    intern_id: string;
    intern_email: string;
    current_status: string;
    suggested_status: string;
    proposed_at: string;
  }>;
}