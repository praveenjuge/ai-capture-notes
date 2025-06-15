
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { capturedItemsTable } from '../db/schema';
import { type CreateCapturedItemInput } from '../schema';
import { getItemsByTags } from '../handlers/get_items_by_tags';

// Test data setup
const createTestItem = async (content: string, tags: string[]) => {
  const testInput: CreateCapturedItemInput = {
    content_type: 'text',
    content,
    title: `Test Item: ${content}`,
    description: 'Test description',
  };

  const result = await db.insert(capturedItemsTable)
    .values({
      ...testInput,
      tags
    })
    .returning()
    .execute();

  return result[0];
};

describe('getItemsByTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return items with matching tags', async () => {
    // Create test items with different tags
    await createTestItem('Content about JavaScript', ['javascript', 'programming']);
    await createTestItem('Content about Python', ['python', 'programming']);
    await createTestItem('Content about cooking', ['cooking', 'recipe']);

    const results = await getItemsByTags(['programming']);

    expect(results).toHaveLength(2);
    expect(results[0].content).toMatch(/JavaScript|Python/);
    expect(results[1].content).toMatch(/JavaScript|Python/);
    
    // Verify all results contain the programming tag
    results.forEach(item => {
      expect(item.tags).toContain('programming');
    });
  });

  it('should return items matching any of multiple tags', async () => {
    await createTestItem('JavaScript tutorial', ['javascript', 'tutorial']);
    await createTestItem('Python guide', ['python', 'guide']);
    await createTestItem('Cooking recipe', ['cooking', 'recipe']);

    const results = await getItemsByTags(['javascript', 'python']);

    expect(results).toHaveLength(2);
    results.forEach(item => {
      expect(
        item.tags.includes('javascript') || item.tags.includes('python')
      ).toBe(true);
    });
  });

  it('should return empty array when no tags provided', async () => {
    await createTestItem('Test content', ['test', 'content']);

    const results = await getItemsByTags([]);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when no items match tags', async () => {
    await createTestItem('Test content', ['test', 'content']);

    const results = await getItemsByTags(['nonexistent']);

    expect(results).toHaveLength(0);
  });

  it('should handle items with no tags', async () => {
    // Create item with empty tags array
    await createTestItem('Content with no tags', []);
    await createTestItem('Content with tags', ['tagged']);

    const results = await getItemsByTags(['tagged']);

    expect(results).toHaveLength(1);
    expect(results[0].content).toBe('Content with tags');
  });

  it('should return items with proper field structure', async () => {
    await createTestItem('Test content', ['test']);

    const results = await getItemsByTags(['test']);

    expect(results).toHaveLength(1);
    const item = results[0];
    
    expect(item.id).toBeDefined();
    expect(item.content_type).toBe('text');
    expect(item.content).toBe('Test content');
    expect(item.title).toBe('Test Item: Test content');
    expect(item.description).toBe('Test description');
    expect(item.created_at).toBeInstanceOf(Date);
    expect(item.updated_at).toBeInstanceOf(Date);
    expect(Array.isArray(item.tags)).toBe(true);
    expect(item.tags).toContain('test');
  });
});
