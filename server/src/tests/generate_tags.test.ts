
import { describe, expect, it } from 'bun:test';
import { type GenerateTagsInput } from '../schema';
import { generateTags } from '../handlers/generate_tags';

describe('generateTags', () => {
  it('should generate tags for code content', async () => {
    const input: GenerateTagsInput = {
      content_type: 'code',
      content: 'function fetchUser(id) {\n  return fetch(`/api/users/${id}`);\n}',
      title: 'User API Function',
      description: 'JavaScript function to fetch user data from API'
    };

    const result = await generateTags(input);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(5);
    
    // Should include relevant tags for JavaScript code
    expect(result).toContain('programming');
    expect(result).toContain('javascript');
    expect(result).toContain('api');
    
    // All tags should be strings
    result.forEach(tag => {
      expect(typeof tag).toBe('string');
      expect(tag.length).toBeGreaterThan(0);
      expect(tag.length).toBeLessThanOrEqual(50);
    });
  });

  it('should generate tags for link content', async () => {
    const input: GenerateTagsInput = {
      content_type: 'link',
      content: 'https://github.com/user/awesome-project',
      title: 'Awesome Project Repository',
      description: 'Open source project with great documentation'
    };

    const result = await generateTags(input);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(5);
    
    // Should include relevant tags for GitHub link
    expect(result).toContain('reference');
    expect(result).toContain('github');
    
    // All tags should be lowercase
    result.forEach(tag => {
      expect(tag).toBe(tag.toLowerCase());
    });
  });

  it('should generate tags for text content', async () => {
    const input: GenerateTagsInput = {
      content_type: 'text',
      content: 'Meeting notes from today. Discussed database optimization and authentication improvements.',
      title: 'Team Meeting Notes',
      description: 'Weekly team sync discussion points'
    };

    const result = await generateTags(input);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(5);
    
    // Should include relevant tags based on content
    expect(result).toContain('notes');
    expect(result).toContain('database');
    expect(result).toContain('authentication');
  });

  it('should generate tags for image content', async () => {
    const input: GenerateTagsInput = {
      content_type: 'image',
      content: '/path/to/screenshot.png',
      title: 'Application Screenshot',
      description: 'Screenshot of the new user interface'
    };

    const result = await generateTags(input);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(5);
    
    // Should include image-specific tags
    expect(result).toContain('visual');
    expect(result).toContain('media');
  });

  it('should handle minimal input', async () => {
    const input: GenerateTagsInput = {
      content_type: 'text',
      content: 'Just some random text content here.'
    };

    const result = await generateTags(input);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(5);
    
    // Should generate at least basic tags
    expect(result).toContain('notes');
    
    // Should not contain undefined or empty tags
    result.forEach(tag => {
      expect(tag).toBeDefined();
      expect(tag.length).toBeGreaterThan(0);
    });
  });

  it('should handle SQL code content', async () => {
    const input: GenerateTagsInput = {
      content_type: 'code',
      content: 'SELECT * FROM users WHERE created_at > NOW() - INTERVAL \'1 day\';',
      title: 'Recent Users Query',
      description: 'SQL query to get users created in the last day'
    };

    const result = await generateTags(input);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    
    // Should detect SQL and database tags
    expect(result).toContain('programming');
    expect(result).toContain('sql');
    expect(result).toContain('database');
  });

  it('should return unique tags only', async () => {
    const input: GenerateTagsInput = {
      content_type: 'code',
      content: 'const api = require("api"); api.get("/users");',
      title: 'API Call Example',
      description: 'Example of API usage in JavaScript'
    };

    const result = await generateTags(input);

    // Check for uniqueness
    const uniqueResult = [...new Set(result)];
    expect(result.length).toBe(uniqueResult.length);
  });

  it('should limit tags to maximum of 5', async () => {
    const input: GenerateTagsInput = {
      content_type: 'code',
      content: 'docker run -p 3000:3000 node:alpine npm start',
      title: 'Docker React App',
      description: 'Running a React application with Docker container and database authentication'
    };

    const result = await generateTags(input);

    expect(result.length).toBeLessThanOrEqual(5);
  });
});
