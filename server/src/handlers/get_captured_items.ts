
import { db } from '../db';
import { capturedItemsTable } from '../db/schema';
import { type CapturedItem } from '../schema';

export const getCapturedItems = async (): Promise<CapturedItem[]> => {
  try {
    const results = await db.select()
      .from(capturedItemsTable)
      .execute();

    return results.map(item => ({
      ...item,
      tags: item.tags || [], // Ensure tags is always an array
      metadata: item.metadata as Record<string, any> | null // Type assertion for metadata
    }));
  } catch (error) {
    console.error('Failed to get captured items:', error);
    throw error;
  }
};
