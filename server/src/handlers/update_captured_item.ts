
import { db } from '../db';
import { capturedItemsTable, tagsTable } from '../db/schema';
import { type UpdateCapturedItemInput, type CapturedItem } from '../schema';
import { eq, sql, inArray } from 'drizzle-orm';

export const updateCapturedItem = async (input: UpdateCapturedItemInput): Promise<CapturedItem> => {
  try {
    // Check if the item exists
    const existingItem = await db.select()
      .from(capturedItemsTable)
      .where(eq(capturedItemsTable.id, input.id))
      .execute();

    if (existingItem.length === 0) {
      throw new Error(`Captured item with id ${input.id} not found`);
    }

    // Prepare update values, filtering out undefined fields
    const updateValues: any = {
      updated_at: new Date()
    };

    if (input.content_type !== undefined) {
      updateValues['content_type'] = input.content_type;
    }
    if (input.content !== undefined) {
      updateValues['content'] = input.content;
    }
    if (input.title !== undefined) {
      updateValues['title'] = input.title;
    }
    if (input.description !== undefined) {
      updateValues['description'] = input.description;
    }
    if (input.tags !== undefined) {
      updateValues['tags'] = input.tags;
    }
    if (input.metadata !== undefined) {
      updateValues['metadata'] = input.metadata;
    }

    // Update the captured item
    const result = await db.update(capturedItemsTable)
      .set(updateValues)
      .where(eq(capturedItemsTable.id, input.id))
      .returning()
      .execute();

    const updatedItem = result[0];

    // Update tag usage counts if tags were modified
    if (input.tags !== undefined) {
      const oldTags = existingItem[0].tags || [];
      const newTags = input.tags || [];

      // Find tags to decrement (removed tags)
      const removedTags = oldTags.filter(tag => !newTags.includes(tag));
      
      // Find tags to increment (added tags)
      const addedTags = newTags.filter(tag => !oldTags.includes(tag));

      // Decrement usage count for removed tags
      if (removedTags.length > 0) {
        await db.update(tagsTable)
          .set({ usage_count: sql`usage_count - 1` })
          .where(inArray(tagsTable.name, removedTags))
          .execute();
      }

      // Handle added tags - insert new ones or increment existing
      for (const tagName of addedTags) {
        await db.insert(tagsTable)
          .values({ name: tagName, usage_count: 1 })
          .onConflictDoUpdate({
            target: tagsTable.name,
            set: { usage_count: sql`tags.usage_count + 1` }
          })
          .execute();
      }
    }

    // Convert the result to match the expected schema
    return {
      id: updatedItem.id,
      content_type: updatedItem.content_type,
      content: updatedItem.content,
      title: updatedItem.title,
      description: updatedItem.description,
      created_at: updatedItem.created_at,
      updated_at: updatedItem.updated_at,
      tags: updatedItem.tags,
      metadata: updatedItem.metadata as Record<string, any> | null
    };
  } catch (error) {
    console.error('Captured item update failed:', error);
    throw error;
  }
};
