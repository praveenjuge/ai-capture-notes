
import { db } from '../db';
import { capturedItemsTable } from '../db/schema';
import { type SemanticSearchInput, type CapturedItem } from '../schema';
import { eq, ilike, and, or, desc } from 'drizzle-orm';

export const semanticSearch = async (input: SemanticSearchInput): Promise<CapturedItem[]> => {
  try {
    // Handle empty query case first
    if (!input.query.trim()) {
      const baseQuery = input.content_type
        ? db.select().from(capturedItemsTable)
            .where(eq(capturedItemsTable.content_type, input.content_type))
            .orderBy(desc(capturedItemsTable.created_at))
            .limit(input.limit)
        : db.select().from(capturedItemsTable)
            .orderBy(desc(capturedItemsTable.created_at))
            .limit(input.limit);
      
      const results = await baseQuery.execute();
      return results.map(item => ({
        ...item,
        metadata: item.metadata as Record<string, any> | null
      }));
    }

    // Process search terms
    const searchTerms = input.query.trim().toLowerCase().split(' ').filter(term => term.length > 0);
    
    // Build search condition for all terms
    const searchConditions = searchTerms.map(term => 
      or(
        ilike(capturedItemsTable.content, `%${term}%`),
        ilike(capturedItemsTable.title, `%${term}%`),
        ilike(capturedItemsTable.description, `%${term}%`)
      )
    );

    // Combine search with content type filter if needed
    let finalCondition;
    if (input.content_type) {
      finalCondition = and(
        eq(capturedItemsTable.content_type, input.content_type),
        ...searchConditions
      );
    } else {
      finalCondition = searchConditions.length === 1 
        ? searchConditions[0] 
        : and(...searchConditions);
    }

    // Execute the query
    const results = await db.select()
      .from(capturedItemsTable)
      .where(finalCondition)
      .orderBy(desc(capturedItemsTable.created_at))
      .limit(input.limit)
      .execute();

    // Transform results to match CapturedItem schema
    return results.map(item => ({
      ...item,
      metadata: item.metadata as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Semantic search failed:', error);
    throw error;
  }
};
