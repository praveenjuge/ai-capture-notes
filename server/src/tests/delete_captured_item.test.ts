
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { capturedItemsTable, tagsTable } from '../db/schema';
import { type CreateCapturedItemInput } from '../schema';
import { deleteCapturedItem } from '../handlers/delete_captured_item';
import { eq } from 'drizzle-orm';

describe('deleteCapturedItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a captured item', async () => {
    // Create a test item directly in database
    const result = await db.insert(capturedItemsTable)
      .values({
        content_type: 'text',
        content: 'Test content for deletion',
        title: 'Test Item',
        description: 'Item to be deleted',
        tags: []
      })
      .returning()
      .execute();

    const createdItem = result[0];

    // Delete the item
    await deleteCapturedItem(createdItem.id);

    // Verify item is deleted
    const items = await db.select()
      .from(capturedItemsTable)
      .where(eq(capturedItemsTable.id, createdItem.id))
      .execute();

    expect(items).toHaveLength(0);
  });

  it('should throw error when item does not exist', async () => {
    await expect(deleteCapturedItem(999)).rejects.toThrow(/not found/i);
  });

  it('should decrement tag usage counts when deleting item with tags', async () => {
    // Create tags first
    await db.insert(tagsTable)
      .values([
        { name: 'important', usage_count: 5 },
        { name: 'work', usage_count: 3 }
      ])
      .execute();

    // Create item with tags
    const result = await db.insert(capturedItemsTable)
      .values({
        content_type: 'text',
        content: 'Test content with tags',
        title: 'Tagged Item',
        tags: ['important', 'work']
      })
      .returning()
      .execute();

    const createdItem = result[0];

    // Delete the item
    await deleteCapturedItem(createdItem.id);

    // Verify tag usage counts were decremented
    const tags = await db.select()
      .from(tagsTable)
      .execute();

    const importantTag = tags.find(tag => tag.name === 'important');
    const workTag = tags.find(tag => tag.name === 'work');

    expect(importantTag?.usage_count).toEqual(4); // 5 - 1
    expect(workTag?.usage_count).toEqual(2); // 3 - 1
  });

  it('should handle deletion of item with empty tags array', async () => {
    // Create a test item without tags
    const result = await db.insert(capturedItemsTable)
      .values({
        content_type: 'code',
        content: 'console.log("test");',
        title: 'Code Item',
        tags: []
      })
      .returning()
      .execute();

    const createdItem = result[0];

    // Delete should succeed without affecting any tags
    await deleteCapturedItem(createdItem.id);

    // Verify item is deleted
    const items = await db.select()
      .from(capturedItemsTable)
      .where(eq(capturedItemsTable.id, createdItem.id))
      .execute();

    expect(items).toHaveLength(0);
  });

  it('should handle deletion when tag does not exist in tags table', async () => {
    // Create item with tags that don't exist in tags table
    const result = await db.insert(capturedItemsTable)
      .values({
        content_type: 'text',
        content: 'Test content',
        title: 'Test Item',
        tags: ['nonexistent-tag']
      })
      .returning()
      .execute();

    const createdItem = result[0];

    // Delete should succeed without errors
    await deleteCapturedItem(createdItem.id);

    // Verify item is deleted
    const items = await db.select()
      .from(capturedItemsTable)
      .where(eq(capturedItemsTable.id, createdItem.id))
      .execute();

    expect(items).toHaveLength(0);
  });
});
