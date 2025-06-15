
import { db } from '../db';
import { capturedItemsTable } from '../db/schema';
import { type ContentType, type CapturedItem } from '../schema';
import { eq } from 'drizzle-orm';

export const getItemsByContentType = async (contentType: ContentType): Promise<CapturedItem[]> => {
  try {
    const results = await db.select()
      .from(capturedItemsTable)
      .where(eq(capturedItemsTable.content_type, contentType))
      .execute();

    // Map results to match the expected CapturedItem type
    return results.map(item => ({
      ...item,
      metadata: item.metadata as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Failed to get items by content type:', error);
    throw error;
  }
};
