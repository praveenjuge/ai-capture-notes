
import { db } from '../db';
import { capturedItemsTable } from '../db/schema';
import { type SearchCapturedItemsInput, type CapturedItem } from '../schema';
import { and, eq, ilike, arrayContains, SQL } from 'drizzle-orm';

export const searchCapturedItems = async (input: SearchCapturedItemsInput): Promise<CapturedItem[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Add text search condition if query provided
    if (input.query) {
      conditions.push(
        ilike(capturedItemsTable.content, `%${input.query}%`)
      );
    }

    // Add content type filter if provided
    if (input.content_type) {
      conditions.push(
        eq(capturedItemsTable.content_type, input.content_type)
      );
    }

    // Add tag filter if provided
    if (input.tags && input.tags.length > 0) {
      // Check if all provided tags are present in the item's tags array
      for (const tag of input.tags) {
        conditions.push(
          arrayContains(capturedItemsTable.tags, [tag])
        );
      }
    }

    // Build the query step by step to maintain proper type inference
    const baseQuery = db.select().from(capturedItemsTable);
    
    // Apply where conditions if any exist
    const queryWithConditions = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    // Apply pagination
    const finalQuery = queryWithConditions.limit(input.limit).offset(input.offset);

    const results = await finalQuery.execute();

    // Convert results to match CapturedItem schema
    return results.map(item => ({
      ...item,
      created_at: item.created_at,
      updated_at: item.updated_at,
      tags: item.tags || [],
      metadata: item.metadata as Record<string, any> | null // Type assertion to match schema
    }));
  } catch (error) {
    console.error('Search captured items failed:', error);
    throw error;
  }
};
