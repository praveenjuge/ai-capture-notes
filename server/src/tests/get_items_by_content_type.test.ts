
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { capturedItemsTable } from '../db/schema';
import { type ContentType } from '../schema';
import { getItemsByContentType } from '../handlers/get_items_by_content_type';

describe('getItemsByContentType', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return items matching the specified content type', async () => {
    // Create test items with different content types
    await db.insert(capturedItemsTable)
      .values([
        {
          content_type: 'text',
          content: 'This is a text item',
          title: 'Text Item',
          description: 'A text description',
          tags: ['tag1', 'tag2']
        },
        {
          content_type: 'code',
          content: 'console.log("Hello World");',
          title: 'Code Snippet',
          description: 'JavaScript code',
          tags: ['javascript', 'code'],
          metadata: { language: 'javascript' }
        },
        {
          content_type: 'text',
          content: 'Another text item',
          title: 'Second Text',
          description: null,
          tags: ['different']
        }
      ])
      .execute();

    const textItems = await getItemsByContentType('text');

    expect(textItems).toHaveLength(2);
    textItems.forEach(item => {
      expect(item.content_type).toEqual('text');
      expect(item.id).toBeDefined();
      expect(item.created_at).toBeInstanceOf(Date);
      expect(item.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific items
    const titles = textItems.map(item => item.title);
    expect(titles).toContain('Text Item');
    expect(titles).toContain('Second Text');
  });

  it('should return only code items when filtering by code type', async () => {
    // Create mixed content items
    await db.insert(capturedItemsTable)
      .values([
        {
          content_type: 'code',
          content: 'function test() { return true; }',
          title: 'Test Function',
          tags: ['javascript']
        },
        {
          content_type: 'image',
          content: 'https://example.com/image.jpg',
          title: 'Sample Image',
          tags: ['photo']
        },
        {
          content_type: 'code',
          content: 'SELECT * FROM users;',
          title: 'SQL Query',
          tags: ['sql'],
          metadata: { language: 'sql' }
        }
      ])
      .execute();

    const codeItems = await getItemsByContentType('code');

    expect(codeItems).toHaveLength(2);
    codeItems.forEach(item => {
      expect(item.content_type).toEqual('code');
    });

    const titles = codeItems.map(item => item.title);
    expect(titles).toContain('Test Function');
    expect(titles).toContain('SQL Query');
  });

  it('should return empty array when no items match content type', async () => {
    // Create items with different content type
    await db.insert(capturedItemsTable)
      .values([
        {
          content_type: 'text',
          content: 'Some text content',
          title: 'Text Only',
          tags: []
        }
      ])
      .execute();

    const linkItems = await getItemsByContentType('link');

    expect(linkItems).toHaveLength(0);
    expect(Array.isArray(linkItems)).toBe(true);
  });

  it('should handle all content types correctly', async () => {
    const contentTypes: ContentType[] = ['text', 'code', 'image', 'link'];
    
    // Create one item for each content type
    const testItems = contentTypes.map((type, index) => ({
      content_type: type,
      content: `Sample ${type} content ${index}`,
      title: `${type} title`,
      tags: [type]
    }));

    await db.insert(capturedItemsTable)
      .values(testItems)
      .execute();

    // Test each content type
    for (const contentType of contentTypes) {
      const items = await getItemsByContentType(contentType);
      
      expect(items).toHaveLength(1);
      expect(items[0].content_type).toEqual(contentType);
      expect(items[0].title).toEqual(`${contentType} title`);
    }
  });
});
