
import { db } from '../db';
import { capturedItemsTable } from '../db/schema';
import { type CapturedItem } from '../schema';
import { eq } from 'drizzle-orm';

export const getCapturedItemById = async (id: number): Promise<CapturedItem | null> => {
  try {
    const results = await db.select()
      .from(capturedItemsTable)
      .where(eq(capturedItemsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const item = results[0];
    
    return {
      ...item,
      // Ensure tags array is always present (fallback to empty array if null/undefined)
      tags: item.tags || [],
      // Ensure metadata matches expected type
      metadata: item.metadata as Record<string, any> | null
    };
  } catch (error) {
    console.error('Failed to get captured item by id:', error);
    throw error;
  }
};
