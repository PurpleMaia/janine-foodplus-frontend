import { KANBAN_COLUMNS } from "@/lib/kanban-columns";
import { useRef } from "react";

// ================== REFERENCES ============================ //

export const introducedRef = useRef<HTMLDivElement>(null);
export const scheduled1Ref = useRef<HTMLDivElement>(null);
export const deferred1Ref = useRef<HTMLDivElement>(null);

export const waiting2Ref = useRef<HTMLDivElement>(null);
export const scheduled2ef = useRef<HTMLDivElement>(null);
export const deferred2Ref = useRef<HTMLDivElement>(null);

export const waiting3Ref = useRef<HTMLDivElement>(null);
export const scheduled3Ref = useRef<HTMLDivElement>(null);
export const deferred3Ref = useRef<HTMLDivElement>(null);

export const crossoverRef = useRef<HTMLDivElement>(null);
export const crossoveScheduled1rRef = useRef<HTMLDivElement>(null);
export const crossoveDeferred1rRef = useRef<HTMLDivElement>(null);

export const crossoverWaiting2Ref = useRef<HTMLDivElement>(null);
export const crossoverScheduled2Ref = useRef<HTMLDivElement>(null);
export const crossoverDeferred2Ref = useRef<HTMLDivElement>(null);
export const crossoverWaiting3Ref = useRef<HTMLDivElement>(null);
export const crossoverScheduled3Ref = useRef<HTMLDivElement>(null);
export const crossoverDeferred3Ref = useRef<HTMLDivElement>(null);

export const conferenceRef = useRef<HTMLDivElement>(null);
export const conferenceScheduledRef = useRef<HTMLDivElement>(null);
export const conferenceDeferredRef = useRef<HTMLDivElement>(null);
export const conferencePassedRef = useRef<HTMLDivElement>(null);

export const governorRef = useRef<HTMLDivElement>(null);
export const vetoListRef = useRef<HTMLDivElement>(null);
export const governorSignsRef = useRef<HTMLDivElement>(null);
export const lawWithoutSignatureRef = useRef<HTMLDivElement>(null);

// ================== INDEXES ============================ //

export const beforeCrossoverIdx = KANBAN_COLUMNS.findIndex(col => col.id === 'introduced');
export const defferred1Idx = KANBAN_COLUMNS.findIndex(col => col.id === 'deferred1');
export const crossoverIdx = KANBAN_COLUMNS.findIndex(col => col.id === ('crossoverWaiting1'));
export const conferenceIdx = KANBAN_COLUMNS.findIndex(col => col.id === ('conferenceAssigned'));
export const governorIdx = KANBAN_COLUMNS.findIndex(col => col.id === 'transmittedGovernor');