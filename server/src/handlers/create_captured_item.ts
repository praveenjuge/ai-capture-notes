
import { db } from '../db';
import { capturedItemsTable } from '../db/schema';
import { type CreateCapturedItemInput, type CapturedItem } from '../schema';

export const createCapturedItem = async (input: CreateCapturedItemInput): Promise<CapturedItem> => {
  try {
    // Insert captured item record
    const result = await db.insert(capturedItemsTable)
      .values({
        content_type: input.content_type,
        content: input.content,
        title: input.title || null,
        description: input.description || null,
        metadata: input.metadata || null,
        tags: [], // Start with empty tags array
      })
      .returning()
      .execute();

    const capturedItem = result[0];
    return {
      ...capturedItem,
      // Ensure tags is always an array (even if database returns null)
      tags: capturedItem.tags || [],
      // Ensure metadata matches the expected type
      metadata: capturedItem.metadata as Record<string, any> | null,
    };
  } catch (error) {
    console.error('Captured item creation failed:', error);
    throw error;
  }
};
