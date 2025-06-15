
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { capturedItemsTable } from '../db/schema';
import { type CreateCapturedItemInput } from '../schema';
import { getCapturedItemById } from '../handlers/get_captured_item_by_id';

const testInput: CreateCapturedItemInput = {
  content_type: 'text',
  content: 'Test content for retrieval',
  title: 'Test Item',
  description: 'A test item for testing retrieval',
  metadata: { source: 'test' }
};

describe('getCapturedItemById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing item by id', async () => {
    // Create a test item first
    const insertResult = await db.insert(capturedItemsTable)
      .values({
        content_type: testInput.content_type,
        content: testInput.content,
        title: testInput.title,
        description: testInput.description,
        tags: [],
        metadata: testInput.metadata
      })
      .returning()
      .execute();

    const createdItem = insertResult[0];

    // Retrieve the item by id
    const result = await getCapturedItemById(createdItem.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdItem.id);
    expect(result!.content_type).toEqual('text');
    expect(result!.content).toEqual('Test content for retrieval');
    expect(result!.title).toEqual('Test Item');
    expect(result!.description).toEqual('A test item for testing retrieval');
    expect(result!.tags).toEqual([]);
    expect(result!.metadata).toEqual({ source: 'test' });
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent id', async () => {
    const result = await getCapturedItemById(999);
    expect(result).toBeNull();
  });

  it('should handle items with tags correctly', async () => {
    // Create an item with tags
    const insertResult = await db.insert(capturedItemsTable)
      .values({
        content_type: 'code',
        content: 'function test() { return true; }',
        title: 'Test Function',
        description: 'A test function',
        tags: ['javascript', 'testing', 'function'],
        metadata: { language: 'javascript' }
      })
      .returning()
      .execute();

    const createdItem = insertResult[0];

    // Retrieve the item
    const result = await getCapturedItemById(createdItem.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdItem.id);
    expect(result!.content_type).toEqual('code');
    expect(result!.tags).toEqual(['javascript', 'testing', 'function']);
    expect(result!.metadata).toEqual({ language: 'javascript' });
  });

  it('should handle items with null/empty fields correctly', async () => {
    // Create an item with minimal fields
    const insertResult = await db.insert(capturedItemsTable)
      .values({
        content_type: 'link',
        content: 'https://example.com',
        title: null,
        description: null,
        tags: [],
        metadata: null
      })
      .returning()
      .execute();

    const createdItem = insertResult[0];

    // Retrieve the item
    const result = await getCapturedItemById(createdItem.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdItem.id);
    expect(result!.content_type).toEqual('link');
    expect(result!.content).toEqual('https://example.com');
    expect(result!.title).toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.tags).toEqual([]);
    expect(result!.metadata).toBeNull();
  });
});
