'use client';

import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface KanbanBoardContextType {
  view: 'kanban' | 'spreadsheet' | 'admin';
  setView: Dispatch<SetStateAction<'kanban' | 'spreadsheet' | 'admin'>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

const KanbanBoardContext = createContext<KanbanBoardContextType | undefined>(undefined);

export function KanbanBoardProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'kanban' | 'spreadsheet' | 'admin'>('kanban');

  return (
    <KanbanBoardContext.Provider value={{ searchQuery, setSearchQuery, view, setView }}>
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
