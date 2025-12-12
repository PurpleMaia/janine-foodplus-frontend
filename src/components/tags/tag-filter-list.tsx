'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Settings } from 'lucide-react';
import { getAllTags } from '@/services/db/tags';
import type { Tag } from '@/types/legislation';
import { TagManagementDialog } from './tag-management-dialog';
import { useAuth } from '@/contexts/auth-context';

interface TagFilterListProps {
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  onClearFilters: () => void;
}

export function TagFilterList({
  selectedTagIds,
  onTagToggle,
  onClearFilters,
}: TagFilterListProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManagementDialog, setShowManagementDialog] = useState(false);
  const { user } = useAuth();

  // Debug log
  useEffect(() => {
    console.log('showManagementDialog state:', showManagementDialog);
    console.log('canManageTags:', user?.role === 'admin' || user?.role === 'supervisor');
  }, [showManagementDialog, user]);

  const canManageTags = user?.role === 'admin' || user?.role === 'supervisor';

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    try {
      const fetchedTags = await getAllTags();
      setTags(fetchedTags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground p-2">Loading filters...</div>
    );
  }

  if (tags.length === 0) {
    return (
      <>
        <div className="p-2 space-y-2">
          <p className="text-sm text-muted-foreground">No tags available.</p>
          {canManageTags && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Manage tags button clicked (no tags), setting dialog to open');
                setShowManagementDialog(true);
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Tags
            </Button>
          )}
        </div>
        <TagManagementDialog
          isOpen={showManagementDialog}
          onClose={() => {
            setShowManagementDialog(false);
            loadTags(); // Refresh tags after management
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className="p-2 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Filter by Tags</h3>
          <div className="flex gap-2">
            {selectedTagIds.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearFilters}
                className="h-7 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            {canManageTags && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Manage tags button clicked, setting dialog to open');
                  setShowManagementDialog(true);
                }}
                className="h-7 text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Manage
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <Badge
                key={tag.id}
                variant={isSelected ? 'default' : 'outline'}
                style={{
                  backgroundColor: isSelected ? (tag.color || '#3b82f6') : undefined,
                  color: isSelected ? 'white' : undefined,
                  cursor: 'pointer',
                }}
                onClick={() => onTagToggle(tag.id)}
                className="cursor-pointer"
              >
                {tag.name}
              </Badge>
            );
          })}
        </div>
        {selectedTagIds.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <TagManagementDialog
        isOpen={showManagementDialog}
        onClose={() => {
          setShowManagementDialog(false);
          loadTags(); // Refresh tags after management
        }}
      />
    </>
  );
}

