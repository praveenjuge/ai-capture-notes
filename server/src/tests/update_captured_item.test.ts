
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { capturedItemsTable, tagsTable } from '../db/schema';
import { type UpdateCapturedItemInput, type CreateCapturedItemInput } from '../schema';
import { updateCapturedItem } from '../handlers/update_captured_item';
import { eq } from 'drizzle-orm';

// Helper function to create a test item
const createTestItem = async (): Promise<number> => {
  const result = await db.insert(capturedItemsTable)
    .values({
      content_type: 'text',
      content: 'Original content',
      title: 'Original title',
      description: 'Original description',
      tags: ['tag1', 'tag2'],
      metadata: { original: true }
    })
    .returning()
    .execute();

  // Create corresponding tags
  await db.insert(tagsTable)
    .values([
      { name: 'tag1', usage_count: 1 },
      { name: 'tag2', usage_count: 1 }
    ])
    .execute();

  return result[0].id;
};

describe('updateCapturedItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic fields', async () => {
    const itemId = await createTestItem();

    const updateInput: UpdateCapturedItemInput = {
      id: itemId,
      content: 'Updated content',
      title: 'Updated title',
      description: 'Updated description'
    };

    const result = await updateCapturedItem(updateInput);

    expect(result.id).toEqual(itemId);
    expect(result.content).toEqual('Updated content');
    expect(result.title).toEqual('Updated title');
    expect(result.description).toEqual('Updated description');
    expect(result.content_type).toEqual('text'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update content type and metadata', async () => {
    const itemId = await createTestItem();

    const updateInput: UpdateCapturedItemInput = {
      id: itemId,
      content_type: 'code',
      metadata: { language: 'typescript', lines: 42 }
    };

    const result = await updateCapturedItem(updateInput);

    expect(result.content_type).toEqual('code');
    expect(result.metadata).toEqual({ language: 'typescript', lines: 42 });
    expect(result.content).toEqual('Original content'); // Should remain unchanged
  });

  it('should update tags and adjust tag usage counts', async () => {
    const itemId = await createTestItem();

    const updateInput: UpdateCapturedItemInput = {
      id: itemId,
      tags: ['tag2', 'tag3', 'tag4'] // Remove tag1, keep tag2, add tag3 and tag4
    };

    const result = await updateCapturedItem(updateInput);

    expect(result.tags).toEqual(['tag2', 'tag3', 'tag4']);

    // Check tag usage counts
    const tags = await db.select()
      .from(tagsTable)
      .execute();

    const tagMap = tags.reduce((acc, tag) => {
      acc[tag.name] = tag.usage_count;
      return acc;
    }, {} as Record<string, number>);

    expect(tagMap['tag1']).toEqual(0); // Decremented
    expect(tagMap['tag2']).toEqual(1); // Unchanged
    expect(tagMap['tag3']).toEqual(1); // New tag
    expect(tagMap['tag4']).toEqual(1); // New tag
  });

  it('should handle setting fields to null', async () => {
    const itemId = await createTestItem();

    const updateInput: UpdateCapturedItemInput = {
      id: itemId,
      title: null,
      description: null,
      metadata: null
    };

    const result = await updateCapturedItem(updateInput);

    expect(result.title).toBeNull();
    expect(result.description).toBeNull();
    expect(result.metadata).toBeNull();
  });

  it('should handle empty tags array', async () => {
    const itemId = await createTestItem();

    const updateInput: UpdateCapturedItemInput = {
      id: itemId,
      tags: []
    };

    const result = await updateCapturedItem(updateInput);

    expect(result.tags).toEqual([]);

    // Check that original tags had their usage count decremented
    const tags = await db.select()
      .from(tagsTable)
      .execute();

    const tagMap = tags.reduce((acc, tag) => {
      acc[tag.name] = tag.usage_count;
      return acc;
    }, {} as Record<string, number>);

    expect(tagMap['tag1']).toEqual(0);
    expect(tagMap['tag2']).toEqual(0);
  });

  it('should update only specified fields', async () => {
    const itemId = await createTestItem();

    const updateInput: UpdateCapturedItemInput = {
      id: itemId,
      content: 'Only content updated'
    };

    const result = await updateCapturedItem(updateInput);

    expect(result.content).toEqual('Only content updated');
    expect(result.title).toEqual('Original title'); // Should remain unchanged
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.tags).toEqual(['tag1', 'tag2']); // Should remain unchanged
  });

  it('should save updated item to database', async () => {
    const itemId = await createTestItem();

    const updateInput: UpdateCapturedItemInput = {
      id: itemId,
      content: 'Database test content',
      title: 'Database test title'
    };

    await updateCapturedItem(updateInput);

    // Verify the update was persisted
    const savedItem = await db.select()
      .from(capturedItemsTable)
      .where(eq(capturedItemsTable.id, itemId))
      .execute();

    expect(savedItem).toHaveLength(1);
    expect(savedItem[0].content).toEqual('Database test content');
    expect(savedItem[0].title).toEqual('Database test title');
    expect(savedItem[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent item', async () => {
    const updateInput: UpdateCapturedItemInput = {
      id: 99999,
      content: 'This should fail'
    };

    expect(updateCapturedItem(updateInput)).rejects.toThrow(/not found/i);
  });
});
