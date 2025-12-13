'use client';

import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface KanbanBoardContextType {
  view: 'kanban' | 'spreadsheet' | 'admin' | 'supervisor';
  setView: Dispatch<SetStateAction<'kanban' | 'spreadsheet' | 'admin' | 'supervisor'>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  selectedTagIds: string[];
  setSelectedTagIds: Dispatch<SetStateAction<string[]>>;
}

const KanbanBoardContext = createContext<KanbanBoardContextType | undefined>(undefined);

export function KanbanBoardProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'kanban' | 'spreadsheet' | 'admin' | 'supervisor'>('kanban');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  return (
    <KanbanBoardContext.Provider value={{ searchQuery, setSearchQuery, view, setView, selectedTagIds, setSelectedTagIds }}>
      {children}
    </KanbanBoardContext.Provider>
  );
}

export function useKanbanBoard() {
  const context = useContext(KanbanBoardContext);
  if (context === undefined) {
    throw new Error('useKanbanBoard must be used within a KanbanBoardProvider');
  }
  return context;
}
