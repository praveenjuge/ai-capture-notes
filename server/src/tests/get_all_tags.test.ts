
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tagsTable } from '../db/schema';
import { getAllTags } from '../handlers/get_all_tags';

describe('getAllTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tags exist', async () => {
    const result = await getAllTags();
    expect(result).toEqual([]);
  });

  it('should return all tags', async () => {
    // Create test tags
    await db.insert(tagsTable)
      .values([
        { name: 'javascript', usage_count: 5 },
        { name: 'python', usage_count: 3 },
        { name: 'tutorial', usage_count: 8 }
      ])
      .execute();

    const result = await getAllTags();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('tutorial');
    expect(result[0].usage_count).toEqual(8);
    expect(result[1].name).toEqual('javascript');
    expect(result[1].usage_count).toEqual(5);
    expect(result[2].name).toEqual('python');
    expect(result[2].usage_count).toEqual(3);
  });

  it('should return tags ordered by usage count descending', async () => {
    // Create tags with different usage counts
    await db.insert(tagsTable)
      .values([
        { name: 'low-usage', usage_count: 1 },
        { name: 'high-usage', usage_count: 100 },
        { name: 'medium-usage', usage_count: 10 }
      ])
      .execute();

    const result = await getAllTags();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('high-usage');
    expect(result[0].usage_count).toEqual(100);
    expect(result[1].name).toEqual('medium-usage');
    expect(result[1].usage_count).toEqual(10);
    expect(result[2].name).toEqual('low-usage');
    expect(result[2].usage_count).toEqual(1);
  });

  it('should return tags with all required fields', async () => {
    await db.insert(tagsTable)
      .values({ name: 'test-tag', usage_count: 5 })
      .execute();

    const result = await getAllTags();

    expect(result).toHaveLength(1);
    const tag = result[0];
    expect(tag.id).toBeDefined();
    expect(tag.name).toEqual('test-tag');
    expect(tag.usage_count).toEqual(5);
    expect(tag.created_at).toBeInstanceOf(Date);
  });
});
