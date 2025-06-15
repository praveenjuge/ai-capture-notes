
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { capturedItemsTable } from '../db/schema';
import { type SemanticSearchInput, type CreateCapturedItemInput } from '../schema';
import { semanticSearch } from '../handlers/semantic_search';

// Test data setup
const testItems: CreateCapturedItemInput[] = [
  {
    content_type: 'text',
    content: 'This is a JavaScript tutorial about async functions',
    title: 'JavaScript Async Tutorial',
    description: 'Learn how to use async/await in JavaScript'
  },
  {
    content_type: 'code',
    content: 'function hello() { console.log("Hello World"); }',
    title: 'Hello World Function',
    description: 'A simple JavaScript function'
  },
  {
    content_type: 'link',
    content: 'https://example.com/python-guide',
    title: 'Python Programming Guide',
    description: 'Complete guide to Python programming'
  },
  {
    content_type: 'image',
    content: 'base64imagedata...',
    title: 'Database Schema Diagram',
    description: 'Visual representation of our database structure'
  }
];

describe('semanticSearch', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(capturedItemsTable)
      .values(testItems.map(item => ({
        content_type: item.content_type,
        content: item.content,
        title: item.title || null,
        description: item.description || null,
        tags: [],
        metadata: item.metadata || null
      })))
      .execute();
  });

  afterEach(resetDB);

  it('should search by content', async () => {
    const input: SemanticSearchInput = {
      query: 'JavaScript',
      limit: 10
    };

    const results = await semanticSearch(input);

    expect(results.length).toBe(2);
    expect(results.some(item => item.title === 'JavaScript Async Tutorial')).toBe(true);
    expect(results.some(item => item.title === 'Hello World Function')).toBe(true);
  });

  it('should search by title', async () => {
    const input: SemanticSearchInput = {
      query: 'Python Guide',
      limit: 10
    };

    const results = await semanticSearch(input);

    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Python Programming Guide');
    expect(results[0].content_type).toBe('link');
  });

  it('should search by description', async () => {
    const input: SemanticSearchInput = {
      query: 'database structure',
      limit: 10
    };

    const results = await semanticSearch(input);

    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Database Schema Diagram');
    expect(results[0].content_type).toBe('image');
  });

  it('should filter by content type', async () => {
    const input: SemanticSearchInput = {
      query: 'JavaScript',
      content_type: 'code',
      limit: 10
    };

    const results = await semanticSearch(input);

    expect(results.length).toBe(1);
    expect(results[0].content_type).toBe('code');
    expect(results[0].title).toBe('Hello World Function');
  });

  it('should handle multiple search terms', async () => {
    const input: SemanticSearchInput = {
      query: 'async tutorial',
      limit: 10
    };

    const results = await semanticSearch(input);

    expect(results.length).toBe(1);
    expect(results[0].title).toBe('JavaScript Async Tutorial');
  });

  it('should respect limit parameter', async () => {
    const input: SemanticSearchInput = {
      query: 'guide',
      limit: 1
    };

    const results = await semanticSearch(input);

    expect(results.length).toBe(1);
  });

  it('should return empty array when no matches found', async () => {
    const input: SemanticSearchInput = {
      query: 'nonexistent term xyz',
      limit: 10
    };

    const results = await semanticSearch(input);

    expect(results.length).toBe(0);
  });

  it('should handle empty query', async () => {
    const input: SemanticSearchInput = {
      query: '',
      limit: 10
    };

    const results = await semanticSearch(input);

    // Should return all items when query is empty
    expect(results.length).toBe(4);
  });

  it('should return items with proper structure', async () => {
    const input: SemanticSearchInput = {
      query: 'JavaScript',
      limit: 10
    };

    const results = await semanticSearch(input);

    expect(results.length).toBeGreaterThan(0);
    
    const item = results[0];
    expect(item.id).toBeDefined();
    expect(item.content_type).toBeDefined();
    expect(item.content).toBeDefined();
    expect(item.created_at).toBeInstanceOf(Date);
    expect(item.updated_at).toBeInstanceOf(Date);
    expect(Array.isArray(item.tags)).toBe(true);
  });

  it('should order results by most recent first', async () => {
    const input: SemanticSearchInput = {
      query: 'guide',
      limit: 10
    };

    const results = await semanticSearch(input);

    // Should have at least one result
    expect(results.length).toBeGreaterThan(0);
    
    // Check that results are ordered by created_at descending
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].created_at >= results[i].created_at).toBe(true);
    }
  });

  it('should handle case insensitive search', async () => {
    const input: SemanticSearchInput = {
      query: 'JAVASCRIPT',
      limit: 10
    };

    const results = await semanticSearch(input);

    expect(results.length).toBe(2);
    expect(results.some(item => item.title === 'JavaScript Async Tutorial')).toBe(true);
    expect(results.some(item => item.title === 'Hello World Function')).toBe(true);
  });

  it('should handle whitespace in query', async () => {
    const input: SemanticSearchInput = {
      query: '  async   functions  ',
      limit: 10
    };

    const results = await semanticSearch(input);

    expect(results.length).toBe(1);
    expect(results[0].title).toBe('JavaScript Async Tutorial');
  });

  it('should return results for broad search terms', async () => {
    const input: SemanticSearchInput = {
      query: 'programming',
      limit: 10
    };

    const results = await semanticSearch(input);

    expect(results.length).toBe(1); // Only Python Programming Guide contains "programming"
    expect(results[0].title).toBe('Python Programming Guide');
  });

  it('should filter by content type without search query', async () => {
    const input: SemanticSearchInput = {
      query: '',
      content_type: 'text',
      limit: 10
    };

    const results = await semanticSearch(input);

    expect(results.length).toBe(1);
    expect(results[0].content_type).toBe('text');
    expect(results[0].title).toBe('JavaScript Async Tutorial');
  });

  it('should search across multiple fields', async () => {
    const input: SemanticSearchInput = {
      query: 'function',
      limit: 10
    };

    const results = await semanticSearch(input);

    expect(results.length).toBe(2); // "Hello World Function" (title) and "JavaScript function" (description)
    const titles = results.map(r => r.title);
    expect(titles).toContain('Hello World Function');
    expect(titles).toContain('JavaScript Async Tutorial');
  });
});
