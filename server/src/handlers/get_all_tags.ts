
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type Tag } from '../schema';
import { desc } from 'drizzle-orm';

export const getAllTags = async (): Promise<Tag[]> => {
  try {
    const results = await db.select()
      .from(tagsTable)
      .orderBy(desc(tagsTable.usage_count))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get all tags:', error);
    throw error;
  }
};
