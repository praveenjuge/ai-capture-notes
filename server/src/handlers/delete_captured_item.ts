
import { db } from '../db';
import { capturedItemsTable, tagsTable } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export const deleteCapturedItem = async (id: number): Promise<void> => {
  try {
    // First, get the item to retrieve its tags for cleanup
    const existingItem = await db.select()
      .from(capturedItemsTable)
      .where(eq(capturedItemsTable.id, id))
      .execute();

    if (existingItem.length === 0) {
      throw new Error(`Captured item with id ${id} not found`);
    }

    const itemTags = existingItem[0].tags;

    // Delete the captured item
    await db.delete(capturedItemsTable)
      .where(eq(capturedItemsTable.id, id))
      .execute();

    // Decrement usage count for each tag that was used by this item
    if (itemTags.length > 0) {
      for (const tagName of itemTags) {
        await db.update(tagsTable)
          .set({
            usage_count: sql`usage_count - 1`
          })
          .where(eq(tagsTable.name, tagName))
          .execute();
      }
    }
  } catch (error) {
    console.error('Captured item deletion failed:', error);
    throw error;
  }
};
