
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { capturedItemsTable } from '../db/schema';
import { type CreateCapturedItemInput } from '../schema';
import { getCapturedItems } from '../handlers/get_captured_items';

// Test data
const testItem1: CreateCapturedItemInput = {
  content_type: 'text',
  content: 'First captured item',
  title: 'First Item',
  description: 'This is the first test item',
  metadata: { source: 'test' }
};

const testItem2: CreateCapturedItemInput = {
  content_type: 'code',
  content: 'console.log("Hello World");',
  title: 'Code Snippet',
  description: 'JavaScript hello world',
  metadata: { language: 'javascript' }
};

describe('getCapturedItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no items exist', async () => {
    const result = await getCapturedItems();

    expect(result).toEqual([]);
  });

  it('should return all captured items', async () => {
    // Insert test data
    await db.insert(capturedItemsTable)
      .values([
        {
          content_type: testItem1.content_type,
          content: testItem1.content,
          title: testItem1.title,
          description: testItem1.description,
          metadata: testItem1.metadata,
          tags: ['test', 'first']
        },
        {
          content_type: testItem2.content_type,
          content: testItem2.content,
          title: testItem2.title,
          description: testItem2.description,
          metadata: testItem2.metadata,
          tags: ['code', 'javascript']
        }
      ])
      .execute();

    const result = await getCapturedItems();

    expect(result).toHaveLength(2);
    
    // Verify first item
    const firstItem = result[0];
    expect(firstItem.content_type).toEqual('text');
    expect(firstItem.content).toEqual('First captured item');
    expect(firstItem.title).toEqual('First Item');
    expect(firstItem.description).toEqual('This is the first test item');
    expect(firstItem.tags).toEqual(['test', 'first']);
    expect(firstItem.metadata).toEqual({ source: 'test' });
    expect(firstItem.id).toBeDefined();
    expect(firstItem.created_at).toBeInstanceOf(Date);
    expect(firstItem.updated_at).toBeInstanceOf(Date);

    // Verify second item
    const secondItem = result[1];
    expect(secondItem.content_type).toEqual('code');
    expect(secondItem.content).toEqual('console.log("Hello World");');
    expect(secondItem.title).toEqual('Code Snippet');
    expect(secondItem.description).toEqual('JavaScript hello world');
    expect(secondItem.tags).toEqual(['code', 'javascript']);
    expect(secondItem.metadata).toEqual({ language: 'javascript' });
    expect(secondItem.id).toBeDefined();
    expect(secondItem.created_at).toBeInstanceOf(Date);
    expect(secondItem.updated_at).toBeInstanceOf(Date);
  });

  it('should handle items with null fields', async () => {
    // Insert item with minimal data
    await db.insert(capturedItemsTable)
      .values({
        content_type: 'link',
        content: 'https://example.com',
        title: null,
        description: null,
        metadata: null,
        tags: []
      })
      .execute();

    const result = await getCapturedItems();

    expect(result).toHaveLength(1);
    expect(result[0].content_type).toEqual('link');
    expect(result[0].content).toEqual('https://example.com');
    expect(result[0].title).toBeNull();
    expect(result[0].description).toBeNull();
    expect(result[0].metadata).toBeNull();
    expect(result[0].tags).toEqual([]);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should ensure tags is always an array', async () => {
    // Insert item with empty tags
    await db.insert(capturedItemsTable)
      .values({
        content_type: 'image',
        content: 'base64-image-data',
        title: 'Test Image',
        tags: []
      })
      .execute();

    const result = await getCapturedItems();

    expect(result).toHaveLength(1);
    expect(Array.isArray(result[0].tags)).toBe(true);
    expect(result[0].tags).toEqual([]);
  });
});
