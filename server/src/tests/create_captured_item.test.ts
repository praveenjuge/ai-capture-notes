
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { capturedItemsTable } from '../db/schema';
import { type CreateCapturedItemInput } from '../schema';
import { createCapturedItem } from '../handlers/create_captured_item';
import { eq } from 'drizzle-orm';

// Test inputs for different content types
const textInput: CreateCapturedItemInput = {
  content_type: 'text',
  content: 'This is a sample text note',
  title: 'Sample Text',
  description: 'A test text note',
  metadata: { source: 'manual' }
};

const codeInput: CreateCapturedItemInput = {
  content_type: 'code',
  content: 'console.log("Hello, world!");',
  title: 'Hello World',
  description: 'A simple JavaScript example',
  metadata: { language: 'javascript', lines: 1 }
};

const minimalInput: CreateCapturedItemInput = {
  content_type: 'link',
  content: 'https://example.com'
};

describe('createCapturedItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a captured item with all fields', async () => {
    const result = await createCapturedItem(textInput);

    // Basic field validation
    expect(result.content_type).toEqual('text');
    expect(result.content).toEqual('This is a sample text note');
    expect(result.title).toEqual('Sample Text');
    expect(result.description).toEqual('A test text note');
    expect(result.metadata).toEqual({ source: 'manual' });
    expect(result.tags).toEqual([]);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a code captured item', async () => {
    const result = await createCapturedItem(codeInput);

    expect(result.content_type).toEqual('code');
    expect(result.content).toEqual('console.log("Hello, world!");');
    expect(result.title).toEqual('Hello World');
    expect(result.metadata).toEqual({ language: 'javascript', lines: 1 });
    expect(result.tags).toEqual([]);
  });

  it('should create a minimal captured item', async () => {
    const result = await createCapturedItem(minimalInput);

    expect(result.content_type).toEqual('link');
    expect(result.content).toEqual('https://example.com');
    expect(result.title).toBeNull();
    expect(result.description).toBeNull();
    expect(result.metadata).toBeNull();
    expect(result.tags).toEqual([]);
  });

  it('should save captured item to database', async () => {
    const result = await createCapturedItem(textInput);

    // Query using proper drizzle syntax
    const items = await db.select()
      .from(capturedItemsTable)
      .where(eq(capturedItemsTable.id, result.id))
      .execute();

    expect(items).toHaveLength(1);
    const savedItem = items[0];
    expect(savedItem.content_type).toEqual('text');
    expect(savedItem.content).toEqual('This is a sample text note');
    expect(savedItem.title).toEqual('Sample Text');
    expect(savedItem.description).toEqual('A test text note');
    expect(savedItem.metadata).toEqual({ source: 'manual' });
    expect(savedItem.tags).toEqual([]);
    expect(savedItem.created_at).toBeInstanceOf(Date);
    expect(savedItem.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different content types correctly', async () => {
    const textResult = await createCapturedItem(textInput);
    const codeResult = await createCapturedItem(codeInput);
    const linkResult = await createCapturedItem(minimalInput);

    expect(textResult.content_type).toEqual('text');
    expect(codeResult.content_type).toEqual('code');
    expect(linkResult.content_type).toEqual('link');

    // Verify all are saved in database
    const allItems = await db.select()
      .from(capturedItemsTable)
      .execute();

    expect(allItems).toHaveLength(3);
    const contentTypes = allItems.map(item => item.content_type);
    expect(contentTypes).toContain('text');
    expect(contentTypes).toContain('code');
    expect(contentTypes).toContain('link');
  });

  it('should handle null/undefined optional fields correctly', async () => {
    const inputWithUndefined: CreateCapturedItemInput = {
      content_type: 'image',
      content: 'base64imagedata',
      title: undefined,
      description: undefined,
      metadata: undefined
    };

    const result = await createCapturedItem(inputWithUndefined);

    expect(result.title).toBeNull();
    expect(result.description).toBeNull();
    expect(result.metadata).toBeNull();
    expect(result.tags).toEqual([]);
  });
});
