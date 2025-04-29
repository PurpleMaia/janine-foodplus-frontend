'use client';

import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface KanbanBoardContextType {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

const KanbanBoardContext = createContext<KanbanBoardContextType | undefined>(undefined);

export function KanbanBoardProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <KanbanBoardContext.Provider value={{ searchQuery, setSearchQuery }}>
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
