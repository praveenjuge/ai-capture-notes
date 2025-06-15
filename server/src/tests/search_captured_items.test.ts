
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { capturedItemsTable } from '../db/schema';
import { type SearchCapturedItemsInput } from '../schema';
import { searchCapturedItems } from '../handlers/search_captured_items';

// Helper function to create a test item
const createTestItem = async (overrides: {
  content_type?: 'text' | 'code' | 'image' | 'link';
  content?: string;
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any> | null;
} = {}) => {
  const defaultItem = {
    content_type: 'text' as const,
    content: 'Test content',
    title: 'Test Title',
    description: 'Test description',
    tags: ['test', 'sample'],
    metadata: { source: 'test' }
  };

  const item = { ...defaultItem, ...overrides };

  const result = await db.insert(capturedItemsTable)
    .values({
      content_type: item.content_type,
      content: item.content,
      title: item.title,
      description: item.description,
      tags: item.tags,
      metadata: item.metadata
    })
    .returning()
    .execute();

  return result[0];
};

describe('searchCapturedItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all items when no filters provided', async () => {
    // Create test items
    await createTestItem({ content: 'First item' });
    await createTestItem({ content: 'Second item' });

    const input: SearchCapturedItemsInput = {
      limit: 50,
      offset: 0
    };

    const results = await searchCapturedItems(input);

    expect(results).toHaveLength(2);
    expect(results[0].content).toEqual('First item');
    expect(results[1].content).toEqual('Second item');
  });

  it('should filter by query text', async () => {
    await createTestItem({ content: 'JavaScript tutorial' });
    await createTestItem({ content: 'Python guide' });
    await createTestItem({ content: 'JavaScript advanced' });

    const input: SearchCapturedItemsInput = {
      query: 'JavaScript',
      limit: 50,
      offset: 0
    };

    const results = await searchCapturedItems(input);

    expect(results).toHaveLength(2);
    results.forEach(item => {
      expect(item.content.toLowerCase()).toContain('javascript');
    });
  });

  it('should filter by content type', async () => {
    await createTestItem({ content_type: 'text', content: 'Text content' });
    await createTestItem({ content_type: 'code', content: 'Code content' });
    await createTestItem({ content_type: 'image', content: 'Image content' });

    const input: SearchCapturedItemsInput = {
      content_type: 'code',
      limit: 50,
      offset: 0
    };

    const results = await searchCapturedItems(input);

    expect(results).toHaveLength(1);
    expect(results[0].content_type).toEqual('code');
    expect(results[0].content).toEqual('Code content');
  });

  it('should filter by tags', async () => {
    await createTestItem({ tags: ['javascript', 'tutorial'] });
    await createTestItem({ tags: ['python', 'guide'] });
    await createTestItem({ tags: ['javascript', 'advanced'] });

    const input: SearchCapturedItemsInput = {
      tags: ['javascript'],
      limit: 50,
      offset: 0
    };

    const results = await searchCapturedItems(input);

    expect(results).toHaveLength(2);
    results.forEach(item => {
      expect(item.tags).toContain('javascript');
    });
  });

  it('should filter by multiple tags', async () => {
    await createTestItem({ tags: ['javascript', 'tutorial', 'beginner'] });
    await createTestItem({ tags: ['javascript', 'advanced'] });
    await createTestItem({ tags: ['python', 'tutorial'] });

    const input: SearchCapturedItemsInput = {
      tags: ['javascript', 'tutorial'],
      limit: 50,
      offset: 0
    };

    const results = await searchCapturedItems(input);

    expect(results).toHaveLength(1);
    expect(results[0].tags).toContain('javascript');
    expect(results[0].tags).toContain('tutorial');
  });

  it('should combine multiple filters', async () => {
    await createTestItem({ 
      content_type: 'code',
      content: 'JavaScript function example',
      tags: ['javascript', 'function']
    });
    await createTestItem({ 
      content_type: 'text',
      content: 'JavaScript tutorial',
      tags: ['javascript', 'tutorial']
    });
    await createTestItem({ 
      content_type: 'code',
      content: 'Python function example',
      tags: ['python', 'function']
    });

    const input: SearchCapturedItemsInput = {
      query: 'JavaScript',
      content_type: 'code',
      tags: ['function'],
      limit: 50,
      offset: 0
    };

    const results = await searchCapturedItems(input);

    expect(results).toHaveLength(1);
    expect(results[0].content_type).toEqual('code');
    expect(results[0].content.toLowerCase()).toContain('javascript');
    expect(results[0].tags).toContain('function');
  });

  it('should handle pagination', async () => {
    // Create multiple items
    for (let i = 1; i <= 5; i++) {
      await createTestItem({ content: `Item ${i}` });
    }

    // Test first page
    const firstPage = await searchCapturedItems({
      limit: 2,
      offset: 0
    });

    expect(firstPage).toHaveLength(2);

    // Test second page
    const secondPage = await searchCapturedItems({
      limit: 2,
      offset: 2
    });

    expect(secondPage).toHaveLength(2);

    // Ensure different results
    expect(firstPage[0].id).not.toEqual(secondPage[0].id);
  });

  it('should return items with all required fields', async () => {
    const item = await createTestItem({
      content_type: 'text',
      content: 'Test content',
      title: 'Test title',
      description: 'Test description',
      tags: ['test'],
      metadata: { key: 'value' }
    });

    const results = await searchCapturedItems({
      limit: 50,
      offset: 0
    });

    expect(results).toHaveLength(1);
    const result = results[0];

    expect(result.id).toBeDefined();
    expect(result.content_type).toEqual('text');
    expect(result.content).toEqual('Test content');
    expect(result.title).toEqual('Test title');
    expect(result.description).toEqual('Test description');
    expect(result.tags).toEqual(['test']);
    expect(result.metadata).toEqual({ key: 'value' });
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no matches found', async () => {
    await createTestItem({ content: 'JavaScript tutorial' });

    const input: SearchCapturedItemsInput = {
      query: 'nonexistent',
      limit: 50,
      offset: 0
    };

    const results = await searchCapturedItems(input);

    expect(results).toHaveLength(0);
  });
});
