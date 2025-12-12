'use client';

import type { Tag } from '@/types/legislation';

/**
 * Fetches all tags from the API
 */
export async function getAllTags(): Promise<Tag[]> {
  try {
    const response = await fetch('/api/tags', {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch tags');
    }
    const data = await response.json();
    return data.tags || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Creates a new tag (admin/supervisor only)
 */
export async function createTag(name: string, color?: string): Promise<Tag> {
  const response = await fetch('/api/tags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name, color }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create tag');
  }

  const data = await response.json();
  return data.tag;
}

/**
 * Updates a tag (admin/supervisor only)
 */
export async function updateTag(id: string, name: string, color?: string): Promise<Tag> {
  const response = await fetch(`/api/tags/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name, color }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update tag');
  }

  const data = await response.json();
  return data.tag;
}

/**
 * Deletes a tag (admin/supervisor only)
 */
export async function deleteTag(id: string): Promise<void> {
  const response = await fetch(`/api/tags/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete tag');
  }
}

/**
 * Fetches tags for a specific bill
 */
export async function getBillTags(billId: string): Promise<Tag[]> {
  try {
    const response = await fetch(`/api/bills/${billId}/tags`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch bill tags');
    }
    const data = await response.json();
    return data.tags || [];
  } catch (error) {
    console.error('Error fetching bill tags:', error);
    return [];
  }
}

/**
 * Updates tags for a bill (admin/supervisor only)
 */
export async function updateBillTags(billId: string, tagIds: string[]): Promise<Tag[]> {
  const response = await fetch(`/api/bills/${billId}/tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ tagIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update bill tags');
  }

  const data = await response.json();
  return data.tags || [];
}

