
import { db } from '../db';
import { capturedItemsTable } from '../db/schema';
import { type CapturedItem } from '../schema';
import { sql } from 'drizzle-orm';

export const getItemsByTags = async (tags: string[]): Promise<CapturedItem[]> => {
  try {
    // If no tags provided, return empty array
    if (!tags || tags.length === 0) {
      return [];
    }

    // Query items that contain any of the specified tags
    // Use array overlap operator && with proper PostgreSQL array syntax
    const results = await db.select()
      .from(capturedItemsTable)
      .where(sql`${capturedItemsTable.tags} && ${sql`ARRAY[${sql.join(tags.map(tag => sql`${tag}`), sql`, `)}]`}`)
      .execute();

    // Convert metadata from unknown to proper type
    return results.map(item => ({
      ...item,
      metadata: item.metadata as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Get items by tags failed:', error);
    throw error;
  }
};
