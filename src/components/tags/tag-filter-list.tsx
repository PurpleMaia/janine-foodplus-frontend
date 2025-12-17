'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Settings, Filter, Check } from 'lucide-react';
import { getAllTags } from '@/services/tags';
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
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { user } = useAuth();

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

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));

  return (
    <>
      <div className="flex items-center gap-2">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" >
              <Filter className="h-4 w-4 mr-2" />
              Filter by Tags
              {selectedTagIds.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {selectedTagIds.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Filter by Tags</h3>
                <div className="flex gap-1">
                  {selectedTagIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearFilters();
                      }}
                      className="h-7 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                  {canManageTags && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowManagementDialog(true);
                        setPopoverOpen(false);
                      }}
                      className="h-7 text-xs"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Loading filters...
                </div>
              ) : tags.length === 0 ? (
                <div className="py-4 space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    No tags available.
                  </p>
                  {canManageTags && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowManagementDialog(true);
                        setPopoverOpen(false);
                      }}
                      className="w-full"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Create Tags
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="max-h-[300px] overflow-y-auto space-y-1">
                    {tags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <div
                          key={tag.id}
                          onClick={() => onTagToggle(tag.id)}
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-center w-4 h-4">
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <Badge
                            variant="outline"
                            style={{
                              backgroundColor: tag.color || '#3b82f6',
                              color: 'white',
                              borderColor: tag.color || '#3b82f6',
                            }}
                            className="text-xs"
                          >
                            {tag.name}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                  {selectedTagIds.length > 0 && (
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Show selected tags outside the popover */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="default"
                style={{
                  backgroundColor: tag.color || '#3b82f6',
                  color: 'white',
                }}
                className="cursor-pointer hover:opacity-80"
                onClick={() => onTagToggle(tag.id)}
              >
                {tag.name}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <TagManagementDialog
        isOpen={showManagementDialog}
        onClose={() => {
          setShowManagementDialog(false);
          loadTags();
        }}
      />
    </>
  );
}